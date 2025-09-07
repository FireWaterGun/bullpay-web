import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getWallet, updateWallet, deleteWallet } from '../../api/wallets'
import ConfirmModal from '../../components/ConfirmModal'
import { listCoins, getCoinNetworksBySymbol } from '../../api/coins'

function getCoinAssetCandidates(symbol, logoUrl) {
  const sym = String(symbol || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const aliases = {
    btc: ['bitcoin'],
    eth: ['ethereum'],
    doge: ['dogecoin'],
    sol: ['solana'],
    matic: ['polygon'],
    ada: ['cardano'],
    xmr: ['monero'],
    zec: ['zcash'],
    // USDT and network-specific variants
    usdt: ['usdterc20', 'tether'],
    usdttrc20: ['usdt', 'tether'],
    usdterc20: ['usdt', 'tether'],
    usdtbsc: ['usdt', 'tether'],
    usdtbep20: ['usdt', 'tether'],
    usdte: ['usdt', 'tether'],
    usdtton: ['usdtton', 'usdt', 'tether'],
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

export default function WalletEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { token } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [address, setAddress] = useState('')
  const [coinNetworkId, setCoinNetworkId] = useState('')
  const [coins, setCoins] = useState([])
  const [selectedCoin, setSelectedCoin] = useState('')
  const [networks, setNetworks] = useState([])
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const coinMetaBySymbol = useMemo(() => {
    const m = {}
    for (const c of coins) {
      const sym = c.coin?.symbol
      if (sym && !m[sym]) m[sym] = c.coin
    }
    return m
  }, [coins])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const [w, list] = await Promise.all([
          getWallet(id, token),
          listCoins(token),
        ])
        if (!mounted) return
        setCoins(list || [])
        if (w) {
          setAddress(w.address || '')
          const cnId = String(w.coinNetworkId || '')
          setCoinNetworkId(cnId)
          // Derive selected coin by matching coinNetworkId in list
          const found = (list || []).find(cn => String(cn.id) === cnId)
          if (found?.coin?.symbol) setSelectedCoin(found.coin.symbol)
        }
      } catch (e) {
        if (!mounted) return
        setError(typeof e?.message === 'string' ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id, token])

  useEffect(() => {
    async function fetchNetworks() {
      try {
        if (!selectedCoin) { setNetworks([]); return }
        const data = await getCoinNetworksBySymbol(selectedCoin, token)
        setNetworks(Array.isArray(data) ? data : [])
      } catch {
        setNetworks([])
      }
    }
    fetchNetworks()
  }, [selectedCoin, token])

  const grouped = useMemo(() => {
    const bySymbol = {}
    for (const c of coins) {
      const sym = c.coin?.symbol || `COIN-${c.coinId}`
      if (!bySymbol[sym]) bySymbol[sym] = { coin: c.coin, items: [] }
      bySymbol[sym].items.push(c)
    }
    return bySymbol
  }, [coins])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      setSaving(true)
      await updateWallet(id, { coinNetworkId: Number(coinNetworkId), address: address.trim() }, token)
      navigate('/app/wallets')
    } catch (e) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    try {
      setSaving(true)
      await deleteWallet(id, token)
      navigate('/app/wallets')
    } catch (e) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="content-wrapper"><div className="container-xxl container-p-y">{t('invoices.loading')}</div></div>

  return (
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={onSubmit} className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">{t('wallet.editTitle', { defaultValue: 'Edit wallet' })}</h6>
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={onDelete} disabled={saving}>{t('actions.delete') || 'Delete'}</button>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">{t('form.coin')}</label>
                <div className="row g-2">
                  {Object.entries(grouped).map(([sym, group]) => {
                    const isActive = selectedCoin === sym
                    return (
                      <div className="col-6 col-md-4 col-lg-3" key={sym}>
                        <div role="button" className={`card h-100 border-2 ${isActive ? 'border-primary bg-label-primary' : ''}`} onClick={() => setSelectedCoin(sym)}>
                          <div className="card-body d-flex align-items-center gap-2">
                            <CoinImg coin={coinMetaBySymbol[sym] || group.coin} symbol={sym} />
                            <div className="fw-bold">{sym}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">{t('form.network')}</label>
                <div className="d-flex flex-wrap gap-2">
                  {networks.map(n => (
                    <button key={n.id} type="button" className={`btn ${String(coinNetworkId) === String(n.id) ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setCoinNetworkId(String(n.id))}>
                      {n.networkName || n.network?.name || n.network || n.id}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">{t('wallet.address')}</label>
                <input className="form-control" value={address} onChange={(e)=>setAddress(e.target.value)} maxLength={128} />
              </div>
            </div>
          </div>
          <div className="card-footer d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={()=>navigate(-1)} disabled={saving}>{t('actions.back') || 'Back'}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? (t('common.saving') || 'Saving...') : (t('actions.save') || 'Save')}</button>
          </div>
        </form>
        <ConfirmModal
          show={confirmOpen}
          title={t('actions.delete') || 'Delete'}
          message={t('wallet.confirmDelete', { defaultValue: 'Delete this wallet?' })}
          confirmText={t('actions.delete') || 'Delete'}
          cancelText={t('actions.back') || 'Back'}
          busy={saving}
          onConfirm={confirmDelete}
          onCancel={() => !saving && setConfirmOpen(false)}
        />
      </div>
    </div>
  )
}
