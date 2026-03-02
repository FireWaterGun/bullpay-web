'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import { listAllWallets } from '@/lib/api/wallets'
import { getBalancesWithFiat } from '@/lib/api/balance'
import { createWithdrawal, estimateWithdrawalFee } from '@/lib/api/withdrawals'
import Verify2FAModal from '@/components/Verify2FAModal'
import use2FAStatus from '@/hooks/use2FAStatus'
import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import { formatCoinAmount } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg'
import WithdrawFeeBreakdown from './WithdrawFeeBreakdown'
import { SuccessModalWrapper, ErrorModalWrapper } from './WithdrawRequestModals'


export default function WithdrawRequest() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const router = useRouter()
  const params = useParams()
  const coinNetworkId = params?.coinNetworkId

  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wallets, setWallets] = useState([])

  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [feeEstimate, setFeeEstimate] = useState(null)
  const [estimatingFee, setEstimatingFee] = useState(false)
  const [feeError, setFeeError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [show2FAModal, setShow2FAModal] = useState(false)

  const { isEnabled: is2FAEnabled, isLoading: is2FALoading } = use2FAStatus()

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          setLoading(true)
          const [balRes, walletList] = await Promise.all([
            getBalancesWithFiat(token, undefined, coinNetworkId),
            listAllWallets(token, 100, coinNetworkId),
          ])
          if (!mounted) return
          const balanceItem = Array.isArray(balRes?.breakdown) && balRes.breakdown.length > 0
            ? balRes.breakdown[0]
            : null
          setBalance(balanceItem)
          setWallets(Array.isArray(walletList) ? walletList : [])
        } catch (e) {
          setError(e?.message || 'Failed to load data')
        } finally {
          setLoading(false)
        }
      })()
    return () => { mounted = false }
  }, [token, coinNetworkId])

  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltips = Array.from(tooltipTriggerList).map(tooltipTriggerEl => {
      if (window.bootstrap && window.bootstrap.Tooltip) {
        return new window.bootstrap.Tooltip(tooltipTriggerEl, {
          delay: { show: 100, hide: 0 }
        })
      }
      return null
    }).filter(Boolean)

    return () => {
      tooltips.forEach(tooltip => tooltip.dispose())
    }
  }, [feeEstimate])

  const coin = balance?.coin
  const network = balance?.network
  const sym = (coin?.symbol || 'COIN').toUpperCase()
  const networkSym = (network?.symbol || '').toUpperCase()
  const networkLabel = network?.name || 'Network'

  const available = useMemo(() => {
    if (!balance) return 0
    const decimals = Number(balance?.decimals || 8)
    const rawValue = balance?.availableBalanceRaw
    if (rawValue) {
      return Number(AmountNormalizer.fromRawSimple(rawValue, decimals)) || 0
    }
    return Number(balance?.availableBalance || 0) || 0
  }, [balance])

  const matchingWallets = useMemo(() => {
    const id = Number(coinNetworkId)
    return wallets.filter(w => Number(w.coinNetworkId) === id)
  }, [wallets, coinNetworkId])

  // Derive default address from first matching wallet (no useEffect needed)
  const defaultAddress = matchingWallets.length > 0 ? (matchingWallets[0]?.address || '') : ''
  const effectiveAddress = address || defaultAddress

  const selectedWallet = useMemo(() => {
    if (address) return matchingWallets.find(w => (w.address || '') === address) || null
    if (effectiveAddress) return matchingWallets.find(w => (w.address || '') === effectiveAddress) || null
    return matchingWallets[0] || null
  }, [matchingWallets, address, effectiveAddress])

  const decimals = Number(balance?.decimals || 8)
  const amountNum = Number(effectiveAmount) || 0

  const canSubmit = amountNum > 0 && amountNum <= available && effectiveAddress.trim().length > 0 && selectedWallet?.id && feeEstimate && !estimatingFee && !is2FALoading

  const executeWithdrawal = async (twoFactorCode) => {
    if (!balance || !effectiveAddress || !effectiveAmount || !selectedWallet?.id || !feeEstimate) return
    try {
      setSubmitting(true)
      await createWithdrawal({
        coinNetworkId: Number(balance.coinNetworkId),
        amount: String(effectiveAmount),
        withdrawalAddressId: selectedWallet.id,
        memo: '',
        ...(twoFactorCode ? { twoFactorCode } : {}),
      }, token)
      setSuccessOpen(true)
    } catch (err) {
      setErrorMessage(typeof err?.message === 'string' ? err.message : 'Withdrawal failed')
      setErrorOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  const onConfirm = async (e) => {
    e.preventDefault()
    if (!balance || !effectiveAddress || !effectiveAmount || !selectedWallet?.id || !feeEstimate) return

    if (is2FAEnabled) {
      setShow2FAModal(true)
      return
    }

    await executeWithdrawal()
  }

  const handle2FASuccess = async (code) => {
    setShow2FAModal(false)
    await executeWithdrawal(code)
  }

  const walletAvailable = useMemo(() => {
    const n = Number(selectedWallet?.availableBalance || selectedWallet?.balance || 0)
    return Number.isFinite(n) ? n : 0
  }, [selectedWallet])

  // Derive initial amount from wallet/available balance (no useEffect needed)
  const effectiveAmount = useMemo(() => {
    if (amount !== '' && Number(amount) !== 0) return amount
    const fill = walletAvailable > 0 ? walletAvailable : available
    return fill > 0 ? String(fill) : amount
  }, [amount, walletAvailable, available])

  useEffect(() => {
    if (!coinNetworkId || !effectiveAmount || Number(effectiveAmount) <= 0) {
      setFeeEstimate(null)
      setFeeError('')
      return
    }

    let mounted = true
    const timer = setTimeout(async () => {
      try {
        setEstimatingFee(true)
        setFeeError('')
        const estimate = await estimateWithdrawalFee(coinNetworkId, effectiveAmount, token)
        if (mounted) {
          setFeeEstimate(estimate)
        }
      } catch (e) {
        if (mounted) {
          setFeeEstimate(null)
          const errMsg = e?.error?.message || e?.message || 'Failed to estimate fee'
          setFeeError(errMsg)
        }
      } finally {
        if (mounted) {
          setEstimatingFee(false)
        }
      }
    }, 500)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [effectiveAmount, coinNetworkId, token])

  const closeSuccess = () => {
    setSuccessOpen(false)
    setTimeout(() => {
      router.push('/withdrawals')
    }, 300)
  }

  const closeError = () => {
    setErrorOpen(false)
    setErrorMessage('')
  }

  return (
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        {loading ? (
          <div className="card"><div className="card-body"><div className="placeholder-glow"><span className="placeholder col-4"></span><span className="placeholder col-8"></span></div></div></div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">{error}</div>
        ) : !balance ? (
          <div className="alert alert-warning" role="alert">{t('common.noData') || 'Not found'}</div>
        ) : !is2FALoading && !is2FAEnabled ? (
          <div className="card mx-auto" style={{ maxWidth: 520 }}>
            <div className="card-body text-center py-5">
              <div className="mb-4">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10" style={{ width: 80, height: 80 }}>
                  <i className="bx bx-shield-x text-warning" style={{ fontSize: '2.5rem' }}></i>
                </div>
              </div>
              <h5 className="mb-2">{t('balance.require2FATitle', { defaultValue: 'Two-Factor Authentication Required' })}</h5>
              <p className="text-muted mb-4">
                {t('balance.require2FADesc', { defaultValue: 'For your security, please enable Two-Factor Authentication (2FA) before making withdrawals.' })}
              </p>
              <Link
                href="/settings"
                className="btn btn-primary"
              >
                <i className="bx bx-lock me-2"></i>
                {t('balance.setup2FA', { defaultValue: 'Setup 2FA' })}
              </Link>
            </div>
          </div>
        ) : (
          <div className="card mx-auto" style={{ maxWidth: 520 }}>
            <div className="card-header">
              <h5 className="mb-0">{t('balance.requestWithdraw', { defaultValue: 'Request withdraw' })}</h5>
            </div>
            <div className="card-body">
              {wallets.length === 0 || matchingWallets.length === 0 ? (
                <div className="text-center py-3">
                  <h6 className="mb-2">{t('wallet.requiredWithdrawTitle', { defaultValue: 'Withdrawal address required' })}</h6>
                  <p className="text-muted mb-3">{t('wallet.requiredWithdrawDesc', { defaultValue: 'To withdraw, please add a withdrawal wallet address first.' })}</p>
                  <Link
                    href="/wallet/new-address"
                    className="btn btn-primary"
                  >
                    {t('wallet.goCreate', { defaultValue: 'Withdraw wallet' })}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <div className="text-muted small mb-1">{t('balance.from', { defaultValue: 'From' })}</div>
                    <div className="d-flex align-items-center justify-content-between border rounded-3 p-3">
                      <div className="d-flex align-items-center">
                        <CoinImg coin={coin} symbol={sym} networkSymbol={networkSym} size={40} imgClassName="rounded" />
                        <div className="ms-3">
                          <div className="fw-semibold">{sym}</div>
                          <div className="text-muted small">{networkLabel}</div>
                        </div>
                      </div>
                      {networkLabel && (
                        <span className="badge bg-danger-subtle text-danger">{t('wallet.colNetwork', { defaultValue: 'Network' })}</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{t('balance.payoutAddress', { defaultValue: 'Payout address' })}</label>
                    <input className="form-control" value={effectiveAddress} disabled readOnly placeholder={t('wallet.addressPlaceholder', { defaultValue: 'Wallet address' })} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{t('balance.amount', { defaultValue: 'Amount' })}</label>
                    <div className="position-relative">
                      <input
                        type="number"
                        min="0"
                        max={available}
                        step={1 / Math.pow(10, Math.min(decimals, 8))}
                        className="form-control form-control-lg"
                        value={effectiveAmount}
                        onChange={(e) => {
                          const value = e.target.value
                          const numValue = Number(value)
                          if (value === '' || (numValue >= 0 && numValue <= available)) {
                            setAmount(value)
                            setAmountError('')
                          } else if (numValue > available) {
                            setAmountError(t('balance.amountExceedsBalance', { defaultValue: 'Amount exceeds available balance' }))
                          }
                        }}
                        placeholder="0.0"
                        style={{ paddingRight: '80px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-link position-absolute top-50 end-0 translate-middle-y me-2 text-primary text-decoration-none"
                        onClick={() => setAmount(String(available))}
                        style={{ fontSize: '0.875rem' }}
                      >
                        Max
                      </button>
                    </div>
                    <div className="text-muted small mt-2">
                      {t('balance.balance', { defaultValue: 'Balance' })}: {formatCoinAmount(available)} {sym}
                    </div>
                    {amountError && (
                      <div className="text-danger small mt-1">
                        <i className="bx bx-error-circle me-1"></i>
                        {amountError}
                      </div>
                    )}
                  </div>

                  <WithdrawFeeBreakdown feeEstimate={feeEstimate} sym={sym} t={t} />

                  {estimatingFee && !feeEstimate && (
                    <div className="mb-3 text-center">
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      <span className="small text-muted">{t('balance.calculatingFee', { defaultValue: 'Calculating fee...' })}</span>
                    </div>
                  )}

                  {feeError && !estimatingFee && (
                    <div className="mb-3">
                      <div className="alert alert-danger py-2 px-3 mb-0" role="alert">
                        <i className="bx bx-error-circle me-1"></i>
                        <span className="small">{feeError}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {wallets.length > 0 && matchingWallets.length > 0 && !successOpen && (
              <div className="card-footer">
                <button className="btn btn-primary w-100" onClick={onConfirm} disabled={!canSubmit || submitting}>
                  {submitting ? (<span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>) : null}
                  {t('actions.confirm', { defaultValue: 'Confirm' })}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <SuccessModalWrapper open={successOpen} onClose={closeSuccess} receiveAmount={feeEstimate?.display?.netAmount || effectiveAmount} sym={sym} address={effectiveAddress} networkName={networkLabel} t={t} />
      <ErrorModalWrapper open={errorOpen} onClose={closeError} message={errorMessage} t={t} />

      <Verify2FAModal
        show={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSuccess={handle2FASuccess}
        title={t('balance.confirm2FATitle', { defaultValue: 'Confirm Withdrawal' })}
        description={t('balance.confirm2FADescription', { defaultValue: 'Enter your 2FA code to confirm this withdrawal' })}
        skipVerify={true}
      />
    </div>
  )
}
