import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToastContext } from '../../context/ToastContext'
import {
  getRolePermissions,
  getRolePermissionOverrides,
  grantRolePermission,
  denyRolePermission,
  deleteRolePermissionOverride,
  resetRolePermissionOverrides,
} from '../../api/admin.ts'
import { ROLE_ICON, ROLE_COLOR, formatRoleLabel } from '../../utils/roles'
import PermissionActionModal from './PermissionActionModal'
import ResetOverridesModal from './ResetOverridesModal'
import PermissionGroupCard, { groupPermissions } from './PermissionGroupCard'

export default function RolePermissions() {
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
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
      console.error('Failed to load role permissions:', error)
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
  for (const p of permissions) { if (p.active) activeCount++ }
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

  function toggleGroup(groupKey) {
    setCollapsedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))
  }

  async function handleGrant(permission, reason) {
    try {
      setActionLoading(permission)
      await grantRolePermission(token, role, permission, reason || undefined)
      toast.success(`Granted: ${permission}`)
      await loadData()
    } catch (error) {
      console.error('Grant failed:', error)
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
      console.error('Deny failed:', error)
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
      console.error('Revert failed:', error)
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
      console.error('Reset failed:', error)
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
      <button onClick={() => navigate('/admin/roles')} className="btn btn-outline-secondary mb-3">
        <i className="bx bx-arrow-back me-2"></i>
        Back to Roles
      </button>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className={`d-flex align-items-center justify-content-center rounded bg-label-${color}`}
                style={{ width: '56px', height: '56px', minWidth: '56px' }}
              >
                <i className={`bx ${icon}`} style={{ fontSize: '1.75rem' }}></i>
              </div>
              <div>
                <h4 className="mb-1">{formatRoleLabel(role)}</h4>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className={`badge bg-label-${color}`}>{formatRoleLabel(role)}</span>
                  <span className="badge bg-label-success">{activeCount} active</span>
                  <span className="badge bg-label-secondary">{inactiveCount} inactive</span>
                  {overrides.length > 0 && (
                    <span className="badge bg-label-warning">{overrides.length} overrides</span>
                  )}
                </div>
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
              <button className="btn btn-outline-secondary btn-sm" onClick={loadData} disabled={loading}>
                <i className="bx bx-refresh me-1"></i>Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text"><i className="bx bx-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search permissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="btn btn-outline-secondary" onClick={() => setSearchQuery('')}>
                    <i className="bx bx-x"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All ({permissions.length})</option>
                <option value="active">Active ({activeCount})</option>
                <option value="inactive">Inactive ({inactiveCount})</option>
                <option value="granted">Granted (override)</option>
                <option value="denied">Denied (override)</option>
                <option value="default">Default</option>
              </select>
            </div>
            <div className="col-md-3 text-end">
              <span className="text-muted">
                Showing {filteredPermissions.length} of {permissions.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(groupedPermissions).length === 0 ? (
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
