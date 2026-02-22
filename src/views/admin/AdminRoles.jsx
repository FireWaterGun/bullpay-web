import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToastContext } from '../../context/ToastContext'
import { getAdminRoles, getAdminRoleStats } from '../../api/admin.ts'
import { ROLE_ICON, ROLE_COLOR, formatRoleLabel } from '../../utils/roles'

export default function AdminRoles() {
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [stats, setStats] = useState(null)

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

      const roleList = Array.isArray(rolesData) ? rolesData : (rolesData?.roles || [])
      setRoles(roleList)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load roles:', error)
      toast.error('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  // Build lookup: role -> { count, percentage }
  function getRoleStats(roleName) {
    if (!stats) return { count: 0, percentage: 0 }
    const key = roleName.toLowerCase()

    // New API format: { roleDistribution: [{ role, count, percentage }] }
    if (stats.roleDistribution && Array.isArray(stats.roleDistribution)) {
      const entry = stats.roleDistribution.find(d => d.role === roleName || d.role === key)
      if (entry) return { count: entry.count || 0, percentage: entry.percentage || 0 }
    }

    // Fallback: stats array format [{ role, count }]
    if (Array.isArray(stats)) {
      const entry = stats.find(s => s.role === roleName || s.role === key)
      if (entry) return { count: entry.count || entry.userCount || 0, percentage: entry.percentage || 0 }
    }

    // Fallback: stats.stats array
    if (stats.stats && Array.isArray(stats.stats)) {
      const entry = stats.stats.find(s => s.role === roleName || s.role === key)
      if (entry) return { count: entry.count || entry.userCount || 0, percentage: entry.percentage || 0 }
    }

    // Fallback: object { role: count }
    if (typeof stats === 'object' && !Array.isArray(stats)) {
      const val = stats[roleName] || stats[key]
      if (typeof val === 'number') return { count: val, percentage: 0 }
    }

    return { count: 0, percentage: 0 }
  }

  const totalUsers = stats?.totalUsers
    ?? (stats?.roleDistribution ? stats.roleDistribution.reduce((sum, d) => sum + (d.count || 0), 0) : null)

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
      {/* Header */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="mb-1">
                <i className="bx bx-shield-alt-2 me-2"></i>
                Roles & Permissions
              </h4>
              <p className="text-muted mb-0">Manage role-based access control (RBAC)</p>
            </div>
            <button className="btn btn-primary" onClick={loadData} disabled={loading}>
              <i className="bx bx-refresh me-1"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {(totalUsers != null || roles.length > 0) && (
        <div className="row mb-4">
          {totalUsers != null && (
            <div className="col-sm-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded bg-label-primary" style={{ width: '42px', height: '42px' }}>
                      <i className="bx bx-group" style={{ fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                      <h5 className="mb-0">{totalUsers}</h5>
                      <small className="text-muted">Total Users</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="col-sm-6 col-lg-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center justify-content-center rounded bg-label-info" style={{ width: '42px', height: '42px' }}>
                    <i className="bx bx-shield-alt-2" style={{ fontSize: '1.4rem' }}></i>
                  </div>
                  <div>
                    <h5 className="mb-0">{roles.length}</h5>
                    <small className="text-muted">Total Roles</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Cards */}
      <div className="row g-4">
        {roles.map((role) => {
          const roleName = typeof role === 'string' ? role : (role.name || role.role || '')
          const roleKey = roleName.toLowerCase()
          const color = ROLE_COLOR[roleKey] || 'secondary'
          const icon = ROLE_ICON[roleKey] || 'bx-user'
          const description = typeof role === 'object' ? (role.description || '') : ''
          const roleStats = getRoleStats(roleName)
          const userCount = roleStats.count
          const percentage = Number(roleStats.percentage) || 0

          return (
            <div key={roleName} className="col-md-6 col-lg-4">
              <div
                className="card h-100 border-0 shadow-sm"
                style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onClick={() => navigate(`/admin/roles/${roleKey}`)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      className={`d-flex align-items-center justify-content-center rounded bg-label-${color}`}
                      style={{ width: '48px', height: '48px', minWidth: '48px' }}
                    >
                      <i className={`bx ${icon}`} style={{ fontSize: '1.5rem' }}></i>
                    </div>
                    <div>
                      <h5 className="mb-0">{formatRoleLabel(roleName)}</h5>
                      {description && <small className="text-muted">{description}</small>}
                    </div>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bx bx-group text-muted"></i>
                      <span className="text-muted">{userCount} users</span>
                    </div>
                    {percentage > 0 && (
                      <small className="text-muted fw-medium">{percentage.toFixed(1)}%</small>
                    )}
                  </div>
                  {percentage > 0 && (
                    <div className="progress" style={{ height: '4px' }}>
                      <div
                        className={`progress-bar bg-${color}`}
                        role="progressbar"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                <div className={`card-footer bg-label-${color} bg-opacity-10 border-0`}>
                  <div className="d-flex align-items-center justify-content-between">
                    <small className="fw-medium">Manage Permissions</small>
                    <i className="bx bx-chevron-right"></i>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {roles.length === 0 && (
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bx bx-shield-x text-muted" style={{ fontSize: '3rem' }}></i>
                <p className="text-muted mt-2">No roles found</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
