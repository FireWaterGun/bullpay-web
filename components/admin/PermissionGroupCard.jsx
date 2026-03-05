'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

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
  if (source === 'granted') return { cls: 'bg-green-50 text-green-700', label: 'granted' }
  if (source === 'denied') return { cls: 'bg-red-50 text-red-700', label: 'denied' }
  return { cls: 'bg-surface-100 text-surface-600', label: 'default' }
}

function getPermAction(permName) {
  const parts = permName.split('.')
  return parts[parts.length - 1] || ''
}

export default function PermissionGroupCard({ group, perms, color = 'primary', isCollapsed, overrideMap, actionLoading, onToggle, onDeny, onGrant, onRevert }) {
  const { t } = useAdminTranslation()
  const activeInGroup = perms.filter(p => p.active).length
  const groupIcon = getGroupIcon(group)

  return (
    <div className="card mb-3">
      <div
        className="px-5 py-4 border-b border-surface-200 py-3"
        style={{ cursor: 'pointer' }}
        onClick={() => onToggle(group)}
      >
        <div className="flex items-center justify-between">
          <h6 className="mb-0 flex items-center gap-2">
            <i className={`bx ${isCollapsed ?'bx-chevron-right' : 'bx-chevron-down'} text-muted`}></i>
            <i className={`bx ${groupIcon} text-${color}`}></i>
            {formatGroupLabel(group)}
          </h6>
          <div className="flex items-center gap-2">
            <small className="text-muted">{activeInGroup}/{perms.length} {t('admin.roles.active', { defaultValue: 'active' }).toLowerCase()}</small>
            <span className={`badge bg-label-${color} rounded-full`} style={{ fontSize: '0.7rem' }}>{perms.length}</span>
          </div>
        </div>
      </div>
      {!isCollapsed && (
        <div className="p-5 p-0">
          <ul className="list-group list-group-flush">
            {perms.map((p) => {
              const override = overrideMap[p.permission]
              const isOverridden = !!override
              const isLoading = actionLoading === p.permission
              const badge = sourceBadge(p.source)
              const action = getPermAction(p.permission)

              return (
                <li key={p.permission} className="list-group-item flex items-center gap-3 py-2 px-3">
                  {/* Status icon */}
                  <div style={{ width: '24px', textAlign: 'center', flexShrink: 0 }}>
                    {p.active ? (
                      <i className="bx bx-check-circle text-success" style={{ fontSize: '1.1rem' }}></i>
                    ) : (
                      <i className="bx bx-x-circle text-danger" style={{ fontSize: '1.1rem' }}></i>
                    )}
                  </div>

                  {/* Permission info */}
                  <div className="grow overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code style={{ fontSize: '0.8rem' }}>{p.permission}</code>
                      <span className={`badge ${badge.cls}`} style={{ fontSize: '0.6rem' }}>{badge.label}</span>
                      {isOverridden && (
                        <span className="badge bg-amber-50 text-amber-700" style={{ fontSize: '0.6rem' }}>
                          <i className="bx bx-edit-alt" style={{ fontSize: '0.55rem' }}></i> {t('admin.roles.override', { defaultValue: 'override' })}
                        </span>
                      )}
                    </div>
                    {isOverridden && override.reason && (
                      <small className="text-muted block mt-1" style={{ fontSize: '0.75rem' }}>
                        <i className="bx bx-message-detail mr-1"></i>{override.reason}
                      </small>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {isLoading ? (
                      <span className="spinner w-4 h-4 text-primary"></span>
                    ) : (
                      <div className="flex gap-1">
                        {isOverridden && (
                          <button
                            className="btn btn btn-sm text-xs py-0.5 px-2 btn border border-warning-500 text-warning-500 bg-transparent hover:bg-warning-500 hover:text-white"
                            style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}
                            onClick={(e) => { e.stopPropagation(); onRevert(override.id, p.permission) }}
                            title={t('admin.roles.revertToDefault', { defaultValue: 'Revert to default' })}
                          >
                            <i className="bx bx-undo mr-1"></i>{t('admin.roles.revert', { defaultValue: 'Revert' })}
                          </button>
                        )}
                        {p.active ? (
                          <button
                            className="btn btn btn-sm text-xs py-0.5 px-2 btn border border-danger-500 text-danger-500 bg-transparent hover:bg-danger-500 hover:text-white"
                            style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}
                            onClick={(e) => { e.stopPropagation(); onDeny(p.permission) }}
                            title={t('admin.roles.denyPermission', { defaultValue: 'Deny this permission' })}
                          >
                            <i className="bx bx-x mr-1"></i>{t('admin.roles.deny', { defaultValue: 'Deny' })}
                          </button>
                        ) : (
                          <button
                            className="btn btn btn-sm text-xs py-0.5 px-2 btn border border-success-500 text-success-500 bg-transparent hover:bg-success-500 hover:text-white"
                            style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}
                            onClick={(e) => { e.stopPropagation(); onGrant(p.permission) }}
                            title={t('admin.roles.grantPermission', { defaultValue: 'Grant this permission' })}
                          >
                            <i className="bx bx-check mr-1"></i>{t('admin.roles.grant', { defaultValue: 'Grant' })}
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
