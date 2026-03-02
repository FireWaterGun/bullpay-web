'use client'

import { useState } from 'react'
import { useToast } from '@/app/providers'
import { registerMerchant } from '@/lib/api/merchant'

export default function RegisterForm({ onRegistered, token, t }) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1 = intro, 2 = form
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
    { icon: 'bx-bolt-circle', color: 'primary', title: t('merchant.featureFast', { defaultValue: 'Fast Integration' }), desc: t('merchant.featureFastDesc', { defaultValue: 'Get your API key instantly and start accepting payments in minutes' }) },
    { icon: 'bx-shield-quarter', color: 'success', title: t('merchant.featureSecure', { defaultValue: 'Secure Payments' }), desc: t('merchant.featureSecureDesc', { defaultValue: 'Enterprise-grade security with webhook notifications and signature verification' }) },
    { icon: 'bx-coin-stack', color: 'info', title: t('merchant.featureMulti', { defaultValue: 'Multi-Chain Support' }), desc: t('merchant.featureMultiDesc', { defaultValue: 'Accept payments on Ethereum, BSC, Polygon, Arbitrum, TRON and more' }) },
    { icon: 'bx-bar-chart-alt-2', color: 'warning', title: t('merchant.featureDashboard', { defaultValue: 'Real-time Dashboard' }), desc: t('merchant.featureDashboardDesc', { defaultValue: 'Track transactions, settlements, and analytics from one place' }) },
  ]

  const stats = [
    { value: '10+', label: t('merchant.statChains', { defaultValue: 'Blockchains' }) },
    { value: '< 1min', label: t('merchant.statSetup', { defaultValue: 'Setup Time' }) },
    { value: '0%', label: t('merchant.statFee', { defaultValue: 'Setup Fee' }) },
    { value: '24/7', label: t('merchant.statUptime', { defaultValue: 'Availability' }) },
  ]

  /* ── Step 1: Welcome / Landing ────────────────────────────── */
  if (step === 1) {
    return (
      <div>
        {/* Hero */}
        <div className="card w-100 overflow-hidden mb-4">
          {/* Gradient bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, var(--bs-primary) 0%, #a855f7 50%, #06b6d4 100%)' }} />

          <div className="card-body text-center py-5 px-4">
            {/* Icon */}
            <div
              className="mx-auto mb-4 d-inline-flex align-items-center justify-content-center rounded-circle"
              style={{ width: 88, height: 88, background: 'linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.16) 0%, rgba(var(--bs-primary-rgb), 0.04) 100%)' }}
            >
              <i className="bx bx-store" style={{ fontSize: '2.75rem', color: 'var(--bs-primary)' }}></i>
            </div>

            <h2 className="mb-2">{t('merchant.registerTitle', { defaultValue: 'Become a Merchant' })}</h2>
            <p className="text-muted mb-4 mx-auto" style={{ maxWidth: 480 }}>
              {t('merchant.registerDesc', { defaultValue: 'Register your business to accept crypto payments via BullPay API. Start accepting payments in minutes.' })}
            </p>

            <button className="btn btn-primary btn-lg px-5" onClick={() => setStep(2)}>
              <i className="bx bx-rocket me-2"></i>
              {t('merchant.getStarted', { defaultValue: 'Get Started' })}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="row g-3 w-100 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="col-6 col-sm-3">
              <div className="card h-100">
                <div className="card-body text-center py-3">
                  <h4 className="mb-1 text-primary">{s.value}</h4>
                  <small className="text-muted">{s.label}</small>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="row g-3 w-100">
          {features.map((f, i) => (
            <div key={i} className="col-sm-6">
              <div className="card h-100">
                <div className="card-body d-flex gap-3 p-3">
                  <span
                    className={`d-inline-flex align-items-center justify-content-center rounded-2 bg-label-${f.color} flex-shrink-0`}
                    style={{ width: 44, height: 44 }}
                  >
                    <i className={`bx ${f.icon}`} style={{ fontSize: '1.35rem' }}></i>
                  </span>
                  <div>
                    <div className="fw-semibold mb-1">{f.title}</div>
                    <small className="text-muted">{f.desc}</small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="text-center mt-4">
          <small className="text-muted">
            <i className="bx bx-info-circle me-1"></i>
            {t('merchant.freeToStart', { defaultValue: 'Free to register. You only pay per transaction.' })}
          </small>
        </div>
      </div>
    )
  }

  /* ── Step 2: Registration Form ────────────────────────────── */
  return (
    <div>
      <div className="card w-100 overflow-hidden">
        {/* Gradient bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--bs-primary) 0%, #a855f7 50%, #06b6d4 100%)' }} />

        <div className="card-header d-flex align-items-center gap-3 py-3">
          <button
            type="button"
            className="btn btn-icon btn-sm btn-text-secondary"
            onClick={() => setStep(1)}
            title={t('actions.back', { defaultValue: 'Back' })}
          >
            <i className="bx bx-arrow-back" style={{ fontSize: '1.25rem' }}></i>
          </button>
          <div>
            <h5 className="card-title mb-0">
              {t('merchant.formTitle', { defaultValue: 'Business Information' })}
            </h5>
            <small className="text-muted">{t('merchant.formSubtitle', { defaultValue: 'Fill in your details to create a merchant account' })}</small>
          </div>
        </div>

        <div className="card-body p-4">
          {/* Progress indicator */}
          <div className="d-flex align-items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid var(--bs-border-color)' }}>
            {[
              { num: 1, label: t('merchant.stepRegister', { defaultValue: 'Register' }), done: false, active: true },
              { num: 2, label: t('merchant.stepCredentials', { defaultValue: 'Get Credentials' }), done: false, active: false },
              { num: 3, label: t('merchant.stepIntegrate', { defaultValue: 'Integrate' }), done: false, active: false },
            ].map((s, i) => (
              <div key={i} className="d-flex align-items-center gap-2">
                <span
                  className={`d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ${
                    s.active ? 'bg-primary text-white' : s.done ? 'bg-label-success' : 'bg-label-secondary'
                  }`}
                  style={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {s.done ? <i className="bx bx-check"></i> : s.num}
                </span>
                <span className={`small ${s.active ? 'fw-semibold' : 'text-muted'} d-none d-sm-inline`}>{s.label}</span>
                {i < 2 && <i className="bx bx-chevron-right text-muted ms-1"></i>}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Merchant Name */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  {t('merchant.name', { defaultValue: 'Merchant Name' })} <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bx bx-store text-muted"></i></span>
                  <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} placeholder={t('merchant.namePlaceholder', { defaultValue: 'Your business name' })} minLength={2} maxLength={100} required />
                </div>
              </div>

              {/* Contact Email */}
              <div className="col-md-6">
                <label className="form-label fw-semibold small">
                  {t('merchant.email', { defaultValue: 'Contact Email' })}
                </label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bx bx-envelope text-muted"></i></span>
                  <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} placeholder={t('merchant.emailPlaceholder', { defaultValue: 'merchant@example.com' })} maxLength={255} />
                </div>
              </div>

              {/* Website URL */}
              <div className="col-12">
                <label className="form-label fw-semibold small">
                  {t('merchant.websiteUrl', { defaultValue: 'Website URL' })}
                </label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bx bx-globe text-muted"></i></span>
                  <input type="url" className="form-control" name="websiteUrl" value={form.websiteUrl} onChange={handleChange} placeholder="https://example.com" maxLength={500} />
                </div>
              </div>

              {/* Description */}
              <div className="col-12">
                <label className="form-label fw-semibold small">
                  {t('merchant.description', { defaultValue: 'Description' })}
                </label>
                <textarea className="form-control" name="description" value={form.description} onChange={handleChange} placeholder={t('merchant.descPlaceholder', { defaultValue: 'Describe your business...' })} rows={3} maxLength={1000} />
              </div>

              {/* Webhook Callback URL */}
              <div className="col-12">
                <label className="form-label fw-semibold small">
                  {t('merchant.callbackUrl', { defaultValue: 'Webhook Callback URL' })}
                  <span className="badge bg-label-secondary ms-2" style={{ fontSize: '0.65rem' }}>
                    {t('merchant.optional', { defaultValue: 'Optional' })}
                  </span>
                </label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bx bx-link text-muted"></i></span>
                  <input type="url" className="form-control" name="callbackUrl" value={form.callbackUrl} onChange={handleChange} placeholder="https://example.com/webhooks/payment" maxLength={500} />
                </div>
                <small className="text-muted">{t('merchant.callbackHint', { defaultValue: 'URL to receive payment notifications (can be set later)' })}</small>
              </div>
            </div>

            {/* Submit */}
            <div className="d-flex justify-content-between gap-3 mt-4 pt-3" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(1)}>
                <i className="bx bx-arrow-back me-1"></i>
                {t('actions.back', { defaultValue: 'Back' })}
              </button>
              <button type="submit" className="btn btn-primary px-5" disabled={loading}>
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
  )
}
