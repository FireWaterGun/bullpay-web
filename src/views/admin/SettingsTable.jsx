import React from 'react'
import { useTranslation } from 'react-i18next'
import { formatLabel, getColor, getColorRgb } from './settingsUtils'

export default function SettingsTable({
  groupedSettings,
  expandedGroups,
  toggleGroup,
  editingId,
  editValue,
  setEditValue,
  saving,
  saveInline,
  cancelEdit,
  openAdvancedModal,
}) {
  const { t } = useTranslation()

  return groupedSettings.map((group, groupIdx) => {
    const expanded = expandedGroups.has(group.network)
    const color = getColor(group.network, groupIdx)
    const colorRgb = getColorRgb(group.network, groupIdx)
    return (
      <div className="card mb-4 overflow-hidden" key={group.network} style={{ borderLeft: `4px solid ${color}` }}>
        {/* Network header */}
        <div
          className="card-header d-flex align-items-center justify-content-between py-3"
          style={{ cursor: 'pointer', background: 'var(--bs-card-bg)' }}
          onClick={() => toggleGroup(group.network)}
        >
          <div className="d-flex align-items-center gap-2">
            <i className={`bx ${expanded ? 'bx-chevron-down' : 'bx-chevron-right'}`} style={{ fontSize: '1.2rem' }}></i>
            <span className="fw-bold" style={{ fontSize: '1.05rem', color }}>{group.network}</span>
            <span className="badge rounded-pill bg-label-secondary">{group.count} {t('admin.settings.items', { defaultValue: 'items' })}</span>
          </div>
        </div>

        {expanded && (
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: 'var(--bs-tertiary-bg)' }}>
                    <th style={{ width: '35%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: 'var(--bs-secondary-color)' }}>
                      {t('admin.settings.keyName', { defaultValue: 'Setting' })}
                    </th>
                    <th style={{ width: '10%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: 'var(--bs-secondary-color)' }}>
                      {t('admin.settings.dataType', { defaultValue: 'Type' })}
                    </th>
                    <th style={{ width: '15%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: 'var(--bs-secondary-color)' }}>
                      {t('admin.settings.defaultValue', { defaultValue: 'Default' })}
                    </th>
                    <th style={{ width: '20%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: 'var(--bs-secondary-color)' }}>
                      {t('admin.settings.value', { defaultValue: 'Value' })}
                    </th>
                    <th style={{ width: '20%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: 'var(--bs-secondary-color)', textAlign: 'right' }}>
                      {t('admin.settings.actions', { defaultValue: 'Actions' })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.subGroups.map(sg => {
                    const sgKey = sg.name ? `${group.network}.${sg.name}` : group.network
                    const sgOpen = !sg.name || expandedGroups.has(sgKey)

                    return (
                      <React.Fragment key={sg.name || '_default'}>
                        {/* Sub-group header row */}
                        {sg.name && (
                          <tr
                            style={{ cursor: 'pointer', background: `rgba(${colorRgb}, 0.08)` }}
                            onClick={() => toggleGroup(sgKey)}
                          >
                            <td colSpan="5" style={{ padding: '10px 16px', borderBottom: '2px solid var(--bs-border-color)' }}>
                              <div className="d-flex align-items-center gap-2">
                                <i className={`bx ${sgOpen ? 'bx-chevron-down' : 'bx-chevron-right'}`} style={{ fontSize: '1rem', color }}></i>
                                <span className="fw-bold" style={{ fontSize: '0.9rem', color }}>{formatLabel(sg.name)}</span>
                                <span className="badge rounded-pill" style={{ background: `rgba(${colorRgb}, 0.15)`, color, fontSize: '0.7rem' }}>
                                  {sg.items.length} {t('admin.settings.items', { defaultValue: 'items' })}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Setting rows */}
                        {sgOpen && sg.items.map((s) => {
                          const isEditing = editingId === s.id
                          const changed = s.value !== s.defaultValue

                          return (
                            <tr key={s.id} style={sg.name ? { background: 'var(--bs-secondary-bg)' } : {}}>
                              {/* Setting name */}
                              <td style={{ padding: '12px 16px', paddingLeft: sg.name ? '40px' : '16px', verticalAlign: 'middle' }}>
                                <div>
                                  <span className="fw-semibold" style={{ fontFamily: 'SFMono-Regular, Menlo, monospace', fontSize: '0.85rem' }}>
                                    {s.settingName || s.keyName}
                                  </span>
                                  {s.description && (
                                    <small className="text-muted d-block mt-1" style={{ lineHeight: 1.3, fontSize: '0.75rem' }}>{s.description}</small>
                                  )}
                                </div>
                              </td>

                              {/* Data type */}
                              <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>{s.dataType}</span>
                              </td>

                              {/* Default value */}
                              <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                <span className="text-muted" style={{ fontSize: '0.85rem' }}>{s.defaultValue || '-'}</span>
                              </td>

                              {/* Value */}
                              <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                {isEditing ? (
                                  <div className="d-flex align-items-center gap-2">
                                    {s.dataType === 'boolean' ? (
                                      <select className="form-select" value={editValue} onChange={e => setEditValue(e.target.value)} disabled={saving} autoFocus style={{ maxWidth: 120 }}>
                                        <option value="true">true</option>
                                        <option value="false">false</option>
                                      </select>
                                    ) : (
                                      <input
                                        type={s.dataType === 'integer' || s.dataType === 'decimal' ? 'number' : 'text'}
                                        className="form-control"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveInline(s); if (e.key === 'Escape') cancelEdit() }}
                                        disabled={saving}
                                        autoFocus
                                        step={s.dataType === 'decimal' ? 'any' : undefined}
                                        style={{ maxWidth: 180 }}
                                      />
                                    )}
                                    <button className="btn btn-xs btn-primary" onClick={() => saveInline(s)} disabled={saving} style={{ padding: '2px 8px' }}>
                                      {saving ? <span className="spinner-border spinner-border-sm"></span> : <i className="bx bx-check"></i>}
                                    </button>
                                    <button className="btn btn-xs btn-outline-secondary" onClick={cancelEdit} disabled={saving} style={{ padding: '2px 8px' }}>
                                      <i className="bx bx-x"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                                      {Number(s.isEncrypted) === 1 ? <span className="text-muted fst-italic">••••••</span> : s.value}
                                    </span>
                                    {changed && !Number(s.isEncrypted) && (
                                      <span className="badge bg-label-warning" style={{ fontSize: '0.6rem', padding: '2px 5px' }}>modified</span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Actions */}
                              <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                                {!isEditing && (
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => openAdvancedModal(s)}
                                    style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                                  >
                                    <i className="bx bx-edit-alt me-1"></i>{t('actions.edit', { defaultValue: 'Edit' })}
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  })
}
