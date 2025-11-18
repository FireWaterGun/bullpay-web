import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyWalletAddress } from '../../api/wallets'
import { useAuth } from '../../context/AuthContext'

export default function WalletVerify() {
  const { t } = useTranslation()
  const { token: authToken } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verificationToken = searchParams.get('token')
    
    if (!verificationToken) {
      setVerifying(false)
      setError(t('wallet.verify.noToken', { defaultValue: 'Verification token is missing' }))
      return
    }

    let mounted = true
    
    ;(async () => {
      try {
        setVerifying(true)
        const res = await verifyWalletAddress({ token: verificationToken }, authToken)
        
        if (!mounted) return
        
        if (res?.success) {
          setSuccess(true)
          setMessage(res?.message || t('wallet.verify.success', { defaultValue: 'Wallet address verified successfully' }))
        } else {
          setSuccess(false)
          setError(res?.message || t('wallet.verify.failed', { defaultValue: 'Verification failed' }))
        }
      } catch (e) {
        if (!mounted) return
        setSuccess(false)
        setError(typeof e?.message === 'string' ? e.message : t('wallet.verify.error', { defaultValue: 'An error occurred during verification' }))
      } finally {
        if (mounted) setVerifying(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [searchParams, authToken, t])

  const handleGoToWallets = () => {
    navigate('/app/balance/withdrawals')
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card">
            <div className="card-body text-center py-5">
              {verifying ? (
                <>
                  <div className="mb-4">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                  <h4 className="mb-2">{t('wallet.verify.verifying', { defaultValue: 'Verifying...' })}</h4>
                  <p className="text-muted">
                    {t('wallet.verify.verifyingDesc', { defaultValue: 'Please wait while we verify your wallet address' })}
                  </p>
                </>
              ) : success ? (
                <>
                  <div className="mb-4">
                    <div 
                      className="rounded-circle d-inline-flex align-items-center justify-content-center bg-label-success"
                      style={{ width: '80px', height: '80px' }}
                    >
                      <i className="bx bx-check" style={{ fontSize: '3rem' }}></i>
                    </div>
                  </div>
                  <h4 className="mb-2 text-success">
                    {t('wallet.verify.successTitle', { defaultValue: 'Verification Successful!' })}
                  </h4>
                  <p className="text-muted mb-4">
                    {message || t('wallet.verify.successDesc', { defaultValue: 'Your wallet address has been verified successfully. You can now use it for withdrawals.' })}
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={handleGoToWallets}
                  >
                    {t('wallet.verify.goToWallets', { defaultValue: 'Go to Wallets' })}
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <div 
                      className="rounded-circle d-inline-flex align-items-center justify-content-center bg-label-danger"
                      style={{ width: '80px', height: '80px' }}
                    >
                      <i className="bx bx-x" style={{ fontSize: '3rem' }}></i>
                    </div>
                  </div>
                  <h4 className="mb-2 text-danger">
                    {t('wallet.verify.failedTitle', { defaultValue: 'Verification Failed' })}
                  </h4>
                  <p className="text-muted mb-4">
                    {error || t('wallet.verify.failedDesc', { defaultValue: 'Unable to verify your wallet address. The verification link may be invalid or expired.' })}
                  </p>
                  <div className="d-flex gap-2 justify-content-center">
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={handleGoToWallets}
                    >
                      {t('wallet.verify.goToWallets', { defaultValue: 'Go to Wallets' })}
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigate('/app/balance/new-address')}
                    >
                      {t('wallet.verify.addNewAddress', { defaultValue: 'Add New Address' })}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
