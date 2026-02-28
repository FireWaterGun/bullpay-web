'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Turnstile } from 'react-turnstile'
import { forgotPasswordApi } from '@/lib/api/auth'

export default function ForgotPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [cfToken, setCfToken] = useState('')
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
  const theme = 'light'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      await forgotPasswordApi({ email, cfToken })
      // Store email in sessionStorage for the complete page
      sessionStorage.setItem('forgot_email', email)
      router.replace('/forgot-complete')
    } catch (err: any) {
      const details = err?.details || err?.data?.error?.details || err?.data?.details || {}
      setFieldErrors(details)
      let display = ''
      if (typeof err?.message === 'string') display = err.message
      else if (typeof err?.data?.error?.message === 'string') display = err.data.error.message
      else if (typeof err?.data?.message === 'string') display = err.data.message
      if (!display && Array.isArray(details?.cfToken) && details.cfToken.length) display = details.cfToken[0]
      setError(display || 'Request failed')
      setCfToken('')
      setCaptchaRenderKey((k) => k + 1)
    } finally {
      setLoading(false)
    }
  }

  const emailInvalid = Array.isArray(fieldErrors.email) && fieldErrors.email.length > 0
  const captchaInvalid = Array.isArray(fieldErrors.cfToken) && fieldErrors.cfToken.length > 0

  return (
    <div className="card px-sm-6 px-0">
      <div className="card-body">
        <div className="app-brand justify-content-center mb-4">
          <Link href="/" className="app-brand-link gap-2 d-flex align-items-center">
            <div className="brand-icon">
              <i className="bx bxs-wallet-alt text-primary" style={{ fontSize: '40px' }}></i>
            </div>
            <span className="fw-bold" style={{ fontSize: '24px' }}>
              <span className="text-dark">BULL</span>
              <span className="text-primary">PAY</span>
            </span>
          </Link>
        </div>
        <h4 className="mb-1">Forgot Password? 🔒</h4>
        <p className="mb-6">Enter your email and we&apos;ll send you instructions to reset your password</p>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <form id="formAuthentication" className="mb-6" onSubmit={onSubmit}>
          <div className="mb-6 form-control-validation">
            <label htmlFor="email" className="form-label">Email</label>
            <input type="text" className={`form-control ${emailInvalid ? 'is-invalid' : ''}`} id="email" name="email" placeholder="Enter your email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={emailInvalid} />
            {emailInvalid && <div className="invalid-feedback d-block">{fieldErrors.email[0]}</div>}
          </div>

          {/* Cloudflare Turnstile */}
          <div className="my-6">
            {siteKey && (
              <div className="captcha-box p-0">
                <Turnstile
                  key={captchaRenderKey}
                  sitekey={siteKey}
                  theme={theme}
                  appearance="always"
                  size="flexible"
                  onVerify={(token) => setCfToken(token)}
                  onError={() => setError('CAPTCHA failed, please try again')}
                  onExpire={() => setCfToken('')}
                />
              </div>
            )}
            {captchaInvalid && (
              <div className="text-danger small mt-2">CAPTCHA: {fieldErrors.cfToken[0]}</div>
            )}
          </div>

          <button className="btn btn-primary d-grid w-100" type="submit" disabled={loading || !cfToken}>{loading ? 'Submitting...' : 'Send Reset Link'}</button>
        </form>
        <div className="text-center">
          <Link href="/login" className="d-flex justify-content-center"><i className="icon-base bx bx-chevron-left scaleX-n1-rtl me-1"></i>Back to login</Link>
        </div>
      </div>
    </div>
  )
}
