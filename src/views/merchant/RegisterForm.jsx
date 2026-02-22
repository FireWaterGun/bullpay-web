import { useState } from 'react'
import { useToastContext } from '../../context/ToastContext'
import { registerMerchant } from '../../api/merchant.ts'

export default function RegisterForm({ onRegistered, token, t }) {
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
