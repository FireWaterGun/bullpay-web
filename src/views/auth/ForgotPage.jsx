import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Turnstile from 'react-turnstile'
import { forgotPasswordApi } from '../../api/auth.ts'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

export default function ForgotPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [cfToken, setCfToken] = useState('')
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
  const theme = 'dark'

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      await forgotPasswordApi({ email, cfToken })
      navigate('/forgot-complete', { replace: true, state: { email } })
    } catch (err) {
      const details = err?.details || err?.data?.error?.details || err?.data?.details || {}
      setFieldErrors(details)
      let display = ''
      if (typeof err?.message === 'string') display = err.message
      else if (typeof err?.data?.error?.message === 'string') display = err.data.error.message
      else if (typeof err?.data?.message === 'string') display = err.data.message
      if (!display && Array.isArray(details?.cfToken) && details.cfToken.length) display = details.cfToken[0]
      setError(display || 'Request failed')
      setCfToken('')
      setCaptchaRenderKey((k)=>k+1)
    } finally {
      setLoading(false)
    }
  }

  const emailInvalid = Array.isArray(fieldErrors.email) && fieldErrors.email.length > 0
  const captchaInvalid = Array.isArray(fieldErrors.cfToken) && fieldErrors.cfToken.length > 0

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">
          <div className="card px-sm-6 px-0">
            <div className="card-body">
              <div className="app-brand justify-content-center">
                <a href="#" className="app-brand-link gap-2"><span className="app-brand-text demo text-heading fw-bold">Bull Pay</span></a>
              </div>
              <h4 className="mb-1">Forgot Password? 🔒</h4>
              <p className="mb-6">Enter your email and we'll send you instructions to reset your password</p>
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              <form id="formAuthentication" className="mb-6" onSubmit={onSubmit}>
                <div className="mb-6 form-control-validation">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input type="text" className={`form-control ${emailInvalid ? 'is-invalid' : ''}`} id="email" name="email" placeholder="Enter your email" autoFocus value={email} onChange={(e)=>setEmail(e.target.value)} aria-invalid={emailInvalid} />
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
                        options={{ theme, appearance: 'always', size: 'flexible' }}
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
                <Link to="/login" className="d-flex justify-content-center"><i className="icon-base bx bx-chevron-left scaleX-n1-rtl me-1"></i>Back to login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
