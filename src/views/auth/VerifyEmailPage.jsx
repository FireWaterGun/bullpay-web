import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { verifyEmailApi } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

export default function VerifyEmailPage() {
  const location = useLocation()
  const [status, setStatus] = useState('pending') // 'pending' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const [errorDetails, setErrorDetails] = useState(null)
  const [errorCode, setErrorCode] = useState('')
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const { token, email } = useMemo(() => {
    const qs = new URLSearchParams(location.search || '')
    const t = qs.get('verify_token') || qs.get('token') || ''
    const e = qs.get('verify_email') || qs.get('email') || ''
    return { token: t, email: e }
  }, [location.search])

  const runVerify = useCallback(async () => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token.')
      return
    }
    setStatus('pending')
    try {
      const res = await verifyEmailApi({ token, email: email || undefined })
      const ok = (res && (res.success === true || !res.error)) || false
      setStatus(ok ? 'success' : 'error')
      const msg = (res && (res.message || res.title)) || (ok ? 'Your email has been verified.' : 'Verification failed.')
      setMessage(msg)
    } catch (err) {
      const m = err?.message || 'Verification failed.'
      setStatus('error')
      setMessage(m)
      setErrorDetails(err?.details || err?.data?.details || null)
      setErrorCode(err?.code || err?.data?.code || '')
    }
  }, [token, email])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (cancelled) return
      await runVerify()
    })()
    return () => { cancelled = true }
  }, [runVerify])

  const onBack = useCallback(() => {
    // Avoid relying on history which may have been replaced; go to a safe destination.
    navigate(isAuthenticated ? '/app' : '/login', { replace: true })
  }, [navigate, isAuthenticated])

  const iconClass = status === 'success' ? 'bx bx-check' : status === 'error' ? 'ti ti-alert-triangle' : 'ti ti-loader-2'
  const isInvalidToken = useMemo(() => {
    if (status !== 'error') return false
    const m = (message || '').toLowerCase()
    if (errorCode && ['INVALID_TOKEN', 'BIZ_1202', 'TOKEN_INVALID'].includes(String(errorCode).toUpperCase())) return true
    return (m.includes('invalid') && (m.includes('token') || m.includes('verification'))) || m.includes('invalid verification token')
  }, [status, message, errorCode])

  const badgeClass = status === 'success' ? 'bg-success text-white shadow-sm' : status === 'error' ? 'bg-label-danger' : 'bg-label-info'
  const title = status === 'success'
    ? 'Email verified!'
    : status === 'error'
      ? (isInvalidToken ? 'Invalid verification link' : 'Verification failed')
      : 'Verifying your email…'

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner py-4">
          <div className="card">
            <div className="card-body text-center">
              <div
                className={`mx-auto mb-3 d-inline-flex align-items-center justify-content-center rounded-circle ${status === 'success' ? 'bg-success-subtle' : ''}`}
                style={{ width: status === 'success' ? 80 : 64, height: status === 'success' ? 80 : 64 }}
              >
                <span
                  className={`badge badge-center rounded-pill ${badgeClass}`}
                  style={{ width: status === 'success' ? 56 : 48, height: status === 'success' ? 56 : 48 }}
                >
                  <i className={iconClass} style={{ fontSize: status === 'success' ? 28 : 24 }} />
                </span>
              </div>
              <h4 className="mb-1">{title}</h4>
              <p className="mb-2 text-body-secondary">
                {status === 'pending'
                  ? 'Please wait a moment while we confirm your email.'
                  : isInvalidToken
                    ? 'Your verification link is invalid or expired. Please request a new verification email and try again.'
                    : (message || 'Verification failed. Please try again later.')}
              </p>
              {!!email && <p className="mb-4 text-body-secondary small">{email}</p>}

              <div className="d-flex flex-wrap gap-2 justify-content-center mt-1">
                {status === 'success' && (
                  <Link to="/login" className="btn btn-primary">
                    Proceed to Login
                  </Link>
                )}
                {status === 'error' && !isInvalidToken && (
                  <>
                    <button type="button" className="btn btn-outline-primary" onClick={onBack}>
                      Back
                    </button>
                    <Link to="/register" className="btn btn-outline-secondary">
                      Register
                    </Link>
                  </>
                )}
                {status === 'error' && isInvalidToken && (
                  <>
                    <Link to="/login" className="btn btn-outline-primary">
                      Go to Login
                    </Link>
                    <Link to="/register" className="btn btn-outline-secondary">
                      Register
                    </Link>
                  </>
                )}
                {status === 'pending' && (
                  <button type="button" className="btn btn-outline-secondary" disabled>
                    Checking...
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
