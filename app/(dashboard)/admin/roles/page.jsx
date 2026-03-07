'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getAdminRoles, getAdminRoleStats } from '@/lib/api/admin'
import { ROLE_ICON, ROLE_COLOR, ROLE_LEVEL, ROLE_DESCRIPTION, formatRoleLabel } from '@/lib/utils/roles'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'
import AvatarInitial from '@/components/ui/AvatarInitial'
import Badge, { bgLabelClass } from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

/* Tailwind JIT can't resolve dynamic `bg-${color}` — map to real classes */
const progressBgMap = {
  primary: 'bg-primary',
  danger: 'bg-danger',
  info: 'bg-info',
  warning: 'bg-warning',
  success: 'bg-success',
  secondary: 'bg-surface-400',
}

export default function AdminRoles() {
  const { token, user } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const { t } = useAdminTranslation()

  const myLevel = ROLE_LEVEL[user?.role] || 0

  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [stats, setStats] = useState(null)
  const [animating, setAnimating] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setAnimating(true)
      const [rolesData, statsData] = await Promise.all([
        getAdminRoles(token),
        getAdminRoleStats(token).catch(() => null),
      ])
      const roleList = Array.isArray(rolesData) ? rolesData : rolesData?.roles || []
      setRoles(roleList)
      setStats(statsData)
    } catch (error) {
      logger.error('Failed to load roles:', error)
      toast.error(t('admin.roles.loadError', { defaultValue: 'Failed to load roles' }))
    } finally {
      setLoading(false)
      // Delay 1 frame so bars render at 0% first, then animate to target
      requestAnimationFrame(() => setAnimating(false))
    }
  }, [token, toast, t])

  useEffect(() => {
    loadData()
  }, [loadData])

  function getRoleStats(roleKey) {
    if (!stats?.roleDistribution) return { count: 0, percentage: 0 }
    const entry = stats.roleDistribution.find((d) => d.role === roleKey)
    return entry
      ? { count: entry.count || 0, percentage: parseFloat(entry.percentage) || 0 }
      : { count: 0, percentage: 0 }
  }

  function getRoleKey(role) {
    if (typeof role === 'string') return role.toLowerCase()
    return (role.value || role.name || role.role || '').toLowerCase()
  }

  function getRoleName(role) {
    if (typeof role === 'string') return formatRoleLabel(role)
    return role.name || formatRoleLabel(role.value || '')
  }

  const totalUsers =
    stats?.totalUsers ??
    (stats?.roleDistribution ? stats.roleDistribution.reduce((sum, d) => sum + (d.count || 0), 0) : null)

  const visibleRoles = [...roles]
    .filter((role) => {
      const canAssign = typeof role === 'object' ? role.canAssign : undefined
      return canAssign !== false && (ROLE_LEVEL[getRoleKey(role)] || 0) <= myLevel
    })
    .sort((a, b) => (ROLE_LEVEL[getRoleKey(b)] || 0) - (ROLE_LEVEL[getRoleKey(a)] || 0))

  if (loading && roles.length === 0) {
    return <PageSpinner />
  }

  return (
    <div className="grow pb-6">
      <Card>
        {/* Header */}
        <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h4 className="mb-1">
              <i className="bx bx-shield-alt-2 text-primary mr-2"></i>
              {t('admin.roles.title', { defaultValue: 'Roles & Permissions' })}
            </h4>
            <p className="text-surface-500 mb-0 text-sm">
              {totalUsers != null
                ? t('admin.roles.summaryLine', {
                    roles: visibleRoles.length,
                    users: totalUsers,
                    defaultValue: '{{roles}} roles · {{users}} total users',
                  })
                : t('admin.roles.description', { defaultValue: 'Manage role-based access control (RBAC)' })}
            </p>
          </div>
          <RefreshButton onClick={loadData} loading={loading} />
        </div>

        {/* Table */}
        <Table>
          <thead>
            <tr>
              <th>{t('admin.roles.role', { defaultValue: 'Role' })}</th>
              <th className="text-center">{t('admin.roles.level', { defaultValue: 'Level' })}</th>
              <th>{t('admin.roles.description', { defaultValue: 'Description' })}</th>
              <th className="text-right">{t('admin.roles.users', { defaultValue: 'Users' })}</th>
              <th>{t('admin.roles.distribution', { defaultValue: 'Distribution' })}</th>
              <th className="text-center">{t('invoices.actions', { defaultValue: 'Actions' })}</th>
            </tr>
          </thead>
          <tbody className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {visibleRoles.length === 0 ? (
              <TableEmptyState
                colSpan={6}
                icon="bx-shield-x"
                message={t('admin.roles.noRoles', { defaultValue: 'No roles found' })}
              />
            ) : (
              visibleRoles.map((role) => {
                const roleKey = getRoleKey(role)
                const roleName = getRoleName(role)
                const color = ROLE_COLOR[roleKey] || 'secondary'
                const icon = ROLE_ICON[roleKey] || 'bx-user'
                const level = ROLE_LEVEL[roleKey] || 0
                const description = t(`admin.roles.roleDesc.${roleKey}`, { defaultValue: ROLE_DESCRIPTION[roleKey] || '' })
                const rs = getRoleStats(roleKey)

                return (
                  <tr key={roleKey} className="cursor-pointer" onClick={() => router.push(`/admin/roles/${roleKey}`)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <AvatarInitial className={bgLabelClass(color)}>
                          <i className={`bx ${icon} bx-sm`}></i>
                        </AvatarInitial>
                        <div>
                          <div className="font-medium">{roleName}</div>
                          <div className="text-surface-500 text-xs">{roleKey}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <Badge color={color} label>
                        L{level}
                      </Badge>
                    </td>
                    <td>
                      <span className="text-surface-500 text-[0.85rem]">{description || '—'}</span>
                    </td>
                    <td className="text-right">
                      <span className="font-semibold">{rs.count}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="h-[6px] grow rounded-full bg-surface-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progressBgMap[color] || 'bg-primary'} transition-[width] duration-500 ease-out`}
                            role="progressbar"
                            style={{ width: animating ? '0%' : `${Math.max(rs.percentage, 2)}%` }}
                          />
                        </div>
                        <span className="text-xs text-surface-500 w-10 text-right">{rs.percentage.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <a
                        href={`/admin/roles/${roleKey}`}
                        title={t('admin.roles.managePermissions', { defaultValue: 'Manage Permissions' })}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-100 dark:hover:bg-white/6 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="bx bx-chevron-right text-primary text-xl"></i>
                      </a>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
