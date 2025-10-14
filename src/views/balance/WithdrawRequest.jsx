import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { listCoins } from '../../api/coins'
import { listAllWallets } from '../../api/wallets'
import { getBalancesWithFiat } from '../../api/balance'
import { createWithdrawal } from '../../api/withdrawals'
import { listNetworks } from '../../api/networks'
import ConfirmModal from '../../components/ConfirmModal'

function fmtAmount(x, maxFrac = 8) {
  const n = Number(x)
  if (!Number.isFinite(n)) return '0'
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac })
}

function getNetworkLabel(n, coin) {
  if (n?.network && typeof n.network === 'object' && n.network.name) return n.network.name
  if (typeof n?.network === 'string') return n.network
  const id = Number(n?.networkId ?? n)
  if (!Number.isFinite(id)) return '-'
  const sym = String(coin?.symbol || coin || '').toUpperCase()
  if (sym === 'BTC') return id === 2 ? 'Lightning' : 'Bitcoin'
  if (sym === 'ETH' && n?.contractAddress) return 'ERC-20'
  return n?.name || 'Network'
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
  const candidates = useMemo(
    () => getCoinAssetCandidates(symbol, coin?.logoUrl),
    [coin?.logoUrl, symbol]
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

  const [coins, setCoins] = useState([])
  const [networks, setNetworks] = useState([])
  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wallets, setWallets] = useState([])

  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const [coinList, networksData, balRes, walletList] = await Promise.all([
          listCoins(token),
          listNetworks(token),
          getBalancesWithFiat(token),
          listAllWallets(token, 100),
        ])
        if (!mounted) return
        setCoins(Array.isArray(coinList) ? coinList : [])
        setNetworks(Array.isArray(networksData) ? networksData : [])
        setBalances(Array.isArray(balRes?.breakdown) ? balRes.breakdown : [])
        setWallets(Array.isArray(walletList) ? walletList : [])
      } catch (e) {
        setError(e?.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [token])

  const cn = useMemo(() => {
    const id = Number(coinNetworkId)
    const coinNetwork = coins.find(c => Number(c.id) === id)
    if (!coinNetwork) return null
    const network = networks.find(n => Number(n.id) === Number(coinNetwork.networkId))
    return { ...coinNetwork, network }
  }, [coins, networks, coinNetworkId])

  const coin = cn?.coin
  const sym = (coin?.symbol || 'COIN').toUpperCase()
  const networkSym = (cn?.network?.symbol || '').toUpperCase()
  const networkLabel = cn?.network?.name || getNetworkLabel(cn, coin)

  const available = useMemo(() => {
    const id = Number(coinNetworkId)
    const b = balances.find(x => Number(x.coinNetworkId) === id)
    return Number(b?.availableBalance || b?.balance || 0) || 0
  }, [balances, coinNetworkId])

  const decimals = Number(cn?.decimals || coin?.decimals || 8)
  const amountNum = Number(amount) || 0
  const outcome = Math.max(available - amountNum, 0)

  const canSubmit = amountNum > 0 && amountNum <= available && address.trim().length > 0

  const onConfirm = async (e) => {
    e.preventDefault()
    if (!cn || !address || !amount) return
    try {
      setSubmitting(true)
      await createWithdrawal({
        coinNetworkId: Number(cn.id),
        amount: String(amount),
        toAddress: address,
        memo: 'Withdrawal request',
      }, token)
      setSuccessOpen(true)
    } catch (err) {
      alert(typeof err?.message === 'string' ? err.message : 'Withdrawal failed')
    } finally {
      setSubmitting(false)
    }
  }

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

  const closeSuccess = () => {
    setSuccessOpen(false)
    navigate('/app/balance/withdrawals', { replace: true })
  }

  return (
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        {loading ? (
          <div className="card"><div className="card-body"><div className="placeholder-glow"><span className="placeholder col-4"></span><span className="placeholder col-8"></span></div></div></div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">{error}</div>
        ) : !cn ? (
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
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-end">
                      <label className="form-label mb-1">{t('balance.amountToWithdraw', { defaultValue: 'Amount to withdraw' })}</label>
                    </div>
                    <div className="input-group">
                      <input type="number" min="0" step={1/Math.pow(10, Math.min(decimals, 8))} className="form-control" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder={`0.0`} />
                      <span className="input-group-text">{sym}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">{t('balance.payoutAddress', { defaultValue: 'Payout address' })}</label>
                    <input className="form-control" value={address} disabled readOnly placeholder={t('wallet.addressPlaceholder', { defaultValue: 'Wallet address' })} />
                  </div>

                  {/* Address list removed per request; auto-filled from first matching wallet */}

                  <div className="d-flex justify-content-between small">
                    <div>
                      <span className="text-primary">{t('balance.currentBalance', { defaultValue: 'Current balance' })}</span>
                      <div className="fw-medium">{fmtAmount(available, decimals)} {sym}</div>
                    </div>
                    <div className="text-end">
                      <span className="text-primary">{t('balance.outcomeBalance', { defaultValue: 'Outcome balance' })}</span>
                      <div className="fw-medium">{fmtAmount(outcome, decimals)} {sym}</div>
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
    </div>
  )
}

// Success modal
// Show a simple success message and navigate back to withdrawals on close or confirm
;(() => {})

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
