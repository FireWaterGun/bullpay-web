import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useToastContext } from '../../context/ToastContext'
import {
  getMerchantProfile,
  rotateSecret,
  regenerateKey,
  updateWebhook,
} from '../../api/merchant.ts'
import { formatCommission, formatDate } from '../../utils/format'
import CredentialAlert from './CredentialAlert'
import RegisterForm from './RegisterForm'
import ConfirmActionModal from './ConfirmActionModal'
import ApiCredentialsCard from './ApiCredentialsCard'

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'active') return 'badge bg-label-success'
  if (s === 'suspended') return 'badge bg-label-danger'
  if (s === 'pending') return 'badge bg-label-warning'
  return 'badge bg-label-secondary'
}

// ── Main Merchant Settings Page ──
export default function MerchantSettings() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()

  const [loading, setLoading] = useState(true)
  const [merchant, setMerchant] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [apiSecretMasked, setApiSecretMasked] = useState('')
  const [hasMerchant, setHasMerchant] = useState(false)

  // One-time credential display
  const [newCredentials, setNewCredentials] = useState(null)
  const [credentialWarning, setCredentialWarning] = useState('')

  // Webhook edit
  const [editingWebhook, setEditingWebhook] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookLoading, setWebhookLoading] = useState(false)

  // Confirm modal
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState('')
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

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
        console.error('Failed to load merchant profile:', error)
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
    setShowModal(true)
  }

  function closeModal() {
    if (modalLoading) return
    setShowModal(false)
    setModalAction('')
  }

  async function handleModalConfirm() {
    try {
      setModalLoading(true)
      if (modalAction === 'rotate-secret') {
        const result = await rotateSecret(token)
        setNewCredentials({ apiSecret: result.apiSecret })
        setCredentialWarning(result.warning || '')
        toast.success(t('merchant.rotateSuccess', { defaultValue: 'API secret rotated successfully' }))
      } else if (modalAction === 'regenerate-key') {
        const result = await regenerateKey(token)
        setNewCredentials({ apiKey: result.apiKey, apiSecret: result.apiSecret })
        setApiKey(result.apiKey || '')
        setCredentialWarning(result.warning || '')
        toast.success(t('merchant.regenerateSuccess', { defaultValue: 'API key & secret regenerated successfully' }))
      }
      closeModal()
    } catch (error) {
      toast.error(error?.message || t('merchant.actionError', { defaultValue: 'Action failed. Please try again.' }))
    } finally {
      setModalLoading(false)
    }
  }

  async function handleWebhookSave() {
    if (!webhookUrl) {
      toast.error(t('merchant.webhookRequired', { defaultValue: 'Webhook URL is required' }))
      return
    }
    try {
      setWebhookLoading(true)
      await updateWebhook(token, webhookUrl)
      toast.success(t('merchant.webhookSuccess', { defaultValue: 'Webhook URL updated successfully' }))
      setEditingWebhook(false)
      loadProfile()
    } catch (error) {
      toast.error(error?.message || t('merchant.webhookError', { defaultValue: 'Failed to update webhook URL' }))
    } finally {
      setWebhookLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // Not registered — show registration form
  if (!hasMerchant) {
    return <RegisterForm onRegistered={handleRegistered} token={token} t={t} />
  }

  // Registered — show merchant dashboard
  const status = String(merchant?.status || '').toLowerCase()

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

      <div className="row">
        {/* ─── Left Column: Profile ─── */}
        <div className="col-xl-4 col-lg-5 mb-4">
          <div className="card h-100">
            <div className="card-body text-center pt-4">
              <div className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center bg-label-primary" style={{ width: 72, height: 72 }}>
                <i className="bx bx-store fs-1 text-primary"></i>
              </div>
              <h5 className="mb-1">{merchant?.name || '-'}</h5>
              <span className={statusBadgeClass(merchant?.status)}>
                {String(merchant?.status || '').toUpperCase()}
              </span>

              {status === 'pending' && (
                <div className="alert alert-warning py-2 mt-3 mb-0 text-start small" role="alert">
                  <i className="bx bx-time-five me-1"></i>
                  {t('merchant.pendingNotice', { defaultValue: 'Your merchant account is pending approval.' })}
                </div>
              )}
              {status === 'suspended' && (
                <div className="alert alert-danger py-2 mt-3 mb-0 text-start small" role="alert">
                  <i className="bx bx-block me-1"></i>
                  {t('merchant.suspendedNotice', { defaultValue: 'Your merchant account is suspended.' })}
                </div>
              )}
            </div>
            <hr className="my-0" />
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="d-flex align-items-center mb-3">
                  <i className="bx bx-envelope text-muted me-2"></i>
                  <span className="fw-medium me-1">{t('merchant.email', { defaultValue: 'Email' })}:</span>
                  <span>{merchant?.email || '-'}</span>
                </li>
                <li className="d-flex align-items-center mb-3">
                  <i className="bx bx-globe text-muted me-2"></i>
                  <span className="fw-medium me-1">{t('merchant.websiteUrl', { defaultValue: 'Website' })}:</span>
                  {merchant?.websiteUrl ? (
                    <a href={merchant.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-truncate">{merchant.websiteUrl}</a>
                  ) : <span>-</span>}
                </li>
                <li className="d-flex align-items-center mb-3">
                  <i className="bx bx-trending-up text-muted me-2"></i>
                  <span className="fw-medium me-1">{t('merchant.commissionRate', { defaultValue: 'Commission' })}:</span>
                  <span>{merchant?.commissionRate ? formatCommission(merchant.commissionRate) : '-'}</span>
                </li>
                <li className="d-flex align-items-center mb-3">
                  <i className="bx bx-calendar text-muted me-2"></i>
                  <span className="fw-medium me-1">{t('merchant.createdAt', { defaultValue: 'Registered' })}:</span>
                  <span>{formatDate(merchant?.createdAt)}</span>
                </li>
                {merchant?.description && (
                  <li className="d-flex align-items-start">
                    <i className="bx bx-detail text-muted me-2 mt-1"></i>
                    <div>
                      <span className="fw-medium">{t('merchant.description', { defaultValue: 'Description' })}:</span>
                      <p className="mb-0 small text-muted">{merchant.description}</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Credentials + Webhook + Actions ─── */}
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

          {/* Webhook */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">{t('merchant.webhookTitle', { defaultValue: 'Webhook' })}</h6>
              {merchant?.hasWebhook ? (
                <span className="badge bg-label-success">{t('merchant.configured', { defaultValue: 'Configured' })}</span>
              ) : (
                <span className="badge bg-label-secondary">{t('merchant.notConfigured', { defaultValue: 'Not Configured' })}</span>
              )}
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">
                {t('merchant.webhookDesc', { defaultValue: 'Set a callback URL to receive real-time payment notifications via webhook.' })}
              </p>
              {editingWebhook ? (
                <>
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
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={handleWebhookSave} disabled={webhookLoading}>
                      {webhookLoading ? (
                        <><span className="spinner-border spinner-border-sm me-1"></span>{t('merchant.saving', { defaultValue: 'Saving...' })}</>
                      ) : (
                        <><i className="bx bx-check me-1"></i>{t('merchant.save', { defaultValue: 'Save' })}</>
                      )}
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditingWebhook(false)} disabled={webhookLoading}>
                      {t('actions.cancel', { defaultValue: 'Cancel' })}
                    </button>
                  </div>
                </>
              ) : (
                <button className="btn btn-outline-primary btn-sm" onClick={() => { setWebhookUrl(''); setEditingWebhook(true) }}>
                  <i className="bx bx-edit me-1"></i>
                  {merchant?.hasWebhook
                    ? t('merchant.updateWebhook', { defaultValue: 'Update Webhook' })
                    : t('merchant.setWebhook', { defaultValue: 'Set Webhook' })
                  }
                </button>
              )}
            </div>
          </div>

          {/* Security Tips */}
          <div className="card">
            <div className="card-body">
              <h6 className="mb-3">
                <i className="bx bx-shield me-1 text-primary"></i>
                {t('merchant.securityTips', { defaultValue: 'Security Tips' })}
              </h6>
              <ul className="small text-muted mb-0 ps-3">
                <li className="mb-1">{t('merchant.tip1', { defaultValue: 'Never share your API Secret publicly' })}</li>
                <li className="mb-1">{t('merchant.tip2', { defaultValue: 'Rotate your secret periodically' })}</li>
                <li className="mb-1">{t('merchant.tip3', { defaultValue: 'Use HTTPS for webhook URLs' })}</li>
                <li>{t('merchant.tip4', { defaultValue: 'Regenerating key invalidates all existing credentials' })}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showModal && (
        <ConfirmActionModal
          action={modalAction}
          loading={modalLoading}
          onConfirm={handleModalConfirm}
          onClose={closeModal}
          t={t}
        />
      )}
    </div>
  )
}
