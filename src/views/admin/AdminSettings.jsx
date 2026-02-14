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
    if ((modalScope === 'merchant' || modalScope === 'user') && !modalEntityId) {
      toast.error(t('admin.settings.entityIdRequired', { defaultValue: 'Entity ID is required for merchant/user scope' }))
      return
    }
    try {
      setModalLoading(true)
      await upsertSetting(token, {
        keyName: modalSetting.keyName,
        value: modalValue,
        description: modalDesc || undefined,
        scope: modalScope,
        entityId: modalEntityId ? Number(modalEntityId) : null,
        isPublic: modalIsPublic,
        isEncrypted: modalIsEncrypted,
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

  useEffect(() => {
    if (groupedSettings.length > 0) {
      const allKeys = new Set()
      groupedSettings.forEach(g => {
        allKeys.add(g.network)
        g.subGroups.forEach(sg => { if (sg.name) allKeys.add(`${g.network}.${sg.name}`) })
      })
      setExpandedGroups(allKeys)
    }
  }, [groupedSettings])

  function toggleGroup(key) {
    setExpandedGroups(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0 fw-bold">{t('admin.settings.title', { defaultValue: 'System Settings' })}</h4>
          <small className="text-muted">{t('admin.settings.description', { defaultValue: 'View and manage system configuration settings' })}</small>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { loadSettings(); loadCategories() }} disabled={loading}>
          <i className="bx bx-refresh me-1"></i>{t('actions.refresh', { defaultValue: 'Refresh' })}
        </button>
      </div>

      {/* Category pills */}
      {categoryList.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-4">
          {categoryList.filter(c => CATEGORY_OPTIONS.includes(c)).map(cat => {
            const active = appliedFilters.category === cat
            return (
              <button
                key={cat}
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => handleCategoryClick(cat)}
                style={{ borderRadius: '20px' }}
              >
                {formatLabel(cat)}
                <span className={`ms-1 badge ${active ? 'bg-white text-primary' : 'bg-label-secondary'}`} style={{ fontSize: '0.65rem' }}>
                  {categoryCounts[cat] ?? 0}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3 col-sm-6">
              <label className="form-label small mb-1">{t('filter.search', { defaultValue: 'Search' })}</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder={t('admin.settings.searchPlaceholder', { defaultValue: 'Key name...' })}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <label className="form-label small mb-1">{t('admin.settings.category', { defaultValue: 'Category' })}</label>
              <select className="form-select form-select-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">{t('admin.settings.allCategories', { defaultValue: 'All Categories' })}</option>
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>{formatLabel(c)}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 col-sm-6">
              <label className="form-label small mb-1">{t('admin.settings.scope', { defaultValue: 'Scope' })}</label>
              <select className="form-select form-select-sm" value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
                <option value="">{t('admin.settings.allScopes', { defaultValue: 'All Scopes' })}</option>
                {SCOPE_OPTIONS.map(s => (
                  <option key={s} value={s}>{formatLabel(s)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary btn-sm" onClick={applyFilters} disabled={loading}>
              <i className="bx bx-filter-alt me-1"></i>
              {t('filter.apply', { defaultValue: 'Apply Filters' })}
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={resetFilters} disabled={loading}>
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
          <div className="d-flex justify-content-between align-items-center mb-3">
            <small className="text-muted">{settings.length} settings</small>
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-secondary" onClick={expandAll}><i className="bx bx-expand-alt me-1"></i>Expand</button>
              <button className="btn btn-outline-secondary" onClick={collapseAll}><i className="bx bx-collapse-alt me-1"></i>Collapse</button>
            </div>
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
                            <th style={{ width: '40%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: '#697a8d' }}>
                              {t('admin.settings.keyName', { defaultValue: 'Setting' })}
                            </th>
                            <th style={{ width: '15%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: '#697a8d' }}>
                              {t('admin.settings.dataType', { defaultValue: 'Type' })}
                            </th>
                            <th style={{ width: '25%', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', color: '#697a8d' }}>
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
                                    <td colSpan="4" style={{ padding: '10px 16px', borderBottom: '2px solid #e9ecef' }}>
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

                                      {/* Value */}
                                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                                        {isEditing ? (
                                          <div className="d-flex align-items-center gap-2">
                                            {s.dataType === 'boolean' ? (
                                              <select className="form-select form-select-sm" value={editValue} onChange={e => setEditValue(e.target.value)} disabled={saving} autoFocus style={{ maxWidth: 120 }}>
                                                <option value="true">true</option>
                                                <option value="false">false</option>
                                              </select>
                                            ) : (
                                              <input
                                                type={s.dataType === 'integer' || s.dataType === 'decimal' ? 'number' : 'text'}
                                                className="form-control form-control-sm"
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
                                          <div>
                                            <span
                                              className={`fw-semibold ${changed ? 'text-primary' : ''}`}
                                              style={{ fontSize: '0.9rem', cursor: Number(s.isEncrypted) === 1 ? 'default' : 'pointer' }}
                                              onClick={() => !Number(s.isEncrypted) && startEdit(s)}
                                              title={Number(s.isEncrypted) === 1 ? '' : t('admin.settings.clickToEdit', { defaultValue: 'Click to edit' })}
                                            >
                                              {Number(s.isEncrypted) === 1 ? <span className="text-muted fst-italic">••••••</span> : s.value}
                                            </span>
                                            {changed && !Number(s.isEncrypted) && (
                                              <span className="badge bg-label-warning ms-2" style={{ fontSize: '0.6rem', padding: '2px 5px', verticalAlign: 'middle' }}>modified</span>
                                            )}
                                            {changed && s.defaultValue && !Number(s.isEncrypted) && (
                                              <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>default: {s.defaultValue}</small>
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

      {/* Advanced Edit Modal */}
      {showModal && modalSetting && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !modalLoading && closeModal()}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bx bx-slider-alt me-2"></i>
                  {t('admin.settings.editSetting', { defaultValue: 'Edit Setting' })}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} disabled={modalLoading}></button>
              </div>
              <div className="modal-body">
                <div className="bg-light rounded p-3 mb-3">
                  <code className="fw-bold d-block mb-2">{modalSetting.keyName}</code>
                  <div className="d-flex gap-3">
                    <small className="text-muted">Type: <strong>{modalSetting.dataType}</strong></small>
                    <small className="text-muted">Category: <strong>{formatLabel(modalSetting.category)}</strong></small>
                    <small className="text-muted">Default: <strong>{modalSetting.defaultValue || '-'}</strong></small>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('admin.settings.value', { defaultValue: 'Value' })} <span className="text-danger">*</span></label>
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

                <div className="mb-3">
                  <label className="form-label fw-semibold">{t('admin.settings.descriptionLabel', { defaultValue: 'Description' })}</label>
                  <textarea className="form-control" rows="2" value={modalDesc} onChange={e => setModalDesc(e.target.value)} disabled={modalLoading} maxLength={500} />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('admin.settings.scope', { defaultValue: 'Scope' })}</label>
                    <select className="form-select" value={modalScope} onChange={e => setModalScope(e.target.value)} disabled={modalLoading}>
                      {SCOPE_OPTIONS.map(s => <option key={s} value={s}>{formatLabel(s)}</option>)}
                    </select>
                  </div>
                  {(modalScope === 'merchant' || modalScope === 'user') && (
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Entity ID <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" value={modalEntityId} onChange={e => setModalEntityId(e.target.value)} disabled={modalLoading} min="1" />
                    </div>
                  )}
                </div>

                <div className="d-flex gap-4">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="modalIsPublic" checked={modalIsPublic} onChange={e => setModalIsPublic(e.target.checked)} disabled={modalLoading} />
                    <label className="form-check-label" htmlFor="modalIsPublic"><i className="bx bx-globe me-1"></i>Public</label>
                  </div>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="modalIsEncrypted" checked={modalIsEncrypted} onChange={e => setModalIsEncrypted(e.target.checked)} disabled={modalLoading} />
                    <label className="form-check-label" htmlFor="modalIsEncrypted"><i className="bx bx-lock-alt me-1"></i>Encrypted</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary" onClick={closeModal} disabled={modalLoading}>{t('actions.cancel', { defaultValue: 'Cancel' })}</button>
                <button className="btn btn-primary" onClick={handleModalSave} disabled={modalLoading}>
                  {modalLoading ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bx bx-save me-1"></i>}
                  {t('actions.save', { defaultValue: 'Save' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
