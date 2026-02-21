import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useToastContext } from '../../context/ToastContext'
import {
  registerMerchant,
  getMerchantProfile,
  rotateSecret,
  regenerateKey,
  updateWebhook,
} from '../../api/merchant.ts'
import { formatCommission } from '../../utils/format'
import { copyToClipboard as copyText } from '../../utils/clipboard'

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'active') return 'badge bg-label-success'
  if (s === 'suspended') return 'badge bg-label-danger'
  if (s === 'pending') return 'badge bg-label-warning'
  return 'badge bg-label-secondary'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Credential Display Modal (shown once after register/regenerate) ──
function CredentialAlert({ credentials, warning, onDismiss, t }) {
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  async function handleCopy(text, setter) {
    const ok = await copyText(text)
    if (ok) { setter(true); setTimeout(() => setter(false), 2000) }
  }

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {t('merchant.apiCredentials', { defaultValue: 'API Credentials' })}
            </h5>
            {onDismiss && <button type="button" className="btn-close" onClick={onDismiss}></button>}
          </div>
          <div className="modal-body">
            <div className="alert alert-warning py-2 mb-4" role="alert">
              <i className="bx bx-info-circle me-1"></i>
              {warning || t('merchant.credentialWarning')}
            </div>

            {credentials.apiKey && (
              <div className="mb-3">
                <label className="form-label fw-semibold mb-1">API Key</label>
                <div className="input-group">
                  <input type="text" className="form-control font-monospace" value={credentials.apiKey} readOnly style={{ fontSize: '0.85rem' }} />
                  <button className="btn btn-outline-secondary" onClick={() => handleCopy(credentials.apiKey, setCopiedKey)}>
                    <i className={`bx ${copiedKey ? 'bx-check' : 'bx-copy'} me-1`}></i>
                    {copiedKey ? t('merchant.copied', { defaultValue: 'Copied!' }) : 'Copy'}
                  </button>
                </div>
              </div>
            )}
            {credentials.apiSecret && (
              <div className="mb-0">
                <label className="form-label fw-semibold mb-1">API Secret</label>
                <div className="input-group">
                  <input type="text" className="form-control font-monospace" value={credentials.apiSecret} readOnly style={{ fontSize: '0.85rem' }} />
                  <button className="btn btn-outline-secondary" onClick={() => handleCopy(credentials.apiSecret, setCopiedSecret)}>
                    <i className={`bx ${copiedSecret ? 'bx-check' : 'bx-copy'} me-1`}></i>
                    {copiedSecret ? t('merchant.copied', { defaultValue: 'Copied!' }) : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={onDismiss}>
              <i className="bx bx-check me-1"></i>
              {t('merchant.credentialSaved', { defaultValue: 'I have saved my credentials' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Registration Form ──
function RegisterForm({ onRegistered, token, t }) {
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    websiteUrl: '',
    description: '',
    callbackUrl: '',
  })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || form.name.length < 2) {
      toast.error(t('merchant.nameRequired', { defaultValue: 'Merchant name is required (min 2 characters)' }))
      return
    }
    try {
      setLoading(true)
      const body = { name: form.name }
      if (form.email) body.email = form.email
      if (form.websiteUrl) body.websiteUrl = form.websiteUrl
      if (form.description) body.description = form.description
      if (form.callbackUrl) body.callbackUrl = form.callbackUrl

      const result = await registerMerchant(token, body)
      toast.success(t('merchant.registerSuccess', { defaultValue: 'Merchant registered successfully!' }))
      onRegistered(result)
    } catch (error) {
      toast.error(error?.message || t('merchant.registerError', { defaultValue: 'Failed to register merchant' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <div className="card">
            <div className="card-body">
              <div className="text-center mb-4">
                <div className="mb-3">
                  <span className="avatar avatar-lg bg-label-primary rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 64, height: 64 }}>
                    <i className="bx bx-store fs-2"></i>
                  </span>
                </div>
                <h4 className="mb-1">{t('merchant.registerTitle', { defaultValue: 'Become a Merchant' })}</h4>
                <p className="text-muted">{t('merchant.registerDesc', { defaultValue: 'Register your business to accept crypto payments via BullPay API' })}</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">{t('merchant.name', { defaultValue: 'Merchant Name' })} <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t('merchant.namePlaceholder', { defaultValue: 'Your business name' })}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">{t('merchant.email', { defaultValue: 'Contact Email' })}</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t('merchant.emailPlaceholder', { defaultValue: 'merchant@example.com' })}
                    maxLength={255}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">{t('merchant.websiteUrl', { defaultValue: 'Website URL' })}</label>
                  <input
                    type="url"
                    className="form-control"
                    name="websiteUrl"
                    value={form.websiteUrl}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    maxLength={500}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">{t('merchant.description', { defaultValue: 'Description' })}</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder={t('merchant.descPlaceholder', { defaultValue: 'Describe your business...' })}
                    rows={3}
                    maxLength={1000}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">{t('merchant.callbackUrl', { defaultValue: 'Webhook Callback URL' })}</label>
                  <input
                    type="url"
                    className="form-control"
                    name="callbackUrl"
                    value={form.callbackUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/webhooks/payment"
                    maxLength={500}
                  />
                  <small className="text-muted">{t('merchant.callbackHint', { defaultValue: 'URL to receive payment notifications (can be set later)' })}</small>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {t('merchant.registering', { defaultValue: 'Registering...' })}
                    </>
                  ) : (
                    <>
                      <i className="bx bx-rocket me-2"></i>
                      {t('merchant.register', { defaultValue: 'Register Merchant' })}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">{t('merchant.apiCredentials', { defaultValue: 'API Credentials' })}</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-borderless mb-0">
                  <tbody>
                    <tr>
                      <td className="ps-0" style={{ width: 110 }}><span className="fw-medium">API Key</span></td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="font-monospace" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{apiKey || '-'}</span>
                          {apiKey && (
                            <button
                              className="btn btn-sm btn-icon btn-text-secondary ms-2 flex-shrink-0"
                              onClick={async () => {
                                const ok = await copyText(apiKey)
                                if (ok) toast.success(t('merchant.copied', { defaultValue: 'Copied!' }))
                              }}
                            >
                              <i className="bx bx-copy"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-0"><span className="fw-medium">API Secret</span></td>
                      <td>
                        <span className="font-monospace" style={{ fontSize: '0.85rem' }}>{apiSecretMasked || '••••••••'}</span>
                        <small className="text-muted ms-2">
                          <i className="bx bx-lock-alt" style={{ fontSize: '0.75rem' }}></i> {t('merchant.secretMasked', { defaultValue: 'masked' })}
                        </small>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-outline-primary btn-sm" onClick={() => openModal('rotate-secret')}>
                  <i className="bx bx-refresh me-1"></i>
                  {t('merchant.rotateSecret', { defaultValue: 'Rotate Secret' })}
                </button>
                <button className="btn btn-outline-danger btn-sm" onClick={() => openModal('regenerate-key')}>
                  <i className="bx bx-reset me-1"></i>
                  {t('merchant.regenerateKey', { defaultValue: 'Regenerate Key & Secret' })}
                </button>
              </div>
            </div>
          </div>

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
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !modalLoading && closeModal()}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalAction === 'rotate-secret'
                    ? t('merchant.rotateSecretTitle', { defaultValue: 'Rotate API Secret' })
                    : t('merchant.regenerateKeyTitle', { defaultValue: 'Regenerate API Key & Secret' })
                  }
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} disabled={modalLoading}></button>
              </div>
              <div className="modal-body">
                {modalAction === 'rotate-secret' ? (
                  <div className="alert alert-primary py-2 mb-0" role="alert">
                    <i className="bx bx-info-circle me-1"></i>
                    {t('merchant.rotateConfirm', { defaultValue: 'This will generate a new API secret. Your API key will remain the same. The old secret will stop working immediately.' })}
                  </div>
                ) : (
                  <div className="alert alert-danger py-2 mb-0" role="alert">
                    <i className="bx bx-error me-1"></i>
                    {t('merchant.regenerateConfirm', { defaultValue: 'This will generate a new API key AND secret. All existing credentials will be invalidated immediately.' })}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={modalLoading}>
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button
                  type="button"
                  className={`btn ${modalAction === 'rotate-secret' ? 'btn-primary' : 'btn-danger'}`}
                  onClick={handleModalConfirm}
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span>{t('merchant.processing', { defaultValue: 'Processing...' })}</>
                  ) : (
                    modalAction === 'rotate-secret'
                      ? t('merchant.rotateSecret', { defaultValue: 'Rotate Secret' })
                      : t('merchant.regenerateKey', { defaultValue: 'Regenerate Key & Secret' })
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
