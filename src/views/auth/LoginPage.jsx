import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Turnstile from 'react-turnstile'
import { loginApi } from '../../api/auth.ts'
import { useAuth } from '../../context/AuthContext'
import { extractToken } from '../../utils/authToken'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cfToken, setCfToken] = useState('')
  const [captchaRenderKey, setCaptchaRenderKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Use only real site key from env; if missing, show warning (no test fallback)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
  // Use dark to match default dark theme
  const theme = 'dark'

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      const res = await loginApi({ email, password, cfToken })
      const token = extractToken(res)
      const user = res?.user || { email }
      login(user, token)
      navigate('/app', { replace: true })
    } catch (err) {
      const details = err?.details || err?.data?.error?.details || err?.data?.details || {}
      setFieldErrors(details)
      let display = ''
      if (typeof err?.message === 'string') display = err.message
      else if (typeof err?.data?.error?.message === 'string') display = err.data.error.message
      else if (typeof err?.data?.message === 'string') display = err.data.message
      if (!display && Array.isArray(details?.cfToken) && details.cfToken.length) display = details.cfToken[0]
      setError(display || 'Login failed')
      // Force re-render Turnstile so user gets a fresh challenge
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
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">
          <div className="card px-sm-6 px-0">
            <div className="card-body">
              <div className="app-brand justify-content-center">
                <a href="#" className="app-brand-link gap-2">
                  <span className="app-brand-text demo text-heading fw-bold">BULL PAY</span>
                </a>
              </div>
              {/* Removed welcome heading and subtitle per requirement */}
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
              {!siteKey && (
                <div className="alert alert-warning" role="alert">
                  Turnstile site key not set. Add VITE_TURNSTILE_SITE_KEY to your .env.local
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
                    onChange={(e)=>setEmail(e.target.value)}
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
                      onChange={(e)=>setPassword(e.target.value)}
                      aria-invalid={passwordInvalid}
                    />
                    <button
                      type="button"
                      className="input-group-text bg-transparent"
                      onClick={() => setShowPassword((v)=>!v)}
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
                        options={{ theme, appearance: 'always', size: 'flexible' }}
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
                    <Link to="/forgot"><span>Forgot Password?</span></Link>
                  </div>
                </div>
                <div className="mb-6 d-grid">
                  <button className="btn btn-primary" type="submit" disabled={loading || !cfToken}>{loading ? 'Signing in...' : 'Login'}</button>
                </div>
              </form>
              <p className="text-center">
                <span>New on our platform?</span>
                <Link to="/register"><span>Create an account</span></Link>
              </p>
              {/* Social sign-in removed per requirement */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
