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

  // Derive networks from grouped[selectedCoin] — no state needed
  const networks = useMemo(() => {
    if (!selectedCoin) return []
    return grouped[selectedCoin]?.items ?? []
  }, [selectedCoin, grouped])

  // Auto-select coinNetworkId when networks change
  useEffect(() => {
    if (networks.length === 1) {
      setCoinNetworkId(String(networks[0].id))
    } else if (networks.length > 1 && !networks.some(i => String(i.id) === String(coinNetworkId))) {
      setCoinNetworkId('')
    } else if (networks.length === 0) {
      setCoinNetworkId('')
    }
  }, [networks]) // eslint-disable-line react-hooks/exhaustive-deps

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
    <>
      {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

      {/* Step 1: Select Coin */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">1</span>
          <h6 className="font-semibold text-surface-900 mb-0">{t('form.selectCoin')}</h6>
        </div>
        <div className="p-6">
          {loadingCoins ? (
            <p className="text-surface-500">{t('invoices.loading')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Object.entries(grouped).map(([sym, group]) => {
                const isActive = selectedCoin === sym
                const networksCount = group.items.length
                return (
                  <button
                    type="button"
                    key={sym}
                    className={`text-left rounded-xl border-2 p-3 transition-all cursor-pointer ${ isActive ?'border-primary-500 bg-primary-50 shadow-sm'
                        : 'border-surface-200 hover:border-surface-300 bg-white'
                    }`}
                    onClick={() => {
                      setSelectedCoin(sym)
                      if (!group.items.some(i => String(i.id) === String(coinNetworkId))) setCoinNetworkId('')
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <CoinImg coin={group.coin} symbol={sym} size={36} showFallback imgClassName="rounded" />
                      <div>
                        <div className="font-bold text-surface-900">{sym}</div>
                        <div className="text-surface-500 text-xs">{group.coin?.name || ''}</div>
                        {networksCount > 1 && (
                          <div className="text-surface-400 text-xs">{t('wallet.networksCount', { count: networksCount, defaultValue: '{{count}} networks' })}</div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
              {coins.length === 0 && <p className="col-span-full text-surface-500">{t('common.noData') || 'No coins'}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Select Network */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">2</span>
          <h6 className="font-semibold text-surface-900 mb-0">{t('form.selectNetwork')}</h6>
        </div>
        <div className="p-6">
          {selectedCoin ? (
            <div className="flex flex-wrap gap-2">
              {networks.map(n => {
                const selected = String(coinNetworkId) === String(n.id)
                const networkLabel = getNetworkLabel(n, { symbol: selectedCoin })
                return (
                  <button
                    type="button"
                    key={n.id}
                    className={`btn ${selected ?'btn-primary' : 'btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100'}`}
                    onClick={() => setCoinNetworkId(String(n.id))}
                  >
                    {networkLabel}
                  </button>
                )
              })}
              {networks.length === 0 && <p className="text-surface-500 text-sm">{t('common.noData')}</p>}
            </div>
          ) : (
            <p className="text-surface-500">{t('form.selectCoin')}</p>
          )}
        </div>
      </div>

      {/* Step 3: Address + Save */}
      <form onSubmit={onSubmit} className="card">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">3</span>
          <h6 className="font-semibold text-surface-900 mb-0">{t('wallet.enterAddress', { defaultValue: 'Enter address' })}</h6>
        </div>
        <div className="p-6">
          <input type="hidden" name="coinNetworkId" value={coinNetworkId} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('wallet.address', { defaultValue: 'Address' })}</label>
              <input
                className="form-input"
                placeholder={t('wallet.addressPlaceholder', { defaultValue: 'Wallet address' })}
                maxLength={128}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">{t('wallet.label', { defaultValue: 'Label' })}</label>
              <input
                className="form-input"
                placeholder={t('wallet.labelPlaceholder', { defaultValue: 'e.g., My Binance Wallet' })}
                maxLength={100}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">{t('wallet.memo', { defaultValue: 'Memo (Optional)' })}</label>
              <textarea
                className="form-input"
                placeholder={t('wallet.memoPlaceholder', { defaultValue: 'Optional memo text' })}
                rows={3}
                maxLength={500}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-surface-100 flex justify-end gap-2">
          <button type="button" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100" onClick={() => router.back()} disabled={saving}>
            {t('actions.back') || 'Back'}
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (t('common.saving') || 'Saving...') : t('wallet.saveAddress', { defaultValue: 'Save address' })}
          </button>
        </div>
      </form>
    </>
  )
}
