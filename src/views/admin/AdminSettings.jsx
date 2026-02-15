import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import {
  getSettings,
  getSettingCategories,
  upsertSetting,
} from '../../api/admin.ts'

const CATEGORY_OPTIONS = ['general', 'withdrawal', 'sweep', 'gas_topup', 'gas_price', 'gas_limit', 'rbf', 'invoice', 'notification', 'security']
const SCOPE_OPTIONS = ['global', 'merchant', 'user']

function formatLabel(str) {
  return String(str || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const KNOWN_COLORS = { ETH: '#627eea', BSC: '#f3ba2f', POL: '#8247e5' }
const COLOR_PALETTE = ['#697a8d', '#20c997', '#e83e8c', '#fd7e14', '#0dcaf0', '#6610f2', '#d63384', '#198754', '#0d6efd', '#dc3545']
function getColor(name) {
  const upper = (name || '').toUpperCase()
  if (KNOWN_COLORS[upper]) return KNOWN_COLORS[upper]
  let hash = 0
  for (let i = 0; i < upper.length; i++) hash = upper.charCodeAt(i) + ((hash << 5) - hash)
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length]
}

export default function AdminSettings() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const initCategory = searchParams.get('category') || ''
  const initScope = searchParams.get('scope') || ''
  const initSearch = searchParams.get('search') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [categories, setCategories] = useState(null)

  const [categoryFilter, setCategoryFilter] = useState(initCategory)
  const [scopeFilter, setScopeFilter] = useState(initScope)
  const [searchFilter, setSearchFilter] = useState(initSearch)
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initCategory) f.category = initCategory
    if (initScope) f.scope = initScope
    if (initSearch) f.search = initSearch
    return f
  })

  // Inline edit state
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Modal for advanced edit
  const [showModal, setShowModal] = useState(false)
  const [modalSetting, setModalSetting] = useState(null)
  const [modalValue, setModalValue] = useState('')
  const [modalDesc, setModalDesc] = useState('')
  const [modalScope, setModalScope] = useState('global')
  const [modalEntityId, setModalEntityId] = useState('')
  const [modalIsPublic, setModalIsPublic] = useState(false)
  const [modalIsEncrypted, setModalIsEncrypted] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)

  // Expand/collapse
  const [expandedGroups, setExpandedGroups] = useState(new Set())

  useEffect(() => { loadSettings() }, [currentPage, appliedFilters])
  useEffect(() => { loadCategories() }, [])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, v) })
    if (page > 1) params.set('page', page)
    setSearchParams(params, { replace: true })
  }

  function applyFilters() {
    const f = { category: categoryFilter || undefined, scope: scopeFilter || undefined, search: searchFilter || undefined }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setCategoryFilter('')
    setScopeFilter('')
    setSearchFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    syncSearchParams({}, 1)
  }

  async function loadSettings() {
    if (!token) return
    try {
      setLoading(true)
      const data = await getSettings(token, { page: currentPage, limit: 50, ...appliedFilters })
      setSettings(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error(t('admin.settings.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoading(false)
    }
  }

  async function loadCategories() {
    if (!token) return
    try {
      const data = await getSettingCategories(token)
      setCategories(data)
      // If no category selected yet, default to first category from API
      const list = data?.categories || data || []
      if (!searchParams.get('category') && list.length > 0) {
        const first = list[0]
        setCategoryFilter(first)
        const f = { ...appliedFilters, category: first }
        setAppliedFilters(f)
        syncSearchParams(f, currentPage)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  // --- Inline edit ---
  function startEdit(s) {
    setEditingId(s.id)
    setEditValue(s.value || '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function saveInline(s) {
    if (!editValue.trim()) return
    if (editValue === s.value) { cancelEdit(); return }
    try {
      setSaving(true)
      await upsertSetting(token, { keyName: s.keyName, value: editValue })
      toast.success(t('admin.settings.saveSuccess', { defaultValue: 'Setting saved successfully' }))
      cancelEdit()
      loadSettings()
    } catch (error) {
      console.error('Failed to save setting:', error)
      toast.error(t('admin.settings.saveError', { defaultValue: 'Failed to save setting' }))
    } finally {
      setSaving(false)
    }
  }

  // --- Advanced modal ---
  function openAdvancedModal(s) {
    setModalSetting(s)
    setModalValue(s.value || '')
    setModalDesc(s.description || '')
    setModalScope(s.scope || 'global')
    setModalEntityId(s.entityId ? String(s.entityId) : '')
    setModalIsPublic(Number(s.isPublic) === 1)
    setModalIsEncrypted(Number(s.isEncrypted) === 1)
    setShowModal(true)
  }

  function closeModal() {
    if (modalLoading) return
    setShowModal(false)
    setModalSetting(null)
  }

  async function handleModalSave() {
    if (!modalSetting) return
    if (!modalValue.trim()) {
      toast.error(t('admin.settings.valueRequired', { defaultValue: 'Value is required' }))
      return
    }
    try {
      setModalLoading(true)
      await upsertSetting(token, {
        keyName: modalSetting.keyName,
        value: modalValue,
      })
      toast.success(t('admin.settings.saveSuccess', { defaultValue: 'Setting saved successfully' }))
      closeModal()
      loadSettings()
    } catch (error) {
      console.error('Failed to save setting:', error)
      toast.error(t('admin.settings.saveError', { defaultValue: 'Failed to save setting' }))
    } finally {
      setModalLoading(false)
    }
  }

  function handleCategoryClick(cat) {
    const newCat = appliedFilters.category === cat ? '' : cat
    setCategoryFilter(newCat)
    const f = { ...appliedFilters, category: newCat || undefined }
    if (!newCat) delete f.category
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  // --- Grouped data ---
  const categoryCounts = useMemo(() => {
    if (!categories) return {}
    const counts = categories.counts || []
    if (Array.isArray(counts)) {
      const map = {}
      counts.forEach(c => { map[c.category] = c.count })
      return map
    }
    return counts
  }, [categories])

  const categoryList = useMemo(() => {
    if (!categories) return []
    return categories.categories || []
  }, [categories])

  const groupedSettings = useMemo(() => {
    if (!settings.length) return []
    const tree = {}
    settings.forEach(s => {
      const parts = s.keyName.split('.')
      const network = parts[1] ? parts[1].toUpperCase() : 'OTHER'
      const subGroup = parts.length > 3 ? parts[2] : null
      const settingName = parts.length > 3 ? parts.slice(3).join('.') : parts.slice(2).join('.')
      if (!tree[network]) tree[network] = {}
      const gk = subGroup || '_default'
      if (!tree[network][gk]) tree[network][gk] = []
      tree[network][gk].push({ ...s, settingName, subGroup, network })
    })
    return Object.entries(tree)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([network, subs]) => ({
        network,
        subGroups: Object.entries(subs)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, items]) => ({ name: k === '_default' ? null : k, items: items.sort((a, b) => a.settingName.localeCompare(b.settingName)) })),
        count: Object.values(subs).reduce((sum, arr) => sum + arr.length, 0)
      }))
  }, [settings])

  function toggleGroup(key) {
    setExpandedGroups(prev => {
      if (prev.has(key)) {
        const n = new Set(prev)
        n.delete(key)
        return n
      }
      // Check if key is a network (top-level) — collapse others and open only this one
      const isNetwork = groupedSettings.some(g => g.network === key)
      if (isNetwork) {
        const n = new Set()
        n.add(key)
        // Also expand its sub-groups
        const group = groupedSettings.find(g => g.network === key)
        if (group) group.subGroups.forEach(sg => { if (sg.name) n.add(`${key}.${sg.name}`) })
        return n
      }
      // Sub-group toggle
      const n = new Set(prev)
      n.add(key)
      return n
    })
  }
  function expandAll() {
    const a = new Set()
    groupedSettings.forEach(g => { a.add(g.network); g.subGroups.forEach(sg => { if (sg.name) a.add(`${g.network}.${sg.name}`) }) })
    setExpandedGroups(a)
  }
  function collapseAll() { setExpandedGroups(new Set()) }

  // --- Render ---
  if (loading && settings.length === 0 && !categories) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">
                <i className="bx bx-cog me-2"></i>
                {t('admin.settings.title', { defaultValue: 'System Settings' })}
              </h4>
              <p className="text-muted mb-0">
                {t('admin.settings.description', { defaultValue: 'View and manage system configuration settings' })}
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => { loadSettings(); loadCategories() }} disabled={loading}>
              <i className="bx bx-refresh me-1"></i>
              {t('actions.refresh', { defaultValue: 'Refresh' })}
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3 col-sm-6">
              <label className="form-label">{t('admin.settings.category', { defaultValue: 'Category' })}</label>
              <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">{t('admin.settings.allCategories', { defaultValue: 'All Categories' })}</option>
                {categoryList.map(c => (
                  <option key={c} value={c}>{formatLabel(c)}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 col-sm-6">
              <label className="form-label">{t('admin.settings.scope', { defaultValue: 'Scope' })}</label>
              <select className="form-select" value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
                <option value="">{t('admin.settings.allScopes', { defaultValue: 'All Scopes' })}</option>
                {SCOPE_OPTIONS.map(s => (
                  <option key={s} value={s}>{formatLabel(s)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary" onClick={applyFilters} disabled={loading}>
              <i className="bx bx-filter-alt me-1"></i>
              {t('filter.apply', { defaultValue: 'Apply Filters' })}
            </button>
            <button className="btn btn-outline-secondary" onClick={resetFilters} disabled={loading}>
              <i className="bx bx-reset me-1"></i>
              {t('filter.reset', { defaultValue: 'Reset' })}
            </button>
          </div>
        </div>
      </div>

      {/* Settings content */}
      {settings.length === 0 ? (
        <div className="card"><div className="card-body text-center text-muted py-5">{t('admin.settings.noSettings', { defaultValue: 'No settings found' })}</div></div>
      ) : (
        <>
          <div className="mb-3">
            <small className="text-muted">{settings.length} settings</small>
          </div>

          {groupedSettings.map(group => {
            const expanded = expandedGroups.has(group.network)
            const color = getColor(group.network)
            return (
              <div className="card mb-4 overflow-hidden" key={group.network} style={{ borderLeft: `4px solid ${color}` }}>
                {/* Network header */}
                <div
                  className="card-header d-flex align-items-center justify-content-between py-3"
                  style={{ cursor: 'pointer', background: expanded ? '#fff' : '#f8f9fa' }}
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
                          <tr style={{ background: '#f1f3f5' }}>
                            <th style={{ width: '35%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: '#697a8d' }}>
                              {t('admin.settings.keyName', { defaultValue: 'Setting' })}
                            </th>
                            <th style={{ width: '10%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: '#697a8d' }}>
                              {t('admin.settings.dataType', { defaultValue: 'Type' })}
                            </th>
                            <th style={{ width: '15%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: '#697a8d' }}>
                              {t('admin.settings.defaultValue', { defaultValue: 'Default' })}
                            </th>
                            <th style={{ width: '20%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: '#697a8d' }}>
                              {t('admin.settings.value', { defaultValue: 'Value' })}
                            </th>
                            <th style={{ width: '20%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: '#697a8d', textAlign: 'right' }}>
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
                                    style={{ cursor: 'pointer', background: `${color}10` }}
                                    onClick={() => toggleGroup(sgKey)}
                                  >
                                    <td colSpan="5" style={{ padding: '10px 16px', borderBottom: '2px solid #e9ecef' }}>
                                      <div className="d-flex align-items-center gap-2">
                                        <i className={`bx ${sgOpen ? 'bx-chevron-down' : 'bx-chevron-right'}`} style={{ fontSize: '1rem', color }}></i>
                                        <span className="fw-bold" style={{ fontSize: '0.9rem', color }}>{formatLabel(sg.name)}</span>
                                        <span className="badge rounded-pill" style={{ background: `${color}20`, color, fontSize: '0.7rem' }}>
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
                                    <tr key={s.id} style={sg.name ? { background: '#fafbfd' } : {}}>
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
          })}

          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">
                {t('invoices.showingEntries', {
                  start: ((pagination.page - 1) * pagination.limit) + 1,
                  end: Math.min(pagination.page * pagination.limit, pagination.total),
                  total: pagination.total,
                  defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
                })}
              </small>
              <div className="btn-group">
                <button className="btn btn-outline-secondary btn-sm" disabled={!pagination.hasPrev || loading}
                  onClick={() => { setCurrentPage(currentPage - 1); syncSearchParams(appliedFilters, currentPage - 1) }}>
                  <i className="bx bx-chevron-left"></i>
                </button>
                <button className="btn btn-outline-secondary btn-sm" disabled>{pagination.page} / {pagination.totalPages}</button>
                <button className="btn btn-outline-secondary btn-sm" disabled={!pagination.hasNext || loading}
                  onClick={() => { setCurrentPage(currentPage + 1); syncSearchParams(appliedFilters, currentPage + 1) }}>
                  <i className="bx bx-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {showModal && modalSetting && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{t('admin.settings.editSetting', { defaultValue: 'Edit Setting' })}</h5>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">{t('admin.settings.descriptionLabel', { defaultValue: 'Description' })}</label>
                      <p className="mb-0 fw-semibold">{modalSetting.description || '-'}</p>
                    </div>
                    <div className="col-12">
                      <label className="form-label">{t('admin.settings.keyName', { defaultValue: 'Key' })}</label>
                      <p className="mb-0"><code>{modalSetting.keyName}</code></p>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">{t('admin.settings.dataType', { defaultValue: 'Type' })}</label>
                      <p className="mb-0">{modalSetting.dataType}</p>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">{t('admin.settings.scope', { defaultValue: 'Scope' })}</label>
                      <p className="mb-0">{formatLabel(modalSetting.scope || 'global')}{modalSetting.entityId ? ` #${modalSetting.entityId}` : ''}</p>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">{t('admin.settings.defaultValue', { defaultValue: 'Default' })}</label>
                      <p className="mb-0">{modalSetting.defaultValue || '-'}</p>
                    </div>
                    <div className="col-12">
                      <hr className="my-0" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">{t('admin.settings.value', { defaultValue: 'Value' })} *</label>
                      {modalSetting.dataType === 'boolean' ? (
                        <select className="form-select" value={modalValue} onChange={e => setModalValue(e.target.value)} disabled={modalLoading}>
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : modalSetting.dataType === 'json' || modalSetting.dataType === 'array' ? (
                        <textarea className="form-control font-monospace" rows="5" value={modalValue} onChange={e => setModalValue(e.target.value)} disabled={modalLoading} style={{ fontSize: '0.85rem' }} />
                      ) : (
                        <input
                          type={modalSetting.dataType === 'integer' || modalSetting.dataType === 'decimal' ? 'number' : 'text'}
                          className="form-control"
                          value={modalValue}
                          onChange={e => setModalValue(e.target.value)}
                          disabled={modalLoading}
                          step={modalSetting.dataType === 'decimal' ? 'any' : undefined}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={modalLoading}>
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleModalSave} disabled={modalLoading}>
                    {modalLoading ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>{t('actions.saving', { defaultValue: 'Saving...' })}</>
                    ) : (
                      <><i className="bx bx-save me-1"></i>{t('actions.save', { defaultValue: 'Save' })}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
