'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getAdminRoles, getAdminRoleStats } from '@/lib/api/admin'
import { ROLE_ICON, ROLE_COLOR, ROLE_LEVEL, ROLE_DESCRIPTION, formatRoleLabel } from '@/lib/utils/roles'
import SummaryCard from '@/components/admin/RevenueSummaryCard'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import CardEmptyState from '@/components/CardEmptyState'

const HIERARCHY_ORDER = ['super_admin', 'admin', 'support_agent', 'business_user', 'regular_user']

export default function AdminRoles() {
  const { token, user } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const { t } = useAdminTranslation()

  // Requester's level — used to hide roles above their access
  const myLevel = ROLE_LEVEL[user?.role] || 0

  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [stats, setStats] = useState(null)
  const [requesterRole, setRequesterRole] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [rolesData, statsData] = await Promise.all([
        getAdminRoles(token),
        getAdminRoleStats(token).catch(() => null),
      ])

      // API: { roles: [{ value, name, canAssign }], requesterRole }
      const roleList = Array.isArray(rolesData) ? rolesData : (rolesData?.roles || [])
      setRoles(roleList)
      setRequesterRole(rolesData?.requesterRole || null)
      setStats(statsData)
    } catch (error) {
      logger.error('Failed to load roles:', error)
      toast.error(t('admin.roles.loadError', { defaultValue: 'Failed to load roles' }))
    } finally {
      setLoading(false)
    }
  }

  // Build lookup: role key -> { count, percentage }
  function getRoleStats(roleKey) {
    if (!stats) return { count: 0, percentage: 0 }
    const key = roleKey.toLowerCase()

    if (stats.roleDistribution && Array.isArray(stats.roleDistribution)) {
      const entry = stats.roleDistribution.find(d => d.role === key)
      if (entry) return { count: entry.count || 0, percentage: parseFloat(entry.percentage) || 0 }
    }

    return { count: 0, percentage: 0 }
  }

  // Extract role key from role object — API uses `value` field
  function getRoleKey(role) {
    if (typeof role === 'string') return role.toLowerCase()
    return (role.value || role.name || role.role || '').toLowerCase()
  }

  function getRoleName(role) {
    if (typeof role === 'string') return formatRoleLabel(role)
    return role.name || formatRoleLabel(role.value || '')
  }

  const totalUsers = stats?.totalUsers
    ?? (stats?.roleDistribution ? stats.roleDistribution.reduce((sum, d) => sum + (d.count || 0), 0) : null)

  // Sort roles by hierarchy level (highest first)
  const sortedRoles = [...roles].sort((a, b) => {
    return (ROLE_LEVEL[getRoleKey(b)] || 0) - (ROLE_LEVEL[getRoleKey(a)] || 0)
  })

  // Build hierarchy from known order, filtered by existing roles and requester level
  const hierarchyRoles = HIERARCHY_ORDER.filter(h =>
    roles.some(r => getRoleKey(r) === h) && (ROLE_LEVEL[h] || 0) <= myLevel
  )

  if (loading) {
    return <PageSpinner />
  }

  return (
    <div className="grow py-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bx bx-shield-alt-2 text-primary mr-2"></i>
            {t('admin.roles.title', { defaultValue: 'Roles & Permissions' })}
          </h4>
          <p className="text-muted mb-0">
            {t('admin.roles.description', { defaultValue: 'Manage role-based access control (RBAC)' })}
            {requesterRole && (
              <span className="ml-2">
                — {t('admin.roles.loggedInAs', { defaultValue: 'logged in as' })} <span className={`badge bg-label-${ROLE_COLOR[requesterRole] ||'secondary'}`}>{formatRoleLabel(requesterRole)}</span>
              </span>
            )}
          </p>
        </div>
        <RefreshButton onClick={loadData} loading={loading} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-12 gap-x-6 gap-4 mb-4">
        <SummaryCard
          title={t('admin.roles.totalUsers', { defaultValue: 'Total Users' })}
          value={totalUsers ?? '—'}
          icon="bx-group"
          color="primary"
        />
        <SummaryCard
          title={t('admin.roles.totalRoles', { defaultValue: 'Total Roles' })}
          value={roles.length}
          icon="bx-shield-alt-2"
          color="info"
        />
      </div>

      {/* Role Hierarchy */}
      {hierarchyRoles.length > 0 && (
        <div className="card mb-4">
          <div className="p-5">
            <h6 className="mb-3">
              <i className="bx bx-sitemap mr-2 text-muted"></i>
              {t('admin.roles.roleHierarchy', { defaultValue: 'Role Hierarchy' })}
            </h6>
            <div className="flex items-end gap-3 flex-wrap justify-center">
              {hierarchyRoles.map((roleKey) => {
                const level = ROLE_LEVEL[roleKey] || 1
                const color = ROLE_COLOR[roleKey] || 'secondary'
                const icon = ROLE_ICON[roleKey] || 'bx-user'
                const rs = getRoleStats(roleKey)
                const barHeight = 40 + level * 16

                return (
                  <div
                    key={roleKey}
                    className="text-center"
                    style={{ cursor: 'pointer', minWidth: '100px', flex: '1 1 0' }}
                    onClick={() => router.push(`/admin/roles/${roleKey}`)}
                  >
                    <div
                      className={`flex flex-col items-center justify-end mx-auto rounded-top bg-label-${color}`}
                      style={{ width: '100%', maxWidth: '120px', height: `${barHeight}px`, transition: 'opacity 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                    >
                      <i className={`bx ${icon} mb-1`} style={{ fontSize: '1.25rem' }}></i>
                      <span className={`badge bg-${color} mb-2`} style={{ fontSize: '0.65rem' }}>L{level}</span>
                    </div>
                    <div className="mt-2">
                      <small className="font-semibold block" style={{ fontSize: '0.75rem' }}>{formatRoleLabel(roleKey)}</small>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {rs.count} {rs.count === 1 ? t('admin.roles.user', { defaultValue: 'user' }) : t('admin.roles.users', { defaultValue: 'users' })} · {rs.percentage.toFixed(0)}%
                      </small>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Role Cards */}
      <div className="grid grid-cols-12 gap-x-6 gap-4">
        {sortedRoles.filter((role) => {
          const canAssign = typeof role === 'object' ? role.canAssign : undefined
          const roleLevel = ROLE_LEVEL[getRoleKey(role)] || 0
          return canAssign !== false && roleLevel <= myLevel
        }).map((role) => {
          const roleKey = getRoleKey(role)
          const roleName = getRoleName(role)
          const color = ROLE_COLOR[roleKey] || 'secondary'
          const icon = ROLE_ICON[roleKey] || 'bx-user'
          const level = ROLE_LEVEL[roleKey] || 0
          const description = ROLE_DESCRIPTION[roleKey] || ''
          const rs = getRoleStats(roleKey)

          return (
            <div key={roleKey} className="md:col-span-6">
              <div
                className="card h-full"
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onClick={() => router.push(`/admin/roles/${roleKey}`)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                <div className="p-5">
                  {/* Role header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <span className={`avatar-initial rounded bg-label-${color}`}>
                          <i className={`bx ${icon} bx-sm`}></i>
                        </span>
                      </div>
                      <div>
                        <h5 className="mb-0">{roleName}</h5>
                        <small className="text-muted">{roleKey}</small>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {level > 0 && (
                        <span className={`badge bg-label-${color}`}>L{level}</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {description && (
                    <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>{description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <h4 className="mb-0">{rs.count}</h4>
                      <small className="text-muted">{t('admin.roles.users', { defaultValue: 'Users' })}</small>
                    </div>
                    <div className="grow">
                      <div className="flex justify-between mb-1">
                        <small className="text-muted">{t('admin.roles.distribution', { defaultValue: 'Distribution' })}</small>
                        <small className={`font-medium text-${color}`}>{rs.percentage.toFixed(1)}%</small>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar bg-${color}`}
                          role="progressbar"
                          style={{ width: `${Math.max(rs.percentage, 2)}%`, transition: 'width 0.4s ease' }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Footer link */}
                  <div className="flex items-center justify-between pt-2 border-top">
                    <small className="font-medium">{t('admin.roles.managePermissions', { defaultValue: 'Manage Permissions' })}</small>
                    <i className={`bx bx-chevron-right text-${color}`}></i>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {roles.length === 0 && (
          <div className="col-span-12">
            <div className="card">
              <div className="p-5">
                <CardEmptyState
                  icon="bx-shield-x"
                  message={t('admin.roles.noRoles', { defaultValue: 'No roles found' })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
