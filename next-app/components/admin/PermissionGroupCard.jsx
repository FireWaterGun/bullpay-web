'use client'

const GROUP_ICONS = {
  dashboard: 'bx-tachometer',
  wallet: 'bx-wallet',
  invoice: 'bx-receipt',
  notifications: 'bx-bell',
  transactions: 'bx-transfer-alt',
  merchant: 'bx-store',
  admin: 'bx-cog',
}

function getGroupIcon(groupKey) {
  const base = groupKey.split('.')[0]
  return GROUP_ICONS[base] || 'bx-lock-alt'
}

function formatGroupLabel(groupKey) {
  return groupKey.replace(/\./g, ' / ').replace(/\b\w/g, c => c.toUpperCase())
}

function sourceBadge(source) {
  if (source === 'granted') return { cls: 'bg-label-success', label: 'granted' }
  if (source === 'denied') return { cls: 'bg-label-danger', label: 'denied' }
  return { cls: 'bg-label-secondary', label: 'default' }
}

function getPermAction(permName) {
  const parts = permName.split('.')
  return parts[parts.length - 1] || ''
}

export default function PermissionGroupCard({ group, perms, color = 'primary', isCollapsed, overrideMap, actionLoading, onToggle, onDeny, onGrant, onRevert }) {
  const activeInGroup = perms.filter(p => p.active).length
  const groupIcon = getGroupIcon(group)

  return (
    <div className="card mb-3">
      <div
        className="card-header py-3"
        style={{ cursor: 'pointer' }}
        onClick={() => onToggle(group)}
      >
        <div className="d-flex align-items-center justify-content-between">
          <h6 className="mb-0 d-flex align-items-center gap-2">
            <i className={`bx ${isCollapsed ? 'bx-chevron-right' : 'bx-chevron-down'} text-muted`}></i>
            <i className={`bx ${groupIcon} text-${color}`}></i>
            {formatGroupLabel(group)}
          </h6>
          <div className="d-flex align-items-center gap-2">
            <small className="text-muted">{activeInGroup}/{perms.length} active</small>
            <span className={`badge bg-label-${color} rounded-pill`} style={{ fontSize: '0.7rem' }}>{perms.length}</span>
          </div>
        </div>
      </div>
      {!isCollapsed && (
        <div className="card-body p-0">
          <ul className="list-group list-group-flush">
            {perms.map((p) => {
              const override = overrideMap[p.permission]
              const isOverridden = !!override
              const isLoading = actionLoading === p.permission
              const badge = sourceBadge(p.source)
              const action = getPermAction(p.permission)

              return (
                <li key={p.permission} className="list-group-item d-flex align-items-center gap-3 py-2 px-3">
                  {/* Status icon */}
                  <div style={{ width: '24px', textAlign: 'center', flexShrink: 0 }}>
                    {p.active ? (
                      <i className="bx bx-check-circle text-success" style={{ fontSize: '1.1rem' }}></i>
                    ) : (
                      <i className="bx bx-x-circle text-danger" style={{ fontSize: '1.1rem' }}></i>
                    )}
                  </div>

                  {/* Permission info */}
                  <div className="flex-grow-1 overflow-hidden">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <code style={{ fontSize: '0.8rem' }}>{p.permission}</code>
                      <span className={`badge ${badge.cls}`} style={{ fontSize: '0.6rem' }}>{badge.label}</span>
                      {isOverridden && (
                        <span className="badge bg-label-warning" style={{ fontSize: '0.6rem' }}>
                          <i className="bx bx-edit-alt" style={{ fontSize: '0.55rem' }}></i> override
                        </span>
                      )}
                    </div>
                    {isOverridden && override.reason && (
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                        <i className="bx bx-message-detail me-1"></i>{override.reason}
                      </small>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {isLoading ? (
                      <span className="spinner-border spinner-border-sm text-primary"></span>
                    ) : (
                      <div className="d-flex gap-1">
                        {isOverridden && (
                          <button
                            className="btn btn-xs btn-outline-warning"
                            style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}
                            onClick={(e) => { e.stopPropagation(); onRevert(override.id, p.permission) }}
                            title="Revert to default"
                          >
                            <i className="bx bx-undo me-1"></i>Revert
                          </button>
                        )}
                        {p.active ? (
                          <button
                            className="btn btn-xs btn-outline-danger"
                            style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}
                            onClick={(e) => { e.stopPropagation(); onDeny(p.permission) }}
                            title="Deny this permission"
                          >
                            <i className="bx bx-x me-1"></i>Deny
                          </button>
                        ) : (
                          <button
                            className="btn btn-xs btn-outline-success"
                            style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}
                            onClick={(e) => { e.stopPropagation(); onGrant(p.permission) }}
                            title="Grant this permission"
                          >
                            <i className="bx bx-check me-1"></i>Grant
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export function groupPermissions(permissions) {
  const groups = {}
  permissions.forEach(p => {
    const name = p.permission || ''
    if (!name) return
    const parts = name.split('.')
    const groupKey = parts.length >= 3 ? parts.slice(0, 2).join('.') : parts[0]
    if (!groups[groupKey]) groups[groupKey] = []
    groups[groupKey].push(p)
  })
  return groups
}
