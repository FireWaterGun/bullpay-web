'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loginApi, verify2FALoginApi } from '@/lib/api/auth'
import { useAuth } from '@/app/providers'
import { extractToken } from '@/lib/utils/authToken'
import { ADMIN_ROLES_SET } from '@/lib/constants'
import Alert from '@/components/ui/Alert'
import CredentialsForm from './CredentialsForm'
import TwoFactorForm from './TwoFactorForm'

function extractErrorMessage(err: any): string {
  if (typeof err?.message === 'string') return err.message
  if (typeof err?.data?.error?.message === 'string') return err.data.error.message
  if (typeof err?.data?.message === 'string') return err.data.message
  return ''
}

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<'credentials' | '2fa'>('credentials')
  const [tempToken, setTempToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [backupCodeWarning, setBackupCodeWarning] = useState('')
  const [sessionReplacedWarning, setSessionReplacedWarning] = useState(false)

  // Detect if user was kicked due to login on another device
  useEffect(() => {
    try {
      if (sessionStorage.getItem('session_replaced') === '1') {
        setSessionReplacedWarning(true)
        sessionStorage.removeItem('session_replaced')
      }
    } catch {
      // sessionStorage may not be available
    }
  }, [])

  const completeLogin = useCallback(
    (res: any) => {
      const token = extractToken(res)
      const user = res?.user || {}
      const sessionId = res?.security?.sessionId as string | undefined
      login(token!, user, sessionId)
      const role = user?.role || ''
      const isAdminUser = ADMIN_ROLES_SET.has(role)
      router.replace(isAdminUser ? '/admin/dashboard' : '/dashboard')
    },
    [login, router]
  )

  const onSubmitCredentials = async (data: { email: string; password: string; cfToken: string }) => {
    setError('')
    setLoading(true)
    try {
      const res = (await loginApi(data)) as any

      if (res?.requires2FA) {
        setTempToken(res.tempToken as string)
        setStep('2fa')
        return
      }

      completeLogin(res)
    } catch (err: any) {
      const display = extractErrorMessage(err)
      const details = err?.details || err?.data?.error?.details || err?.data?.details || {}
      if (!display && Array.isArray(details?.cfToken) && details.cfToken.length) {
        setError(details.cfToken[0])
      } else {
        setError(display || 'Login failed')
      }
      throw err
    } finally {
      setLoading(false)
    }
  }

  const onSubmit2FA = async (code: string) => {
    setError('')
    setBackupCodeWarning('')
    setLoading(true)
    try {
      const res = (await verify2FALoginApi({ tempToken, code })) as any

      if (res?.isBackupCode) {
        const remaining = res.remainingBackupCodes as number
        setBackupCodeWarning(`Backup code used. ${remaining} backup code${remaining !== 1 ? 's' : ''} remaining.`)
      }

      completeLogin(res)
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
    setError('')
    setBackupCodeWarning('')
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

        {error ? <Alert className="mb-4">{error}</Alert> : null}
        {sessionReplacedWarning && (
          <Alert variant="warning" className="mb-4">
            Your session was ended because your account was signed in on another device.
          </Alert>
        )}
        {backupCodeWarning && (
          <Alert variant="warning" className="mb-4">
            {backupCodeWarning}
          </Alert>
        )}

        {step === 'credentials' && (
          <CredentialsForm loading={loading} error={error} onSubmit={onSubmitCredentials} />
        )}

        {step === '2fa' && (
          <TwoFactorForm loading={loading} onSubmit={onSubmit2FA} onBack={goBackToCredentials} />
        )}
      </div>
    </div>
  )
}
