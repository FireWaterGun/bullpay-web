'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const Turnstile = dynamic(() => import('react-turnstile').then(m => m.Turnstile), { ssr: false })
import { loginApi, verify2FALoginApi } from '@/lib/api/auth'
import { useAuth } from '@/app/providers'
import { extractToken } from '@/lib/utils/authToken'
import { ADMIN_ROLES } from '@/lib/constants'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  // ── Step 1: credentials ──
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cfToken, setCfToken] = useState('')
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0)

  // ── Step 2: 2FA ──
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials')
  const [tempToken, setTempToken] = useState('')
  const [twoFACode, setTwoFACode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const twoFAInputRef = useRef<HTMLInputElement>(null)

  // ── Shared state ──
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [backupCodeWarning, setBackupCodeWarning] = useState('')

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
  const theme = 'light'

  /**
   * Complete the login after receiving a full token
   */
  const completeLogin = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res: any) => {
      const token = extractToken(res)
      const user = res?.user || { email }
      login(token!, user)
      const role = user?.role || ''
      const isAdminUser = ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])
      router.replace(isAdminUser ? '/admin/dashboard' : '/dashboard')
    },
    [email, login, router]
  )

  /**
   * Extract error message from API error
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractErrorMessage = (err: any): string => {
    if (typeof err?.message === 'string') return err.message
    if (typeof err?.data?.error?.message === 'string') return err.data.error.message
    if (typeof err?.data?.message === 'string') return err.data.message
    return ''
  }

  /**
   * Step 1: Submit email + password + CAPTCHA
   */
  const onSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      const res = (await loginApi({ email, password, cfToken })) as any

      // Check if 2FA is required
      if (res?.requires2FA) {
        setTempToken(res.tempToken as string)
        setStep('2fa')
        setTwoFACode('')
        setUseBackupCode(false)
        setTimeout(() => twoFAInputRef.current?.focus(), 100)
        return
      }

      // Normal login — no 2FA
      completeLogin(res)
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any
      const details = error?.details || error?.data?.error?.details || error?.data?.details || {}
      setFieldErrors(details)
      const display = extractErrorMessage(error)
      if (!display && Array.isArray(details?.cfToken) && details.cfToken.length)
        setError(details.cfToken[0])
      else setError(display || 'Login failed')
      setCfToken('')
      setCaptchaRenderKey((k) => k + 1)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Step 2: Submit 2FA code
   */
  const onSubmit2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBackupCodeWarning('')

    const code = twoFACode.trim()
    if (!useBackupCode && !/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit code')
      return
    }
    if (useBackupCode && !code) {
      setError('Please enter a backup code')
      return
    }

    setLoading(true)
    try {
      const res = (await verify2FALoginApi({ tempToken, code })) as any

      // Check if a backup code was used — show warning
      if (res?.isBackupCode) {
        const remaining = res.remainingBackupCodes as number
        setBackupCodeWarning(
          `Backup code used. ${remaining} backup code${remaining !== 1 ? 's' : ''} remaining.`
        )
      }

      completeLogin(res)
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any
      let display = extractErrorMessage(error)

      // Handle rate limiting
      const retryAfter = error?.data?.error?.retryAfterSeconds ?? error?.data?.retryAfterSeconds
      if (retryAfter) {
        display = `Too many attempts. Please try again in ${retryAfter} seconds`
      }

      setError(display || '2FA verification failed')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Go back to credentials step
   */
  const goBackToCredentials = () => {
    setStep('credentials')
    setTempToken('')
    setTwoFACode('')
    setError('')
    setBackupCodeWarning('')
    setCfToken('')
    setCaptchaRenderKey((k) => k + 1)
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
        {backupCodeWarning && (
          <div className="alert alert-warning" role="alert">{backupCodeWarning}</div>
        )}

        {/* ── Step 1: Credentials ── */}
        {step === 'credentials' && (
          <>
            {!siteKey && (
              <div className="alert alert-warning" role="alert">
                Turnstile site key not set. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to your .env.local
              </div>
            )}
            <form id="formAuthentication" className="mb-6" onSubmit={onSubmitCredentials}>
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
                {emailInvalid && (
                  <div className="invalid-feedback d-block">{fieldErrors.email[0]}</div>
                )}
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
                {passwordInvalid && (
                  <div className="invalid-feedback d-block">{fieldErrors.password[0]}</div>
                )}
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
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={loading || !cfToken}
                >
                  {loading ? 'Signing in...' : 'Login'}
                </button>
              </div>
            </form>
            <p className="text-center">
              <span>New on our platform? </span>
              <Link href="/register"><span>Create an account</span></Link>
            </p>
          </>
        )}

        {/* ── Step 2: Two-Factor Authentication ── */}
        {step === '2fa' && (
          <>
            <div className="text-center mb-4">
              <div className="mb-2">
                <i
                  className="bx bx-shield-quarter text-primary"
                  style={{ fontSize: '48px' }}
                ></i>
              </div>
              <h5 className="mb-1">Two-Factor Authentication</h5>
              <p className="text-muted mb-0">
                {useBackupCode
                  ? 'Enter one of your backup codes'
                  : 'Enter the 6-digit code from your authenticator app'}
              </p>
            </div>

            <form id="form2FA" className="mb-6" onSubmit={onSubmit2FA}>
              <div className="mb-6">
                <label htmlFor="twoFACode" className="form-label">
                  {useBackupCode ? 'Backup Code' : 'Authentication Code'}
                </label>
                <input
                  ref={twoFAInputRef}
                  type="text"
                  className="form-control text-center"
                  id="twoFACode"
                  placeholder={useBackupCode ? 'ABCD-EFGH' : '000000'}
                  maxLength={useBackupCode ? 20 : 6}
                  autoComplete="one-time-code"
                  inputMode={useBackupCode ? 'text' : 'numeric'}
                  pattern={useBackupCode ? undefined : '[0-9]*'}
                  value={twoFACode}
                  onChange={(e) => {
                    if (useBackupCode) {
                      setTwoFACode(e.target.value)
                    } else {
                      // Only allow digits for TOTP
                      setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                  }}
                  autoFocus
                  style={
                    useBackupCode
                      ? {}
                      : { fontSize: '24px', letterSpacing: '8px', fontWeight: 600 }
                  }
                />
              </div>

              <div className="mb-6 d-grid">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={loading || !twoFACode.trim()}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>

            <div className="text-center">
              <button
                type="button"
                className="btn btn-link btn-sm p-0 mb-2"
                onClick={() => {
                  setUseBackupCode(!useBackupCode)
                  setTwoFACode('')
                  setError('')
                }}
              >
                {useBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
              </button>
              <br />
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-muted"
                onClick={goBackToCredentials}
              >
                <i className="bx bx-arrow-back me-1"></i>
                Back to login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
