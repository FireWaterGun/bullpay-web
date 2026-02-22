function formatGroupLabel(groupKey) {
  return groupKey.replace(/\./g, ' > ').replace(/\b\w/g, c => c.toUpperCase())
}

function sourceBadgeClass(source) {
  if (source === 'granted') return 'bg-label-success'
  if (source === 'denied') return 'bg-label-danger'
  return 'bg-label-secondary'
}

export default function PermissionGroupCard({ group, perms, isCollapsed, overrideMap, actionLoading, onToggle, onDeny, onGrant, onRevert }) {
  return (
    <div className="card mb-3">
      <div
        className="card-header py-2"
        style={{ cursor: 'pointer' }}
        onClick={() => onToggle(group)}
      >
        <h6 className="mb-0 d-flex align-items-center gap-2">
          <i className={`bx ${isCollapsed ? 'bx-chevron-right' : 'bx-chevron-down'} text-muted`}></i>
          <i className="bx bx-lock-alt text-muted"></i>
          {formatGroupLabel(group)}
          <span className="badge bg-label-secondary rounded-pill" style={{ fontSize: '0.7rem' }}>{perms.length}</span>
        </h6>
      </div>
      {!isCollapsed && (
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <tbody>
                {perms.map((p) => {
                  const override = overrideMap[p.permission]
                  const isOverridden = !!override
                  const isLoading = actionLoading === p.permission

                  return (
                    <tr key={p.permission}>
                      <td style={{ width: '40px' }}>
                        {p.active ? (
                          <i className="bx bx-check-circle text-success" style={{ fontSize: '1.25rem' }}></i>
                        ) : (
                          <i className="bx bx-x-circle text-danger" style={{ fontSize: '1.25rem' }}></i>
                        )}
                      </td>
                      <td>
                        <div>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <code style={{ fontSize: '0.8rem' }}>{p.permission}</code>
                            <span className={`badge ${sourceBadgeClass(p.source)}`} style={{ fontSize: '0.65rem' }}>
                              {p.source}
                            </span>
                          </div>
                          {isOverridden && override.reason && (
                            <small className="text-muted d-block mt-1">
                              <i className="bx bx-message-detail me-1"></i>
                              {override.reason}
                            </small>
                          )}
                        </div>
                      </td>
                      <td className="text-end" style={{ whiteSpace: 'nowrap', width: '220px' }}>
                        {isLoading ? (
                          <span className="spinner-border spinner-border-sm text-primary"></span>
                        ) : (
                          <div className="d-flex gap-1 justify-content-end">
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
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
