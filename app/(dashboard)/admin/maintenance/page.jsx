'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getSettingByKey, upsertSetting } from '@/lib/api/admin'
import { getSystemStatus } from '@/lib/api/system'
import { logger } from '@/lib/utils/logger'
import ConfirmModal from '@/components/ConfirmModal'

const MAINTENANCE_KEYS = [
  'maintenance.level',
  'maintenance.message_en',
  'maintenance.estimated_end',
  'maintenance.allowed_ips',
]

// Labels/descriptions resolved via t() at render time — see getLevelOptions()
function getLevelOptions(t) {
  return [
    { value: 'none', label: t('admin.maintenance.levelNone', { defaultValue: 'None' }), description: t('admin.maintenance.levelNoneDesc', { defaultValue: 'System operating normally' }), color: 'success', icon: 'bx-check-circle' },
    { value: 'partial', label: t('admin.maintenance.levelPartial', { defaultValue: 'Partial' }), description: t('admin.maintenance.levelPartialDesc', { defaultValue: 'Block user API + merchant write, allow merchant read + background jobs' }), color: 'warning', icon: 'bx-error' },
    { value: 'full', label: t('admin.maintenance.levelFull', { defaultValue: 'Full' }), description: t('admin.maintenance.levelFullDesc', { defaultValue: 'Block all APIs except admin + health check' }), color: 'danger', icon: 'bx-x-circle' },
  ]
}

export default function AdminMaintenancePage() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [liveStatus, setLiveStatus] = useState(null)

  // Form state
  const [level, setLevel] = useState('none')
  const [messageEn, setMessageEn] = useState('')
  const [estimatedEnd, setEstimatedEnd] = useState('')
  const [allowedIps, setAllowedIps] = useState('')

  // Track original values for dirty detection
  const [originalValues, setOriginalValues] = useState({})

  // Confirm modal state for quick toggle
  const [pendingToggle, setPendingToggle] = useState(null)

  // Validation errors
  const [errors, setErrors] = useState({})

  /**
   * Validate a single IPv4/IPv6 address string.
   * Returns true if valid, false otherwise.
   */
  function isValidIp(ip) {
    if (!ip || typeof ip !== 'string') return false
    const trimmed = ip.trim()
    if (!trimmed) return false
    // IPv4
    const ipv4Re = /^(\d{1,3}\.){3}\d{1,3}$/
    if (ipv4Re.test(trimmed)) {
      return trimmed.split('.').every(o => { const n = Number(o); return n >= 0 && n <= 255 })
    }
    // IPv6 (including ::1 loopback)
    if (trimmed === '::1') return true
    const ipv6Re = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
    return ipv6Re.test(trimmed)
  }

  /**
   * Validate all form fields. Returns errors object (empty = valid).
   */
  function validateForm() {
    const newErrors = {}

    // Message (English) required when maintenance is active
    if (level !== 'none' && !messageEn.trim()) {
      newErrors.messageEn = t('admin.maintenance.messageEnRequired', { defaultValue: 'Message is required when maintenance is active' })
    }

    // Estimated End: validate date format if provided
    if (estimatedEnd.trim()) {
      const dt = new Date(estimatedEnd)
      if (isNaN(dt.getTime())) {
        newErrors.estimatedEnd = t('admin.maintenance.invalidDate', { defaultValue: 'Invalid date format' })
      }
    }

    // Allowed IPs: validate JSON + each entry is valid IP
    if (allowedIps.trim() && allowedIps.trim() !== '[]') {
      try {
        const parsed = JSON.parse(allowedIps)
        if (!Array.isArray(parsed)) {
          newErrors.allowedIps = t('admin.maintenance.invalidIps', { defaultValue: 'Must be a JSON array' })
        } else {
          for (const entry of parsed) {
            if (typeof entry !== 'string' || !entry.trim()) {
              newErrors.allowedIps = t('admin.maintenance.invalidIpEntry', { defaultValue: 'Each entry must be a non-empty string' })
              break
            }
            if (!isValidIp(entry)) {
              newErrors.allowedIps = t('admin.maintenance.invalidIpFormat', { ip: entry.trim(), defaultValue: `"${entry.trim()}" is not a valid IPv4 or IPv6 address` })
              break
            }
          }
        }
      } catch {
        newErrors.allowedIps = t('admin.maintenance.invalidIps', { defaultValue: 'Must be valid JSON (e.g. ["1.2.3.4"])' })
      }
    }

    return newErrors
  }

  const loadSettings = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const results = await Promise.all(
        MAINTENANCE_KEYS.map(async (key) => {
          try {
            const setting = await getSettingByKey(token, key)
            return { key, value: setting?.value ?? setting?.defaultValue ?? '' }
          } catch {
            return { key, value: '' }
          }
        })
      )

      const values = {}
      for (const { key, value } of results) {
        values[key] = value
      }

      setLevel(values['maintenance.level'] || 'none')
      setMessageEn(values['maintenance.message_en'] || '')
      setEstimatedEnd(values['maintenance.estimated_end'] || '')
      setAllowedIps(values['maintenance.allowed_ips'] || '[]')
      setOriginalValues(values)
    } catch (error) {
      logger.error('Failed to load maintenance settings:', error)
      toast.error(t('admin.maintenance.loadError', { defaultValue: 'Failed to load maintenance settings' }))
    } finally {
      setLoading(false)
    }
  }, [token])

  // Load live status (public endpoint)
  const loadLiveStatus = useCallback(async () => {
    try {
      const status = await getSystemStatus()
      setLiveStatus(status)
    } catch {
      setLiveStatus(null)
    }
  }, [])

  useEffect(() => {
    loadSettings()
    loadLiveStatus()
  }, [loadSettings, loadLiveStatus])

  // Auto-refresh status every 15s
  useEffect(() => {
    const interval = setInterval(loadLiveStatus, 15_000)
    return () => clearInterval(interval)
  }, [loadLiveStatus])

  async function handleSave() {
    if (!token) return

    // Validate form
    const formErrors = validateForm()
    setErrors(formErrors)
    if (Object.keys(formErrors).length > 0) {
      toast.error(t('admin.maintenance.fixErrors', { defaultValue: 'Please fix the errors before saving' }))
      return
    }

    setSaving(true)
    try {
      const updates = [
        { keyName: 'maintenance.level', value: level },
        { keyName: 'maintenance.message_en', value: messageEn },
        { keyName: 'maintenance.estimated_end', value: estimatedEnd },
        { keyName: 'maintenance.allowed_ips', value: allowedIps.trim() || '[]' },
      ]

      for (const update of updates) {
        await upsertSetting(token, update)
      }

      toast.success(
        level === 'none'
          ? t('admin.maintenance.disabled', { defaultValue: 'Maintenance mode disabled' })
          : t('admin.maintenance.enabled', { defaultValue: 'Maintenance mode activated ({level})' }).replace('{level}', level)
      )

      // Notify navbar banner to refresh immediately
      window.dispatchEvent(new Event('maintenance-status-changed'))

      // Refresh live status and original values
      await Promise.all([loadLiveStatus(), loadSettings()])
    } catch (error) {
      logger.error('Failed to save maintenance settings:', error)
      toast.error(t('admin.maintenance.saveError', { defaultValue: 'Failed to save maintenance settings' }))
    } finally {
      setSaving(false)
    }
  }

  // Quick toggle: activate partial or deactivate
  function requestQuickToggle(newLevel) {
    if (newLevel === level) return // already at this level
    setPendingToggle(newLevel)
  }

  async function confirmQuickToggle() {
    const newLevel = pendingToggle
    setPendingToggle(null)
    if (!newLevel || !token) return
    setLevel(newLevel)
    setSaving(true)
    try {
      await upsertSetting(token, { keyName: 'maintenance.level', value: newLevel })
      toast.success(
        newLevel === 'none'
          ? t('admin.maintenance.disabled', { defaultValue: 'Maintenance mode disabled' })
          : t('admin.maintenance.enabled', { defaultValue: 'Maintenance mode activated ({level})' }).replace('{level}', newLevel)
      )

      // Notify navbar banner to refresh immediately
      window.dispatchEvent(new Event('maintenance-status-changed'))

      await loadLiveStatus()
    } catch (error) {
      logger.error('Quick toggle failed:', error)
      toast.error(t('admin.maintenance.saveError', { defaultValue: 'Failed to toggle maintenance mode' }))
    } finally {
      setSaving(false)
    }
  }

  const levelOptions = getLevelOptions(t)
  const currentLevelInfo = levelOptions.find((o) => o.value === level) || levelOptions[0]
  const isActive = level !== 'none'

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bx bx-wrench me-2 text-warning"></i>
            {t('admin.maintenance.title', { defaultValue: 'Maintenance Mode' })}
          </h4>
          <p className="text-muted mb-0">
            {t('admin.maintenance.subtitle', { defaultValue: 'Control system availability for users and merchants' })}
          </p>
        </div>
      </div>

      {/* Live Status Banner */}
      {liveStatus && (
        <div className={`alert border-0 d-flex align-items-center mb-4 ${liveStatus.maintenance ? 'bg-label-warning text-warning' : 'bg-label-success text-success'}`} style={{ borderLeft: `4px solid`, borderLeftColor: 'currentColor' }}>
          <i className={`bx ${liveStatus.maintenance ? 'bx-error' : 'bx-check-circle'} me-2`} style={{ fontSize: '1.25rem' }}></i>
          <div>
            <strong>{t('admin.maintenance.liveStatus', { defaultValue: 'Live Status' })}:</strong>{' '}
            {liveStatus.maintenance
              ? t('admin.maintenance.systemDown', { defaultValue: 'System is in maintenance mode ({level})' }).replace('{level}', liveStatus.level)
              : t('admin.maintenance.systemUp', { defaultValue: 'System is operating normally' })
            }
          </div>
        </div>
      )}

      <div className="row">
        {/* Quick Toggle Cards */}
        <div className="col-12 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                {t('admin.maintenance.quickToggle', { defaultValue: 'Quick Toggle' })}
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {levelOptions.map((opt) => (
                  <div key={opt.value} className="col-md-4">
                    <div
                      className={`card border ${level === opt.value ? `border-${opt.color} shadow-sm` : 'border-light'}`}
                      style={{ cursor: level === opt.value ? 'default' : 'pointer', transition: 'all 0.2s', opacity: level === opt.value ? 0.7 : 1 }}
                      onClick={() => requestQuickToggle(opt.value)}
                    >
                      <div className="card-body text-center py-4">
                        <i className={`bx ${opt.icon} text-${opt.color} mb-2`} style={{ fontSize: '2rem' }}></i>
                        <h6 className={`mb-1 ${level === opt.value ? `text-${opt.color}` : ''}`}>
                          {opt.label}
                          {level === opt.value && <i className="bx bx-check ms-1"></i>}
                        </h6>
                        <small className="text-muted">{opt.description}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0">
                {t('admin.maintenance.configuration', { defaultValue: 'Configuration' })}
              </h5>
              <span className={`badge bg-label-${currentLevelInfo.color}`}>
                {currentLevelInfo.label}
              </span>
            </div>
            <div className="card-body">
              {/* Message */}
              <div className="mb-3">
                <label className="form-label">
                  {t('admin.maintenance.messageEn', { defaultValue: 'Message' })}
                  {level !== 'none' && <span className="text-danger"> *</span>}
                </label>
                <textarea
                  className={`form-control${errors.messageEn ? ' is-invalid' : ''}`}
                  rows={2}
                  value={messageEn}
                  onChange={(e) => { setMessageEn(e.target.value); setErrors(prev => ({ ...prev, messageEn: undefined })) }}
                  placeholder="System is under maintenance. Please try again later."
                />
                {errors.messageEn && <div className="invalid-feedback d-block">{errors.messageEn}</div>}
              </div>

              {/* Estimated End */}
              <div className="mb-3">
                <label className="form-label">
                  {t('admin.maintenance.estimatedEnd', { defaultValue: 'Estimated End Time' })}
                </label>
                <div className="row g-2">
                  <div className="col-7">
                    <input
                      type="date"
                      className="form-control"
                      value={estimatedEnd ? estimatedEnd.slice(0, 10) : ''}
                      onChange={(e) => {
                        const dateVal = e.target.value
                        if (!dateVal) { setEstimatedEnd(''); return }
                        // Keep existing time or default to 00:00
                        const existingTime = estimatedEnd ? estimatedEnd.slice(11, 16) : '00:00'
                        setEstimatedEnd(new Date(`${dateVal}T${existingTime}`).toISOString())
                      }}
                    />
                  </div>
                  <div className="col-5">
                    <input
                      type="time"
                      className="form-control"
                      value={estimatedEnd ? estimatedEnd.slice(11, 16) : ''}
                      disabled={!estimatedEnd}
                      onChange={(e) => {
                        const timeVal = e.target.value
                        if (!timeVal || !estimatedEnd) return
                        const dateVal = estimatedEnd.slice(0, 10)
                        setEstimatedEnd(new Date(`${dateVal}T${timeVal}`).toISOString())
                      }}
                    />
                  </div>
                </div>
                <div className="form-text">
                  {t('admin.maintenance.estimatedEndHelp', { defaultValue: 'Leave empty if unknown. Shown to users and in Retry-After header.' })}
                </div>
              </div>

              {/* Allowed IPs */}
              <div className="mb-4">
                <label className="form-label">
                  {t('admin.maintenance.allowedIps', { defaultValue: 'Allowed IPs (bypass maintenance)' })}
                </label>
                <input
                  type="text"
                  className={`form-control${errors.allowedIps ? ' is-invalid' : ''}`}
                  value={allowedIps}
                  onChange={(e) => { setAllowedIps(e.target.value); setErrors(prev => ({ ...prev, allowedIps: undefined })) }}
                  placeholder='["1.2.3.4", "5.6.7.8"]'
                />
                {errors.allowedIps
                  ? <div className="invalid-feedback d-block">{errors.allowedIps}</div>
                  : <div className="form-text">
                      {t('admin.maintenance.allowedIpsHelp', { defaultValue: 'JSON array of IPs that can access the system during maintenance.' })}
                    </div>
                }
              </div>

              {/* Save button */}
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    {t('common.saving', { defaultValue: 'Saving...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-save me-1"></i>
                    {t('admin.maintenance.saveAll', { defaultValue: 'Save Configuration' })}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="col-lg-4">
          {/* Level Explanation */}
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="card-title mb-0">
                <i className="bx bx-info-circle me-1"></i>
                {t('admin.maintenance.levelInfo', { defaultValue: 'Maintenance Levels' })}
              </h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>{t('admin.maintenance.component', { defaultValue: 'Component' })}</th>
                    <th className="text-center">None</th>
                    <th className="text-center">Partial</th>
                    <th className="text-center">Full</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><small>User API</small></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                    <td className="text-center"><i className="bx bx-x text-danger"></i></td>
                    <td className="text-center"><i className="bx bx-x text-danger"></i></td>
                  </tr>
                  <tr>
                    <td><small>Merchant (GET)</small></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                    <td className="text-center"><i className="bx bx-x text-danger"></i></td>
                  </tr>
                  <tr>
                    <td><small>Merchant (POST)</small></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                    <td className="text-center"><i className="bx bx-x text-danger"></i></td>
                    <td className="text-center"><i className="bx bx-x text-danger"></i></td>
                  </tr>
                  <tr>
                    <td><small>Admin API</small></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                  </tr>
                  <tr>
                    <td><small>Background Jobs</small></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                  </tr>
                  <tr>
                    <td><small>Webhooks</small></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                    <td className="text-center"><i className="bx bx-check text-success"></i></td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title mb-0">
                <i className="bx bx-bulb me-1"></i>
                {t('admin.maintenance.tips', { defaultValue: 'Tips' })}
              </h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0 small text-muted">
                <li className="mb-2">
                  <i className="bx bx-right-arrow-alt me-1"></i>
                  {t('admin.maintenance.tip1', { defaultValue: 'Use Partial for UI/frontend updates — merchants can still check payment status.' })}
                </li>
                <li className="mb-2">
                  <i className="bx bx-right-arrow-alt me-1"></i>
                  {t('admin.maintenance.tip2', { defaultValue: 'Use Full only for database migrations or critical infrastructure changes.' })}
                </li>
                <li className="mb-2">
                  <i className="bx bx-right-arrow-alt me-1"></i>
                  {t('admin.maintenance.tip3', { defaultValue: 'Background jobs (watchers, sweeps, webhooks) continue running in both modes.' })}
                </li>
                <li>
                  <i className="bx bx-right-arrow-alt me-1"></i>
                  {t('admin.maintenance.tip4', { defaultValue: 'Changes take effect immediately via Redis cache invalidation.' })}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Toggle Confirmation Modal */}
      <ConfirmModal
        show={pendingToggle !== null}
        title={t('admin.maintenance.confirmToggleTitle', { defaultValue: 'Change Maintenance Mode' })}
        message={
          pendingToggle === 'none'
            ? t('admin.maintenance.confirmDisable', { defaultValue: 'Are you sure you want to disable maintenance mode? The system will be fully accessible to all users.' })
            : pendingToggle === 'full'
              ? t('admin.maintenance.confirmFull', { defaultValue: 'Are you sure you want to enable Full maintenance mode? All user and merchant APIs will be blocked immediately.' })
              : t('admin.maintenance.confirmPartial', { defaultValue: 'Are you sure you want to enable Partial maintenance mode? User APIs and merchant write operations will be blocked.' })
        }
        confirmText={
          pendingToggle === 'none'
            ? t('admin.maintenance.confirmDisableBtn', { defaultValue: 'Disable Maintenance' })
            : t('admin.maintenance.confirmEnableBtn', { defaultValue: 'Enable Maintenance' })
        }
        cancelText={t('common:cancel', { defaultValue: 'Cancel' })}
        confirmVariant={pendingToggle === 'none' ? 'success' : pendingToggle === 'full' ? 'danger' : 'warning'}
        onConfirm={confirmQuickToggle}
        onCancel={() => setPendingToggle(null)}
        busy={saving}
      />
    </div>
  )
}
