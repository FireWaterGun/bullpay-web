import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import {
  getSettings,
  getSettingCategories,
  upsertSetting,
} from '../../api/admin.ts'
import { formatLabel, SCOPE_OPTIONS } from './settingsUtils'
import useSettingsFilters from './useSettingsFilters'
import SettingsTable from './SettingsTable'
import SettingEditModal from './SettingEditModal'

export default function AdminSettings() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()

  const {
    searchParams,
    currentPage,
    setCurrentPage,
    categoryFilter,
    setCategoryFilter,
    scopeFilter,
    setScopeFilter,
    appliedFilters,
    syncSearchParams,
    applyFilters,
    resetFilters,
    handleCategoryClick,
    initDefaultCategory,
  } = useSettingsFilters()

  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState([])
  const [pagination, setPagination] = useState(null)
  const [categories, setCategories] = useState(null)

  // Inline edit state
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Modal for advanced edit
  const [showModal, setShowModal] = useState(false)
  const [modalSetting, setModalSetting] = useState(null)
  const [modalValue, setModalValue] = useState('')
  const [modalLoading, setModalLoading] = useState(false)

  // Expand/collapse
  const [expandedGroups, setExpandedGroups] = useState(new Set())

  useEffect(() => { loadSettings() }, [currentPage, appliedFilters])
  useEffect(() => { loadCategories() }, [])

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
      const list = data?.categories || data || []
      if (!searchParams.get('category') && list.length > 0) {
        initDefaultCategory(list[0])
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

  // --- Grouped data ---
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
      const isNetwork = groupedSettings.some(g => g.network === key)
      if (isNetwork) {
        const n = new Set()
        n.add(key)
        const group = groupedSettings.find(g => g.network === key)
        if (group) group.subGroups.forEach(sg => { if (sg.name) n.add(`${key}.${sg.name}`) })
        return n
      }
      const n = new Set(prev)
      n.add(key)
      return n
    })
  }

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

          <SettingsTable
            groupedSettings={groupedSettings}
            expandedGroups={expandedGroups}
            toggleGroup={toggleGroup}
            editingId={editingId}
            editValue={editValue}
            setEditValue={setEditValue}
            saving={saving}
            saveInline={saveInline}
            cancelEdit={cancelEdit}
            openAdvancedModal={openAdvancedModal}
          />

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
      {showModal && (
        <SettingEditModal
          modalSetting={modalSetting}
          modalValue={modalValue}
          setModalValue={setModalValue}
          modalLoading={modalLoading}
          onClose={closeModal}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
}
