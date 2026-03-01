'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { useAuth, useToast } from '@/app/providers'
import { listCoins } from '@/lib/api/coins'
import { createWallet } from '@/lib/api/wallets'
import CoinImg from '@/components/CoinImg'

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

export default function WalletNewAddressPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const router = useRouter()

  const [coins, setCoins] = useState([])
  const [loadingCoins, setLoadingCoins] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState('')
  const [networks, setNetworks] = useState([])
  const [coinNetworkId, setCoinNetworkId] = useState('')
  const [address, setAddress] = useState('')
  const [label, setLabel] = useState('')
  const [memo, setMemo] = useState('')
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
    if (!selectedCoin) {
      setNetworks([])
      setCoinNetworkId('')
      return
    }

    const group = grouped[selectedCoin]
    if (group && group.items) {
      setNetworks(group.items)

      // Auto-select if only one network
      if (group.items.length === 1) {
        setCoinNetworkId(String(group.items[0].id))
      } else if (!group.items.some((i) => String(i.id) === String(coinNetworkId))) {
        // Clear if current selection is not in available networks
        setCoinNetworkId('')
      }
    } else {
      setNetworks([])
      setCoinNetworkId('')
    }
  }, [selectedCoin, grouped, coinNetworkId])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!coinNetworkId || !address || !label.trim()) {
      setError(t('validation.requiredFields') || 'Please fill required fields')
      return
    }
    try {
      setSaving(true)
      const payload = {
        coinNetworkId: Number(coinNetworkId),
        address: address.trim(),
        label: label.trim(),
        ...(memo.trim() && { memo: memo.trim() })
      }
      await createWallet(payload, token)
      toast.success(t('wallet.createSuccess', { defaultValue: 'Withdrawal address added successfully' }))
      router.push('/withdrawals')
    } catch (e) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
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
                        <CoinImg coin={group.coin} symbol={sym} size={36} showFallback imgClassName="rounded" />
                        <div>
                          <div className="fw-bold">{sym}</div>
                          <div className="text-muted small">{group.coin?.name || ''}</div>
                          {networksCount > 1 && (
                            <div className="text-muted small">{networksCount} networks</div>
                          )}
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
                const networkLabel = getNetworkLabel(n, { symbol: selectedCoin })
                return (
                  <button
                    type="button"
                    key={n.id}
                    className={`btn ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setCoinNetworkId(String(n.id))}
                  >
                    {networkLabel}
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
                required
              />
            </div>
            <div className="col-12 col-md-8 col-lg-6">
              <label className="form-label">{t('wallet.label', { defaultValue: 'Label' })}</label>
              <input
                className="form-control"
                placeholder={t('wallet.labelPlaceholder', { defaultValue: 'e.g., My Binance Wallet' })}
                maxLength={100}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>
            <div className="col-12 col-md-8 col-lg-6">
              <label className="form-label">{t('wallet.memo', { defaultValue: 'Memo (Optional)' })}</label>
              <textarea
                className="form-control"
                placeholder={t('wallet.memoPlaceholder', { defaultValue: 'Optional memo text' })}
                rows={3}
                maxLength={500}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="card-footer d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => router.back()} disabled={saving}>
            {t('actions.back') || 'Back'}
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (t('common.saving') || 'Saving...') : t('wallet.saveAddress', { defaultValue: 'Save address' })}
          </button>
        </div>
      </form>
    </div>
  )
}
