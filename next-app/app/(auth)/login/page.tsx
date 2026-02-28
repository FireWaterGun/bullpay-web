'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Turnstile } from 'react-turnstile'
import { loginApi } from '@/lib/api/auth'
import { useAuth } from '@/app/providers'
import { extractToken } from '@/lib/utils/authToken'
import { ADMIN_ROLES } from '@/lib/constants'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      const res = await loginApi({ email, password, cfToken })
      const token = extractToken(res)
      const user = (res as any)?.user || { email }
      login(token!, user)
      const role = user?.role || ''
      const isAdminUser = ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])
      router.replace(isAdminUser ? '/admin/dashboard' : '/dashboard')
    } catch (err: any) {
      const details = err?.details || err?.data?.error?.details || err?.data?.details || {}
      setFieldErrors(details)
      let display = ''
      if (typeof err?.message === 'string') display = err.message
      else if (typeof err?.data?.error?.message === 'string') display = err.data.error.message
      else if (typeof err?.data?.message === 'string') display = err.data.message
      if (!display && Array.isArray(details?.cfToken) && details.cfToken.length) display = details.cfToken[0]
      setError(display || 'Login failed')
      setCfToken('')
      setCaptchaRenderKey((k) => k + 1)
    } finally {
      setLoading(false)
    }
  }

  const emailInvalid = Array.isArray(fieldErrors.email) && fieldErrors.email.length > 0
  const passwordInvalid = Array.isArray(fieldErrors.password) && fieldErrors.password.length > 0
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
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {!siteKey && (
          <div className="alert alert-warning" role="alert">
            Turnstile site key not set. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to your .env.local
          </div>
        )}
        <form id="formAuthentication" className="mb-6" onSubmit={onSubmit}>
          <div className="mb-6 form-control-validation">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="text"
              className={`form-control ${emailInvalid ? 'is-invalid' : ''}`}
              id="email"
              name="email"
              placeholder="Enter your email"
              autoFocus
              maxLength={50}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={emailInvalid}
            />
            {emailInvalid && <div className="invalid-feedback d-block">{fieldErrors.email[0]}</div>}
          </div>
          <div className="mb-6 form-password-toggle form-control-validation">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-group input-group-merge">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`form-control ${passwordInvalid ? 'is-invalid' : ''}`}
                name="password"
                placeholder="••••••••••••"
                maxLength={50}
                aria-describedby="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={passwordInvalid}
              />
              <button
                type="button"
                className="input-group-text bg-transparent"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                <i className={`icon-base bx ${showPassword ? 'bx-show' : 'bx-hide'}`}></i>
              </button>
            </div>
            {passwordInvalid && <div className="invalid-feedback d-block">{fieldErrors.password[0]}</div>}
          </div>

          {/* Cloudflare Turnstile */}
          <div className="mb-6">
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

          <div className="mb-7">
            <div className="d-flex justify-content-between">
              <div className="form-check mb-0">
                <input className="form-check-input" type="checkbox" id="remember-me" />
                <label className="form-check-label" htmlFor="remember-me"> Remember Me </label>
              </div>
              <Link href="/forgot"><span>Forgot Password?</span></Link>
            </div>
          </div>
          <div className="mb-6 d-grid">
            <button className="btn btn-primary" type="submit" disabled={loading || !cfToken}>{loading ? 'Signing in...' : 'Login'}</button>
          </div>
        </form>
        <p className="text-center">
          <span>New on our platform? </span>
          <Link href="/register"><span>Create an account</span></Link>
        </p>
      </div>
    </div>
  )
}
