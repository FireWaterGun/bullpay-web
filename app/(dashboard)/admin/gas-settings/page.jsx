'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getSettings, upsertSetting } from '@/lib/api/admin'
import { logger } from '@/lib/utils/logger'

// ─── Constants ───────────────────────────────────────────────

const TABS = [
  { key: 'gasPrice', icon: 'bx-gas-pump', labelKey: 'admin.gasSettings.tabGasPrice', defaultLabel: 'Gas Price' },
  { key: 'gasLimit', icon: 'bx-tachometer', labelKey: 'admin.gasSettings.tabGasLimit', defaultLabel: 'Gas Limit' },
  { key: 'gasTopup', icon: 'bx-coin-stack', labelKey: 'admin.gasSettings.tabGasTopup', defaultLabel: 'Gas Topup' },
]

const NETWORKS = [
  { key: 'eth', name: 'Ethereum', symbol: 'ETH', nativeCoin: 'ETH', type: 'eip1559' },
  { key: 'bsc', name: 'BNB Smart Chain', symbol: 'BSC', nativeCoin: 'BNB', type: 'legacy' },
  { key: 'pol', name: 'Polygon', symbol: 'POL', nativeCoin: 'POL', type: 'eip1559' },
  { key: 'arbitrum', name: 'Arbitrum', symbol: 'ARBITRUM', nativeCoin: 'ETH', type: 'eip1559' },
  { key: 'optimism', name: 'Optimism', symbol: 'OPTIMISM', nativeCoin: 'ETH', type: 'eip1559' },
  { key: 'base', name: 'Base', symbol: 'BASE', nativeCoin: 'ETH', type: 'eip1559' },
  { key: 'avax', name: 'Avalanche', symbol: 'AVAX', nativeCoin: 'AVAX', type: 'eip1559' },
]

const OPERATIONS = ['withdrawal', 'sweep', 'topup']

// ─── Component ───────────────────────────────────────────────

export default function GasSettingsPage() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('gasPrice')
  const [loading, setLoading] = useState(true)

  // All settings keyed by keyName → value
  const [settingsMap, setSettingsMap] = useState({})

  // Edit modals
  const [editModal, setEditModal] = useState(null) // { tab, network }
  const [editForm, setEditForm] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Escape key to close modal (blocked during save to prevent race condition)
  useEffect(() => {
    if (!editModal) return
    const handler = (e) => { if (e.key === 'Escape' && !saving) setEditModal(null) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [editModal, saving])

  // ─── Data Loading ────────────────────────────────────────

  const loadSettings = useCallback(async () => {
    if (!token) return
    try {
      const [gasPriceRes, gasLimitRes, gasTopupRes] = await Promise.all([
        getSettings(token, { category: 'gas_price', limit: 100 }),
        getSettings(token, { category: 'gas_limit', limit: 100 }),
        getSettings(token, { category: 'gas_topup', limit: 100 }),
      ])

      const map = {}
      const allItems = [
        ...(gasPriceRes?.items || []),
        ...(gasLimitRes?.items || []),
        ...(gasTopupRes?.items || []),
      ]
      for (const item of allItems) {
        const key = item.keyName || item.key_name
        map[key] = item.value ?? item.defaultValue ?? item.default_value ?? ''
      }
      setSettingsMap(map)
    } catch (error) {
      logger.error('Failed to load gas settings:', error)
      toast.error(t('admin.gasSettings.loadError', { defaultValue: 'Failed to load gas settings' }))
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function init() {
      setLoading(true)
      await loadSettings()
      setLoading(false)
    }
    init()
  }, [loadSettings])

  // ─── Helpers ─────────────────────────────────────────────

  function getVal(key, fallback = '—') {
    const v = settingsMap[key]
    return v !== undefined && v !== '' ? v : fallback
  }

  function updateField(field, value) {
    setEditForm((f) => ({ ...f, [field]: value }))
    setFormErrors((e) => {
      if (!e[field]) return e
      const next = { ...e }
      delete next[field]
      return next
    })
  }

  function validateNumber(value, { min, max, integer, fieldLabel } = {}) {
    if (value === '' || value === undefined) return null // empty = optional, skip
    const n = Number(value)
    if (isNaN(n) || value.toString().trim() === '') return t('admin.gasSettings.errNotANumber', { defaultValue: '{{field}} must be a valid number', field: fieldLabel || 'Value' })
    if (integer && !Number.isInteger(n)) return t('admin.gasSettings.errMustBeInteger', { defaultValue: '{{field}} must be an integer', field: fieldLabel || 'Value' })
    if (min !== undefined && n < min) return t('admin.gasSettings.errMin', { defaultValue: '{{field}} must be at least {{min}}', field: fieldLabel || 'Value', min })
    if (max !== undefined && n > max) return t('admin.gasSettings.errMax', { defaultValue: '{{field}} cannot exceed {{max}}', field: fieldLabel || 'Value', max })
    return null
  }

  function openGasPriceEdit(network) {
    const net = network.key
    const form = {
      maxGasPriceGwei: getVal(`gas_price.${net}.max_gas_price_gwei`, ''),
    }
    for (const op of OPERATIONS) {
      form[`${op}Base`] = getVal(`gas_price.${net}.${op}.base_multiplier`, '')
      if (network.type === 'eip1559') {
        form[`${op}Priority`] = getVal(`gas_price.${net}.${op}.priority_multiplier`, '')
      }
    }
    setEditForm(form)
    setFormErrors({})
    setEditModal({ tab: 'gasPrice', network })
  }

  function openGasLimitEdit(network) {
    setEditForm({
      multiplier: getVal(`gas_limit.${network.key}.multiplier`, ''),
    })
    setFormErrors({})
    setEditModal({ tab: 'gasLimit', network })
  }

  function openGasTopupEdit(network) {
    setEditForm({
      maxTopupAmount: getVal(`gas_topup.${network.key}.max_topup_amount`, ''),
    })
    setFormErrors({})
    setEditModal({ tab: 'gasTopup', network })
  }

  // ─── Save Handlers ──────────────────────────────────────

  async function saveSetting(keyName, value) {
    await upsertSetting(token, { keyName, value: String(value) })
  }

  async function handleSaveGasPrice() {
    const net = editModal.network.key
    const isEip1559 = editModal.network.type === 'eip1559'

    // Validate
    const errors = {}
    const e1 = validateNumber(editForm.maxGasPriceGwei, { min: 0, max: 100000, fieldLabel: 'Max Gas Price' })
    if (e1) errors.maxGasPriceGwei = e1
    for (const op of OPERATIONS) {
      const eBase = validateNumber(editForm[`${op}Base`], { min: 1, max: 100, fieldLabel: 'Base Multiplier' })
      if (eBase) errors[`${op}Base`] = eBase
      if (isEip1559) {
        const ePri = validateNumber(editForm[`${op}Priority`], { min: 1, max: 100, fieldLabel: 'Priority Multiplier' })
        if (ePri) errors[`${op}Priority`] = ePri
      }
    }
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    try {
      setSaving(true)
      const updates = []
      const mapUpdates = {}

      // Max gas price
      const maxGwei = editForm.maxGasPriceGwei
      if (maxGwei !== '') {
        const key = `gas_price.${net}.max_gas_price_gwei`
        updates.push(saveSetting(key, maxGwei))
        mapUpdates[key] = String(maxGwei)
      }

      // Per-operation multipliers
      for (const op of OPERATIONS) {
        const baseVal = editForm[`${op}Base`]
        if (baseVal !== '') {
          const key = `gas_price.${net}.${op}.base_multiplier`
          updates.push(saveSetting(key, baseVal))
          mapUpdates[key] = String(baseVal)
        }
        if (isEip1559) {
          const priVal = editForm[`${op}Priority`]
          if (priVal !== '') {
            const key = `gas_price.${net}.${op}.priority_multiplier`
            updates.push(saveSetting(key, priVal))
            mapUpdates[key] = String(priVal)
          }
        }
      }

      if (updates.length === 0) return
      await Promise.all(updates)
      setSettingsMap((prev) => ({ ...prev, ...mapUpdates }))
      setEditModal(null)
      toast.success(t('admin.gasSettings.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      toast.error(error?.message || t('admin.gasSettings.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveGasLimit() {
    const val = editForm.multiplier
    if (val === '' || val === undefined) return

    const errors = {}
    const e1 = validateNumber(val, { min: 1, max: 100, fieldLabel: 'Multiplier' })
    if (e1) errors.multiplier = e1
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    const key = `gas_limit.${editModal.network.key}.multiplier`
    try {
      setSaving(true)
      await saveSetting(key, val)
      setSettingsMap((prev) => ({ ...prev, [key]: String(val) }))
      setEditModal(null)
      toast.success(t('admin.gasSettings.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      toast.error(error?.message || t('admin.gasSettings.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveGasTopup() {
    const val = editForm.maxTopupAmount
    if (val === '' || val === undefined) return

    const errors = {}
    const e1 = validateNumber(val, { min: 0, fieldLabel: 'Max Topup Amount' })
    if (e1) errors.maxTopupAmount = e1
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    const key = `gas_topup.${editModal.network.key}.max_topup_amount`
    try {
      setSaving(true)
      await saveSetting(key, val)
      setSettingsMap((prev) => ({ ...prev, [key]: String(val) }))
      setEditModal(null)
      toast.success(t('admin.gasSettings.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      toast.error(error?.message || t('admin.gasSettings.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setSaving(false)
    }
  }

  function handleSave() {
    if (!editModal) return
    if (editModal.tab === 'gasPrice') return handleSaveGasPrice()
    if (editModal.tab === 'gasLimit') return handleSaveGasLimit()
    if (editModal.tab === 'gasTopup') return handleSaveGasTopup()
  }

  // ─── Render: Loading ─────────────────────────────────────

  if (loading) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render: Tabs ────────────────────────────────────────

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bx bx-gas-pump me-2 text-primary"></i>
            {t('admin.gasSettings.title', { defaultValue: 'Gas Settings' })}
          </h4>
          <p className="text-muted mb-0">
            {t('admin.gasSettings.subtitle', { defaultValue: 'Configure gas price multipliers, gas limit buffers, and topup amounts per network' })}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="nav-align-top">
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

        <div className="tab-content border border-top-0 rounded-bottom p-4">
          {activeTab === 'gasPrice' && renderGasPriceTab()}
          {activeTab === 'gasLimit' && renderGasLimitTab()}
          {activeTab === 'gasTopup' && renderGasTopupTab()}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && renderEditModal()}
    </div>
  )

  // ─── Tab: Gas Price ──────────────────────────────────────

  function renderGasPriceTab() {
    return (
      <>
        <div className="alert alert-primary mb-4" role="alert">
          <i className="bx bx-info-circle me-1"></i>
          {t('admin.gasSettings.gasPriceInfo', {
            defaultValue: 'Gas price multipliers control how aggressively transactions are priced. Higher multipliers = faster confirmation but higher cost. BSC uses Legacy (gasPrice only), all other networks use EIP-1559 (base + priority fee).',
          })}
        </div>

        <div className="table-responsive">
          <table className="table table-hover border-top">
            <thead>
              <tr>
                <th>{t('admin.gasSettings.colNetwork', { defaultValue: 'Network' })}</th>
                <th className="text-center">{t('admin.gasSettings.colMaxGwei', { defaultValue: 'Max Gwei' })}</th>
                <th className="text-center">{t('admin.gasSettings.colWithdrawal', { defaultValue: 'Withdrawal' })}</th>
                <th className="text-center">{t('admin.gasSettings.colSweep', { defaultValue: 'Sweep' })}</th>
                <th className="text-center">{t('admin.gasSettings.colTopup', { defaultValue: 'Topup' })}</th>
                <th className="text-end">{t('admin.gasSettings.colActions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody>
              {NETWORKS.map((net) => {
                const maxGwei = getVal(`gas_price.${net.key}.max_gas_price_gwei`)
                return (
                  <tr key={net.key}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div>
                          <strong>{net.name}</strong>
                          <div>
                            <span className={`badge rounded-pill ${net.type === 'eip1559' ? 'bg-label-info' : 'bg-label-warning'} me-1`}>
                              {net.type === 'eip1559' ? 'EIP-1559' : 'Legacy'}
                            </span>
                            <small className="text-muted">{net.symbol}</small>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="fw-semibold">{maxGwei}</span>
                      {maxGwei !== '—' && <div className="text-muted small">gwei</div>}
                    </td>
                    {OPERATIONS.map((op) => {
                      const baseVal = getVal(`gas_price.${net.key}.${op}.base_multiplier`)
                      const priVal = net.type === 'eip1559' ? getVal(`gas_price.${net.key}.${op}.priority_multiplier`) : null
                      return (
                        <td key={op} className="text-center">
                          <div>
                            <span className="text-body fw-medium">
                              {baseVal}{baseVal !== '—' && '×'}
                            </span>
                            <div className="text-muted small">base</div>
                          </div>
                          {priVal !== null && (
                            <div className="mt-1">
                              <span className="text-body fw-medium">
                                {priVal}{priVal !== '—' && '×'}
                              </span>
                              <div className="text-muted small">priority</div>
                            </div>
                          )}
                        </td>
                      )
                    })}
                    <td className="text-end">
                      <button
                        className="btn btn-icon btn-sm text-secondary"
                        title={t('admin.gasSettings.edit', { defaultValue: 'Edit' })}
                        onClick={() => openGasPriceEdit(net)}
                      >
                        <i className="bx bx-edit" style={{ fontSize: '1rem' }}></i>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Formula info */}
        <div className="card bg-lighter mt-3">
          <div className="card-body py-3">
            <h6 className="mb-2">
              <i className="bx bx-math me-1"></i>
              {t('admin.gasSettings.formulaTitle', { defaultValue: 'How Multipliers Work' })}
            </h6>
            <div className="row g-3">
              <div className="col-md-6">
                <small className="text-muted d-block mb-1">EIP-1559 Networks</small>
                <code>maxFeePerGas = baseFee × baseMultiplier</code><br />
                <code>maxPriorityFee = suggestedTip × priorityMultiplier</code>
              </div>
              <div className="col-md-6">
                <small className="text-muted d-block mb-1">Legacy Networks (BSC)</small>
                <code>gasPrice = networkGasPrice × baseMultiplier</code>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ─── Tab: Gas Limit ──────────────────────────────────────

  function renderGasLimitTab() {
    return (
      <>
        <div className="alert alert-primary mb-4" role="alert">
          <i className="bx bx-info-circle me-1"></i>
          {t('admin.gasSettings.gasLimitInfo', {
            defaultValue: 'Gas limit multiplier is applied after estimateGas() to add a safety buffer, preventing out-of-gas failures. Unused gas is NOT charged — only the buffer risk cost.',
          })}
        </div>

        <div className="table-responsive">
          <table className="table table-hover border-top">
            <thead>
              <tr>
                <th>{t('admin.gasSettings.colNetwork', { defaultValue: 'Network' })}</th>
                <th className="text-center">{t('admin.gasSettings.colMultiplier', { defaultValue: 'Multiplier' })}</th>
                <th className="text-center">{t('admin.gasSettings.colBuffer', { defaultValue: 'Buffer %' })}</th>
                <th className="text-end">{t('admin.gasSettings.colActions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody>
              {NETWORKS.map((net) => {
                const multiplier = getVal(`gas_limit.${net.key}.multiplier`)
                const bufferPct = multiplier !== '—' ? ((parseFloat(multiplier) - 1) * 100).toFixed(0) : '—'
                return (
                  <tr key={net.key}>
                    <td>
                      <strong>{net.name}</strong>
                      <div className="text-muted small">{net.symbol}</div>
                    </td>
                    <td className="text-center">
                      <span className="fw-semibold">{multiplier}{multiplier !== '—' && '×'}</span>
                    </td>
                    <td className="text-center">
                      {bufferPct !== '—' ? (
                        <span className={`badge rounded-pill ${
                          parseInt(bufferPct) >= 20 ? 'bg-label-warning' :
                          parseInt(bufferPct) >= 15 ? 'bg-label-info' :
                          'bg-label-success'
                        }`}>
                          +{bufferPct}%
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-icon btn-sm text-secondary"
                        title={t('admin.gasSettings.edit', { defaultValue: 'Edit' })}
                        onClick={() => openGasLimitEdit(net)}
                      >
                        <i className="bx bx-edit" style={{ fontSize: '1rem' }}></i>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Formula info */}
        <div className="card bg-lighter mt-3">
          <div className="card-body py-3">
            <h6 className="mb-2">
              <i className="bx bx-math me-1"></i>
              {t('admin.gasSettings.gasLimitFormula', { defaultValue: 'Formula' })}
            </h6>
            <code>gasLimit = estimateGas() × multiplier</code>
            <div className="text-muted small mt-1">
              {t('admin.gasSettings.gasLimitFormulaNote', {
                defaultValue: 'Example: estimateGas() = 21,000 × 1.15 = 24,150 gas limit. Unused gas is not charged.',
              })}
            </div>
          </div>
        </div>
      </>
    )
  }

  // ─── Tab: Gas Topup ──────────────────────────────────────

  function renderGasTopupTab() {
    return (
      <>
        <div className="alert alert-primary mb-4" role="alert">
          <i className="bx bx-info-circle me-1"></i>
          {t('admin.gasSettings.gasTopupInfo', {
            defaultValue: 'Max topup amount is the safety cap for native coin sent to temp wallets for gas. The actual topup amount is calculated based on the gas deficit — this is just the maximum allowed per topup.',
          })}
        </div>

        <div className="table-responsive">
          <table className="table table-hover border-top">
            <thead>
              <tr>
                <th>{t('admin.gasSettings.colNetwork', { defaultValue: 'Network' })}</th>
                <th className="text-center">{t('admin.gasSettings.colMaxAmount', { defaultValue: 'Max Topup Amount' })}</th>
                <th className="text-center">{t('admin.gasSettings.colNativeCoin', { defaultValue: 'Native Coin' })}</th>
                <th className="text-end">{t('admin.gasSettings.colActions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody>
              {NETWORKS.map((net) => {
                const amount = getVal(`gas_topup.${net.key}.max_topup_amount`)
                return (
                  <tr key={net.key}>
                    <td>
                      <strong>{net.name}</strong>
                      <div className="text-muted small">{net.symbol}</div>
                    </td>
                    <td className="text-center">
                      <span className="fw-semibold">{amount}</span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-label-primary">{net.nativeCoin}</span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-icon btn-sm text-secondary"
                        title={t('admin.gasSettings.edit', { defaultValue: 'Edit' })}
                        onClick={() => openGasTopupEdit(net)}
                      >
                        <i className="bx bx-edit" style={{ fontSize: '1rem' }}></i>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Info card */}
        <div className="card bg-lighter mt-3">
          <div className="card-body py-3">
            <h6 className="mb-2">
              <i className="bx bx-info-circle me-1"></i>
              {t('admin.gasSettings.gasTopupHowItWorks', { defaultValue: 'How Topup Works' })}
            </h6>
            <div className="text-muted small">
              {t('admin.gasSettings.gasTopupHowItWorksDesc', {
                defaultValue: 'When a temp wallet needs to sweep tokens but lacks gas, the system sends native coin from the gas wallet. The topup amount = (required gas) − (current balance), capped at the max topup amount above.',
              })}
            </div>
          </div>
        </div>
      </>
    )
  }

  // ─── Edit Modal ──────────────────────────────────────────

  function renderEditModal() {
    const { tab, network } = editModal
    const isEip1559 = network.type === 'eip1559'

    const modalTitle = {
      gasPrice: t('admin.gasSettings.editGasPrice', { defaultValue: 'Edit Gas Price — {{network}}', network: network.name }),
      gasLimit: t('admin.gasSettings.editGasLimit', { defaultValue: 'Edit Gas Limit — {{network}}', network: network.name }),
      gasTopup: t('admin.gasSettings.editGasTopup', { defaultValue: 'Edit Gas Topup — {{network}}', network: network.name }),
    }[tab]

    return (
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={(e) => { if (e.target === e.currentTarget && !saving) setEditModal(null) }}
      >
        <div className={`modal-dialog modal-dialog-centered ${tab === 'gasPrice' ? 'modal-lg' : ''}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className={`bx ${TABS.find((item) => item.key === tab)?.icon || 'bx-cog'} me-2`}></i>
                {modalTitle}
              </h5>
              <button type="button" className="btn-close" onClick={() => setEditModal(null)} disabled={saving}></button>
            </div>
            <div className="modal-body">
              {tab === 'gasPrice' && renderGasPriceForm(network, isEip1559)}
              {tab === 'gasLimit' && renderGasLimitForm(network)}
              {tab === 'gasTopup' && renderGasTopupForm(network)}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={() => setEditModal(null)} disabled={saving}>
                {t('admin.gasSettings.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving && <span className="spinner-border spinner-border-sm me-1" role="status"></span>}
                {t('admin.gasSettings.save', { defaultValue: 'Save Changes' })}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Modal Forms ─────────────────────────────────────────

  function renderGasPriceForm(network, isEip1559) {
    const opLabels = {
      withdrawal: t('admin.gasSettings.opWithdrawal', { defaultValue: 'Withdrawal' }),
      sweep: t('admin.gasSettings.opSweep', { defaultValue: 'Sweep' }),
      topup: t('admin.gasSettings.opTopup', { defaultValue: 'Topup' }),
    }

    const opIcons = { withdrawal: 'bx-upload', sweep: 'bx-transfer', topup: 'bx-coin-stack' }
    const opColors = { withdrawal: 'var(--bs-primary)', sweep: 'var(--bs-success)', topup: 'var(--bs-warning)' }
    const opTextColors = { withdrawal: 'text-primary', sweep: 'text-success', topup: 'text-warning' }

    return (
      <>
        {/* Network type badge */}
        <div className="mb-4">
          <span className={`badge rounded-pill ${isEip1559 ? 'bg-label-info' : 'bg-label-warning'} me-2`}>
            {isEip1559 ? 'EIP-1559' : 'Legacy'}
          </span>
          <span className="text-muted">{network.symbol}</span>
        </div>

        {/* Max Gas Price */}
        <div className="mb-4">
          <label className="form-label fw-semibold">
            {t('admin.gasSettings.maxGasPriceGwei', { defaultValue: 'Max Gas Price (Gwei)' })}
          </label>
          <div className="input-group">
            <input
              type="text"
              inputMode="decimal"
              className={`form-control ${formErrors.maxGasPriceGwei ? 'is-invalid' : ''}`}
              value={editForm.maxGasPriceGwei ?? ''}
              onChange={(e) => updateField('maxGasPriceGwei', e.target.value)}
            />
            <span className="input-group-text">Gwei</span>
          </div>
          {formErrors.maxGasPriceGwei && <div className="invalid-feedback d-block">{formErrors.maxGasPriceGwei}</div>}
          <div className="form-text">
            {t('admin.gasSettings.maxGasPriceDesc', { defaultValue: 'Safety cap — transactions will not exceed this gas price regardless of multipliers.' })}
          </div>
        </div>

        {/* Per-operation multipliers */}
        <div className="d-flex align-items-center mb-3">
          <h6 className="mb-0">
            {t('admin.gasSettings.operationMultipliers', { defaultValue: 'Operation Multipliers' })}
          </h6>
          <hr className="flex-grow-1 ms-3 my-0" />
        </div>

        {OPERATIONS.map((op) => (
          <div
            key={op}
            className="card mb-3"
            style={{ borderLeft: `3px solid ${opColors[op]}` }}
          >
            <div className="card-body py-3">
              <h6 className={`mb-3 d-flex align-items-center ${opTextColors[op]}`}>
                <i className={`bx ${opIcons[op]} me-2`}></i>
                {opLabels[op]}
              </h6>
              <div className="row g-3">
                <div className={isEip1559 ? 'col-md-6' : 'col-12'}>
                  <label className="form-label small text-muted mb-1">
                    {t('admin.gasSettings.baseMultiplier', { defaultValue: 'Base Multiplier' })}
                  </label>
                  <div className="input-group">
                    <input
                      type="text"
                      inputMode="decimal"
                      className={`form-control ${formErrors[`${op}Base`] ? 'is-invalid' : ''}`}
                      value={editForm[`${op}Base`] ?? ''}
                      onChange={(e) => updateField(`${op}Base`, e.target.value)}
                    />
                    <span className="input-group-text">×</span>
                  </div>
                  {formErrors[`${op}Base`] && <div className="invalid-feedback d-block">{formErrors[`${op}Base`]}</div>}
                </div>
                {isEip1559 && (
                  <div className="col-md-6">
                    <label className="form-label small text-muted mb-1">
                      {t('admin.gasSettings.priorityMultiplier', { defaultValue: 'Priority Multiplier' })}
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        inputMode="decimal"
                        className={`form-control ${formErrors[`${op}Priority`] ? 'is-invalid' : ''}`}
                        value={editForm[`${op}Priority`] ?? ''}
                        onChange={(e) => updateField(`${op}Priority`, e.target.value)}
                      />
                      <span className="input-group-text">×</span>
                    </div>
                    {formErrors[`${op}Priority`] && <div className="invalid-feedback d-block">{formErrors[`${op}Priority`]}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </>
    )
  }

  function renderGasLimitForm(network) {
    return (
      <div>
        <div className="mb-4">
          <span className="text-muted">{network.symbol}</span>
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold">
            {t('admin.gasSettings.gasLimitMultiplier', { defaultValue: 'Gas Limit Multiplier' })}
          </label>
          <div className="input-group">
            <input
              type="text"
              inputMode="decimal"
              className={`form-control ${formErrors.multiplier ? 'is-invalid' : ''}`}
              value={editForm.multiplier ?? ''}
              onChange={(e) => updateField('multiplier', e.target.value)}
            />
            <span className="input-group-text">×</span>
          </div>
          {formErrors.multiplier && <div className="invalid-feedback d-block">{formErrors.multiplier}</div>}
          <div className="form-text">
            {t('admin.gasSettings.gasLimitMultiplierDesc', {
              defaultValue: 'Applied to estimateGas() result. 1.10 = 10% buffer, 1.20 = 20% buffer. Higher buffer prevents out-of-gas failures.',
            })}
          </div>
        </div>
        {editForm.multiplier && !isNaN(parseFloat(editForm.multiplier)) && (
          <div className="alert alert-info mb-0">
            <i className="bx bx-calculator me-1"></i>
            {t('admin.gasSettings.bufferPreview', { defaultValue: 'Buffer: +{{pct}}% above gas estimate', pct: ((parseFloat(editForm.multiplier) - 1) * 100).toFixed(0) })}
          </div>
        )}
      </div>
    )
  }

  function renderGasTopupForm(network) {
    return (
      <div>
        <div className="mb-3">
          <span className="text-muted">{network.symbol}</span>
          <span className="badge bg-label-primary ms-2">{network.nativeCoin}</span>
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold">
            {t('admin.gasSettings.maxTopupAmount', { defaultValue: 'Max Topup Amount' })}
          </label>
          <div className="input-group">
            <input
              type="text"
              inputMode="decimal"
              className={`form-control ${formErrors.maxTopupAmount ? 'is-invalid' : ''}`}
              value={editForm.maxTopupAmount ?? ''}
              onChange={(e) => updateField('maxTopupAmount', e.target.value)}
            />
            <span className="input-group-text">{network.nativeCoin}</span>
          </div>
          {formErrors.maxTopupAmount && <div className="invalid-feedback d-block">{formErrors.maxTopupAmount}</div>}
          <div className="form-text">
            {t('admin.gasSettings.maxTopupAmountDesc', {
              defaultValue: 'Maximum native coin to send per topup operation. Safety cap to prevent over-funding temp wallets.',
            })}
          </div>
        </div>
      </div>
    )
  }
}
