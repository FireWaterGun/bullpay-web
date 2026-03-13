'use client'

import { useState } from 'react'
import { useToast } from '@/app/providers'
import { registerMerchant } from '@/lib/api/merchant'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { Input, InputGroup, InputIcon, Label } from '../ui/Input'
import Spinner from '../ui/Spinner'

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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
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

  const features = [
    {
      icon: 'bx-bolt-circle',
      color: 'primary',
      title: t('merchant.featureFast', { defaultValue: 'Fast Integration' }),
      desc: t('merchant.featureFastDesc', {
        defaultValue: 'Get your API key instantly and start accepting payments in minutes',
      }),
    },
    {
      icon: 'bx-shield-quarter',
      color: 'success',
      title: t('merchant.featureSecure', { defaultValue: 'Secure Payments' }),
      desc: t('merchant.featureSecureDesc', {
        defaultValue: 'Enterprise-grade security with webhook notifications and signature verification',
      }),
    },
    {
      icon: 'bx-coin-stack',
      color: 'info',
      title: t('merchant.featureMulti', { defaultValue: 'Multi-Chain Support' }),
      desc: t('merchant.featureMultiDesc', {
        defaultValue: 'Accept payments on Ethereum, BSC, Polygon, Arbitrum, TRON and more',
      }),
    },
    {
      icon: 'bx-bar-chart-alt-2',
      color: 'warning',
      title: t('merchant.featureDashboard', { defaultValue: 'Real-time Dashboard' }),
      desc: t('merchant.featureDashboardDesc', {
        defaultValue: 'Track transactions, settlements, and analytics from one place',
      }),
    },
  ]

  const stats = [
    { value: '10+', label: t('merchant.statChains', { defaultValue: 'Blockchains' }) },
    { value: '< 1min', label: t('merchant.statSetup', { defaultValue: 'Setup Time' }) },
    { value: '0%', label: t('merchant.statFee', { defaultValue: 'Setup Fee' }) },
    { value: '24/7', label: t('merchant.statUptime', { defaultValue: 'Availability' }) },
  ]

  const featureColors = {
    primary: 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400',
    success: 'bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-400',
    info: 'bg-info-50 dark:bg-info-950/30 text-info-700 dark:text-info-400',
    warning: 'bg-warning-50 dark:bg-warning-950/30 text-warning-700 dark:text-warning-400',
  }

  /* ── Step 1: Welcome / Landing ────────────────────────────── */
  if (step === 1) {
    return (
      <div>
        {/* Hero */}
        <Card className="w-full overflow-hidden mb-4">
          {/* Gradient bar */}
          <div
            className="h-1"
            style={{ background: 'linear-gradient(90deg, var(--color-primary-600) 0%, #a855f7 50%, #06b6d4 100%)' }}
          />

          <div className="p-6 text-center py-10 px-4">
            {/* Icon */}
            <div
              className="mx-auto mb-4 inline-flex items-center justify-center rounded-full w-20 h-20"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(99,102,241,0.04) 100%)' }}
            >
              <i className="bx bx-store text-primary-600 dark:text-primary-400 text-[2.75rem]"></i>
            </div>

            <h2 className="mb-2 font-bold text-2xl text-surface-900">
              {t('merchant.registerTitle', { defaultValue: 'Become a Merchant' })}
            </h2>
            <p className="text-surface-500 dark:text-surface-400 mb-4 mx-auto max-w-xl">
              {t('merchant.registerDesc', {
                defaultValue:
                  'Register your business to accept crypto payments via BullPay API. Start accepting payments in minutes.',
              })}
            </p>

            <Button onClick={() => setStep(2)} size="lg" className="px-5">
              <i className="bx bx-rocket mr-2"></i>
              {t('merchant.getStarted', { defaultValue: 'Get Started' })}
            </Button>
          </div>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-4">
          {stats.map((s) => (
            <Card key={s.label} className="h-full">
              <div className="p-4 text-center py-3">
                <h4 className="mb-1 text-primary-600 dark:text-primary-400 font-bold">{s.value}</h4>
                <small className="text-surface-500 dark:text-surface-400">{s.label}</small>
              </div>
            </Card>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {features.map((f) => (
            <Card key={f.icon} className="h-full">
              <div className="p-3 flex gap-3">
                <span
                  className={`inline-flex items-center justify-center rounded-lg shrink-0 ${featureColors[f.color] || 'bg-surface-100 text-surface-700'} w-11 h-11`}
                >
                  <i className={`bx ${f.icon} text-[1.35rem]`}></i>
                </span>
                <div>
                  <div className="font-semibold mb-1 text-surface-900">{f.title}</div>
                  <small className="text-surface-500 dark:text-surface-400">{f.desc}</small>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer note */}
        <div className="text-center mt-4">
          <small className="text-surface-500 dark:text-surface-400">
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
      <Card className="w-full overflow-hidden">
        {/* Gradient bar */}
        <div
          className="h-1"
          style={{ background: 'linear-gradient(90deg, var(--color-primary-600) 0%, #a855f7 50%, #06b6d4 100%)' }}
        />

        <div className="px-6 py-4 border-b border-surface-200 flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-white/6 dark:hover:text-surface-200 transition-colors"
            onClick={() => setStep(1)}
            title={t('actions.back', { defaultValue: 'Back' })}
          >
            <i className="bx bx-arrow-back text-xl"></i>
          </button>
          <div>
            <h5 className="font-semibold mb-0 text-surface-900">
              {t('merchant.formTitle', { defaultValue: 'Business Information' })}
            </h5>
            <small className="text-surface-500 dark:text-surface-400">
              {t('merchant.formSubtitle', { defaultValue: 'Fill in your details to create a merchant account' })}
            </small>
          </div>
        </div>

        <div className="p-6">
          {/* Progress indicator */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-surface-200">
            {[
              { num: 1, label: t('merchant.stepRegister', { defaultValue: 'Register' }), done: false, active: true },
              {
                num: 2,
                label: t('merchant.stepCredentials', { defaultValue: 'Get Credentials' }),
                done: false,
                active: false,
              },
              { num: 3, label: t('merchant.stepIntegrate', { defaultValue: 'Integrate' }), done: false, active: false },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center rounded-full shrink-0 ${s.active ? 'bg-primary-600 text-white' : s.done ? 'bg-success-100 dark:bg-success-950/30 text-success-700 dark:text-success-400' : 'bg-surface-100 dark:bg-dark-elevated text-surface-500'} w-7 h-7 text-xs font-semibold`}
                >
                  {s.done ? <i className="bx bx-check"></i> : s.num}
                </span>
                <span
                  className={`text-sm ${s.active ? 'font-semibold text-surface-900' : 'text-surface-500 dark:text-surface-400'} hidden sm:inline`}
                >
                  {s.label}
                </span>
                {s.num < 3 && <i className="bx bx-chevron-right text-surface-400 dark:text-surface-500 ml-1"></i>}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Merchant Name */}
              <div>
                <Label className="font-semibold text-sm">
                  {t('merchant.name', { defaultValue: 'Merchant Name' })} <span className="text-danger-500">*</span>
                </Label>
                <InputGroup>
                  <InputIcon>
                    <i className="bx bx-store"></i>
                  </InputIcon>
                  <Input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t('merchant.namePlaceholder', { defaultValue: 'Your business name' })}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </InputGroup>
              </div>

              {/* Contact Email */}
              <div>
                <Label className="font-semibold text-sm">
                  {t('merchant.email', { defaultValue: 'Contact Email' })}
                </Label>
                <InputGroup>
                  <InputIcon>
                    <i className="bx bx-envelope"></i>
                  </InputIcon>
                  <Input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t('merchant.emailPlaceholder', { defaultValue: 'merchant@example.com' })}
                    maxLength={255}
                  />
                </InputGroup>
              </div>

              {/* Website URL */}
              <div className="col-span-12 md:col-span-2">
                <Label className="font-semibold text-sm">
                  {t('merchant.websiteUrl', { defaultValue: 'Website URL' })}
                </Label>
                <InputGroup>
                  <InputIcon>
                    <i className="bx bx-globe"></i>
                  </InputIcon>
                  <Input
                    type="url"
                    name="websiteUrl"
                    value={form.websiteUrl}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    maxLength={500}
                  />
                </InputGroup>
              </div>

              {/* Description */}
              <div className="col-span-12 md:col-span-2">
                <Label className="font-semibold text-sm">
                  {t('merchant.description', { defaultValue: 'Description' })}
                </Label>
                <Input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder={t('merchant.descPlaceholder', { defaultValue: 'Describe your business...' })}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              {/* Webhook Callback URL */}
              <div className="col-span-12 md:col-span-2">
                <Label className="font-semibold text-sm">
                  {t('merchant.callbackUrl', { defaultValue: 'Webhook Callback URL' })}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 dark:bg-dark-elevated text-surface-500 ml-2">
                    {t('merchant.optional', { defaultValue: 'Optional' })}
                  </span>
                </Label>
                <InputGroup>
                  <InputIcon>
                    <i className="bx bx-link"></i>
                  </InputIcon>
                  <Input
                    type="url"
                    name="callbackUrl"
                    value={form.callbackUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/webhooks/payment"
                    maxLength={500}
                  />
                </InputGroup>
                <small className="text-surface-500 dark:text-surface-400">
                  {t('merchant.callbackHint', {
                    defaultValue: 'URL to receive payment notifications (can be set later)',
                  })}
                </small>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-between gap-3 mt-4 pt-3 border-t border-surface-200">
              <Button type="button" onClick={() => setStep(1)} variant="outline-secondary">
                <i className="bx bx-arrow-back mr-1"></i>
                {t('actions.back', { defaultValue: 'Back' })}
              </Button>
              <Button type="submit" disabled={loading} className="px-5">
                {loading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2 inline-block align-middle" />
                    {t('merchant.registering', { defaultValue: 'Registering...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-rocket mr-2"></i>
                    {t('merchant.register', { defaultValue: 'Register Merchant' })}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
