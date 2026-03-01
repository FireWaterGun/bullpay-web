'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { verifyWalletAddress } from '@/lib/api/wallets'

export default function WalletVerify() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const verifyToken = searchParams?.get('token') || ''
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (verifyToken) handleVerify()
  }, [verifyToken])

  async function handleVerify() {
    try {
      setLoading(true)
      await verifyWalletAddress({ token: verifyToken }, token)
      setVerified(true)
      toast.success(t('wallets.verifySuccess', { defaultValue: 'Address verified successfully!' }))
    } catch (err) {
      setError(err?.message || t('wallets.verifyError', { defaultValue: 'Verification failed' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="row justify-content-center">
        <div className="col-lg-6 col-xl-4">
          <div className="card">
            <div className="card-body text-center py-5">
              {loading ? (
                <>
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted">
                    {t('wallets.verifying', { defaultValue: 'Verifying your address...' })}
                  </p>
                </>
              ) : verified ? (
                <>
                  <i className="bx bx-check-circle text-success mb-3" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mb-2">
                    {t('wallets.verified', { defaultValue: 'Address Verified!' })}
                  </h5>
                  <p className="text-muted mb-3">
                    {t('wallets.verifiedDesc', { defaultValue: 'Your withdrawal address has been verified successfully.' })}
                  </p>
                  <Link href="/withdrawals" className="btn btn-primary">
                    {t('wallets.goToWallets', { defaultValue: 'Go to Wallets' })}
                  </Link>
                </>
              ) : error ? (
                <>
                  <i className="bx bx-error-circle text-danger mb-3" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mb-2">
                    {t('wallets.verifyFailed', { defaultValue: 'Verification Failed' })}
                  </h5>
                  <p className="text-muted mb-3">{error}</p>
                  <Link href="/withdrawals" className="btn btn-primary">
                    {t('wallets.goToWallets', { defaultValue: 'Go to Wallets' })}
                  </Link>
                </>
              ) : (
                <>
                  <i className="bx bx-link text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted">
                    {t('wallets.noToken', { defaultValue: 'No verification token found.' })}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
