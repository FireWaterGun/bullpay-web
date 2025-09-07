import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { listCoins, getCoinNetworksBySymbol } from '../../api/coins'
import { createWallet } from '../../api/wallets'

function getCoinAssetCandidates(symbol, logoUrl) {
  const sym = String(symbol || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const aliases = {
    btc: ['bitcoin'], eth: ['ethereum'], doge: ['dogecoin'], sol: ['solana'], matic: ['polygon'], ada: ['cardano'], xmr: ['monero'], zec: ['zcash'],
    usdt: ['usdterc20', 'tether'], usdttrc20: ['usdt', 'tether'], usdterc20: ['usdt', 'tether'], usdtbsc: ['usdt', 'tether'], usdtbep20: ['usdt', 'tether'], usdte: ['usdt', 'tether'], usdtton: ['usdtton', 'usdt', 'tether'],
  }
  const names = [sym, ...(aliases[sym] || [])]
  if (sym.startsWith('usdt') && !names.includes('usdt')) names.push('usdt')
  const exts = ['svg', 'png']
  const byAssets = names.flatMap(n => exts.map(ext => `/assets/img/coins/${n}.${ext}`))
  const candidates = [...byAssets, ...(logoUrl ? [logoUrl] : []), '/assets/img/coins/default.svg']
  return Array.from(new Set(candidates))
}

function CoinImg({ coin, symbol, size = 36 }) {
  const [idx, setIdx] = useState(0)
  const candidates = useMemo(() => getCoinAssetCandidates(symbol, coin?.logoUrl), [coin?.logoUrl, symbol])
  const src = candidates[Math.min(idx, candidates.length - 1)]
  return <img src={src} alt={symbol} width={size} height={size} className="rounded" onError={() => setIdx(i => (i + 1 < candidates.length ? i + 1 : i))} />
}

const NETWORK_LABELS = { 1: 'Bitcoin', 2: 'Lightning', 10: 'Ethereum', 11: 'ERC-20', 20: 'BSC (BEP-20)', 21: 'BEP-20', 30: 'TRON (TRC-20)', 31: 'TRC-20', 40: 'Polygon', 50: 'Solana', 60: 'TON', 61: 'TON (Jetton)', 70: 'Base', 80: 'Arbitrum', 90: 'Optimism', 100: 'Avalanche C-Chain' }
function getNetworkLabel(n, coin) {
  if (n?.networkName) return n.networkName
  if (n?.network && typeof n.network === 'object' && n.network.name) return n.network.name
  if (typeof n?.network === 'string') return n.network
  const id = Number(n?.networkId)
  if (NETWORK_LABELS[id]) return NETWORK_LABELS[id]
  const sym = String(coin?.symbol || '').toUpperCase()
  if (sym === 'BTC') return id === 2 ? 'Lightning' : 'Bitcoin'
  if (sym === 'ETH' && n?.contractAddress) return 'ERC-20'
  return `Network #${n?.networkId ?? '-'}`
}

export default function WalletCreate() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [coins, setCoins] = useState([])
  const [loadingCoins, setLoadingCoins] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState('')
  const [networks, setNetworks] = useState([])
  const [coinNetworkId, setCoinNetworkId] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingCoins(true)
        const data = await listCoins(token)
        if (!mounted) return
        setCoins(data || [])
        const bySymbol = {}
        for (const c of data || []) {
          const sym = c.coin?.symbol || `COIN-${c.coinId}`
          if (!bySymbol[sym]) bySymbol[sym] = { coin: c.coin, items: [] }
          bySymbol[sym].items.push(c)
        }
        const keys = Object.keys(bySymbol)
        if (keys.length) {
          const first = keys[0]
          setSelectedCoin(first)
          if (bySymbol[first]?.items?.length === 1) setCoinNetworkId(String(bySymbol[first].items[0].id))
        }
      } catch (e) {
        // ignore
      } finally {
        setLoadingCoins(false)
      }
    })()
    return () => { mounted = false }
  }, [token])

  const grouped = useMemo(() => {
    const bySymbol = {}
    for (const c of coins) {
      const sym = c.coin?.symbol || `COIN-${c.coinId}`
      if (!bySymbol[sym]) bySymbol[sym] = { coin: c.coin, items: [] }
      bySymbol[sym].items.push(c)
    }
    return bySymbol
  }, [coins])

  useEffect(() => {
    async function fetchNetworks() {
      try {
        if (!selectedCoin) { setNetworks([]); return }
        const data = await getCoinNetworksBySymbol(selectedCoin, token)
        setNetworks(Array.isArray(data) ? data : [])
        if (Array.isArray(data) && data.length === 1) setCoinNetworkId(String(data[0].id))
        else if (!data.some(n => String(n.id) === String(coinNetworkId))) setCoinNetworkId('')
      } catch (e) {
        setNetworks([])
      }
    }
    fetchNetworks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoin])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!coinNetworkId || !address) {
      setError(t('validation.requiredFields') || 'Please fill required fields')
      return
    }
    try {
      setSaving(true)
  await createWallet({ coinNetworkId: Number(coinNetworkId), address: address.trim() }, token)
  navigate('/app/balance/withdrawals')
    } catch (e) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Step 1: Select Coin */}
        <div className="card mb-4">
          <div className="card-header d-flex align-items-center">
            <span className="badge bg-primary rounded-pill me-2">1</span>
            <h6 className="mb-0">{t('form.selectCoin')}</h6>
          </div>
          <div className="card-body">
            {loadingCoins ? (
              <div className="text-muted">{t('invoices.loading')}</div>
            ) : (
              <div className="row g-3">
                {Object.entries(grouped).map(([sym, group]) => {
                  const isActive = selectedCoin === sym
                  const networksCount = group.items.length
                  return (
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={sym}>
                      <div
                        role="button"
                        className={`card h-100 border-2 rounded-3 overflow-hidden ${isActive ? 'border-primary bg-label-primary shadow-sm' : 'border-2'}`}
                        onClick={() => {
                          setSelectedCoin(sym)
                          if (!group.items.some(i => String(i.id) === String(coinNetworkId))) setCoinNetworkId('')
                        }}
                      >
                        <div className="card-body d-flex align-items-center gap-3">
                          <CoinImg coin={group.coin} symbol={sym} />
                          <div>
                            <div className="fw-bold">{sym}</div>
                            <div className="text-muted small">{group.coin?.name || ''}</div>
                            <div className="text-muted small">{t('form.networksCount', { count: networksCount })}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {coins.length === 0 && <div className="col-12 text-muted">{t('common.noData') || 'No coins'}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Select Network */}
        <div className="card mb-4">
          <div className="card-header d-flex align-items-center">
            <span className="badge bg-primary rounded-pill me-2">2</span>
            <h6 className="mb-0">{t('form.selectNetwork')}</h6>
          </div>
          <div className="card-body">
            {selectedCoin ? (
              <div className="d-flex flex-wrap gap-2">
                {networks.map(n => {
                  const selected = String(coinNetworkId) === String(n.id)
                  const label = getNetworkLabel(n, { symbol: selectedCoin })
                  return (
                    <button
                      type="button"
                      key={n.id}
                      className={`btn ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setCoinNetworkId(String(n.id))}
                    >
                      {label}
                    </button>
                  )
                })}
                {networks.length === 0 && <div className="text-muted small">{t('common.noData')}</div>}
              </div>
            ) : (
              <div className="text-muted">{t('form.selectCoin')}</div>
            )}
          </div>
        </div>

        {/* Step 3: Address + Save */}
        <form onSubmit={onSubmit} className="card">
          <div className="card-header d-flex align-items-center">
            <span className="badge bg-primary rounded-pill me-2">3</span>
            <h6 className="mb-0">{t('wallet.enterAddress', { defaultValue: 'Enter address' })}</h6>
          </div>
          <div className="card-body">
            <input type="hidden" name="coinNetworkId" value={coinNetworkId} />
            <div className="row g-3">
              <div className="col-12 col-md-8 col-lg-6">
                <label className="form-label">{t('wallet.address', { defaultValue: 'Address' })}</label>
                <input
                  className="form-control"
                  placeholder={t('wallet.addressPlaceholder', { defaultValue: 'Wallet address' })}
                  maxLength={128}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="card-footer d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)} disabled={saving}>
              {t('actions.back') || 'Back'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (t('common.saving') || 'Saving...') : t('wallet.saveAddress', { defaultValue: 'Save address' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
