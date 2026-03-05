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

  const featureColors = { primary: 'bg-primary-50 text-primary-700', success: 'bg-green-50 text-green-700', info: 'bg-cyan-50 text-cyan-700', warning: 'bg-amber-50 text-amber-700' }

  /* ── Step 1: Welcome / Landing ────────────────────────────── */
  if (step === 1) {
    return (
      <div>
        {/* Hero */}
        <div className="card w-full overflow-hidden mb-4">
          {/* Gradient bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, var(--color-primary-600) 0%, #a855f7 50%, #06b6d4 100%)' }} />

          <div className="p-6 text-center py-10 px-4">
            {/* Icon */}
            <div
              className="mx-auto mb-4 inline-flex items-center justify-center rounded-full"
              style={{ width: 88, height: 88, background: 'linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(99,102,241,0.04) 100%)' }}
            >
              <i className="bx bx-store text-primary-600" style={{ fontSize: '2.75rem' }}></i>
            </div>

            <h2 className="mb-2 font-bold text-2xl">{t('merchant.registerTitle', { defaultValue: 'Become a Merchant' })}</h2>
            <p className="text-surface-500 mb-4 mx-auto" style={{ maxWidth: 480 }}>
              {t('merchant.registerDesc', { defaultValue: 'Register your business to accept crypto payments via BullPay API. Start accepting payments in minutes.' })}
            </p>

            <button className="btn btn-primary btn-lg px-5" onClick={() => setStep(2)}>
              <i className="bx bx-rocket mr-2"></i>
              {t('merchant.getStarted', { defaultValue: 'Get Started' })}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-4">
          {stats.map((s, i) => (
            <div key={i} className="card h-full">
              <div className="p-4 text-center py-3">
                <h4 className="mb-1 text-primary-600 font-bold">{s.value}</h4>
                <small className="text-surface-500">{s.label}</small>
              </div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {features.map((f, i) => (
            <div key={i} className="card h-full">
              <div className="p-3 flex gap-3">
                <span
                  className={`inline-flex items-center justify-center rounded-lg shrink-0 ${featureColors[f.color] ||'bg-surface-100 text-surface-700'}`}
                  style={{ width: 44, height: 44 }}
                >
                  <i className={`bx ${f.icon}`} style={{ fontSize: '1.35rem' }}></i>
                </span>
                <div>
                  <div className="font-semibold mb-1">{f.title}</div>
                  <small className="text-surface-500">{f.desc}</small>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="text-center mt-4">
          <small className="text-surface-500">
            <i className="bx bx-info-circle mr-1"></i>
            {t('merchant.freeToStart', { defaultValue: 'Free to register. You only pay per transaction.' })}
          </small>
        </div>
      </div>
    )
  }

  /* ── Step 2: Registration Form ────────────────────────────── */
  return (
    <div>
      <div className="card w-full overflow-hidden">
        {/* Gradient bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--color-primary-600) 0%, #a855f7 50%, #06b6d4 100%)' }} />

        <div className="px-6 py-4 border-b border-surface-200 flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-surface-500 hover:bg-surface-100 transition-colors"
            onClick={() => setStep(1)}
            title={t('actions.back', { defaultValue: 'Back' })}
          >
            <i className="bx bx-arrow-back" style={{ fontSize: '1.25rem' }}></i>
          </button>
          <div>
            <h5 className="font-semibold mb-0">
              {t('merchant.formTitle', { defaultValue: 'Business Information' })}
            </h5>
            <small className="text-surface-500">{t('merchant.formSubtitle', { defaultValue: 'Fill in your details to create a merchant account' })}</small>
          </div>
        </div>

        <div className="p-6">
          {/* Progress indicator */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-surface-200">
            {[
              { num: 1, label: t('merchant.stepRegister', { defaultValue: 'Register' }), done: false, active: true },
              { num: 2, label: t('merchant.stepCredentials', { defaultValue: 'Get Credentials' }), done: false, active: false },
              { num: 3, label: t('merchant.stepIntegrate', { defaultValue: 'Integrate' }), done: false, active: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center rounded-full shrink-0 ${ s.active ?'bg-primary-600 text-white' : s.done ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'
                  }`}
                  style={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {s.done ? <i className="bx bx-check"></i> : s.num}
                </span>
                <span className={`text-sm ${s.active ?'font-semibold' : 'text-surface-500'} hidden sm:inline`}>{s.label}</span>
                {i < 2 && <i className="bx bx-chevron-right text-surface-400 ml-1"></i>}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Merchant Name */}
              <div>
                <label className="form-label font-semibold text-sm">
                  {t('merchant.name', { defaultValue: 'Merchant Name' })} <span className="text-red-500">*</span>
                </label>
                <div className="bp-input-group">
                  <span className="bp-input-suffix"><i className="bx bx-store text-surface-500"></i></span>
                  <input type="text" className="form-input" name="name" value={form.name} onChange={handleChange} placeholder={t('merchant.namePlaceholder', { defaultValue: 'Your business name' })} minLength={2} maxLength={100} required />
                </div>
              </div>

              {/* Contact Email */}
              <div>
                <label className="form-label font-semibold text-sm">
                  {t('merchant.email', { defaultValue: 'Contact Email' })}
                </label>
                <div className="bp-input-group">
                  <span className="bp-input-suffix"><i className="bx bx-envelope text-surface-500"></i></span>
                  <input type="email" className="form-input" name="email" value={form.email} onChange={handleChange} placeholder={t('merchant.emailPlaceholder', { defaultValue: 'merchant@example.com' })} maxLength={255} />
                </div>
              </div>

              {/* Website URL */}
              <div className="md:col-span-2">
                <label className="form-label font-semibold text-sm">
                  {t('merchant.websiteUrl', { defaultValue: 'Website URL' })}
                </label>
                <div className="bp-input-group">
                  <span className="bp-input-suffix"><i className="bx bx-globe text-surface-500"></i></span>
                  <input type="url" className="form-input" name="websiteUrl" value={form.websiteUrl} onChange={handleChange} placeholder="https://example.com" maxLength={500} />
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="form-label font-semibold text-sm">
                  {t('merchant.description', { defaultValue: 'Description' })}
                </label>
                <textarea className="form-input" name="description" value={form.description} onChange={handleChange} placeholder={t('merchant.descPlaceholder', { defaultValue: 'Describe your business...' })} rows={3} maxLength={1000} />
              </div>

              {/* Webhook Callback URL */}
              <div className="md:col-span-2">
                <label className="form-label font-semibold text-sm">
                  {t('merchant.callbackUrl', { defaultValue: 'Webhook Callback URL' })}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-surface-500 ml-2">
                    {t('merchant.optional', { defaultValue: 'Optional' })}
                  </span>
                </label>
                <div className="bp-input-group">
                  <span className="bp-input-suffix"><i className="bx bx-link text-surface-500"></i></span>
                  <input type="url" className="form-input" name="callbackUrl" value={form.callbackUrl} onChange={handleChange} placeholder="https://example.com/webhooks/payment" maxLength={500} />
                </div>
                <small className="text-surface-500">{t('merchant.callbackHint', { defaultValue: 'URL to receive payment notifications (can be set later)' })}</small>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-between gap-3 mt-4 pt-3 border-t border-surface-200">
              <button type="button" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100" onClick={() => setStep(1)}>
                <i className="bx bx-arrow-back mr-1"></i>
                {t('actions.back', { defaultValue: 'Back' })}
              </button>
              <button type="submit" className="btn btn-primary px-5" disabled={loading}>
                {loading ? (
                  <><span className="spinner w-4 h-4 border-2 mr-2 inline-block align-middle"></span>{t('merchant.registering', { defaultValue: 'Registering...' })}</>
                ) : (
                  <><i className="bx bx-rocket mr-2"></i>{t('merchant.register', { defaultValue: 'Register Merchant' })}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
