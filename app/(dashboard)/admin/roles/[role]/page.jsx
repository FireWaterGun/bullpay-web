'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useToast } from '@/app/providers'
import {
  getRolePermissions,
  getRolePermissionOverrides,
  grantRolePermission,
  denyRolePermission,
  deleteRolePermissionOverride,
  resetRolePermissionOverrides,
} from '@/lib/api/admin'
import { ROLE_ICON, ROLE_COLOR, ROLE_LEVEL, ROLE_DESCRIPTION, formatRoleLabel } from '@/lib/utils/roles'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import SummaryCard from '@/components/admin/RevenueSummaryCard'
import PermissionActionModal from '@/components/admin/PermissionActionModal'
import ResetOverridesModal from '@/components/admin/ResetOverridesModal'
import PermissionGroupCard, { groupPermissions } from '@/components/admin/PermissionGroupCard'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import CardEmptyState from '@/components/CardEmptyState'
import AvatarInitial from '@/components/ui/AvatarInitial'
import Badge, { bgLabelClass } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, InputGroup, InputAddon, InputIcon, Select } from '@/components/ui/Input'

export default function RolePermissions() {
  const { token, user } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const { role } = useParams()
  const { t } = useAdminTranslation()

  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState([])
  const [overrides, setOverrides] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [actionLoading, setActionLoading] = useState(null)
  const [collapsedGroups, setCollapsedGroups] = useState({})

  const [showGrantModal, setShowGrantModal] = useState(false)
  const [showDenyModal, setShowDenyModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [modalPermission, setModalPermission] = useState('')
  const [modalReason, setModalReason] = useState('')

  const color = ROLE_COLOR[role] || 'secondary'
  const icon = ROLE_ICON[role] || 'bx-user'
  const level = ROLE_LEVEL[role] || 0
  const description = ROLE_DESCRIPTION[role] || ''

  // Block access if requester's level is lower than the target role
  const myLevel = ROLE_LEVEL[user?.role] || 0
  const accessDenied = level > myLevel

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [permsData, overridesData] = await Promise.all([
        getRolePermissions(token, role),
        getRolePermissionOverrides(token, role).catch(() => null),
      ])

      // API: { role, permissions: [...], resolved: [{ permission, source, active }] }
      const resolved = Array.isArray(permsData) ? permsData : permsData?.resolved || permsData?.permissions || []
      setPermissions(
        resolved.map((p) => {
          if (typeof p === 'string') return { permission: p, source: 'default', active: true }
          return {
            permission: p.permission || p.name || '',
            source: p.source || 'default',
            active: p.active !== undefined ? p.active : (p.granted ?? true),
          }
        })
      )

      const overList = overridesData
        ? Array.isArray(overridesData)
          ? overridesData
          : overridesData?.overrides || []
        : []
      setOverrides(overList)
    } catch (error) {
      logger.error('Failed to load role permissions:', error)
      toast.error(t('admin.roles.loadPermError', { defaultValue: 'Failed to load permissions' }))
    } finally {
      setLoading(false)
    }
  }, [token, role, toast, t])

  useEffect(() => {
    if (!accessDenied) loadData()
  }, [accessDenied, loadData])

  const overrideMap = useMemo(() => {
    const map = {}
    overrides.forEach((o) => {
      map[o.permission || o.name] = o
    })
    return map
  }, [overrides])

  let activeCount = 0
  let defaultCount = 0
  let grantedCount = 0
  let deniedCount = 0
  for (const p of permissions) {
    if (p.active) activeCount++
    if (p.source === 'default') defaultCount++
    if (p.source === 'granted') grantedCount++
    if (p.source === 'denied') deniedCount++
  }
  const inactiveCount = permissions.length - activeCount

  const filteredPermissions = useMemo(() => {
    let list = [...permissions]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((p) => p.permission.toLowerCase().includes(q))
    }

    switch (filterType) {
      case 'active':
        list = list.filter((p) => p.active)
        break
      case 'inactive':
        list = list.filter((p) => !p.active)
        break
      case 'granted':
        list = list.filter((p) => p.source === 'granted')
        break
      case 'denied':
        list = list.filter((p) => p.source === 'denied')
        break
      case 'default':
        list = list.filter((p) => p.source === 'default')
        break
    }

    return list
  }, [permissions, searchQuery, filterType])

  const groupedPermissions = useMemo(() => groupPermissions(filteredPermissions), [filteredPermissions])
  const groupCount = Object.keys(groupedPermissions).length

  function toggleGroup(groupKey) {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }))
  }

  function collapseAll() {
    const all = {}
    Object.keys(groupedPermissions).forEach((k) => {
      all[k] = true
    })
    setCollapsedGroups(all)
  }

  function expandAll() {
    setCollapsedGroups({})
  }

  async function handleGrant(permission, reason) {
    try {
      setActionLoading(permission)
      await grantRolePermission(token, role, permission, reason || undefined)
      toast.success(t('admin.roles.grantedToast', { defaultValue: 'Granted: {{permission}}', permission }))
      await loadData()
    } catch (error) {
      logger.error('Grant failed:', error)
      toast.error(error?.message || t('admin.roles.failedGrant', { defaultValue: 'Failed to grant permission' }))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDeny(permission, reason) {
    try {
      setActionLoading(permission)
      await denyRolePermission(token, role, permission, reason || undefined)
      toast.success(t('admin.roles.deniedToast', { defaultValue: 'Denied: {{permission}}', permission }))
      await loadData()
    } catch (error) {
      logger.error('Deny failed:', error)
      toast.error(error?.message || t('admin.roles.failedDeny', { defaultValue: 'Failed to deny permission' }))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRevertOverride(overrideId, permName) {
    try {
      setActionLoading(permName)
      await deleteRolePermissionOverride(token, role, overrideId)
      toast.success(
        t('admin.roles.revertedToast', { defaultValue: 'Reverted override: {{permission}}', permission: permName })
      )
      await loadData()
    } catch (error) {
      logger.error('Revert failed:', error)
      toast.error(error?.message || t('admin.roles.failedRevert', { defaultValue: 'Failed to revert override' }))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleResetAll() {
    try {
      setActionLoading('__reset__')
      await resetRolePermissionOverrides(token, role)
      toast.success(t('admin.roles.allOverridesReset', { defaultValue: 'All overrides have been reset' }))
      setShowResetModal(false)
      await loadData()
    } catch (error) {
      logger.error('Reset failed:', error)
      toast.error(error?.message || t('admin.roles.failedReset', { defaultValue: 'Failed to reset overrides' }))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleModalGrant() {
    if (!modalPermission.trim()) return
    await handleGrant(modalPermission.trim(), modalReason.trim())
    setModalPermission('')
    setModalReason('')
    setShowGrantModal(false)
  }

  async function handleModalDeny() {
    if (!modalPermission.trim()) return
    await handleDeny(modalPermission.trim(), modalReason.trim())
    setModalPermission('')
    setModalReason('')
    setShowDenyModal(false)
  }

  function openGrantModal(permission = '') {
    setModalPermission(permission)
    setModalReason('')
    setShowGrantModal(true)
  }

  function openDenyModal(permission = '') {
    setModalPermission(permission)
    setModalReason('')
    setShowDenyModal(true)
  }

  if (loading) {
    return <PageSpinner />
  }

  if (accessDenied) {
    return (
      <div className="grow pb-6">
        <Card>
          <div className="p-5 text-center py-5">
            <i className="bx bx-lock-alt text-danger text-[3rem]"></i>
            <h5 className="mt-3">{t('admin.roles.accessDenied', { defaultValue: 'Access Denied' })}</h5>
            <p className="text-surface-500">
              {t('admin.roles.cannotViewHigherRole', { defaultValue: 'You do not have permission to view this role.' })}
            </p>
            <Button onClick={() => router.push('/admin/roles')}>
              {t('admin.roles.backToRoles', { defaultValue: 'Back to Roles' })}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grow pb-6">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="outline-secondary" className="gap-1" href="/admin/roles">
          <i className="bx bx-arrow-back"></i>
          {t('admin.roles.backToRoles', { defaultValue: 'Back to Roles' })}
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div>
            <AvatarInitial className={`${bgLabelClass(color)} w-14 h-14 text-xl`}>
              <i className={`bx ${icon} text-3xl`}></i>
            </AvatarInitial>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="mb-0">{formatRoleLabel(role)}</h4>
              {level > 0 && (
                <Badge color={color} label>
                  L{level}
                </Badge>
              )}
            </div>
            {description && <p className="text-surface-500 mb-0 text-[0.85rem]">{description}</p>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => openGrantModal()} variant="success" size="sm">
            <i className="bx bx-plus-circle mr-1"></i>
            {t('admin.roles.grant', { defaultValue: 'Grant' })}
          </Button>
          <Button onClick={() => openDenyModal()} variant="danger" size="sm">
            <i className="bx bx-minus-circle mr-1"></i>
            {t('admin.roles.deny', { defaultValue: 'Deny' })}
          </Button>
          {overrides.length > 0 && (
            <Button
              onClick={() => setShowResetModal(true)}
              size="sm"
              className="border border-warning-500 text-warning-500 bg-transparent hover:bg-warning-500 hover:text-white"
            >
              <i className="bx bx-reset mr-1"></i>
              {t('admin.roles.resetAll', { defaultValue: 'Reset All' })}
            </Button>
          )}
          <RefreshButton onClick={loadData} loading={loading} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-12 gap-x-6 gap-4 mb-4">
        <SummaryCard
          title={t('admin.roles.totalPermissions', { defaultValue: 'Total Permissions' })}
          value={permissions.length}
          icon="bx-lock-alt"
          color="primary"
        />

        <SummaryCard
          title={t('admin.roles.active', { defaultValue: 'Active' })}
          value={activeCount}
          icon="bx-check-circle"
          color="success"
        />

        <SummaryCard
          title={t('admin.roles.inactive', { defaultValue: 'Inactive' })}
          value={inactiveCount}
          icon="bx-x-circle"
          color={inactiveCount > 0 ? 'danger' : 'secondary'}
        />

        <SummaryCard
          title={t('admin.roles.overrides', { defaultValue: 'Overrides' })}
          value={overrides.length}
          icon="bx-edit-alt"
          color={overrides.length > 0 ? 'warning' : 'secondary'}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="mb-4">
        <div className="p-5 py-3">
          <div className="grid grid-cols-12 gap-x-6 gap-3 items-center">
            <div className="col-span-12 md:col-span-5">
              <InputGroup>
                <InputAddon>
                  <i className="bx bx-search"></i>
                </InputAddon>
                <Input
                  type="text"
                  placeholder={t('admin.roles.searchPermissions', { defaultValue: 'Search permissions...' })}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {searchQuery && (
                  <InputIcon as="button" type="button" aria-label="Clear search" onClick={() => setSearchQuery('')}>
                    <i className="bx bx-x"></i>
                  </InputIcon>
                )}
              </InputGroup>
            </div>
            <div className="col-span-12 md:col-span-3">
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">
                  {t('admin.roles.all', { defaultValue: 'All' })} ({permissions.length})
                </option>
                <option value="active">
                  {t('admin.roles.active', { defaultValue: 'Active' })} ({activeCount})
                </option>
                <option value="inactive">
                  {t('admin.roles.inactive', { defaultValue: 'Inactive' })} ({inactiveCount})
                </option>
                <option value="granted">
                  {t('admin.roles.granted', { defaultValue: 'Granted' })} ({grantedCount})
                </option>
                <option value="denied">
                  {t('admin.roles.denied', { defaultValue: 'Denied' })} ({deniedCount})
                </option>
                <option value="default">
                  {t('admin.roles.default', { defaultValue: 'Default' })} ({defaultCount})
                </option>
              </Select>
            </div>
            <div className="col-span-12 md:col-span-4 flex items-center justify-end gap-2">
              <small className="text-surface-500 mr-2">
                {filteredPermissions.length} / {permissions.length} · {groupCount}{' '}
                {t('admin.roles.groups', { defaultValue: 'groups' })}
              </small>
              <Button
                onClick={expandAll}
                title={t('admin.roles.expandAll', { defaultValue: 'Expand all' })}
                variant="outline-secondary"
                size="sm"
                className="py-[0.2rem] px-[0.5rem] text-[0.7rem]"
              >
                <i className="bx bx-expand-vertical"></i>
              </Button>
              <Button
                onClick={collapseAll}
                title={t('admin.roles.collapseAll', { defaultValue: 'Collapse all' })}
                variant="outline-secondary"
                size="sm"
                className="py-[0.2rem] px-[0.5rem] text-[0.7rem]"
              >
                <i className="bx bx-collapse-vertical"></i>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Permission Groups */}
      {groupCount === 0 ? (
        <Card>
          <div className="p-5">
            <CardEmptyState
              icon="bx-shield-x"
              message={t('admin.roles.noPermissions', { defaultValue: 'No permissions found' })}
            />
          </div>
        </Card>
      ) : (
        Object.entries(groupedPermissions)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([group, perms]) => (
            <PermissionGroupCard
              key={group}
              group={group}
              perms={perms}
              color={color}
              isCollapsed={collapsedGroups[group]}
              overrideMap={overrideMap}
              actionLoading={actionLoading}
              onToggle={toggleGroup}
              onDeny={openDenyModal}
              onGrant={openGrantModal}
              onRevert={handleRevertOverride}
            />
          ))
      )}

      {showGrantModal && (
        <PermissionActionModal
          action="grant"
          role={role}
          permission={modalPermission}
          reason={modalReason}
          onPermissionChange={setModalPermission}
          onReasonChange={setModalReason}
          onSubmit={handleModalGrant}
          onClose={() => setShowGrantModal(false)}
          disabled={!!actionLoading}
        />
      )}

      {showDenyModal && (
        <PermissionActionModal
          action="deny"
          role={role}
          permission={modalPermission}
          reason={modalReason}
          onPermissionChange={setModalPermission}
          onReasonChange={setModalReason}
          onSubmit={handleModalDeny}
          onClose={() => setShowDenyModal(false)}
          disabled={!!actionLoading}
        />
      )}

      {showResetModal && (
        <ResetOverridesModal
          role={role}
          overridesCount={overrides.length}
          actionLoading={actionLoading}
          onReset={handleResetAll}
          onClose={() => setShowResetModal(false)}
        />
      )}
    </div>
  )
}
