'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'

const Turnstile = dynamic(() => import('react-turnstile').then((m) => m.Turnstile), { ssr: false })

interface CredentialsFormProps {
  loading: boolean
  error: string
  onSubmit: (data: { email: string; password: string; cfToken: string }) => Promise<void>
}

export default function CredentialsForm({ loading, error, onSubmit }: CredentialsFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [cfToken, setCfToken] = useState('')
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

  const emailInvalid = Array.isArray(fieldErrors.email) && fieldErrors.email.length > 0
  const passwordInvalid = Array.isArray(fieldErrors.password) && fieldErrors.password.length > 0
  const captchaInvalid = Array.isArray(fieldErrors.cfToken) && fieldErrors.cfToken.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})

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

    try {
      await onSubmit({ email, password, cfToken })
    } catch (err: any) {
      const details = err?.details || err?.data?.error?.details || err?.data?.details || {}
      setFieldErrors(details)
      setCfToken('')
      setCaptchaRenderKey((k) => k + 1)
      throw err
    }
  }

  return (
    <>
      {!siteKey && (
        <Alert variant="warning" className="mb-4">
          Turnstile site key not set. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to your .env.local
        </Alert>
      )}
      <form className="space-y-5" onSubmit={handleSubmit} suppressHydrationWarning>
        {/* Email */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            type="text"
            id="email"
            name="email"
            placeholder="Enter your email"
            autoFocus
            maxLength={50}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={emailInvalid}
            suppressHydrationWarning
            error={emailInvalid}
          />
          {emailInvalid ? <p className="mt-1 text-sm text-danger-500">{fieldErrors.email[0]}</p> : null}
        </div>

        {/* Password */}
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              placeholder="••••••••••••"
              maxLength={50}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={passwordInvalid}
              suppressHydrationWarning
              error={passwordInvalid}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <i className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} text-lg`}></i>
            </button>
          </div>
          {passwordInvalid ? <p className="mt-1 text-sm text-danger-500">{fieldErrors.password[0]}</p> : null}
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
                onError={() => setCfToken('')}
                onExpire={() => setCfToken('')}
              />
            </div>
          )}
          {captchaInvalid ? <p className="mt-2 text-sm text-danger-500">CAPTCHA: {fieldErrors.cfToken[0]}</p> : null}
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
              className={`flex items-center justify-center w-[18px] h-[18px] shrink-0 mr-2.5 rounded-[4px] border-[1.5px] transition-colors ${
                rememberMe ? 'bg-primary-600 border-primary-600 text-white' : 'bg-card border-surface-300'
              }`}
            >
              {rememberMe && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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
        <Button type="submit" disabled={loading || !cfToken} className="w-full">
          {loading ? 'Signing in...' : 'Login'}
        </Button>
      </form>

      <p className="text-center mt-6 text-sm text-surface-500">
        New on our platform?{' '}
        <Link href="/register" className="font-medium">
          Create an account
        </Link>
      </p>
    </>
  )
}
