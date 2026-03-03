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
import { formatCommission, formatDate } from '@/lib/utils/format'
import { copyToClipboard } from '@/lib/utils/clipboard'
import CredentialAlert from '@/components/merchant/CredentialAlert'
import RegisterForm from '@/components/merchant/RegisterForm'
import ConfirmActionModal from '@/components/merchant/ConfirmActionModal'
import ApiCredentialsCard from '@/components/merchant/ApiCredentialsCard'
import RefreshButton from '@/components/RefreshButton'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'active') return 'badge bg-label-success'
  if (s === 'suspended') return 'badge bg-label-danger'
  if (s === 'pending') return 'badge bg-label-warning'
  return 'badge bg-label-secondary'
}

function statusMeta(status, t) {
  const s = String(status || '').toLowerCase()
  if (s === 'active') return { icon: 'bx-check-shield', color: 'success', label: t('merchant.status.active', { defaultValue: 'Active' }) }
  if (s === 'suspended') return { icon: 'bx-block', color: 'danger', label: t('merchant.status.suspended', { defaultValue: 'Suspended' }) }
  if (s === 'pending') return { icon: 'bx-time-five', color: 'warning', label: t('merchant.status.pending', { defaultValue: 'Pending' }) }
  return { icon: 'bx-help-circle', color: 'secondary', label: t('merchant.status.unknown', { defaultValue: status || 'Unknown' }) }
}

function StatTile({ icon, label, value, color = 'primary' }) {
  return (
    <div className="col-6 col-sm-3">
      <div className="d-flex align-items-center gap-3">
        <span
          className={`d-inline-flex align-items-center justify-content-center rounded-2 bg-label-${color} flex-shrink-0`}
          style={{ width: 40, height: 40 }}
        >
          <i className={`bx ${icon}`} style={{ fontSize: '1.25rem' }}></i>
        </span>
        <div className="min-w-0">
          <div className="fw-semibold text-truncate" style={{ fontSize: '0.9rem' }}>{value}</div>
          <small className="text-muted">{label}</small>
        </div>
      </div>
    </div>
  )
}

export default function MerchantPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()

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
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <RegisterForm onRegistered={handleRegistered} token={token} t={t} />
      </div>
    )
  }

  const status = String(merchant?.status || '').toLowerCase()
  const sMeta = statusMeta(merchant?.status, t)

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* New Credential Alert */}
      {newCredentials && (
        <CredentialAlert
          credentials={newCredentials}
          warning={credentialWarning || t('merchant.credentialWarning', { defaultValue: 'Store your credentials securely. They will NOT be shown again.' })}
          onDismiss={() => { setNewCredentials(null); loadProfile() }}
          t={t}
        />
      )}

      {/* ══════════════════════════════════════════════════════════
          §1  PROFILE HERO CARD
          ══════════════════════════════════════════════════════════ */}
      <div className="card mb-4 overflow-hidden">
        {/* Gradient accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--bs-primary) 0%, #a855f7 50%, #06b6d4 100%)' }} />

        <div className="card-body p-4 pb-3">
          <div className="d-flex flex-column flex-sm-row align-items-start gap-4">
            {/* Avatar */}
            <div
              className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
              style={{ width: 80, height: 80, background: 'linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.16) 0%, rgba(var(--bs-primary-rgb), 0.04) 100%)' }}
            >
              <i className="bx bx-store" style={{ fontSize: '2.5rem', color: 'var(--bs-primary)' }}></i>
            </div>

            {/* Info */}
            <div className="flex-grow-1 min-w-0">
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <h4 className="mb-0 text-truncate">{merchant?.name || '-'}</h4>
                <span className={statusBadgeClass(merchant?.status)} style={{ fontSize: '0.7rem', padding: '0.3em 0.7em' }}>
                  <i className={`bx ${sMeta.icon} me-1`}></i>
                  {sMeta.label.toUpperCase()}
                </span>
                <div className="ms-auto">
                  <RefreshButton onClick={loadProfile} loading={loading} title={t('actions.refresh', { defaultValue: 'Refresh' })} />
                </div>
              </div>

              {merchant?.description && (
                <p className="text-muted small mb-2 pe-4">{merchant.description}</p>
              )}

              <div className="d-flex flex-wrap gap-3 text-muted small">
                {merchant?.email && (
                  <span><i className="bx bx-envelope me-1"></i>{merchant.email}</span>
                )}
                {merchant?.websiteUrl && (
                  <a href={merchant.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-muted text-decoration-none">
                    <i className="bx bx-globe me-1"></i>{merchant.websiteUrl}
                  </a>
                )}
                <span>
                  <i className="bx bx-calendar me-1"></i>
                  {t('merchant.createdAt', { defaultValue: 'Registered' })}: {formatDate(merchant?.createdAt)}
                </span>
              </div>

              {/* Status alerts */}
              {status === 'pending' && (
                <div className="alert alert-warning py-2 mt-3 mb-0 small" role="alert">
                  <i className="bx bx-time-five me-1"></i>
                  {t('merchant.pendingNotice', { defaultValue: 'Your merchant account is pending approval.' })}
                </div>
              )}
              {status === 'suspended' && (
                <div className="alert alert-danger py-2 mt-3 mb-0 small" role="alert">
                  <i className="bx bx-block me-1"></i>
                  {t('merchant.suspendedNotice', { defaultValue: 'Your merchant account is suspended.' })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="card-footer bg-transparent border-top py-3 px-4">
          <div className="row g-3">
            <StatTile
              icon={sMeta.icon}
              label={t('common.status', { defaultValue: 'Status' })}
              value={sMeta.label}
              color={sMeta.color}
            />
            <StatTile
              icon="bx-trending-up"
              label={t('merchant.commissionRate', { defaultValue: 'Commission' })}
              value={merchant?.commissionRate ? formatCommission(merchant.commissionRate) : '-'}
              color="primary"
            />
            <StatTile
              icon="bx-calendar-check"
              label={t('merchant.since', { defaultValue: 'Since' })}
              value={formatDate(merchant?.createdAt)}
              color="info"
            />
            <StatTile
              icon="bx-broadcast"
              label={t('merchant.webhookTitle', { defaultValue: 'Webhook' })}
              value={merchant?.hasWebhook
                ? t('merchant.configured', { defaultValue: 'Configured' })
                : t('merchant.notConfigured', { defaultValue: 'Not Configured' })}
              color={merchant?.hasWebhook ? 'success' : 'secondary'}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          §2  MAIN CONTENT
          ══════════════════════════════════════════════════════════ */}
      <div className="row">
        {/* ── Left Column ── */}
        <div className="col-xl-8 col-lg-7">
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
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="bx bx-broadcast me-2 text-primary" style={{ fontSize: '1.1rem' }}></i>
                {t('merchant.webhookTitle', { defaultValue: 'Webhook Configuration' })}
              </h6>
              {merchant?.hasWebhook ? (
                <span className="badge bg-label-success"><i className="bx bx-check-circle me-1"></i>{t('merchant.configured', { defaultValue: 'Configured' })}</span>
              ) : (
                <span className="badge bg-label-secondary"><i className="bx bx-minus-circle me-1"></i>{t('merchant.notConfigured', { defaultValue: 'Not Configured' })}</span>
              )}
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">
                <i className="bx bx-info-circle me-1"></i>
                {t('merchant.webhookDesc', { defaultValue: 'Set a callback URL to receive real-time payment notifications via webhook.' })}
              </p>

              {editingWebhook ? (
                <>
                  <label className="form-label fw-semibold small">{t('merchant.callbackUrl', { defaultValue: 'Callback URL' })}</label>
                  <div className="input-group mb-3">
                    <span className="input-group-text"><i className="bx bx-link"></i></span>
                    <input
                      type="url"
                      className="form-control"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://example.com/webhooks/payment"
                      autoFocus
                    />
                  </div>
                  {/* 2FA code for webhook update (Level 2 — password + TOTP) */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small" htmlFor="webhook-password">
                      <i className="bx bx-lock-alt me-1"></i>
                      {t('merchant.enterPassword', { defaultValue: 'Password' })}
                    </label>
                    <div className="input-group">
                      <input
                        id="webhook-password"
                        type={webhookShowPassword ? 'text' : 'password'}
                        className="form-control"
                        value={webhookPassword}
                        onChange={(e) => setWebhookPassword(e.target.value)}
                        placeholder={t('merchant.passwordPlaceholder', { defaultValue: 'Enter your current password' })}
                        disabled={webhookLoading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setWebhookShowPassword(!webhookShowPassword)}
                        tabIndex={-1}
                      >
                        <i className={`bx ${webhookShowPassword ? 'bx-hide' : 'bx-show'}`}></i>
                      </button>
                    </div>
                  </div>
                  {is2FAEnabled && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold small" htmlFor="webhook-totp">
                        <i className="bx bx-shield me-1"></i>
                        {t('merchant.enter2FACode', { defaultValue: '2FA Code' })}
                      </label>
                      <input
                        id="webhook-totp"
                        type="text"
                        className="form-control"
                        value={webhookTotpCode}
<<<<<<< HEAD
                        onChange={(e) => setWebhookTotpCode(e.target.value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 20))}
                        placeholder={t('merchant.totpPlaceholder', { defaultValue: 'Enter 6-digit code or backup code' })}
                        disabled={webhookLoading}
                        maxLength={20}
=======
                        onChange={(e) => setWebhookTotpCode(e.target.value.replace(/[^0-9A-Za-z\-]/g, '').slice(0, 9))}
                        placeholder={t('merchant.totpPlaceholder', { defaultValue: '6-digit code or backup code' })}
                        disabled={webhookLoading}
                        maxLength={9}
>>>>>>> 82707a8c4d1cd4c4e1e65437bcac8d4a00e8c428
                        autoComplete="one-time-code"
                      />
                      <div className="form-text">
                        {t('merchant.totpHint', { defaultValue: 'Enter the code from your authenticator app or a backup code.' })}
                      </div>
                    </div>
                  )}
                  {/* Webhook error */}
                  {webhookError && (
                    <div className="alert alert-danger py-2 mb-3 small" role="alert">
                      <i className="bx bx-error-circle me-1"></i>
                      {webhookError}
                    </div>
                  )}
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={handleWebhookSave} disabled={webhookLoading}>
                      {webhookLoading ? (
                        <><span className="spinner-border spinner-border-sm me-1"></span>{t('merchant.saving', { defaultValue: 'Saving...' })}</>
                      ) : (
                        <><i className="bx bx-check me-1"></i>{t('merchant.save', { defaultValue: 'Save' })}</>
                      )}
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => { setEditingWebhook(false); setWebhookTotpCode(''); setWebhookPassword(''); setWebhookError('') }} disabled={webhookLoading}>
                      {t('actions.cancel', { defaultValue: 'Cancel' })}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {merchant?.webhookUrl && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold small mb-1">{t('merchant.callbackUrl', { defaultValue: 'Callback URL' })}</label>
                      <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: 'var(--bs-gray-100)' }}>
                        <span className="font-monospace text-break flex-grow-1" style={{ fontSize: '0.85rem' }}>{merchant.webhookUrl}</span>
                        <button
                          className="btn btn-sm btn-icon btn-text-secondary flex-shrink-0"
                          onClick={async () => {
                            const ok = await copyToClipboard(merchant.webhookUrl)
                            if (ok) toast.success(t('merchant.copied', { defaultValue: 'Copied!' }))
                          }}
                          title={t('actions.copy', { defaultValue: 'Copy' })}
                        >
                          <i className="bx bx-copy"></i>
                        </button>
                      </div>
                    </div>
                  )}
                  <button className="btn btn-outline-primary btn-sm" onClick={() => { setWebhookUrl(merchant?.webhookUrl || ''); setEditingWebhook(true); load2FAStatus() }}>
                    <i className="bx bx-edit me-1"></i>
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

        {/* ── Right Column ── */}
        <div className="col-xl-4 col-lg-5">
          {/* Quick Start Guide */}
          <div className="card mb-4">
            <div className="card-header pb-2">
              <h6 className="mb-0">
                <i className="bx bx-rocket me-2 text-primary" style={{ fontSize: '1.1rem' }}></i>
                {t('merchant.quickStart', { defaultValue: 'Quick Start' })}
              </h6>
            </div>
            <div className="card-body pt-1">
              {[
                { step: 1, icon: 'bx-key', text: t('merchant.step1', { defaultValue: 'Get your API Key & Secret' }), done: !!apiKey },
                { step: 2, icon: 'bx-broadcast', text: t('merchant.step2', { defaultValue: 'Configure webhook URL' }), done: !!merchant?.hasWebhook },
                { step: 3, icon: 'bx-receipt', text: t('merchant.step3', { defaultValue: 'Create your first invoice' }), done: false },
                { step: 4, icon: 'bx-wallet', text: t('merchant.step4', { defaultValue: 'Accept crypto payments' }), done: false },
              ].map(({ step, icon, text, done }) => (
                <div key={step} className={`d-flex align-items-center gap-3 py-2 ${step < 4 ? 'border-bottom' : ''}`}>
                  <span
                    className={`d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ${done ? 'bg-label-success' : 'bg-label-secondary'}`}
                    style={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    {done ? <i className="bx bx-check" style={{ fontSize: '1rem' }}></i> : step}
                  </span>
                  <div className="d-flex align-items-center gap-2 min-w-0">
                    <i className={`bx ${icon} ${done ? 'text-success' : 'text-muted'}`} style={{ fontSize: '1.1rem' }}></i>
                    <span className={`small ${done ? '' : 'text-muted'}`}>{text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Tips */}
          <div className="card mb-4">
            <div className="card-header pb-2">
              <h6 className="mb-0">
                <i className="bx bx-shield me-2 text-primary" style={{ fontSize: '1.1rem' }}></i>
                {t('merchant.securityTips', { defaultValue: 'Security Best Practices' })}
              </h6>
            </div>
            <div className="card-body pt-1">
              {[
                { icon: 'bx-lock-alt', color: 'danger', text: t('merchant.tip1', { defaultValue: 'Never share your API Secret publicly' }) },
                { icon: 'bx-refresh', color: 'warning', text: t('merchant.tip2', { defaultValue: 'Rotate your secret periodically' }) },
                { icon: 'bx-link', color: 'success', text: t('merchant.tip3', { defaultValue: 'Use HTTPS for all webhook URLs' }) },
                { icon: 'bx-error', color: 'info', text: t('merchant.tip4', { defaultValue: 'Regenerating key invalidates all credentials' }) },
              ].map(({ icon, color, text }, i) => (
                <div key={i} className={`d-flex align-items-start gap-3 py-2 ${i < 3 ? 'border-bottom' : ''}`}>
                  <span
                    className={`d-inline-flex align-items-center justify-content-center rounded-2 bg-label-${color} flex-shrink-0`}
                    style={{ width: 30, height: 30 }}
                  >
                    <i className={`bx ${icon}`} style={{ fontSize: '0.95rem' }}></i>
                  </span>
                  <span className="small text-muted pt-1">{text}</span>
                </div>
              ))}
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
    </div>
  )
}
