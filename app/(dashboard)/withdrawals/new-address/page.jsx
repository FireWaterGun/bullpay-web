'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { useAuth, useToast } from '@/app/providers'
import { useCoins } from '@/hooks/useCoins'
import { createWallet } from '@/lib/api/wallets'
import CoinNetworkSelector from '@/components/crypto/CoinNetworkSelector'
import Button from '@/components/ui/Button'
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

  const handleCoinSelect = useCallback((coin) => {
    setSelectedCoin(coin)
    const coinNetworks = grouped[coin]?.items ?? []
    if (coinNetworks.length === 1) {
      setCoinNetworkId(String(coinNetworks[0].id))
    } else {
      setCoinNetworkId('')
    }
  }, [grouped])

  useEffect(() => {
    const keys = Object.keys(grouped)
    if (keys.length && !selectedCoin) {
      handleCoinSelect(keys[0])
    }
  }, [grouped, selectedCoin, handleCoinSelect])

  // Derive networks from grouped[selectedCoin] — no state needed
  const networks = useMemo(() => {
    if (!selectedCoin) return []
    return grouped[selectedCoin]?.items ?? []
  }, [selectedCoin, grouped])

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

      <CoinNetworkSelector
        grouped={grouped}
        coins={coins}
        loadingCoins={loadingCoins}
        selectedCoin={selectedCoin}
        setSelectedCoin={handleCoinSelect}
        coinNetworkId={coinNetworkId}
        setCoinNetworkId={setCoinNetworkId}
        networks={networks}
      />

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
