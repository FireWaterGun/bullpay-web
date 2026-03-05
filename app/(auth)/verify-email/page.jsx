'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyEmailApi } from '@/lib/api/auth'
import { useAuth } from '@/app/providers'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="spinner text-primary-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('pending')
  const [message, setMessage] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const router = useRouter()
  const { token: authToken } = useAuth()
  const isAuthenticated = !!authToken

  const token = searchParams.get('verify_token') || searchParams.get('token') || ''
  const email = searchParams.get('verify_email') || searchParams.get('email') || ''

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
      setErrorCode(err?.code || err?.data?.code || '')
    }
  }, [token, email])

  const calledRef = useRef(false)
  useEffect(() => {
    if (!calledRef.current) {
      calledRef.current = true
      runVerify()
    }
  }, [runVerify])

  const onBack = useCallback(() => {
    router.replace(isAuthenticated ? '/dashboard' : '/login')
  }, [router, isAuthenticated])

  const isInvalidToken = useMemo(() => {
    if (status !== 'error') return false
    const m = (message || '').toLowerCase()
    if (errorCode && ['INVALID_TOKEN', 'BIZ_1202', 'TOKEN_INVALID'].includes(String(errorCode).toUpperCase())) return true
    return (m.includes('invalid') && (m.includes('token') || m.includes('verification'))) || m.includes('invalid verification token')
  }, [status, message, errorCode])

  const title = status === 'success'
    ? 'Email verified!'
    : status === 'error'
      ? (isInvalidToken ? 'Invalid verification link' : 'Verification failed')
      : 'Verifying your email...'

  return (
    <div className="py-4">
      <div className="bg-white rounded-[20px] border border-surface-200 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(37,99,235,0.06)]">
        <div className="p-8 sm:p-10 text-center">
          {/* Status icon */}
          <div className="flex justify-center mb-4">
            {status === 'success' && (
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-success-500 text-white flex items-center justify-center shadow-sm">
                  <i className="bx bx-check text-3xl"></i>
                </div>
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-danger-500/15 text-danger-500 flex items-center justify-center">
                  <i className="bx bx-error-circle text-2xl"></i>
                </div>
              </div>
            )}
            {status === 'pending' && (
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
                <div className="spinner text-primary-600"></div>
              </div>
            )}
          </div>

          <h4 className="text-xl font-semibold mb-1">{title}</h4>
          <p className="text-sm text-surface-500 mb-2">
            {status === 'pending'
              ? 'Please wait a moment while we confirm your email.'
              : isInvalidToken
                ? 'Your verification link is invalid or expired. Please request a new verification email and try again.'
                : (message || 'Verification failed. Please try again later.')}
          </p>
          {!!email && <p className="text-xs text-surface-400 mb-4">{email}</p>}

          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {status === 'success' && (
              <Link href="/login" className="btn btn-primary">
                Proceed to Login
              </Link>
            )}
            {status === 'error' && !isInvalidToken && (
              <>
                <button type="button" className="btn btn-outline-primary" onClick={onBack}>
                  Back
                </button>
                <Link href="/register" className="btn btn-outline-secondary">
                  Register
                </Link>
              </>
            )}
            {status === 'error' && isInvalidToken && (
              <>
                <Link href="/login" className="btn btn-outline-primary">
                  Go to Login
                </Link>
                <Link href="/register" className="btn btn-outline-secondary">
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
  )
}
