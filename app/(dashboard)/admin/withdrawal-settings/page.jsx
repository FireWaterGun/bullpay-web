'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getSettingByKey, upsertSetting, getCoinNetworks, updateCoinNetwork } from '@/lib/api/admin'
import { logger } from '@/lib/utils/logger'
import AutoApproveForm from '@/components/admin/withdrawal-policy/AutoApproveForm'
import CoinImg from '@/components/CoinImg'

const TABS = [
  { key: 'policy', icon: 'bx-shield-quarter', labelKey: 'admin.withdrawalSettings.tabPolicy', defaultLabel: 'Policy' },
  { key: 'basefee', icon: 'bx-gas-pump', labelKey: 'admin.withdrawalSettings.tabBaseFee', defaultLabel: 'Base Fee' },
  { key: 'feeLimits', icon: 'bx-table', labelKey: 'admin.withdrawalSettings.tabFeeLimits', defaultLabel: 'Fee & Limits' },
]

const SETTINGS_DB_KEYS = [
  'withdrawal.security.max_pending_per_user',
  'withdrawal.base_fee.auto_update',
  'withdrawal.base_fee.buffer_multiplier',
  'withdrawal.base_fee.alert_threshold',
  'withdrawal.auto_approve.enabled',
  'withdrawal.auto_approve.threshold_usd',
]

export default function WithdrawalSettingsPage() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('policy')
  const [loading, setLoading] = useState(true)

  // DB settings (from settings API)
  const [dbSettings, setDbSettings] = useState({})
  // Auto-approve (derived from dbSettings)
  const [autoApprove, setAutoApprove] = useState({})

  // Coin-networks for fee table
  const [coinNetworks, setCoinNetworks] = useState([])
  const [cnLoading, setCnLoading] = useState(false)
  const [cnLoaded, setCnLoaded] = useState(false)
  const [cnSearch, setCnSearch] = useState('')
  const [cnPagination, setCnPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  // Edit modals
  const [showMaxPendingModal, setShowMaxPendingModal] = useState(false)
  const [maxPendingForm, setMaxPendingForm] = useState('')
  const [savingMaxPending, setSavingMaxPending] = useState(false)

  const [showBufferModal, setShowBufferModal] = useState(false)
  const [bufferForm, setBufferForm] = useState('')
  const [savingBuffer, setSavingBuffer] = useState(false)

  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertForm, setAlertForm] = useState('')
  const [savingAlert, setSavingAlert] = useState(false)

  // Auto-update toggle loading
  const [savingAutoUpdate, setSavingAutoUpdate] = useState(false)

  // Coin-network edit modal
  const [editCn, setEditCn] = useState(null)
  const [cnForm, setCnForm] = useState({})
  const [savingCn, setSavingCn] = useState(false)

  const loadDbSettings = useCallback(async () => {
    if (!token) return
    try {
      const results = await Promise.all(
        SETTINGS_DB_KEYS.map(async (key) => {
          try {
            const setting = await getSettingByKey(token, key)
            return { key, value: setting?.value ?? setting?.defaultValue ?? '' }
          } catch {
            return { key, value: '' }
          }
        })
      )
      const map = {}
      for (const { key, value } of results) {
        map[key] = value
      }
      setDbSettings(map)
      // Derive auto-approve state
      setAutoApprove({
        enabled: map['withdrawal.auto_approve.enabled'] === 'true',
        thresholdUsd: parseFloat(map['withdrawal.auto_approve.threshold_usd']) || 0,
      })
    } catch (error) {
      logger.error('Failed to load DB settings:', error)
    }
  }, [token])

  const loadCoinNetworks = useCallback(async (page = 1, search = '') => {
    if (!token) return
    setCnLoading(true)
    try {
      const response = await getCoinNetworks(token, page, 20, search)
      setCoinNetworks(response?.items || [])
      setCnLoaded(true)
      const pag = response?.pagination || {}
      setCnPagination({
        page: pag.page || page,
        limit: pag.limit || 20,
        total: pag.total || 0,
        totalPages: pag.totalPages || 0,
      })
    } catch (error) {
      logger.error('Failed to load coin networks:', error)
    } finally {
      setCnLoading(false)
    }
  }, [token])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await loadDbSettings()
      setLoading(false)
    }
    init()
  }, [loadDbSettings])

  // Load coin-networks when switching to fee tab
  useEffect(() => {
    if (activeTab === 'feeLimits' && !cnLoaded) {
      loadCoinNetworks(1, '')
    }
  }, [activeTab, cnLoaded, loadCoinNetworks])

  // Save helpers
  async function saveSetting(keyName, value) {
    await upsertSetting(token, { keyName, value: String(value) })
  }

  async function handleSaveMaxPending() {
    try {
      setSavingMaxPending(true)
      const val = parseInt(maxPendingForm) || 5
      await saveSetting('withdrawal.security.max_pending_per_user', val)
      setDbSettings(prev => ({ ...prev, 'withdrawal.security.max_pending_per_user': String(val) }))
      setShowMaxPendingModal(false)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setSavingMaxPending(false)
    }
  }

  async function handleToggleAutoUpdate() {
    const current = dbSettings['withdrawal.base_fee.auto_update'] === 'true'
    const newVal = !current
    try {
      setSavingAutoUpdate(true)
      await saveSetting('withdrawal.base_fee.auto_update', newVal)
      setDbSettings(prev => ({ ...prev, 'withdrawal.base_fee.auto_update': String(newVal) }))
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setSavingAutoUpdate(false)
    }
  }

  async function handleSaveBuffer() {
    try {
      setSavingBuffer(true)
      const parsed = parseFloat(bufferForm)
      const val = isNaN(parsed) ? 1.2 : parsed
      await saveSetting('withdrawal.base_fee.buffer_multiplier', val)
      setDbSettings(prev => ({ ...prev, 'withdrawal.base_fee.buffer_multiplier': String(val) }))
      setShowBufferModal(false)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setSavingBuffer(false)
    }
  }

  async function handleSaveAlert() {
    try {
      setSavingAlert(true)
      const parsed = parseFloat(alertForm)
      const val = isNaN(parsed) ? 0.2 : parsed
      await saveSetting('withdrawal.base_fee.alert_threshold', val)
      setDbSettings(prev => ({ ...prev, 'withdrawal.base_fee.alert_threshold': String(val) }))
      setShowAlertModal(false)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setSavingAlert(false)
    }
  }

  function openCnEditModal(cn) {
    setEditCn(cn)
    setCnForm({
      withdrawEnabled: cn.withdrawEnabled ?? false,
      minWithdrawAmount: cn.minWithdrawAmount ?? '',
      maxWithdrawAmount: cn.maxWithdrawAmount ?? '',
      withdrawFeePercent: cn.withdrawFeePercent ?? '',
      dailyWithdrawLimitUsd: cn.dailyWithdrawLimitUsd ?? '',
    })
  }

  async function handleSaveCn() {
    if (!editCn) return

    // Submission-time validation — match backend regex
    const amountRegex = /^\d+(\.\d+)?$/
    const usdRegex = /^\d+(\.\d{1,2})?$/
    for (const field of ['minWithdrawAmount', 'maxWithdrawAmount', 'withdrawFeePercent']) {
      if (cnForm[field] !== '' && !amountRegex.test(cnForm[field])) {
        toast.error(t('admin.withdrawal.invalidFormat', { defaultValue: 'Invalid number format. Use digits with optional decimal (e.g. 1.5)' }))
        return
      }
    }
    if (cnForm.dailyWithdrawLimitUsd !== '' && !usdRegex.test(cnForm.dailyWithdrawLimitUsd)) {
      toast.error(t('admin.withdrawal.invalidUsdFormat', { defaultValue: 'Invalid USD format. Max 2 decimal places (e.g. 100.50)' }))
      return
    }

    try {
      setSavingCn(true)
      const payload = {
        withdrawEnabled: cnForm.withdrawEnabled,
        minWithdrawAmount: cnForm.minWithdrawAmount !== '' ? cnForm.minWithdrawAmount : undefined,
        maxWithdrawAmount: cnForm.maxWithdrawAmount !== '' ? cnForm.maxWithdrawAmount : undefined,
        withdrawFeePercent: cnForm.withdrawFeePercent !== '' ? cnForm.withdrawFeePercent : undefined,
        dailyWithdrawLimitUsd: cnForm.dailyWithdrawLimitUsd !== '' ? cnForm.dailyWithdrawLimitUsd : undefined,
      }
      await updateCoinNetwork(token, editCn.id, payload)
      // Update local state — only overwrite fields that were sent, keep display-only fields intact
      setCoinNetworks(prev => prev.map(cn => {
        if (cn.id !== editCn.id) return cn
        return {
          ...cn,
          withdrawEnabled: cnForm.withdrawEnabled,
          // Only update amount fields if the form has a value; otherwise keep old value
          // (backend ignores undefined fields, so old value persists on server)
          ...(cnForm.minWithdrawAmount !== '' ? { minWithdrawAmount: cnForm.minWithdrawAmount } : {}),
          ...(cnForm.maxWithdrawAmount !== '' ? { maxWithdrawAmount: cnForm.maxWithdrawAmount } : {}),
          ...(cnForm.withdrawFeePercent !== '' ? { withdrawFeePercent: cnForm.withdrawFeePercent } : {}),
          ...(cnForm.dailyWithdrawLimitUsd !== '' ? { dailyWithdrawLimitUsd: cnForm.dailyWithdrawLimitUsd } : {}),
        }
      }))
      setEditCn(null)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setSavingCn(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  const maxPending = dbSettings['withdrawal.security.max_pending_per_user'] || '5'
  const autoUpdateOn = dbSettings['withdrawal.base_fee.auto_update'] === 'true'
  const bufferMultiplier = dbSettings['withdrawal.base_fee.buffer_multiplier'] || '1.2'
  const alertThreshold = dbSettings['withdrawal.base_fee.alert_threshold'] || '0.2'

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bx bx-transfer me-2 text-primary"></i>
            {t('admin.withdrawalSettings.title', { defaultValue: 'Withdrawal Settings' })}
          </h4>
          <p className="text-muted mb-0">
            {t('admin.withdrawalSettings.subtitle', { defaultValue: 'Global withdrawal policy, base fee configuration, and per-coin fee & limits' })}
          </p>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="row g-3 mb-4">
        <StatusCard
          icon="bx-check-shield"
          color="success"
          label={t('admin.withdrawalSettings.autoApproveCard', { defaultValue: 'Auto-Approve' })}
          value={autoApprove.enabled ? 'ON' : 'OFF'}
          sub={autoApprove.enabled ? `≤ $${autoApprove.thresholdUsd || 0}` : null}
          active={autoApprove.enabled}
        />
        <StatusCard
          icon="bx-lock-alt"
          color="warning"
          label={t('admin.withdrawalSettings.maxPendingCard', { defaultValue: 'Max Pending / User' })}
          value={maxPending}
          sub={t('admin.withdrawalSettings.perUser', { defaultValue: 'per user' })}
        />
        <StatusCard
          icon="bx-gas-pump"
          color="info"
          label={t('admin.withdrawalSettings.gasBufferCard', { defaultValue: 'Gas Buffer' })}
          value={`${bufferMultiplier}x`}
          sub={autoUpdateOn
            ? t('admin.withdrawalSettings.autoUpdate', { defaultValue: 'Auto-update ON' })
            : t('admin.withdrawalSettings.autoUpdateOff', { defaultValue: 'Auto-update OFF' })}
        />
        <StatusCard
          icon="bx-error-circle"
          color="primary"
          label={t('admin.withdrawalSettings.alertThresholdCard', { defaultValue: 'Alert Threshold' })}
          value={`${(parseFloat(alertThreshold) * 100).toFixed(0)}%`}
          sub={t('admin.withdrawalSettings.feeChangeAlert', { defaultValue: 'fee change alert' })}
        />
      </div>

      {/* Tab Navigation */}
      <div className="nav-align-top mb-4">
        <ul className="nav nav-tabs" role="tablist">
          {TABS.map((tab) => (
            <li key={tab.key} className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
                role="tab"
              >
                <i className={`bx ${tab.icon} me-1`}></i>
                {t(tab.labelKey, { defaultValue: tab.defaultLabel })}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Policy Tab ── */}
      {activeTab === 'policy' && (
        <div className="row">
          <div className="col-lg-8">
            {/* Auto-Approve Section */}
            <div className="card mb-4">
              <div className="card-body">
                <AutoApproveForm autoApprove={autoApprove} setAutoApprove={setAutoApprove} />
              </div>
            </div>

            {/* Max Pending Per User */}
            <div className="card mb-4">
              <div className="card-header d-flex align-items-center justify-content-between">
                <h5 className="card-title mb-0">
                  <i className="bx bx-lock-alt me-2 text-warning"></i>
                  {t('admin.withdrawalSettings.maxPendingTitle', { defaultValue: 'Max Pending Withdrawals' })}
                </h5>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    setMaxPendingForm(maxPending)
                    setShowMaxPendingModal(true)
                  }}
                >
                  <i className="bx bx-edit me-1"></i>
                  {t('actions.edit', { defaultValue: 'Edit' })}
                </button>
              </div>
              <div className="card-body">
                <p className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>
                  {t('admin.withdrawalSettings.maxPendingDesc', { defaultValue: 'Maximum number of pending (unprocessed) withdrawal requests allowed per user at any time.' })}
                </p>
                <div className="d-flex align-items-center gap-3 p-3 rounded" style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
                  <div>
                    <small className="text-muted d-block">{t('admin.withdrawalSettings.currentValue', { defaultValue: 'Current Value' })}</small>
                    <h4 className="mb-0 fw-bold">{maxPending}</h4>
                  </div>
                  <div className="ms-auto">
                    <small className="text-muted">
                      withdrawal.security.max_pending_per_user
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="card-title mb-0">
                  <i className="bx bx-info-circle me-1"></i>
                  {t('admin.withdrawalSettings.howItWorks', { defaultValue: 'How It Works' })}
                </h6>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-start gap-2">
                    <span className="badge bg-label-success rounded-pill mt-1">1</span>
                    <div>
                      <small className="fw-semibold d-block">{t('admin.withdrawalSettings.howItWorksStep1', { defaultValue: 'User requests withdrawal' })}</small>
                      <small className="text-muted">{t('admin.withdrawalSettings.howItWorksStep1Desc', { defaultValue: 'System checks max pending limit per user' })}</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-2">
                    <span className="badge bg-label-success rounded-pill mt-1">2</span>
                    <div>
                      <small className="fw-semibold d-block">{t('admin.withdrawalSettings.howItWorksStep2', { defaultValue: 'Auto-approve check' })}</small>
                      <small className="text-muted">{t('admin.withdrawalSettings.howItWorksStep2Desc', { defaultValue: 'If enabled and amount ≤ threshold → auto-approved' })}</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-2">
                    <span className="badge bg-label-warning rounded-pill mt-1">3</span>
                    <div>
                      <small className="fw-semibold d-block">{t('admin.withdrawalSettings.howItWorksStep3', { defaultValue: 'Manual review' })}</small>
                      <small className="text-muted">{t('admin.withdrawalSettings.howItWorksStep3Desc', { defaultValue: 'Large or flagged requests require admin approval' })}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h6 className="card-title mb-0">
                  <i className="bx bx-bulb me-1"></i>
                  {t('admin.withdrawalSettings.tips', { defaultValue: 'Tips' })}
                </h6>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0 small text-muted">
                  <li className="mb-2">
                    <i className="bx bx-right-arrow-alt me-1"></i>
                    {t('admin.withdrawalSettings.tip1', { defaultValue: 'Auto-approve is great for small withdrawals to reduce admin workload.' })}
                  </li>
                  <li className="mb-2">
                    <i className="bx bx-right-arrow-alt me-1"></i>
                    {t('admin.withdrawalSettings.tip3', { defaultValue: 'Keep max pending low (3–5) to prevent withdrawal queue abuse.' })}
                  </li>
                  <li>
                    <i className="bx bx-right-arrow-alt me-1"></i>
                    {t('admin.withdrawalSettings.tip4', { defaultValue: 'Changes take effect immediately — no restart required.' })}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Base Fee Tab ── */}
      {activeTab === 'basefee' && (
        <div className="row">
          <div className="col-lg-8">
            {/* Auto-Update Toggle */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bx bx-refresh me-2 text-info"></i>
                  {t('admin.withdrawalSettings.baseFeeAutoUpdate', { defaultValue: 'Base Fee Auto-Update' })}
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>
                  {t('admin.withdrawalSettings.baseFeeAutoUpdateDesc', { defaultValue: 'When enabled, base fees are automatically recalculated every minute based on current network gas prices.' })}
                </p>
                <div className="d-flex align-items-center justify-content-between p-3 rounded" style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge bg-label-${autoUpdateOn ? 'success' : 'secondary'}`}>
                      {autoUpdateOn ? 'ON' : 'OFF'}
                    </span>
                    <span style={{ fontSize: '0.875rem' }}>
                      {t('admin.withdrawalSettings.autoUpdateToggleLabel', { defaultValue: 'Auto-update base fees from gas prices' })}
                    </span>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={autoUpdateOn}
                      onChange={handleToggleAutoUpdate}
                      disabled={savingAutoUpdate}
                      style={{ cursor: savingAutoUpdate ? 'not-allowed' : 'pointer' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Buffer & Alert */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bx bx-slider-alt me-2 text-primary"></i>
                  {t('admin.withdrawalSettings.baseFeeParams', { defaultValue: 'Base Fee Parameters' })}
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
                        <td className="py-3 ps-3" style={{ width: '40%' }}>
                          <div>
                            <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawalSettings.bufferMultiplier', { defaultValue: 'Buffer Multiplier' })}</span>
                            <br />
                            <small className="text-muted">{t('admin.withdrawalSettings.bufferMultiplierDesc', { defaultValue: 'Multiplied on gas cost (1.2 = 20% safety margin)' })}</small>
                          </div>
                        </td>
                        <td className="py-3">
                          <code className="fs-5">{bufferMultiplier}x</code>
                        </td>
                        <td className="py-3 text-end pe-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => { setBufferForm(bufferMultiplier); setShowBufferModal(true) }}
                          >
                            <i className="bx bx-edit"></i>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 ps-3">
                          <div>
                            <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawalSettings.alertThreshold', { defaultValue: 'Alert Threshold' })}</span>
                            <br />
                            <small className="text-muted">{t('admin.withdrawalSettings.alertThresholdDesc', { defaultValue: 'Notify admin when base fee changes by more than this %' })}</small>
                          </div>
                        </td>
                        <td className="py-3">
                          <code className="fs-5">{(parseFloat(alertThreshold) * 100).toFixed(0)}%</code>
                        </td>
                        <td className="py-3 text-end pe-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => { setAlertForm(alertThreshold); setShowAlertModal(true) }}
                          >
                            <i className="bx bx-edit"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Formula */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bx bx-math me-2"></i>
                  {t('admin.withdrawalSettings.feeFormula', { defaultValue: 'Fee Calculation Formula' })}
                </h5>
              </div>
              <div className="card-body">
                <div className="p-3 rounded mb-3" style={{ backgroundColor: 'var(--bs-tertiary-bg)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  <div className="mb-2"><strong>Base Fee</strong> = {t('admin.withdrawalSettings.baseFeeFormula', { defaultValue: 'Gas Limit × Gas Price × Buffer Multiplier' })}</div>
                  <div className="mb-2"><strong>Platform Fee</strong> = {t('admin.withdrawalSettings.platformFeeFormula', { defaultValue: 'Amount × Fee Percent (%)' })}</div>
                  <div><strong>Total Fee</strong> = {t('admin.withdrawalSettings.totalFeeFormula', { defaultValue: 'Base Fee + Platform Fee' })}</div>
                </div>
                <small className="text-muted">
                  {t('admin.withdrawalSettings.feeFormulaNote', { defaultValue: 'Base fee covers on-chain gas costs. Platform fee (%) is your revenue margin. Both are configured per coin-network in the Fee & Limits tab.' })}
                </small>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="card-title mb-0">
                  <i className="bx bx-dollar-circle me-1"></i>
                  {t('admin.withdrawalSettings.feeModel', { defaultValue: 'Fee Model' })}
                </h6>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-start gap-2">
                    <span className="badge bg-label-primary rounded-pill mt-1">1</span>
                    <div>
                      <small className="fw-semibold d-block">{t('admin.withdrawalSettings.feeModelStep1', { defaultValue: 'Base Fee (gas cost)' })}</small>
                      <small className="text-muted">{t('admin.withdrawalSettings.feeModelStep1Desc', { defaultValue: 'Auto-calculated from on-chain gas price × buffer multiplier' })}</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-2">
                    <span className="badge bg-label-primary rounded-pill mt-1">2</span>
                    <div>
                      <small className="fw-semibold d-block">{t('admin.withdrawalSettings.feeModelStep2', { defaultValue: 'Platform Fee (%)' })}</small>
                      <small className="text-muted">{t('admin.withdrawalSettings.feeModelStep2Desc', { defaultValue: 'Percentage fee on withdrawal amount — your revenue margin' })}</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-2">
                    <span className="badge bg-label-success rounded-pill mt-1">3</span>
                    <div>
                      <small className="fw-semibold d-block">{t('admin.withdrawalSettings.feeModelStep3', { defaultValue: 'Total = Base + Platform' })}</small>
                      <small className="text-muted">{t('admin.withdrawalSettings.feeModelStep3Desc', { defaultValue: 'Charged to user on each withdrawal. Edit per coin-network in Fee & Limits.' })}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h6 className="card-title mb-0">
                  <i className="bx bx-bulb me-1"></i>
                  {t('admin.withdrawalSettings.tips', { defaultValue: 'Tips' })}
                </h6>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0 small text-muted">
                  <li className="mb-2">
                    <i className="bx bx-right-arrow-alt me-1"></i>
                    {t('admin.withdrawalSettings.tip2', { defaultValue: 'Gas buffer of 1.2–1.5x ensures transactions confirm without running out of gas.' })}
                  </li>
                  <li className="mb-2">
                    <i className="bx bx-right-arrow-alt me-1"></i>
                    {t('admin.withdrawalSettings.tip5', { defaultValue: 'Set alert threshold to 20–30% to get notified of significant gas price spikes.' })}
                  </li>
                  <li>
                    <i className="bx bx-right-arrow-alt me-1"></i>
                    {t('admin.withdrawalSettings.tip6', { defaultValue: 'Auto-update runs every minute. Disable only if you want to set base fees manually.' })}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Fee & Limits Tab ── */}
      {activeTab === 'feeLimits' && (
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h5 className="card-title mb-1">
                  <i className="bx bx-table me-2"></i>
                  {t('admin.withdrawalSettings.perCoinNetworkTitle', { defaultValue: 'Per Coin-Network Fee & Limits' })}
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                  {t('admin.withdrawalSettings.perCoinNetworkDesc', { defaultValue: 'Each row is a coin-network pair with its own withdrawal configuration. Click Edit to modify.' })}
                </p>
              </div>
              <div className="d-flex gap-2">
                <div className="input-group input-group-sm" style={{ width: 220 }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('admin.withdrawalSettings.searchPlaceholder', { defaultValue: 'Search coin/network...' })}
                    value={cnSearch}
                    onChange={(e) => setCnSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadCoinNetworks(1, cnSearch)}
                  />
                  <button
                    className="btn btn-outline-primary"
                    type="button"
                    onClick={() => loadCoinNetworks(1, cnSearch)}
                  >
                    <i className="bx bx-search"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            {cnLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : coinNetworks.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bx bx-search-alt-2 fs-1 mb-2 d-block"></i>
                {t('admin.withdrawalSettings.noCoinNetworks', { defaultValue: 'No coin-networks found' })}
              </div>
            ) : (
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ fontSize: '0.8rem' }}>{t('admin.withdrawalSettings.colCoinNetwork', { defaultValue: 'Coin / Network' })}</th>
                    <th style={{ fontSize: '0.8rem' }} className="text-center">{t('admin.withdrawalSettings.colEnabled', { defaultValue: 'Enabled' })}</th>
                    <th style={{ fontSize: '0.8rem' }} className="text-end">{t('admin.withdrawalSettings.colMin', { defaultValue: 'Min' })}</th>
                    <th style={{ fontSize: '0.8rem' }} className="text-end">{t('admin.withdrawalSettings.colMax', { defaultValue: 'Max' })}</th>
                    <th style={{ fontSize: '0.8rem' }} className="text-end">{t('admin.withdrawalSettings.colFeeBase', { defaultValue: 'Fee Base' })}</th>
                    <th style={{ fontSize: '0.8rem' }} className="text-end">{t('admin.withdrawalSettings.colFeePercent', { defaultValue: 'Fee %' })}</th>
                    <th style={{ fontSize: '0.8rem' }} className="text-end">{t('admin.withdrawalSettings.colDailyLimit', { defaultValue: 'Daily Limit (USD)' })}</th>
                    <th style={{ fontSize: '0.8rem' }} className="text-center">{t('admin.withdrawalSettings.colActions', { defaultValue: 'Actions' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {coinNetworks.map((cn) => {
                    const coinSymbol = cn.coin?.symbol || '?'
                    const networkSymbol = cn.network?.symbol || cn.network?.name || '?'
                    return (
                      <tr key={cn.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <CoinImg symbol={coinSymbol} size={28} />
                            <div>
                              <span className="fw-semibold">{coinSymbol}</span>
                              <small className="text-muted ms-1">/ {networkSymbol}</small>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className={`badge bg-label-${cn.withdrawEnabled ? 'success' : 'secondary'}`}>
                            {cn.withdrawEnabled ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="text-end">
                          <code className="text-body">{formatAmount(cn.minWithdrawAmount)}</code>
                        </td>
                        <td className="text-end">
                          <code className="text-body">{formatAmount(cn.maxWithdrawAmount)}</code>
                        </td>
                        <td className="text-end">
                          <code className="text-body">{formatAmount(cn.withdrawFeeBase)}</code>
                          {cn.withdrawFeeBase && cn.withdrawFeeBase !== '0' && (
                            <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>auto</small>
                          )}
                        </td>
                        <td className="text-end">
                          <code className="text-body">{cn.withdrawFeePercent ? `${cn.withdrawFeePercent}%` : '-'}</code>
                        </td>
                        <td className="text-end">
                          <code className="text-body">{cn.dailyWithdrawLimitUsd ? `$${Number(cn.dailyWithdrawLimitUsd).toLocaleString()}` : '-'}</code>
                        </td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-icon btn-outline-primary"
                            title={t('actions.edit', { defaultValue: 'Edit' })}
                            onClick={() => openCnEditModal(cn)}
                          >
                            <i className="bx bx-edit-alt"></i>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {cnPagination.totalPages > 1 && (
            <div className="card-footer d-flex justify-content-between align-items-center">
              <small className="text-muted">
                {t('admin.withdrawalSettings.showing', { defaultValue: 'Showing {{from}}–{{to}} of {{total}}', from: ((cnPagination.page - 1) * cnPagination.limit) + 1, to: Math.min(cnPagination.page * cnPagination.limit, cnPagination.total), total: cnPagination.total })}
              </small>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${cnPagination.page <= 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => loadCoinNetworks(cnPagination.page - 1, cnSearch)}>
                      <i className="bx bx-chevron-left"></i>
                    </button>
                  </li>
                  {Array.from({ length: Math.min(cnPagination.totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, Math.min(cnPagination.page - 2, cnPagination.totalPages - 4))
                    const pageNum = start + i
                    if (pageNum > cnPagination.totalPages) return null
                    return (
                      <li key={pageNum} className={`page-item ${cnPagination.page === pageNum ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => loadCoinNetworks(pageNum, cnSearch)}>
                          {pageNum}
                        </button>
                      </li>
                    )
                  })}
                  <li className={`page-item ${cnPagination.page >= cnPagination.totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => loadCoinNetworks(cnPagination.page + 1, cnSearch)}>
                      <i className="bx bx-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showMaxPendingModal && (
        <SettingModal
          title={t('admin.withdrawalSettings.editMaxPending', { defaultValue: 'Edit Max Pending' })}
          onClose={() => setShowMaxPendingModal(false)}
          onSave={handleSaveMaxPending}
          saving={savingMaxPending}
          t={t}
        >
          <label className="form-label">{t('admin.withdrawalSettings.editMaxPendingLabel', { defaultValue: 'Max pending withdrawals per user' })}</label>
          <input type="number" className="form-control" min="1" max="100" value={maxPendingForm} onChange={(e) => setMaxPendingForm(e.target.value)} />
          <small className="text-muted">{t('admin.withdrawalSettings.editMaxPendingHint', { defaultValue: 'Recommended: 3–10' })}</small>
        </SettingModal>
      )}
      {showBufferModal && (
        <SettingModal
          title={t('admin.withdrawalSettings.editBuffer', { defaultValue: 'Edit Buffer Multiplier' })}
          onClose={() => setShowBufferModal(false)}
          onSave={handleSaveBuffer}
          saving={savingBuffer}
          t={t}
        >
          <label className="form-label">{t('admin.withdrawalSettings.editBufferLabel', { defaultValue: 'Buffer multiplier on gas cost' })}</label>
          <input type="number" className="form-control" min="1" max="5" step="0.1" value={bufferForm} onChange={(e) => setBufferForm(e.target.value)} />
          <small className="text-muted">{t('admin.withdrawalSettings.editBufferHint', { defaultValue: '1.0 = no buffer, 1.2 = 20% safety margin, 1.5 = 50% buffer' })}</small>
        </SettingModal>
      )}
      {showAlertModal && (
        <SettingModal
          title={t('admin.withdrawalSettings.editAlert', { defaultValue: 'Edit Alert Threshold' })}
          onClose={() => setShowAlertModal(false)}
          onSave={handleSaveAlert}
          saving={savingAlert}
          t={t}
        >
          <label className="form-label">{t('admin.withdrawalSettings.editAlertLabel', { defaultValue: 'Alert when fee changes by more than (decimal)' })}</label>
          <input type="number" className="form-control" min="0.01" max="1" step="0.01" value={alertForm} onChange={(e) => setAlertForm(e.target.value)} />
          <small className="text-muted">{t('admin.withdrawalSettings.editAlertHint', { defaultValue: '0.1 = 10%, 0.2 = 20%, 0.5 = 50%' })}</small>
        </SettingModal>
      )}

      {/* Coin-Network Edit Modal */}
      {editCn && (
        <CoinNetworkEditModal
          cn={editCn}
          form={cnForm}
          setForm={setCnForm}
          onClose={() => setEditCn(null)}
          onSave={handleSaveCn}
          saving={savingCn}
          t={t}
        />
      )}
    </div>
  )
}

/* ── Helper Components ── */

function StatusCard({ icon, color, label, value, sub, active }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card h-100">
        <div className="card-body">
          <div className="d-flex align-items-center gap-3">
            <div className="avatar avatar-sm flex-shrink-0" style={{ width: 42, height: 42 }}>
              <span className={`avatar-initial rounded bg-label-${color}`}>
                <i className={`bx ${icon}`} style={{ fontSize: '1.25rem' }}></i>
              </span>
            </div>
            <div className="d-flex flex-column">
              <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                {label}
              </small>
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0 fw-bold" style={{ fontSize: '1.1rem' }}>{value}</h5>
                {active !== undefined && (
                  <span className={`badge bg-label-${active ? 'success' : 'secondary'}`} style={{ fontSize: '0.65rem' }}>
                    {active ? 'ACTIVE' : 'OFF'}
                  </span>
                )}
              </div>
              {sub && <small className="text-muted" style={{ fontSize: '0.75rem' }}>{sub}</small>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CoinNetworkEditModal({ cn, form, setForm, onClose, onSave, saving, t }) {
  const coinSymbol = cn.coin?.symbol || '?'
  const networkSymbol = cn.network?.symbol || cn.network?.name || '?'

  // Stable ref for onClose to avoid listener churn from inline arrow
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Escape key handler
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !saving) onCloseRef.current() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [saving])

  // Filter: allow only digits and one decimal point
  function handleAmountChange(field, value) {
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setForm(prev => ({ ...prev, [field]: value }))
    }
  }

  // Filter: allow only digits, one decimal point, max 2 decimal places
  function handleUsdChange(field, value) {
    if (value === '' || /^[0-9]*\.?[0-9]{0,2}$/.test(value)) {
      setForm(prev => ({ ...prev, [field]: value }))
    }
  }

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center gap-2">
                <CoinImg symbol={coinSymbol} size={24} />
                {t('admin.withdrawalSettings.editCnTitle', { defaultValue: 'Edit Withdrawal — {{coin}} / {{network}}', coin: coinSymbol, network: networkSymbol })}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={saving}></button>
            </div>
            <div className="modal-body">
              {/* Withdraw Enabled Toggle */}
              <div className="d-flex align-items-center justify-content-between mb-4 p-3 rounded" style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
                <div>
                  <span className="fw-semibold">{t('admin.withdrawalSettings.withdrawEnabled', { defaultValue: 'Withdraw Enabled' })}</span>
                  <br />
                  <small className="text-muted">{t('admin.withdrawalSettings.withdrawEnabledDesc', { defaultValue: 'Allow users to withdraw this coin on this network' })}</small>
                </div>
                <div className="form-check form-switch mb-0">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={form.withdrawEnabled}
                    onChange={(e) => updateField('withdrawEnabled', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="row g-3">
                {/* Min Withdraw */}
                <div className="col-md-6">
                  <label className="form-label">{t('admin.withdrawalSettings.minWithdraw', { defaultValue: 'Min Withdraw Amount' })}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0.001"
                    value={form.minWithdrawAmount}
                    onChange={(e) => handleAmountChange('minWithdrawAmount', e.target.value)}
                  />
                </div>

                {/* Max Withdraw */}
                <div className="col-md-6">
                  <label className="form-label">{t('admin.withdrawalSettings.maxWithdraw', { defaultValue: 'Max Withdraw Amount' })}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="1000"
                    value={form.maxWithdrawAmount}
                    onChange={(e) => handleAmountChange('maxWithdrawAmount', e.target.value)}
                  />
                </div>

                {/* Fee Base (read-only) */}
                <div className="col-md-6">
                  <label className="form-label">
                    {t('admin.withdrawalSettings.feeBase', { defaultValue: 'Fee Base' })}
                    <span className="badge bg-label-info ms-2" style={{ fontSize: '0.65rem' }}>{t('admin.withdrawalSettings.autoCalculated', { defaultValue: 'Auto-calculated' })}</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={cn.withdrawFeeBase || '-'}
                    disabled
                    readOnly
                  />
                  <small className="text-muted">{t('admin.withdrawalSettings.feeBaseHint', { defaultValue: 'Managed by Base Fee Auto-Update' })}</small>
                </div>

                {/* Fee Percent */}
                <div className="col-md-6">
                  <label className="form-label">{t('admin.withdrawalSettings.feePercent', { defaultValue: 'Fee Percent (%)' })}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="1.5"
                    value={form.withdrawFeePercent}
                    onChange={(e) => handleAmountChange('withdrawFeePercent', e.target.value)}
                  />
                  <small className="text-muted">{t('admin.withdrawalSettings.feePercentHint', { defaultValue: 'Platform fee charged on withdrawal amount' })}</small>
                </div>

                {/* Daily Limit USD */}
                <div className="col-md-6">
                  <label className="form-label">{t('admin.withdrawalSettings.dailyLimitUsd', { defaultValue: 'Daily Withdraw Limit (USD)' })}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="10000"
                    value={form.dailyWithdrawLimitUsd}
                    onChange={(e) => handleUsdChange('dailyWithdrawLimitUsd', e.target.value)}
                  />
                  <small className="text-muted">{t('admin.withdrawalSettings.dailyLimitHint', { defaultValue: 'Max USD value per user per day (empty = no limit)' })}</small>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
                {saving ? (
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
  )
}

function SettingModal({ title, onClose, onSave, saving, children, t }) {
  // Stable ref for onClose to avoid listener churn from inline arrow
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Escape key handler
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !saving) onCloseRef.current() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [saving])

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={saving}></button>
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
                {saving ? (
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
  )
}

function formatAmount(val) {
  if (val == null || val === '') return '-'
  const num = parseFloat(val)
  if (isNaN(num)) return val
  // Avoid scientific notation for very small numbers
  if (Math.abs(num) < 1e-6 && num !== 0) return val
  return num.toLocaleString('en-US', { maximumFractionDigits: 18, useGrouping: false })
}
