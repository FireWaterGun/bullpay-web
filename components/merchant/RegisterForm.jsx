'use client'

import { useState } from 'react'
import { useToast } from '@/app/providers'
import { registerMerchant } from '@/lib/api/merchant'

export default function RegisterForm({ onRegistered, token, t }) {
  const toast = useToast()
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
      toast.error( t('merchant.nameRequired', { defaultValue: 'Merchant name is required (min 2 characters)' }))
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
      toast.success( t('merchant.registerSuccess', { defaultValue: 'Merchant registered successfully!' }))
      onRegistered(result)
    } catch (error) {
      toast.error( error?.message || t('merchant.registerError', { defaultValue: 'Failed to register merchant' }))
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: 'bx-bolt-circle', title: t('merchant.featureFast', { defaultValue: 'Fast Integration' }), desc: t('merchant.featureFastDesc', { defaultValue: 'Get your API key instantly and start accepting payments in minutes' }) },
    { icon: 'bx-shield-quarter', title: t('merchant.featureSecure', { defaultValue: 'Secure Payments' }), desc: t('merchant.featureSecureDesc', { defaultValue: 'Enterprise-grade security with webhook notifications and signature verification' }) },
    { icon: 'bx-coin-stack', title: t('merchant.featureMulti', { defaultValue: 'Multi-Chain Support' }), desc: t('merchant.featureMultiDesc', { defaultValue: 'Accept payments on Ethereum, BSC, Polygon, Arbitrum, TRON and more' }) },
    { icon: 'bx-bar-chart-alt-2', title: t('merchant.featureDashboard', { defaultValue: 'Real-time Dashboard' }), desc: t('merchant.featureDashboardDesc', { defaultValue: 'Track transactions, settlements, and analytics from one place' }) },
  ]

  return (
    <div>
      <div className="row g-4">
        {/* Left -- Info Panel */}
        <div className="col-lg-6 col-xl-6">
          <div className="card h-100" style={{ background: 'linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.04) 0%, rgba(var(--bs-primary-rgb), 0.01) 100%)' }}>
            <div className="card-body d-flex flex-column p-4">
              <div className="mb-4">
                <span className="d-inline-flex align-items-center justify-content-center rounded-3" style={{ width: 56, height: 56, background: 'rgba(var(--bs-primary-rgb), 0.12)' }}>
                  <i className="bx bx-store fs-3 text-primary"></i>
                </span>
              </div>
              <h3 className="mb-2">{t('merchant.registerTitle', { defaultValue: 'Become a Merchant' })}</h3>
              <p className="text-muted mb-4">{t('merchant.registerDesc', { defaultValue: 'Register your business to accept crypto payments via BullPay API' })}</p>

              <div className="d-flex flex-column gap-4 flex-grow-1">
                {features.map((f, i) => (
                  <div key={i} className="d-flex gap-3">
                    <span className="d-inline-flex align-items-center justify-content-center rounded-2 flex-shrink-0" style={{ width: 40, height: 40, background: 'rgba(var(--bs-primary-rgb), 0.08)' }}>
                      <i className={`bx ${f.icon} text-primary`} style={{ fontSize: '1.25rem' }}></i>
                    </span>
                    <div>
                      <div className="fw-semibold mb-1">{f.title}</div>
                      <small className="text-muted">{f.desc}</small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
                <small className="text-muted">
                  <i className="bx bx-info-circle me-1"></i>
                  {t('merchant.freeToStart', { defaultValue: 'Free to register. You only pay per transaction.' })}
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Right -- Registration Form */}
        <div className="col-lg-6 col-xl-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bx bx-edit me-2 text-primary"></i>
                {t('merchant.formTitle', { defaultValue: 'Business Information' })}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">{t('merchant.name', { defaultValue: 'Merchant Name' })} <span className="text-danger">*</span></label>
                    <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} placeholder={t('merchant.namePlaceholder', { defaultValue: 'Your business name' })} minLength={2} maxLength={100} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{t('merchant.email', { defaultValue: 'Contact Email' })}</label>
                    <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} placeholder={t('merchant.emailPlaceholder', { defaultValue: 'merchant@example.com' })} maxLength={255} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">{t('merchant.websiteUrl', { defaultValue: 'Website URL' })}</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bx bx-globe"></i></span>
                      <input type="url" className="form-control" name="websiteUrl" value={form.websiteUrl} onChange={handleChange} placeholder="https://example.com" maxLength={500} />
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label">{t('merchant.description', { defaultValue: 'Description' })}</label>
                    <textarea className="form-control" name="description" value={form.description} onChange={handleChange} placeholder={t('merchant.descPlaceholder', { defaultValue: 'Describe your business...' })} rows={3} maxLength={1000} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">{t('merchant.callbackUrl', { defaultValue: 'Webhook Callback URL' })}</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bx bx-link"></i></span>
                      <input type="url" className="form-control" name="callbackUrl" value={form.callbackUrl} onChange={handleChange} placeholder="https://example.com/webhooks/payment" maxLength={500} />
                    </div>
                    <small className="text-muted">{t('merchant.callbackHint', { defaultValue: 'URL to receive payment notifications (can be set later)' })}</small>
                  </div>
                </div>

                <div className="mt-4">
                  <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>{t('merchant.registering', { defaultValue: 'Registering...' })}</>
                    ) : (
                      <><i className="bx bx-rocket me-2"></i>{t('merchant.register', { defaultValue: 'Register Merchant' })}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
