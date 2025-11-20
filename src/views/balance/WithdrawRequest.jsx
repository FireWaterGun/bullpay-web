import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { listAllWallets } from '../../api/wallets'
import { getBalancesWithFiat } from '../../api/balance'
import { createWithdrawal, estimateWithdrawalFee } from '../../api/withdrawals'
import ConfirmModal from '../../components/ConfirmModal'
import { AmountNormalizer } from '../../utils/amount_normalizer'

function fmtAmount(x, maxFrac = 4) {
  const n = Number(x)
  if (!Number.isFinite(n)) return '0'
  
  // Use toFixed to limit decimals precisely
  let result = n.toFixed(maxFrac)
  
  // Remove trailing zeros and unnecessary decimal point
  result = result.replace(/\.?0+$/, '')
  
  // Add thousands separator
  const parts = result.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  return parts.join('.')
}

function fromRaw(rawValue, decimals) {
  if (!rawValue || !decimals) return '0'
  try {
    // Return string directly from AmountNormalizer - no Number conversion to avoid precision loss
    return AmountNormalizer.fromRawSimple(rawValue, decimals)
  } catch {
    return '0'
  }
}

function getCoinAssetCandidates(symbol, logoUrl) {
  const sym = String(symbol || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const aliases = {
    btc: ['bitcoin'],
    eth: ['ethereum'],
    doge: ['dogecoin'],
    sol: ['solana'],
    matic: ['polygon'],
    pol: ['polygon'],
    ada: ['cardano'],
    xmr: ['monero'],
    zec: ['zcash'],
    usdt: ['usdterc20', 'tether'],
    usdc: ['usd-coin'],
    bnb: ['binance'],
    bsc: ['binance'],
    trx: ['tron'],
    arb: ['arbitrum'],
    op: ['optimism'],
    base: ['base'],
    ln: ['lightning'],
  }
  const names = [sym, ...(aliases[sym] || [])]
  if (sym.startsWith('usdt') && !names.includes('usdt')) names.push('usdt')
  const exts = ['svg', 'png']
  const byAssets = names.flatMap(n => exts.map(ext => `/assets/img/coins/${n}.${ext}`))
  const candidates = [
    ...byAssets,
    ...(logoUrl ? [logoUrl] : []),
    '/assets/img/coins/default.svg',
  ]
  return Array.from(new Set(candidates))
}

function CoinImg({ coin, symbol, networkSymbol, size = 40 }) {
  const [idx, setIdx] = useState(0)
  const [netIdx, setNetIdx] = useState(0)
  // Support logoUrl from coin object
  const logoUrl = coin?.logoUrl || coin?.logo_url
  const candidates = useMemo(
    () => getCoinAssetCandidates(symbol, logoUrl),
    [logoUrl, symbol]
  )
  const networkCandidates = useMemo(
    () => getCoinAssetCandidates(networkSymbol, null),
    [networkSymbol]
  )
  const src = candidates[Math.min(idx, candidates.length - 1)]
  const netSrc = networkCandidates[Math.min(netIdx, networkCandidates.length - 1)]
  const badgeSize = 20

  return (
    <div className="position-relative" style={{ width: size, height: size, display: 'inline-block' }}>
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        className="rounded"
        style={{ objectFit: 'cover' }}
        onError={() => setIdx(i => (i + 1 < candidates.length ? i + 1 : i))}
      />
      {networkSymbol && networkSymbol !== symbol &&
        !(symbol === 'POL' && networkSymbol === 'MATIC') && (
          <div
            className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
            style={{
              bottom: -2,
              right: -2,
              width: badgeSize,
              height: badgeSize,
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '2px'
            }}
          >
            <img
              src={netSrc}
              alt={networkSymbol}
              width={badgeSize - 4}
              height={badgeSize - 4}
              className="rounded-circle"
              style={{ objectFit: 'cover' }}
              onError={() => setNetIdx(i => (i + 1 < networkCandidates.length ? i + 1 : i))}
            />
          </div>
        )}
    </div>
  )
}

export default function WithdrawRequest() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()
  const { coinNetworkId } = useParams()

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

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          setLoading(true)
          // Call balance API with coinNetworkId to get coin and network data in one request
          const [balRes, walletList] = await Promise.all([
            getBalancesWithFiat(token, undefined, coinNetworkId),
            listAllWallets(token, 100, coinNetworkId),
          ])
          if (!mounted) return
          // Get the first balance item (should be the only one since we filtered by coinNetworkId)
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

  // Extract coin and network info from balance response
  const coin = balance?.coin
  const network = balance?.network
  const sym = (coin?.symbol || 'COIN').toUpperCase()
  const networkSym = (network?.symbol || '').toUpperCase()
  const networkLabel = network?.name || 'Network'

  // Get available balance from the balance object
  const available = useMemo(() => {
    if (!balance) return 0
    const decimals = Number(balance?.decimals || 8)
    // Prefer raw values for accurate calculation
    const rawValue = balance?.totalBalanceRaw || balance?.confirmedBalanceRaw || balance?.availableBalanceRaw
    if (rawValue) {
      return Number(fromRaw(rawValue, decimals))
    }
    // Fallback to string values
    return Number(balance?.totalBalance || balance?.confirmedBalance || balance?.availableBalance || balance?.balance || 0) || 0
  }, [balance])

  const matchingWallets = useMemo(() => {
    const id = Number(coinNetworkId)
    return wallets.filter(w => Number(w.coinNetworkId) === id)
  }, [wallets, coinNetworkId])

  useEffect(() => {
    if (!address && matchingWallets.length > 0) {
      const first = matchingWallets[0]
      if (first?.address) setAddress(first.address)
    }
  }, [matchingWallets, address])

  // Prefill amount from the selected wallet's balance if available
  const selectedWallet = useMemo(() => {
    if (address) return matchingWallets.find(w => (w.address || '') === address) || null
    return matchingWallets[0] || null
  }, [matchingWallets, address])

  const decimals = Number(balance?.decimals || 8)
  const amountNum = Number(amount) || 0
  const outcome = Math.max(available - amountNum, 0)

  // Require valid fee estimate before allowing submission
  const canSubmit = amountNum > 0 && amountNum <= available && address.trim().length > 0 && selectedWallet?.id && feeEstimate && !estimatingFee

  const onConfirm = async (e) => {
    e.preventDefault()
    if (!balance || !address || !amount || !selectedWallet?.id || !feeEstimate) return
    try {
      setSubmitting(true)
      await createWithdrawal({
        coinNetworkId: Number(balance.coinNetworkId),
        amount: String(amount),
        withdrawalAddressId: selectedWallet.id,
        memo: '',
      }, token)
      setSuccessOpen(true)
    } catch (err) {
      setErrorMessage(typeof err?.message === 'string' ? err.message : 'Withdrawal failed')
      setErrorOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  const walletAvailable = useMemo(() => {
    const n = Number(selectedWallet?.availableBalance || selectedWallet?.balance || 0)
    return Number.isFinite(n) ? n : 0
  }, [selectedWallet])

  useEffect(() => {
    // Only prefill when the field is empty or zero to avoid overriding user input
    if (amount === '' || Number(amount) === 0) {
      const fill = walletAvailable > 0 ? walletAvailable : available
      if (fill > 0) setAmount(String(fill))
    }
  }, [walletAvailable, available])

  // Estimate fee when amount changes
  useEffect(() => {
    if (!coinNetworkId || !amount || Number(amount) <= 0) {
      setFeeEstimate(null)
      setFeeError('')
      return
    }

    let mounted = true
    const timer = setTimeout(async () => {
      try {
        setEstimatingFee(true)
        setFeeError('')
        const estimate = await estimateWithdrawalFee(coinNetworkId, amount, token)
        if (mounted) {
          setFeeEstimate(estimate)
        }
      } catch (e) {
        if (mounted) {
          setFeeEstimate(null)
          // Extract error message from API response
          const errMsg = e?.error?.message || e?.message || 'Failed to estimate fee'
          setFeeError(errMsg)
        }
      } finally {
        if (mounted) {
          setEstimatingFee(false)
        }
      }
    }, 500) // Debounce 500ms

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [amount, coinNetworkId, token])

  const closeSuccess = () => {
    setSuccessOpen(false)
    navigate('/app/balance/withdrawals', { replace: true })
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
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      navigate('/app/balance/new-address', {
                        state: { returnTo: `/app/balance/withdraw/${encodeURIComponent(coinNetworkId)}` }
                      })
                    }
                  >
                    {t('wallet.goCreate', { defaultValue: 'Withdraw wallet' })}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <div className="text-muted small mb-1">{t('balance.from', { defaultValue: 'From' })}</div>
                    <div className="d-flex align-items-center justify-content-between border rounded-3 p-3">
                      <div className="d-flex align-items-center">
                        <CoinImg coin={coin} symbol={sym} networkSymbol={networkSym} />
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
                    <div className="d-flex justify-content-between align-items-end">
                      <label className="form-label mb-1">{t('balance.amountToWithdraw', { defaultValue: 'Amount to withdraw' })}</label>
                    </div>
                    <div className="input-group">
                      <input type="number" min="0" step={1 / Math.pow(10, Math.min(decimals, 8))} className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`0.0`} />
                      <span className="input-group-text">{sym}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{t('balance.payoutAddress', { defaultValue: 'Payout address' })}</label>
                    <input className="form-control" value={address} disabled readOnly placeholder={t('wallet.addressPlaceholder', { defaultValue: 'Wallet address' })} />
                  </div>

                  {/* Fee breakdown */}
                  {feeEstimate && (
                    <div className="mb-3">
                      <div className="border rounded-3 p-3">
                        <div className="small text-muted mb-2">{t('balance.feeBreakdown', { defaultValue: 'Fee Breakdown' })}</div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="small">{t('balance.withdrawAmount', { defaultValue: 'Withdraw amount' })}</span>
                          <span className="small fw-medium">{fmtAmount(fromRaw(feeEstimate.amountRaw, feeEstimate.decimals), 4)} {sym}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="small">{t('balance.networkFee', { defaultValue: 'Network fee' })}</span>
                          <span className="small">{fmtAmount(fromRaw(feeEstimate.baseFeeRaw, feeEstimate.decimals), 4)} {sym}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="small">{t('balance.platformFee', { defaultValue: 'Platform fee' })} ({feeEstimate.feePercentage}%)</span>
                          <span className="small">{fmtAmount(fromRaw(feeEstimate.percentFeeRaw, feeEstimate.decimals), 4)} {sym}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2 pt-2 border-top">
                          <span className="small">{t('balance.totalFee', { defaultValue: 'Total fee' })}</span>
                          <span className="small fw-medium">-{fmtAmount(fromRaw(feeEstimate.totalFeeRaw, feeEstimate.decimals), 4)} {sym}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-0 pt-2 border-top">
                          <span className="fw-medium">{t('balance.youWillReceive', { defaultValue: 'You will receive' })}</span>
                          <span className="fw-semibold">{fmtAmount(fromRaw(feeEstimate.netAmountRaw, feeEstimate.decimals), 4)} {sym}</span>
                        </div>
                      </div>
                    </div>
                  )}

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

                  <div className="d-flex justify-content-between small">
                    <div>
                      <span className="text-primary">{t('balance.currentBalance', { defaultValue: 'Current balance' })}</span>
                      <div className="fw-medium">{fmtAmount(available, 4)} {sym}</div>
                    </div>
                    <div className="text-end">
                      <span className="text-primary">{t('balance.remainingBalance', { defaultValue: 'Remaining balance' })}</span>
                      <div className="fw-medium">{fmtAmount(outcome, 4)} {sym}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {wallets.length > 0 && matchingWallets.length > 0 && (
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
      <SuccessModalWrapper open={successOpen} onClose={closeSuccess} amount={amount} sym={sym} address={address} t={t} />
      <ErrorModalWrapper open={errorOpen} onClose={closeError} message={errorMessage} t={t} />
    </div>
  )
}

// Success modal
// Show a simple success message and navigate back to withdrawals on close or confirm
; (() => { })

export function SuccessModalWrapper({ open, onClose, amount, sym, address, t }) {
  return (
    <ConfirmModal
      show={open}
      title={t('balance.withdrawSuccessTitle', { defaultValue: 'Withdrawal requested' })}
      message={(
        <>
          <div className="mb-1">{t('balance.withdrawSuccessMsg', { defaultValue: 'Your withdrawal request has been submitted successfully.' })}</div>
          <div className="small text-muted">{t('balance.amount', { defaultValue: 'Amount' })}: {amount} {sym}</div>
          <div className="small text-muted">{t('balance.payoutAddress', { defaultValue: 'Payout address' })}: <span className="font-monospace">{address}</span></div>
        </>
      )}
      confirmText={t('actions.ok', { defaultValue: 'OK' })}
      cancelText={t('actions.close', { defaultValue: 'Close' })}
      onConfirm={onClose}
      onCancel={onClose}
      variant="basic"
      confirmVariant="primary"
      cancelVariant="outline-secondary"
    />
  )
}

// Error modal
export function ErrorModalWrapper({ open, onClose, message, t }) {
  return (
    <ConfirmModal
      show={open}
      title={t('balance.withdrawErrorTitle', { defaultValue: 'Withdrawal Failed' })}
      message={(
        <div>
          {message || t('balance.withdrawErrorMsg', { defaultValue: 'Failed to process withdrawal request.' })}
        </div>
      )}
      confirmText={t('actions.ok', { defaultValue: 'OK' })}
      cancelText={t('actions.cancel', { defaultValue: 'Cancel' })}
      onConfirm={onClose}
      onCancel={onClose}
      variant="basic"
      confirmVariant="danger"
    />
  )
}
