import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Turnstile from 'react-turnstile'
import { registerApi } from '../../api/auth.ts'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(50, 'Password must be at most 50 characters')
  .regex(/[a-z]/, 'At least one lowercase letter')
  .regex(/[A-Z]/, 'At least one uppercase letter')
  .regex(/[0-9]/, 'At least one number')
  .regex(/[^A-Za-z0-9]/, 'At least one special character')

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(50, 'Full name must be at most 50 characters'),
  email: z.string().email('Invalid email address').max(50, 'Email must be at most 50 characters'),
  password: passwordSchema,
  confirmPassword: z.string().max(50, 'Confirm Password must be at most 50 characters')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const [cfToken, setCfToken] = useState('')
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiFieldErrors, setApiFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
  const theme = 'light'

  const { register, handleSubmit, formState: { errors, isValid }, setError: setFormError, watch } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' }
  })

  const onSubmit = async (values) => {
    setError('')
    setApiFieldErrors({})
    setLoading(true)
    try {
      await registerApi({ ...values, cfToken })
      navigate('/register-complete', { replace: true, state: { email: values.email } })
    } catch (err) {
      const details = err?.details || err?.data?.error?.details || err?.data?.details || {}
      setApiFieldErrors(details)
      // Map API field errors to form where possible
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
      setCaptchaRenderKey((k)=>k+1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">
          <div className="card px-sm-6 px-0">
            <div className="card-body">
              <div className="app-brand justify-content-center mb-6">
                <a href="#" className="app-brand-link gap-2"><span className="app-brand-text demo text-heading fw-bold">Bull Pay</span></a>
              </div>
              <h4 className="mb-1">Adventure starts here 🚀</h4>
              <p className="mb-6">Make your app management easy and fun!</p>
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              <form id="formAuthentication" className="mb-6" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="mb-6 form-control-validation">
                  <label htmlFor="fullName" className="form-label">Full name</label>
                  <input type="text" className={`form-control ${errors.fullName ? 'is-invalid' : ''}`} id="fullName" placeholder="John Doe" maxLength={50} {...register('fullName')} />
                  {errors.fullName && <div className="invalid-feedback d-block">{errors.fullName.message}</div>}
                </div>
                <div className="mb-6 form-control-validation">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} id="email" placeholder="Enter your email" maxLength={50} {...register('email')} />
                  {errors.email && <div className="invalid-feedback d-block">{errors.email.message}</div>}
                </div>
                <div className="mb-6 form-password-toggle form-control-validation">
                  <label className="form-label" htmlFor="password">Password</label>
                  <div className="input-group input-group-merge">
                    <input type={showPassword ? 'text' : 'password'} id="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} placeholder="••••••••••••" aria-describedby="password" maxLength={50} {...register('password')} />
                    <button type="button" className="input-group-text bg-transparent" onClick={() => setShowPassword((v)=>!v)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                      <i className={`icon-base bx ${showPassword ? 'bx-show' : 'bx-hide'}`}></i>
                    </button>
                  </div>
                  {errors.password && <div className="invalid-feedback d-block">{errors.password.message}</div>}
                </div>
                <div className="mb-6 form-password-toggle form-control-validation">
                  <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-group input-group-merge">
                    <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} placeholder="••••••••••••" aria-describedby="confirmPassword" maxLength={50} {...register('confirmPassword')} />
                    <button type="button" className="input-group-text bg-transparent" onClick={() => setShowConfirmPassword((v)=>!v)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} aria-pressed={showConfirmPassword}>
                      <i className={`icon-base bx ${showConfirmPassword ? 'bx-show' : 'bx-hide'}`}></i>
                    </button>
                  </div>
                  {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword.message}</div>}
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
                        options={{ theme, appearance: 'always', size: 'flexible' }}
                      />
                    </div>
                  )}
                </div>

                <button className="btn btn-primary d-grid w-100" type="submit" disabled={loading || !cfToken || !isValid}>{loading ? 'Submitting...' : 'Sign up'}</button>
              </form>
              <p className="text-center"><span>Already have an account?</span> <Link to="/login"><span>Sign in instead</span></Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
