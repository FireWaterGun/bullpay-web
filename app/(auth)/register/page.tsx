'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const Turnstile = dynamic(() => import('react-turnstile').then((m) => m.Turnstile), { ssr: false })
import { registerApi } from '@/lib/api/auth'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(50, 'Password must be at most 50 characters')
  .regex(/[a-z]/, 'At least one lowercase letter')
  .regex(/[A-Z]/, 'At least one uppercase letter')
  .regex(/[0-9]/, 'At least one number')
  .regex(/[^A-Za-z0-9]/, 'At least one special character')

const schema = z
  .object({
    fullName: z.string().min(1, 'Full name is required').max(50, 'Full name must be at most 50 characters'),
    email: z.string().email('Invalid email address').max(50, 'Email must be at most 50 characters'),
    password: passwordSchema,
    confirmPassword: z.string().max(50, 'Confirm Password must be at most 50 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [cfToken, setCfToken] = useState('')
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError: setFormError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: FormValues) => {
    setError('')
    setLoading(true)
    try {
      await registerApi({ ...values, cfToken })
      try {
        sessionStorage.setItem('register_email', values.email)
      } catch {}
      router.replace('/register-complete')
    } catch (err: any) {
      const details = err?.details || err?.data?.error?.details || err?.data?.details || {}
      if (details?.password?.[0]) setFormError('password', { message: details.password[0] })
      if (details?.confirmPassword?.[0]) setFormError('confirmPassword', { message: details.confirmPassword[0] })
      if (details?.email?.[0]) setFormError('email', { message: details.email[0] })
      let display = ''
      if (typeof err?.message === 'string') display = err.message
      else if (typeof err?.data?.error?.message === 'string') display = err.data.error.message
      else if (typeof err?.data?.message === 'string') display = err.data.message
      if (!display && Array.isArray(details?.cfToken) && details.cfToken.length) display = details.cfToken[0]
      setError(display || 'Register failed')
      setCfToken('')
      setCaptchaRenderKey((k) => k + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-[20px] border border-surface-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(37,99,235,0.06)]">
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

        <h4 className="text-xl font-semibold mb-1">Create your account</h4>
        <p className="text-sm text-surface-500 mb-6">Start accepting crypto payments in minutes</p>

        {error ? <Alert className="mb-4">{error}</Alert> : null}

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Full name */}
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              type="text"
              id="fullName"
              placeholder="John Doe"
              maxLength={50}
              {...register('fullName')}
              error={errors.fullName}
            />

            {errors.fullName ? <p className="mt-1 text-sm text-danger-500">{errors.fullName.message}</p> : null}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              placeholder="Enter your email"
              maxLength={50}
              {...register('email')}
              error={errors.email}
            />

            {errors.email ? <p className="mt-1 text-sm text-danger-500">{errors.email.message}</p> : null}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••••••"
                maxLength={50}
                {...register('password')}
                error={errors.password}
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
            {errors.password ? <p className="mt-1 text-sm text-danger-500">{errors.password.message}</p> : null}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="••••••••••••"
                maxLength={50}
                {...register('confirmPassword')}
                error={errors.confirmPassword}
                className="pr-10"
              />

              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`bx ${showConfirmPassword ? 'bx-show' : 'bx-hide'} text-lg`}></i>
              </button>
            </div>
            {errors.confirmPassword ? <p className="mt-1 text-sm text-danger-500">{errors.confirmPassword.message}</p> : null}
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
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading || !cfToken || !isValid} className="w-full">
            {loading ? 'Submitting...' : 'Sign up'}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-surface-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium">
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  )
}
