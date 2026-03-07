'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { useAuth, useToast } from '@/app/providers'
import { useCoins } from '@/hooks/useCoins'
import { createWallet } from '@/lib/api/wallets'
import CoinImg from '@/components/CoinImg'
import { getNetworkLabel } from '@/components/balance/withdrawalHelpers'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'

export default function WalletNewAddressPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const router = useRouter()

  const { coins, isLoading: loadingCoins } = useCoins()
  const [selectedCoin, setSelectedCoin] = useState('')
  const [coinNetworkId, setCoinNetworkId] = useState('')
  const [address, setAddress] = useState('')
  const [label, setLabel] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const grouped = useMemo(() => {
    const bySymbol = {}
    for (const c of coins) {
      const sym = c.coin?.symbol || `COIN-${c.coinId}`
      if (!bySymbol[sym]) bySymbol[sym] = { coin: c.coin, items: [] }
      bySymbol[sym].items.push(c)
    }
    return bySymbol
  }, [coins])

  // Auto-select first coin when data loads
  useEffect(() => {
    const keys = Object.keys(grouped)
    if (keys.length && !selectedCoin) {
      const first = keys[0]
      setSelectedCoin(first)
      if (grouped[first]?.items?.length === 1) setCoinNetworkId(String(grouped[first].items[0].id))
    }
  }, [grouped, selectedCoin])

  // Derive networks from grouped[selectedCoin] — no state needed
  const networks = useMemo(() => {
    if (!selectedCoin) return []
    return grouped[selectedCoin]?.items ?? []
  }, [selectedCoin, grouped])

  // Auto-select coinNetworkId when networks change
  useEffect(() => {
    if (networks.length === 1) {
      setCoinNetworkId(String(networks[0].id))
    } else if (networks.length > 1 && !networks.some((i) => String(i.id) === String(coinNetworkId))) {
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
        ...(memo.trim() && { memo: memo.trim() }),
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
      {error && (
        <div className="rounded-lg bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Select Coin */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-surface-200 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">
            1
          </span>
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
                    className={`text-left rounded-xl border-2 p-3 transition-all cursor-pointer ${
                      isActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 shadow-sm'
                        : 'border-surface-200 hover:border-surface-300 bg-raised'
                    }`}
                    onClick={() => {
                      setSelectedCoin(sym)
                      if (!group.items.some((i) => String(i.id) === String(coinNetworkId))) setCoinNetworkId('')
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <CoinImg coin={group.coin} symbol={sym} size={36} showFallback imgClassName="rounded" />
                      <div>
                        <div className="font-bold text-surface-900">{sym}</div>
                        <div className="text-surface-500 text-xs">{group.coin?.name || ''}</div>
                        {networksCount > 1 && (
                          <div className="text-surface-400 text-xs">
                            {t('wallet.networksCount', { count: networksCount, defaultValue: '{{count}} networks' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
              {coins.length === 0 && (
                <p className="col-span-full text-surface-500">{t('common.noData') || 'No coins'}</p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Step 2: Select Network */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-surface-200 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">
            2
          </span>
          <h6 className="font-semibold text-surface-900 mb-0">{t('form.selectNetwork')}</h6>
        </div>
        <div className="p-6">
          {selectedCoin ? (
            <div className="flex flex-wrap gap-2">
              {networks.map((n) => {
                const selected = String(coinNetworkId) === String(n.id)
                const networkLabel = getNetworkLabel(n, { symbol: selectedCoin })
                return (
                  <Button type="button" key={n.id} onClick={() => setCoinNetworkId(String(n.id))}>
                    {networkLabel}
                  </Button>
                )
              })}
              {networks.length === 0 && <p className="text-surface-500 text-sm">{t('common.noData')}</p>}
            </div>
          ) : (
            <p className="text-surface-500">{t('form.selectCoin')}</p>
          )}
        </div>
      </Card>

      {/* Step 3: Address + Save */}
      <form
        onSubmit={onSubmit}
        className="bg-card border border-surface-200 rounded-card shadow-card dark:shadow-card-dark"
      >
        <div className="px-6 py-4 border-b border-surface-200 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">
            3
          </span>
          <h6 className="font-semibold text-surface-900 mb-0">
            {t('wallet.enterAddress', { defaultValue: 'Enter address' })}
          </h6>
        </div>
        <div className="p-6">
          <input type="hidden" name="coinNetworkId" value={coinNetworkId} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('wallet.address', { defaultValue: 'Address' })}</Label>
              <Input
                placeholder={t('wallet.addressPlaceholder', { defaultValue: 'Wallet address' })}
                maxLength={128}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>{t('wallet.label', { defaultValue: 'Label' })}</Label>
              <Input
                placeholder={t('wallet.labelPlaceholder', { defaultValue: 'e.g., My Binance Wallet' })}
                maxLength={100}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>
            <div className="col-span-full">
              <Label>{t('wallet.memo', { defaultValue: 'Memo (Optional)' })}</Label>
              <Input
                placeholder={t('wallet.memoPlaceholder', { defaultValue: 'Optional memo text' })}
                rows={3}
                maxLength={500}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-2">
          <Button type="button" onClick={() => router.back()} disabled={saving} variant="outline-secondary">
            {t('actions.back') || 'Back'}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t('common.saving') || 'Saving...' : t('wallet.saveAddress', { defaultValue: 'Save address' })}
          </Button>
        </div>
      </form>
    </>
  )
}
