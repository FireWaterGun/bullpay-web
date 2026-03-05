'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import {
  getMerchantProfile,
  rotateSecret,
  regenerateKey,
  updateWebhook,
} from '@/lib/api/merchant'
import { get2FAStatus } from '@/lib/api/twoFactor'
import { formatCommission } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { copyToClipboard } from '@/lib/utils/clipboard'
import CredentialAlert from '@/components/merchant/CredentialAlert'
import RegisterForm from '@/components/merchant/RegisterForm'
import ConfirmActionModal from '@/components/merchant/ConfirmActionModal'
import ApiCredentialsCard from '@/components/merchant/ApiCredentialsCard'
import RefreshButton from '@/components/RefreshButton'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'

const statusColors = {
  active:    { bg: 'bg-success-50', text: 'text-success-700', icon: 'bx-check-shield' },
  suspended: { bg: 'bg-danger-50',  text: 'text-danger-700',  icon: 'bx-block' },
  pending:   { bg: 'bg-warning-50', text: 'text-warning-700', icon: 'bx-time-five' },
}

function statusMeta(status, t) {
  const s = String(status || '').toLowerCase()
  if (s === 'active')    return { ...statusColors.active,    label: t('merchant.status.active',    { defaultValue: 'Active' }) }
  if (s === 'suspended') return { ...statusColors.suspended, label: t('merchant.status.suspended', { defaultValue: 'Suspended' }) }
  if (s === 'pending')   return { ...statusColors.pending,   label: t('merchant.status.pending',   { defaultValue: 'Pending' }) }
  return { bg: 'bg-surface-100', text: 'text-surface-600', icon: 'bx-help-circle', label: t('merchant.status.unknown', { defaultValue: status || 'Unknown' }) }
}

const tileColors = {
  primary: { bg: 'bg-primary-50', icon: 'text-primary-600' },
  success: { bg: 'bg-success-50', icon: 'text-success-600' },
  info:    { bg: 'bg-info-50',    icon: 'text-info-600' },
  secondary: { bg: 'bg-surface-100', icon: 'text-surface-500' },
  danger:  { bg: 'bg-danger-50',  icon: 'text-danger-600' },
  warning: { bg: 'bg-warning-50', icon: 'text-warning-600' },
}

function StatTile({ icon, label, value, color = 'primary' }) {
  const c = tileColors[color] || tileColors.primary
  return (
    <div className="flex items-center gap-3">
      <span className={`flex items-center justify-center w-10 h-10 rounded-lg ${c.bg} shrink-0`}>
        <i className={`bx ${icon} text-xl ${c.icon}`}></i>
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-surface-800 truncate mb-0">{value}</p>
        <p className="text-xs text-surface-400 mb-0">{label}</p>
      </div>
    </div>
  )
}

export default function MerchantPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const { fmtDate } = useDateFormat()

  const [loading, setLoading] = useState(true)
  const [merchant, setMerchant] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [apiSecretMasked, setApiSecretMasked] = useState('')
  const [hasMerchant, setHasMerchant] = useState(false)

  const [newCredentials, setNewCredentials] = useState(null)
  const [credentialWarning, setCredentialWarning] = useState('')

  const [editingWebhook, setEditingWebhook] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookLoading, setWebhookLoading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  const [is2FAEnabled, setIs2FAEnabled] = useState(false)

  useEffect(() => {
    loadProfile()
    load2FAStatus()
  }, [token])

  async function load2FAStatus() {
    if (!token) return
    try {
      const res = await get2FAStatus(token)
      setIs2FAEnabled(!!res?.enabled)
    } catch {
      // Non-critical — if we can't fetch status, 2FA fields won't show
      setIs2FAEnabled(false)
    }
  }

  async function loadProfile() {
    if (!token) return
    try {
      setLoading(true)
      const data = await getMerchantProfile(token)
      setMerchant(data.merchant || data)
      setApiKey(data.apiKey || '')
      setApiSecretMasked(data.apiSecretMasked || '')
      setHasMerchant(true)
    } catch (error) {
      if (error?.status === 404 || error?.status === 400) {
        setHasMerchant(false)
      } else {
        logger.error('Failed to load merchant profile:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleRegistered(result) {
    setMerchant(result.merchant || result)
    setApiKey(result.credentials?.apiKey || result.apiKey || '')
    setApiSecretMasked('')
    setHasMerchant(true)
    if (result.credentials) {
      setNewCredentials(result.credentials)
      setCredentialWarning(result.warning || '')
    }
  }

  function openModal(action) {
    setModalAction(action)
    setModalError('')
    setShowModal(true)
    load2FAStatus()
  }

  function closeModal() {
    if (modalLoading) return
    setShowModal(false)
    setModalAction('')
    setModalError('')
  }

  async function handleModalConfirm({ password, totpCode } = {}) {
    try {
      setModalLoading(true)
      setModalError('')
      if (modalAction === 'rotate-secret') {
        const result = await rotateSecret(token, { password, totpCode })
        setNewCredentials({ apiSecret: result.apiSecret })
        setCredentialWarning(result.warning || '')
        toast.success( t('merchant.rotateSuccess', { defaultValue: 'API secret rotated successfully' }))
      } else if (modalAction === 'regenerate-key') {
        const result = await regenerateKey(token, { password, totpCode })
        setNewCredentials({ apiKey: result.apiKey, apiSecret: result.apiSecret })
        setApiKey(result.apiKey || '')
        setCredentialWarning(result.warning || '')
        toast.success( t('merchant.regenerateSuccess', { defaultValue: 'API key & secret regenerated successfully' }))
      }
      closeModal()
    } catch (error) {
      const code = error?.code || error?.data?.error?.code || error?.data?.code
      const apiMsg = error?.data?.error?.message || error?.message
      const details = error?.data?.error?.details || error?.details || {}

      if (code === 'TWO_FACTOR_REQUIRED') {
        setIs2FAEnabled(true)
        setModalError(t('merchant.twoFactorRequired', { defaultValue: 'Please enter your password and 2FA code' }))
        return
      }

      if (code === 'PASSWORD_REQUIRED') {
        setModalError(t('merchant.passwordRequired', { defaultValue: 'Please enter your password' }))
        return
      }

      if (code === 'INVALID_PASSWORD') {
        setModalError(t('merchant.invalidPassword', { defaultValue: 'Invalid password' }))
        return
      }

      if (code === 'INVALID_2FA_CODE') {
        const retryAfter = details?.retryAfterSeconds
        const remaining = details?.remainingAttempts
        if (retryAfter) {
          setModalError(t('merchant.tooManyAttempts', { defaultValue: 'Too many attempts. Try again in {{seconds}} seconds', seconds: retryAfter }))
        } else if (remaining !== undefined) {
          setModalError(t('merchant.invalidCodeRemaining', { defaultValue: 'Invalid code. {{count}} attempts remaining', count: remaining }))
        } else {
          setModalError(t('merchant.invalid2FACode', { defaultValue: 'Invalid 2FA code' }))
        }
        return
      }

      setModalError(apiMsg || t('merchant.actionError', { defaultValue: 'Action failed. Please try again.' }))
    } finally {
      setModalLoading(false)
    }
  }

  const [webhookTotpCode, setWebhookTotpCode] = useState('')
  const [webhookPassword, setWebhookPassword] = useState('')
  const [webhookShowPassword, setWebhookShowPassword] = useState(false)
  const [webhookError, setWebhookError] = useState('')

  async function handleWebhookSave() {
    if (!webhookUrl) {
      toast.error( t('merchant.webhookRequired', { defaultValue: 'Webhook URL is required' }))
      return
    }
    if (!webhookPassword.trim()) {
      setWebhookError(t('merchant.passwordRequired', { defaultValue: 'Please enter your password' }))
      return
    }
    if (is2FAEnabled && !webhookTotpCode.trim()) {
      setWebhookError(t('merchant.totpRequiredForWebhook', { defaultValue: 'Please enter your 2FA code' }))
      return
    }
    try {
      setWebhookLoading(true)
      setWebhookError('')
      await updateWebhook(token, webhookUrl, {
        password: webhookPassword.trim(),
        ...(is2FAEnabled && webhookTotpCode.trim() && { totpCode: webhookTotpCode.trim() }),
      })
      toast.success(t('merchant.webhookSuccess', { defaultValue: 'Webhook URL updated successfully' }))
      setEditingWebhook(false)
      setWebhookTotpCode('')
      setWebhookPassword('')
      setWebhookError('')
      loadProfile()
    } catch (error) {
      const code = error?.code || error?.data?.error?.code || error?.data?.code
      const apiMsg = error?.data?.error?.message || error?.message
      const details = error?.data?.error?.details || error?.details || {}

      if (code === 'TWO_FACTOR_REQUIRED') {
        setIs2FAEnabled(true)
        setWebhookError(t('merchant.twoFactorRequired', { defaultValue: 'Please enter your password and 2FA code' }))
        return
      }

      if (code === 'PASSWORD_REQUIRED') {
        setWebhookError(t('merchant.passwordRequired', { defaultValue: 'Please enter your password' }))
        return
      }

      if (code === 'INVALID_PASSWORD') {
        setWebhookError(t('merchant.invalidPassword', { defaultValue: 'Invalid password' }))
        return
      }

      if (code === 'INVALID_2FA_CODE') {
        const retryAfter = details?.retryAfterSeconds
        const remaining = details?.remainingAttempts
        if (retryAfter) {
          setWebhookError(t('merchant.tooManyAttempts', { defaultValue: 'Too many attempts. Try again in {{seconds}} seconds', seconds: retryAfter }))
        } else if (remaining !== undefined) {
          setWebhookError(t('merchant.invalidCodeRemaining', { defaultValue: 'Invalid code. {{count}} attempts remaining', count: remaining }))
        } else {
          setWebhookError(t('merchant.invalid2FACode', { defaultValue: 'Invalid 2FA code' }))
        }
        return
      }

      setWebhookError(apiMsg || t('merchant.webhookError', { defaultValue: 'Failed to update webhook URL' }))
    } finally {
      setWebhookLoading(false)
    }
  }

  if (loading && !merchant) {
    return <PageSpinner />
  }

  if (!hasMerchant) {
    return <RegisterForm onRegistered={handleRegistered} token={token} t={t} />
  }

  const status = String(merchant?.status || '').toLowerCase()
  const sMeta = statusMeta(merchant?.status, t)

  return (
    <>
      {/* New Credential Alert */}
      {newCredentials && (
        <CredentialAlert
          credentials={newCredentials}
          warning={credentialWarning || t('merchant.credentialWarning', { defaultValue: 'Store your credentials securely. They will NOT be shown again.' })}
          onDismiss={() => { setNewCredentials(null); loadProfile() }}
          t={t}
        />
      )}

      {/* §1 PROFILE HERO */}
      <div className="bg-white rounded-xl shadow-sm border border-surface-100 mb-5 overflow-hidden">
        <div className="p-5 pb-4">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Avatar */}
            <div className="flex items-center justify-center w-20 h-20 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 shrink-0">
              <i className="bx bx-store text-[2.5rem] text-primary-600"></i>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="text-lg font-semibold text-surface-900 truncate mb-0">{merchant?.name || '-'}</h4>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md ${sMeta.bg} ${sMeta.text}`}>
                  <i className={`bx ${sMeta.icon}`}></i>
                  {sMeta.label.toUpperCase()}
                </span>
                <div className="ml-auto">
                  <RefreshButton onClick={loadProfile} loading={loading} title={t('actions.refresh', { defaultValue: 'Refresh' })} />
                </div>
              </div>
              {merchant?.description && (
                <p className="text-sm text-surface-500 mb-2 pr-4">{merchant.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-surface-400">
                {merchant?.email && (
                  <span className="flex items-center gap-1"><i className="bx bx-envelope"></i>{merchant.email}</span>
                )}
                {merchant?.websiteUrl && (
                  <a href={merchant.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-surface-400 hover:text-primary-600 no-underline transition-colors">
                    <i className="bx bx-globe"></i>{merchant.websiteUrl}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <i className="bx bx-calendar"></i>
                  {t('merchant.createdAt', { defaultValue: 'Registered' })}: {fmtDate(merchant?.createdAt)}
                </span>
              </div>

              {status === 'pending' && (
                <div className="flex items-center gap-2 mt-3 p-2.5 bg-warning-50 border border-warning-200 rounded-lg text-sm text-warning-700">
                  <i className="bx bx-time-five"></i>
                  {t('merchant.pendingNotice', { defaultValue: 'Your merchant account is pending approval.' })}
                </div>
              )}
              {status === 'suspended' && (
                <div className="flex items-center gap-2 mt-3 p-2.5 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700">
                  <i className="bx bx-block"></i>
                  {t('merchant.suspendedNotice', { defaultValue: 'Your merchant account is suspended.' })}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Stats strip */}
        <div className="border-t border-surface-100 px-5 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile icon={sMeta.icon} label={t('common.status', { defaultValue: 'Status' })} value={sMeta.label} color={status === 'active' ? 'success' : status === 'suspended' ? 'danger' : 'warning'} />
            <StatTile icon="bx-trending-up" label={t('merchant.commissionRate', { defaultValue: 'Commission' })} value={merchant?.commissionRate ? formatCommission(merchant.commissionRate) : '-'} color="primary" />
            <StatTile icon="bx-calendar-check" label={t('merchant.since', { defaultValue: 'Since' })} value={fmtDate(merchant?.createdAt)} color="info" />
            <StatTile icon="bx-broadcast" label={t('merchant.webhookTitle', { defaultValue: 'Webhook' })} value={merchant?.hasWebhook ? t('merchant.configured', { defaultValue: 'Configured' }) : t('merchant.notConfigured', { defaultValue: 'Not Configured' })} color={merchant?.hasWebhook ? 'success' : 'secondary'} />
          </div>
        </div>
      </div>

      {/* §2 MAIN CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left Column (2/3) */}
        <div className="xl:col-span-2 space-y-5">
          {/* API Credentials */}
          <ApiCredentialsCard
            apiKey={apiKey}
            apiSecretMasked={apiSecretMasked}
            onRotate={() => openModal('rotate-secret')}
            onRegenerate={() => openModal('regenerate-key')}
            toast={toast}
            t={t}
          />

          {/* Webhook Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-surface-100">
            <div className="flex justify-between items-center px-5 py-4 border-b border-surface-100">
              <h6 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-0">
                <i className="bx bx-broadcast text-primary-600"></i>
                {t('merchant.webhookTitle', { defaultValue: 'Webhook Configuration' })}
              </h6>
              {merchant?.hasWebhook ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-success-50 text-success-700 rounded-md">
                  <i className="bx bx-check-circle"></i>{t('merchant.configured', { defaultValue: 'Configured' })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-surface-100 text-surface-500 rounded-md">
                  <i className="bx bx-minus-circle"></i>{t('merchant.notConfigured', { defaultValue: 'Not Configured' })}
                </span>
              )}
            </div>
            <div className="p-5">
              <p className="text-sm text-surface-500 mb-3 flex items-center gap-1">
                <i className="bx bx-info-circle"></i>
                {t('merchant.webhookDesc', { defaultValue: 'Set a callback URL to receive real-time payment notifications via webhook.' })}
              </p>

              {editingWebhook ? (
                <>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">{t('merchant.callbackUrl', { defaultValue: 'Callback URL' })}</label>
                  <div className="flex mb-3">
                    <span className="inline-flex items-center px-3 bg-surface-50 border border-r-0 border-surface-200 rounded-l-lg text-surface-400">
                      <i className="bx bx-link"></i>
                    </span>
                    <input
                      type="url"
                      className="flex-1 px-3 py-2 text-sm border border-surface-200 rounded-r-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://example.com/webhooks/payment"
                      autoFocus
                    />
                  </div>
                  {/* Password */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-surface-700 mb-1" htmlFor="webhook-password">
                      <i className="bx bx-lock-alt mr-1"></i>
                      {t('merchant.enterPassword', { defaultValue: 'Password' })}
                    </label>
                    <div className="flex">
                      <input
                        id="webhook-password"
                        type={webhookShowPassword ? 'text' : 'password'}
                        className="flex-1 px-3 py-2 text-sm border border-r-0 border-surface-200 rounded-l-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        value={webhookPassword}
                        onChange={(e) => setWebhookPassword(e.target.value)}
                        placeholder={t('merchant.passwordPlaceholder', { defaultValue: 'Enter your current password' })}
                        disabled={webhookLoading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="inline-flex items-center px-3 bg-surface-50 border border-l-0 border-surface-200 rounded-r-lg text-surface-500 hover:text-surface-700 cursor-pointer"
                        onClick={() => setWebhookShowPassword(!webhookShowPassword)}
                        tabIndex={-1}
                      >
                        <i className={`bx ${webhookShowPassword ?'bx-hide' : 'bx-show'}`}></i>
                      </button>
                    </div>
                  </div>
                  {is2FAEnabled && (
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-surface-700 mb-1" htmlFor="webhook-totp">
                        <i className="bx bx-shield mr-1"></i>
                        {t('merchant.enter2FACode', { defaultValue: '2FA Code' })}
                      </label>
                      <input
                        id="webhook-totp"
                        type="text"
                        className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        value={webhookTotpCode}
                        onChange={(e) => setWebhookTotpCode(e.target.value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 9))}
                        placeholder={t('merchant.totpPlaceholder', { defaultValue: '6-digit code or backup code' })}
                        disabled={webhookLoading}
                        maxLength={9}
                        autoComplete="one-time-code"
                      />
                      <p className="text-xs text-surface-400 mt-1">{t('merchant.totpHint', { defaultValue: 'Enter the code from your authenticator app or a backup code.' })}</p>
                    </div>
                  )}
                  {webhookError && (
                    <div className="flex items-center gap-2 p-2.5 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 mb-3">
                      <i className="bx bx-error-circle"></i>{webhookError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 cursor-pointer"
                      onClick={handleWebhookSave}
                      disabled={webhookLoading}
                    >
                      {webhookLoading ? (
                        <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>{t('merchant.saving', { defaultValue: 'Saving...' })}</>
                      ) : (
                        <><i className="bx bx-check"></i>{t('merchant.save', { defaultValue: 'Save' })}</>
                      )}
                    </button>
                    <button
                      className="inline-flex items-center px-3 py-1.5 text-sm border border-surface-200 text-surface-600 rounded-lg hover:bg-surface-50 transition-colors disabled:opacity-50 cursor-pointer"
                      onClick={() => { setEditingWebhook(false); setWebhookTotpCode(''); setWebhookPassword(''); setWebhookError('') }}
                      disabled={webhookLoading}
                    >
                      {t('actions.cancel', { defaultValue: 'Cancel' })}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {merchant?.webhookUrl && (
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-surface-700 mb-1">{t('merchant.callbackUrl', { defaultValue: 'Callback URL' })}</label>
                      <div className="flex items-center gap-2 p-2.5 bg-surface-50 rounded-lg">
                        <span className="font-mono text-sm text-surface-700 break-all flex-1">{merchant.webhookUrl}</span>
                        <button
                          className="inline-flex items-center justify-center w-7 h-7 rounded text-surface-400 hover:bg-surface-200 hover:text-surface-600 transition-colors shrink-0 cursor-pointer"
                          onClick={async () => {
                            const ok = await copyToClipboard(merchant.webhookUrl)
                            if (ok) toast.success(t('merchant.copied', { defaultValue: 'Copied!' }))
                          }}
                          title={t('actions.copy', { defaultValue: 'Copy' })}
                        >
                          <i className="bx bx-copy text-sm"></i>
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer"
                    onClick={() => { setWebhookUrl(merchant?.webhookUrl || ''); setEditingWebhook(true); load2FAStatus() }}
                  >
                    <i className="bx bx-edit"></i>
                    {merchant?.hasWebhook
                      ? t('merchant.updateWebhook', { defaultValue: 'Update Webhook' })
                      : t('merchant.setWebhook', { defaultValue: 'Set Webhook URL' })
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-5">
          {/* Quick Start Guide */}
          <div className="bg-white rounded-xl shadow-sm border border-surface-100">
            <div className="px-5 py-4 border-b border-surface-100">
              <h6 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-0">
                <i className="bx bx-rocket text-primary-600"></i>
                {t('merchant.quickStart', { defaultValue: 'Quick Start' })}
              </h6>
            </div>
            <div className="p-5 pt-3">
              {[
                { step: 1, icon: 'bx-key', text: t('merchant.step1', { defaultValue: 'Get your API Key & Secret' }), done: !!apiKey },
                { step: 2, icon: 'bx-broadcast', text: t('merchant.step2', { defaultValue: 'Configure webhook URL' }), done: !!merchant?.hasWebhook },
                { step: 3, icon: 'bx-receipt', text: t('merchant.step3', { defaultValue: 'Create your first invoice' }), done: false },
                { step: 4, icon: 'bx-wallet', text: t('merchant.step4', { defaultValue: 'Accept crypto payments' }), done: false },
              ].map(({ step, icon, text, done }) => (
                <div key={step} className={`flex items-center gap-3 py-2.5 ${step < 4 ?'border-b border-surface-50' : ''}`}>
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0 ${done ?'bg-success-50 text-success-600' : 'bg-surface-100 text-surface-500'}`}>
                    {done ? <i className="bx bx-check text-base"></i> : step}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <i className={`bx ${icon} ${done ?'text-success-600' : 'text-surface-400'}`}></i>
                    <span className={`text-sm ${done ?'text-surface-800' : 'text-surface-500'}`}>{text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Tips */}
          <div className="bg-white rounded-xl shadow-sm border border-surface-100">
            <div className="px-5 py-4 border-b border-surface-100">
              <h6 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-0">
                <i className="bx bx-shield text-primary-600"></i>
                {t('merchant.securityTips', { defaultValue: 'Security Best Practices' })}
              </h6>
            </div>
            <div className="p-5 pt-3">
              {[
                { icon: 'bx-lock-alt', color: 'danger', text: t('merchant.tip1', { defaultValue: 'Never share your API Secret publicly' }) },
                { icon: 'bx-refresh', color: 'warning', text: t('merchant.tip2', { defaultValue: 'Rotate your secret periodically' }) },
                { icon: 'bx-link', color: 'success', text: t('merchant.tip3', { defaultValue: 'Use HTTPS for all webhook URLs' }) },
                { icon: 'bx-error', color: 'info', text: t('merchant.tip4', { defaultValue: 'Regenerating key invalidates all credentials' }) },
              ].map(({ icon, color, text }, i) => {
                const c = tileColors[color] || tileColors.primary
                return (
                  <div key={i} className={`flex items-start gap-3 py-2.5 ${i < 3 ?'border-b border-surface-50' : ''}`}>
                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${c.bg} shrink-0`}>
                      <i className={`bx ${icon} text-sm ${c.icon}`}></i>
                    </span>
                    <span className="text-sm text-surface-500 pt-0.5">{text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showModal && (
        <ConfirmActionModal
          action={modalAction}
          loading={modalLoading}
          is2FAEnabled={is2FAEnabled}
          onConfirm={handleModalConfirm}
          onClose={closeModal}
          error={modalError}
          t={t}
        />
      )}
    </>
  )
}
