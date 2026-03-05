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
  const [rememberMe, setRememberMe] = useState(false)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractErrorMessage = (err: any): string => {
    if (typeof err?.message === 'string') return err.message
    if (typeof err?.data?.error?.message === 'string') return err.data.error.message
    if (typeof err?.data?.message === 'string') return err.data.message
    return ''
  }

  const onSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    // Client-side validation
    const errors: Record<string, string[]> = {}
    if (!email.trim()) errors.email = ['Email is required']
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = ['Please enter a valid email']
    if (!password) errors.password = ['Password is required']
    else if (password.length < 6) errors.password = ['Password must be at least 6 characters']
    if (!cfToken) errors.cfToken = ['Please complete the CAPTCHA']

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = (await loginApi({ email, password, cfToken })) as any

      if (res?.requires2FA) {
        setTempToken(res.tempToken as string)
        setStep('2fa')
        setTwoFACode('')
        setUseBackupCode(false)
        setTimeout(() => twoFAInputRef.current?.focus(), 100)
        return
      }

      completeLogin(res)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const details = err?.details || err?.data?.error?.details || err?.data?.details || {}
      setFieldErrors(details)
      const display = extractErrorMessage(err)
      if (!display && Array.isArray(details?.cfToken) && details.cfToken.length)
        setError(details.cfToken[0])
      else setError(display || 'Login failed')
      setCfToken('')
      setCaptchaRenderKey((k) => k + 1)
    } finally {
      setLoading(false)
    }
  }

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = (await verify2FALoginApi({ tempToken, code })) as any

      if (res?.isBackupCode) {
        const remaining = res.remainingBackupCodes as number
        setBackupCodeWarning(
          `Backup code used. ${remaining} backup code${remaining !== 1 ? 's' : ''} remaining.`
        )
      }

      completeLogin(res)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      let display = extractErrorMessage(err)

      const retryAfter = err?.data?.error?.retryAfterSeconds ?? err?.data?.retryAfterSeconds
      if (retryAfter) {
        display = `Too many attempts. Please try again in ${retryAfter} seconds`
      }

      setError(display || '2FA verification failed')
    } finally {
      setLoading(false)
    }
  }

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
    <div className="bg-white rounded-[20px] border border-surface-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(37,99,235,0.06)]">
      <div className="p-8 sm:p-10">
        {/* Brand */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <i className="bx bxs-wallet-alt text-2xl text-primary-600"></i>
            <span className="font-bold text-2xl tracking-tight">
              <span className="text-surface-900">BULL</span>
              <span className="text-primary-600">PAY</span>
            </span>
          </Link>
        </div>

        {error && <div className="alert alert-danger mb-4">{error}</div>}
        {backupCodeWarning && <div className="alert alert-warning mb-4">{backupCodeWarning}</div>}

        {/* ── Step 1: Credentials ── */}
        {step === 'credentials' && (
          <>
            {!siteKey && (
              <div className="alert alert-warning mb-4">
                Turnstile site key not set. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to your .env.local
              </div>
            )}
            <form className="space-y-5" onSubmit={onSubmitCredentials} suppressHydrationWarning>
              {/* Email */}
              <div>
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="text"
                  className={`form-input ${emailInvalid ?'!border-danger-500' : ''}`}
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  autoFocus
                  maxLength={50}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={emailInvalid}
                  suppressHydrationWarning
                />
                {emailInvalid && (
                  <p className="mt-1 text-sm text-danger-500">{fieldErrors.email[0]}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`form-input pr-10 ${passwordInvalid ?'!border-danger-500' : ''}`}
                    name="password"
                    placeholder="••••••••••••"
                    maxLength={50}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={passwordInvalid}
                    suppressHydrationWarning
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`bx ${showPassword ?'bx-show' : 'bx-hide'} text-lg`}></i>
                  </button>
                </div>
                {passwordInvalid && (
                  <p className="mt-1 text-sm text-danger-500">{fieldErrors.password[0]}</p>
                )}
              </div>

              {/* Captcha */}
              <div>
                {siteKey && (
                  <div className="rounded-[10px] overflow-hidden">
                    <Turnstile
                      key={captchaRenderKey}
                      sitekey={siteKey}
                      theme="light"
                      appearance="always"
                      size="flexible"
                      onVerify={(token) => setCfToken(token)}
                      onError={() => setError('CAPTCHA failed, please try again')}
                      onExpire={() => setCfToken('')}
                    />
                  </div>
                )}
                {captchaInvalid && (
                  <p className="mt-2 text-sm text-danger-500">CAPTCHA: {fieldErrors.cfToken[0]}</p>
                )}
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center cursor-pointer select-none bg-transparent border-0 p-0"
                >
                  <span
                    className={`flex items-center justify-center w-[18px] h-[18px] shrink-0 mr-2.5 rounded-[4px] border-[1.5px] transition-colors ${ rememberMe ?'bg-primary-600 border-primary-600 text-white'
                        : 'bg-white border-surface-300'
                    }`}
                  >
                    {rememberMe && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm text-surface-600">Remember Me</span>
                </button>
                <Link href="/forgot" className="text-sm font-medium">
                  Forgot Password?
                </Link>
              </div>

              {/* Submit */}
              <button
                className="btn btn-primary w-full"
                type="submit"
                disabled={loading || !cfToken}
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-surface-500">
              New on our platform?{' '}
              <Link href="/register" className="font-medium">Create an account</Link>
            </p>
          </>
        )}

        {/* ── Step 2: Two-Factor Authentication ── */}
        {step === '2fa' && (
          <>
            <div className="text-center mb-6">
              <div className="mb-3">
                <i className="bx bx-shield-quarter text-primary-600 text-5xl"></i>
              </div>
              <h5 className="text-lg font-semibold mb-1">Two-Factor Authentication</h5>
              <p className="text-sm text-surface-500">
                {useBackupCode
                  ? 'Enter one of your backup codes'
                  : 'Enter the 6-digit code from your authenticator app'}
              </p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit2FA}>
              <div>
                <label htmlFor="twoFACode" className="form-label">
                  {useBackupCode ? 'Backup Code' : 'Authentication Code'}
                </label>
                <input
                  ref={twoFAInputRef}
                  type="text"
                  className="form-input text-center"
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

              <button
                className="btn btn-primary w-full"
                type="submit"
                disabled={loading || !twoFACode.trim()}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            <div className="text-center mt-6 space-y-2">
              <button
                type="button"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors cursor-pointer"
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
                className="text-sm text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
                onClick={goBackToCredentials}
              >
                <i className="bx bx-arrow-back mr-1"></i>
                Back to login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
