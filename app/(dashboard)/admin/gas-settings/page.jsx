'use client'

import { useState } from 'react'
import { useToast } from '@/app/providers'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import useApi from '@/hooks/useApi'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getSettings, upsertSetting } from '@/lib/api/admin'
import Spinner from '@/components/ui/Spinner'
import GasPriceTab from '@/components/admin/gas-settings/GasPriceTab'
import GasLimitTab from '@/components/admin/gas-settings/GasLimitTab'
import GasTopupTab from '@/components/admin/gas-settings/GasTopupTab'
import dynamic from 'next/dynamic'
const GasEditModal = dynamic(() => import('@/components/admin/gas-settings/GasEditModal'), { ssr: false })
const preloadGasEdit = () => import('@/components/admin/gas-settings/GasEditModal')

// ─── Constants ───────────────────────────────────────────────

const TABS = [
  { key: 'gasPrice', icon: 'bx-gas-pump', labelKey: 'admin.gasSettings.tabGasPrice', defaultLabel: 'Gas Price' },
  { key: 'gasLimit', icon: 'bx-tachometer', labelKey: 'admin.gasSettings.tabGasLimit', defaultLabel: 'Gas Limit' },
  { key: 'gasTopup', icon: 'bx-coin-stack', labelKey: 'admin.gasSettings.tabGasTopup', defaultLabel: 'Gas Topup' },
]

const OPERATIONS = ['withdrawal', 'sweep', 'topup']

// ─── Component ───────────────────────────────────────────────

export default function GasSettingsPage() {
  const { t } = useAdminTranslation()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('gasPrice')

  const { data: settingsMap, isLoading: loading, mutate, token } = useApi(
    'admin-gas-settings',
    async (token) => {
      const [gasPriceRes, gasLimitRes, gasTopupRes] = await Promise.all([
        getSettings(token, { category: 'gas_price', limit: 100 }),
        getSettings(token, { category: 'gas_limit', limit: 100 }),
        getSettings(token, { category: 'gas_topup', limit: 100 }),
      ])
      const map = {}
      const allItems = [...(gasPriceRes?.items || []), ...(gasLimitRes?.items || []), ...(gasTopupRes?.items || [])]
      for (const item of allItems) {
        const key = item.keyName || item.key_name
        map[key] = item.value ?? item.defaultValue ?? item.default_value ?? ''
      }
      return map
    },
    { onError: () => toast.error(t('admin.gasSettings.loadError', { defaultValue: 'Failed to load gas settings' })) }
  )

  // Edit modal state
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEscapeKey(() => { if (!saving) setEditModal(null) }, !!editModal)

  // ─── Data Loading ────────────────────────────────────────

  // ─── Helpers ─────────────────────────────────────────────

  function getVal(key, fallback = '—') {
    const v = (settingsMap || {})[key]
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
    if (value === '' || value === undefined) return null
    const n = Number(value)
    if (isNaN(n) || value.toString().trim() === '') {
      return t('admin.gasSettings.errNotANumber', {
        defaultValue: '{{field}} must be a valid number',
        field: fieldLabel || 'Value',
      })
    }
    if (integer && !Number.isInteger(n)) {
      return t('admin.gasSettings.errMustBeInteger', {
        defaultValue: '{{field}} must be an integer',
        field: fieldLabel || 'Value',
      })
    }
    if (min !== undefined && n < min) {
      return t('admin.gasSettings.errMin', {
        defaultValue: '{{field}} must be at least {{min}}',
        field: fieldLabel || 'Value',
        min,
      })
    }
    if (max !== undefined && n > max) {
      return t('admin.gasSettings.errMax', {
        defaultValue: '{{field}} cannot exceed {{max}}',
        field: fieldLabel || 'Value',
        max,
      })
    }
    return null
  }

  // ─── Open Edit Modals ────────────────────────────────────

  function openGasPriceEdit(network) {
    const net = network.key
    const form = { maxGasPriceGwei: getVal(`gas_price.${net}.max_gas_price_gwei`, '') }
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
    setEditForm({ multiplier: getVal(`gas_limit.${network.key}.multiplier`, '') })
    setFormErrors({})
    setEditModal({ tab: 'gasLimit', network })
  }

  function openGasTopupEdit(network) {
    setEditForm({ maxTopupAmount: getVal(`gas_topup.${network.key}.max_topup_amount`, '') })
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

    const errors = {}
    const e1 = validateNumber(editForm.maxGasPriceGwei, { min: 0, max: 100000, fieldLabel: 'Max Gas Price' })
    if (e1) errors.maxGasPriceGwei = e1
    for (const op of OPERATIONS) {
      const eBase = validateNumber(editForm[`${op}Base`], { min: 0.01, max: 100, fieldLabel: 'Base Multiplier' })
      if (eBase) errors[`${op}Base`] = eBase
      if (isEip1559) {
        const ePri = validateNumber(editForm[`${op}Priority`], { min: 0.01, max: 100, fieldLabel: 'Priority Multiplier' })
        if (ePri) errors[`${op}Priority`] = ePri
      }
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setSaving(true)
      const updates = []
      const mapUpdates = {}

      const maxGwei = editForm.maxGasPriceGwei
      if (maxGwei !== '') {
        const key = `gas_price.${net}.max_gas_price_gwei`
        updates.push(saveSetting(key, maxGwei))
        mapUpdates[key] = String(maxGwei)
      }

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
      mutate((prev) => ({ ...prev, ...mapUpdates }), false)
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
    const e1 = validateNumber(val, { min: 0.01, max: 100, fieldLabel: 'Multiplier' })
    if (e1) errors.multiplier = e1
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const key = `gas_limit.${editModal.network.key}.multiplier`
    try {
      setSaving(true)
      await saveSetting(key, val)
      mutate((prev) => ({ ...prev, [key]: String(val) }), false)
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
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const key = `gas_topup.${editModal.network.key}.max_topup_amount`
    try {
      setSaving(true)
      await saveSetting(key, val)
      mutate((prev) => ({ ...prev, [key]: String(val) }), false)
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

  // ─── Render ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grow pb-6">
        <div className="flex justify-center items-center py-5">
          <Spinner role="status" className="text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="grow pb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bx bx-gas-pump mr-2 text-primary"></i>
            {t('admin.gasSettings.title', { defaultValue: 'Gas Settings' })}
          </h4>
          <p className="text-surface-500 mb-0">
            {t('admin.gasSettings.subtitle', {
              defaultValue: 'Configure gas price multipliers, gas limit buffers, and topup amounts per network',
            })}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <ul className="flex border-b border-surface-200 gap-2" role="tablist">
          {TABS.map((tab) => (
            <li key={tab.key} role="presentation">
              <button
                className={`px-4 py-2 text-base font-medium border-b-[3px] transition-colors ${activeTab === tab.key ? 'text-primary-600 border-primary-600 font-semibold' : 'text-surface-500 hover:text-surface-700 border-transparent hover:border-surface-300'}`}
                onClick={() => setActiveTab(tab.key)}
                type="button"
                role="tab"
              >
                <i className={`bx ${tab.icon} mr-1.5 text-base align-middle`}></i>
                {t(tab.labelKey, { defaultValue: tab.defaultLabel })}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div onMouseEnter={preloadGasEdit}>
        {activeTab === 'gasPrice' ? <GasPriceTab t={t} getVal={getVal} onEdit={openGasPriceEdit} /> : null}
        {activeTab === 'gasLimit' ? <GasLimitTab t={t} getVal={getVal} onEdit={openGasLimitEdit} /> : null}
        {activeTab === 'gasTopup' ? <GasTopupTab t={t} getVal={getVal} onEdit={openGasTopupEdit} /> : null}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <GasEditModal
          t={t}
          editModal={editModal}
          editForm={editForm}
          setEditForm={setEditForm}
          formErrors={formErrors}
          updateField={updateField}
          saving={saving}
          onClose={() => setEditModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
