'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
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
import SummaryCard from '@/components/admin/RevenueSummaryCard'
import PermissionActionModal from '@/components/admin/PermissionActionModal'
import ResetOverridesModal from '@/components/admin/ResetOverridesModal'
import PermissionGroupCard, { groupPermissions } from '@/components/admin/PermissionGroupCard'
import { logger } from '@/lib/utils/logger'

export default function RolePermissions() {
  const { token } = useAuth()
  const toast = useToast()
  const { role } = useParams()

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

  useEffect(() => {
    loadData()
  }, [role])

  async function loadData() {
    try {
      setLoading(true)
      const [permsData, overridesData] = await Promise.all([
        getRolePermissions(token, role),
        getRolePermissionOverrides(token, role).catch(() => null),
      ])

      // API: { role, permissions: [...], resolved: [{ permission, source, active }] }
      const resolved = Array.isArray(permsData) ? permsData
        : (permsData?.resolved || permsData?.permissions || [])
      setPermissions(resolved.map(p => {
        if (typeof p === 'string') return { permission: p, source: 'default', active: true }
        return {
          permission: p.permission || p.name || '',
          source: p.source || 'default',
          active: p.active !== undefined ? p.active : (p.granted ?? true),
        }
      }))

      const overList = overridesData
        ? (Array.isArray(overridesData) ? overridesData : (overridesData?.overrides || []))
        : []
      setOverrides(overList)
    } catch (error) {
      logger.error('Failed to load role permissions:', error)
      toast.error('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  const overrideMap = useMemo(() => {
    const map = {}
    overrides.forEach(o => { map[o.permission || o.name] = o })
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
      list = list.filter(p => p.permission.toLowerCase().includes(q))
    }

    switch (filterType) {
      case 'active':
        list = list.filter(p => p.active)
        break
      case 'inactive':
        list = list.filter(p => !p.active)
        break
      case 'granted':
        list = list.filter(p => p.source === 'granted')
        break
      case 'denied':
        list = list.filter(p => p.source === 'denied')
        break
      case 'default':
        list = list.filter(p => p.source === 'default')
        break
    }

    return list
  }, [permissions, searchQuery, filterType])

  const groupedPermissions = useMemo(() => groupPermissions(filteredPermissions), [filteredPermissions])
  const groupCount = Object.keys(groupedPermissions).length

  function toggleGroup(groupKey) {
    setCollapsedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))
  }

  function collapseAll() {
    const all = {}
    Object.keys(groupedPermissions).forEach(k => { all[k] = true })
    setCollapsedGroups(all)
  }

  function expandAll() {
    setCollapsedGroups({})
  }

  async function handleGrant(permission, reason) {
    try {
      setActionLoading(permission)
      await grantRolePermission(token, role, permission, reason || undefined)
      toast.success(`Granted: ${permission}`)
      await loadData()
    } catch (error) {
      logger.error('Grant failed:', error)
      toast.error(error?.message || 'Failed to grant permission')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDeny(permission, reason) {
    try {
      setActionLoading(permission)
      await denyRolePermission(token, role, permission, reason || undefined)
      toast.success(`Denied: ${permission}`)
      await loadData()
    } catch (error) {
      logger.error('Deny failed:', error)
      toast.error(error?.message || 'Failed to deny permission')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRevertOverride(overrideId, permName) {
    try {
      setActionLoading(permName)
      await deleteRolePermissionOverride(token, role, overrideId)
      toast.success(`Reverted override: ${permName}`)
      await loadData()
    } catch (error) {
      logger.error('Revert failed:', error)
      toast.error(error?.message || 'Failed to revert override')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleResetAll() {
    try {
      setActionLoading('__reset__')
      await resetRolePermissionOverrides(token, role)
      toast.success('All overrides have been reset')
      setShowResetModal(false)
      await loadData()
    } catch (error) {
      logger.error('Reset failed:', error)
      toast.error(error?.message || 'Failed to reset overrides')
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
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/admin/roles" className="text-muted">
              <i className="bx bx-shield-alt-2 me-1"></i>Roles
            </Link>
          </li>
          <li className="breadcrumb-item active">{formatRoleLabel(role)}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="avatar avatar-lg">
            <span className={`avatar-initial rounded bg-label-${color}`}>
              <i className={`bx ${icon}`} style={{ fontSize: '1.75rem' }}></i>
            </span>
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h4 className="mb-0">{formatRoleLabel(role)}</h4>
              {level > 0 && <span className={`badge bg-label-${color}`}>L{level}</span>}
            </div>
            {description && <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{description}</p>}
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-success btn-sm" onClick={() => openGrantModal()}>
            <i className="bx bx-plus-circle me-1"></i>Grant
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => openDenyModal()}>
            <i className="bx bx-minus-circle me-1"></i>Deny
          </button>
          {overrides.length > 0 && (
            <button className="btn btn-outline-warning btn-sm" onClick={() => setShowResetModal(true)}>
              <i className="bx bx-reset me-1"></i>Reset All
            </button>
          )}
          <button className="btn btn-icon btn-text-secondary" onClick={loadData} disabled={loading}>
            <i className="bx bx-refresh"></i>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="row g-4 mb-4">
        <SummaryCard
          title="Total Permissions"
          value={permissions.length}
          icon="bx-lock-alt"
          color="primary"
        />
        <SummaryCard
          title="Active"
          value={activeCount}
          icon="bx-check-circle"
          color="success"
        />
        <SummaryCard
          title="Inactive"
          value={inactiveCount}
          icon="bx-x-circle"
          color={inactiveCount > 0 ? 'danger' : 'secondary'}
        />
        <SummaryCard
          title="Overrides"
          value={overrides.length}
          icon="bx-edit-alt"
          color={overrides.length > 0 ? 'warning' : 'secondary'}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <div className="input-group input-group-merge">
                <span className="input-group-text"><i className="bx bx-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search permissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <span className="input-group-text" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')}>
                    <i className="bx bx-x"></i>
                  </span>
                )}
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All ({permissions.length})</option>
                <option value="active">Active ({activeCount})</option>
                <option value="inactive">Inactive ({inactiveCount})</option>
                <option value="granted">Granted ({grantedCount})</option>
                <option value="denied">Denied ({deniedCount})</option>
                <option value="default">Default ({defaultCount})</option>
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-center justify-content-end gap-2">
              <small className="text-muted me-2">
                {filteredPermissions.length} of {permissions.length} · {groupCount} groups
              </small>
              <button className="btn btn-xs btn-outline-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={expandAll} title="Expand all">
                <i className="bx bx-expand-vertical"></i>
              </button>
              <button className="btn btn-xs btn-outline-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={collapseAll} title="Collapse all">
                <i className="bx bx-collapse-vertical"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Groups */}
      {groupCount === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bx bx-shield-x text-muted" style={{ fontSize: '3rem' }}></i>
            <p className="text-muted mt-2">No permissions found</p>
          </div>
        </div>
      ) : (
        Object.entries(groupedPermissions).sort(([a], [b]) => a.localeCompare(b)).map(([group, perms]) => (
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
