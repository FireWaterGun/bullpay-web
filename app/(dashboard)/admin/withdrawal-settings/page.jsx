'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getSettingByKey, upsertSetting, getCoinNetworks, updateCoinNetwork } from '@/lib/api/admin'
import { logger } from '@/lib/utils/logger'
import PolicyTab from '@/components/admin/withdrawal-settings/PolicyTab'
import BaseFeeTab from '@/components/admin/withdrawal-settings/BaseFeeTab'
import FeeLimitsTab from '@/components/admin/withdrawal-settings/FeeLimitsTab'
import SettingModal from '@/components/admin/withdrawal-settings/SettingModal'
import CoinNetworkEditModal from '@/components/admin/withdrawal-settings/CoinNetworkEditModal'
import AvatarInitial from '@/components/ui/AvatarInitial'
import Badge, { bgLabelClass } from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

const TABS = [
  { key: 'policy', icon: 'bx-shield-quarter', labelKey: 'admin.withdrawalSettings.tabPolicy', defaultLabel: 'Policy' },
  { key: 'basefee', icon: 'bx-gas-pump', labelKey: 'admin.withdrawalSettings.tabBaseFee', defaultLabel: 'Base Fee' },
  {
    key: 'feeLimits',
    icon: 'bx-table',
    labelKey: 'admin.withdrawalSettings.tabFeeLimits',
    defaultLabel: 'Fee & Limits',
  },
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
  const [cnPagination, setCnPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasPrev: false,
    hasNext: false,
  })

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

  const loadCoinNetworks = useCallback(
    async (page = 1, search = '') => {
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
          hasPrev: (pag.page || page) > 1,
          hasNext: (pag.page || page) < (pag.totalPages || 0),
        })
      } catch (error) {
        logger.error('Failed to load coin networks:', error)
      } finally {
        setCnLoading(false)
      }
    },
    [token]
  )

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
      setDbSettings((prev) => ({ ...prev, 'withdrawal.security.max_pending_per_user': String(val) }))
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
      setDbSettings((prev) => ({ ...prev, 'withdrawal.base_fee.auto_update': String(newVal) }))
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
      setDbSettings((prev) => ({ ...prev, 'withdrawal.base_fee.buffer_multiplier': String(val) }))
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
      setDbSettings((prev) => ({ ...prev, 'withdrawal.base_fee.alert_threshold': String(val) }))
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
        toast.error(
          t('admin.withdrawal.invalidFormat', {
            defaultValue: 'Invalid number format. Use digits with optional decimal (e.g. 1.5)',
          })
        )
        return
      }
    }
    if (cnForm.dailyWithdrawLimitUsd !== '' && !usdRegex.test(cnForm.dailyWithdrawLimitUsd)) {
      toast.error(
        t('admin.withdrawal.invalidUsdFormat', {
          defaultValue: 'Invalid USD format. Max 2 decimal places (e.g. 100.50)',
        })
      )
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
      setCoinNetworks((prev) =>
        prev.map((cn) => {
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
        })
      )
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
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner role="status" className="text-primary" />
      </div>
    )
  }

  const maxPending = dbSettings['withdrawal.security.max_pending_per_user'] || '5'
  const autoUpdateOn = dbSettings['withdrawal.base_fee.auto_update'] === 'true'
  const bufferMultiplier = dbSettings['withdrawal.base_fee.buffer_multiplier'] || '1.2'
  const alertThreshold = dbSettings['withdrawal.base_fee.alert_threshold'] || '0.2'

  return (
    <div className="grow py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bx bx-transfer mr-2 text-primary"></i>
            {t('admin.withdrawalSettings.title', { defaultValue: 'Withdrawal Settings' })}
          </h4>
          <p className="text-surface-500 mb-0">
            {t('admin.withdrawalSettings.subtitle', {
              defaultValue: 'Global withdrawal policy, base fee configuration, and per-coin fee & limits',
            })}
          </p>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-12 gap-x-6 gap-3 mb-4">
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
          sub={
            autoUpdateOn
              ? t('admin.withdrawalSettings.autoUpdate', { defaultValue: 'Auto-update ON' })
              : t('admin.withdrawalSettings.autoUpdateOff', { defaultValue: 'Auto-update OFF' })
          }
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
      <div className="mb-4">
        <ul className="flex border-b border-surface-200 gap-2" role="tablist">
          {TABS.map((tab) => (
            <li key={tab.key} role="presentation">
              <button
                className={`px-4 py-2 text-base font-medium border-b-[3px] transition-colors ${
                  activeTab === tab.key
                    ? 'text-primary-600 border-primary-600 font-semibold'
                    : 'text-surface-500 border-transparent hover:text-surface-700 hover:border-surface-300'
                }`}
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

      {/* Tab Content */}
      {activeTab === 'policy' && (
        <PolicyTab
          t={t}
          autoApprove={autoApprove}
          setAutoApprove={setAutoApprove}
          maxPending={maxPending}
          onEditMaxPending={() => {
            setMaxPendingForm(maxPending)
            setShowMaxPendingModal(true)
          }}
        />
      )}

      {activeTab === 'basefee' && (
        <BaseFeeTab
          t={t}
          autoUpdateOn={autoUpdateOn}
          savingAutoUpdate={savingAutoUpdate}
          handleToggleAutoUpdate={handleToggleAutoUpdate}
          bufferMultiplier={bufferMultiplier}
          alertThreshold={alertThreshold}
          onEditBuffer={() => {
            setBufferForm(bufferMultiplier)
            setShowBufferModal(true)
          }}
          onEditAlert={() => {
            setAlertForm(alertThreshold)
            setShowAlertModal(true)
          }}
        />
      )}

      {activeTab === 'feeLimits' && (
        <FeeLimitsTab
          t={t}
          cnSearch={cnSearch}
          setCnSearch={setCnSearch}
          loadCoinNetworks={loadCoinNetworks}
          cnLoading={cnLoading}
          coinNetworks={coinNetworks}
          cnPagination={cnPagination}
          openCnEditModal={openCnEditModal}
        />
      )}

      {/* Modals */}
      {showMaxPendingModal && (
        <SettingModal
          title={t('admin.withdrawalSettings.editMaxPending', { defaultValue: 'Edit Max Pending' })}
          onClose={() => setShowMaxPendingModal(false)}
          onSave={handleSaveMaxPending}
          saving={savingMaxPending}
          t={t}
        >
          <Label>
            {t('admin.withdrawalSettings.editMaxPendingLabel', { defaultValue: 'Max pending withdrawals per user' })}
          </Label>
          <Input
            type="number"
            min="1"
            max="100"
            value={maxPendingForm}
            onChange={(e) => setMaxPendingForm(e.target.value)}
          />
          <small className="text-surface-500">
            {t('admin.withdrawalSettings.editMaxPendingHint', { defaultValue: 'Recommended: 3–10' })}
          </small>
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
          <Label>
            {t('admin.withdrawalSettings.editBufferLabel', { defaultValue: 'Buffer multiplier on gas cost' })}
          </Label>
          <Input
            type="number"
            min="1"
            max="5"
            step="0.1"
            value={bufferForm}
            onChange={(e) => setBufferForm(e.target.value)}
          />
          <small className="text-surface-500">
            {t('admin.withdrawalSettings.editBufferHint', {
              defaultValue: '1.0 = no buffer, 1.2 = 20% safety margin, 1.5 = 50% buffer',
            })}
          </small>
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
          <Label>
            {t('admin.withdrawalSettings.editAlertLabel', {
              defaultValue: 'Alert when fee changes by more than (decimal)',
            })}
          </Label>
          <Input
            type="number"
            min="0.01"
            max="1"
            step="0.01"
            value={alertForm}
            onChange={(e) => setAlertForm(e.target.value)}
          />
          <small className="text-surface-500">
            {t('admin.withdrawalSettings.editAlertHint', { defaultValue: '0.1 = 10%, 0.2 = 20%, 0.5 = 50%' })}
          </small>
        </SettingModal>
      )}

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
    <div className="col-span-12 sm:col-span-6 xl:col-span-3">
      <Card className="h-full">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-[42px] h-[42px]">
              <AvatarInitial className={bgLabelClass(color)}>
                <i className={`bx ${icon} text-xl`}></i>
              </AvatarInitial>
            </div>
            <div className="flex flex-col">
              <small className="text-surface-500 uppercase font-semibold text-[0.7rem] tracking-[0.5px]">{label}</small>
              <div className="flex items-center gap-2">
                <h5 className="mb-0 font-bold text-[1.1rem]">{value}</h5>
                {active !== undefined && (
                  <Badge color={active ? 'success' : 'secondary'} label className="text-[0.65rem]">
                    {active ? 'ACTIVE' : 'OFF'}
                  </Badge>
                )}
              </div>
              {sub && <small className="text-surface-500 text-xs">{sub}</small>}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
