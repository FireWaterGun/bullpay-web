'use client'

import { useTranslation } from 'react-i18next'
import { useState, useEffect, useMemo } from 'react'
import { createInvoice } from '@/lib/api/invoices'
import { useAuth, useToast } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { useCoins } from '@/hooks/useCoins'
import CoinNetworkSelector from '@/components/crypto/CoinNetworkSelector'
import AmountInput, { MAX_DEPOSIT } from '@/components/invoices/AmountInput'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'

export default function InvoiceCreatePage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [hasWallet] = useState(true)
  const [walletError] = useState('')
  const [coinNetworkId, setCoinNetworkId] = useState('')
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')
  const [expiryHoursError, setExpiryHoursError] = useState('')
  const [description, setDescription] = useState('')
  const [memo, setMemo] = useState('')
  const [expiryHours, setExpiryHours] = useState(24)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { coins, isLoading: loadingCoins } = useCoins()
  const [selectedCoin, setSelectedCoin] = useState('')

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
    const keys = Object.keys(grouped)
    if (keys.length && !selectedCoin) {
      const first = keys[0]
      setSelectedCoin(first)
      const firstGroup = grouped[first]
      if (firstGroup?.items?.length === 1) {
        setCoinNetworkId(String(firstGroup.items[0].id))
      }
    }
  }, [grouped, selectedCoin])

  // Derive networks from grouped[selectedCoin] — no state needed
  const networks = useMemo(() => {
    if (!selectedCoin) return []
    return grouped[selectedCoin]?.items ?? []
  }, [selectedCoin, grouped])

  const selectedNetwork = useMemo(() => {
    return networks.find((n) => String(n.id) === String(coinNetworkId))
  }, [networks, coinNetworkId])

  const minDeposit = useMemo(() => {
    const min = selectedNetwork?.minDeposit ? parseFloat(selectedNetwork.minDeposit) : 0
    return min
  }, [selectedNetwork])

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
    if (!selectedCoin) {
      setError(t('validation.selectCoin') || 'Please select a coin')
      return
    }
    if (!coinNetworkId) {
      setError(t('validation.selectNetwork') || 'Please select a network')
      return
    }
    if (!amount) {
      setError(t('validation.requiredFields') || 'Please fill required fields')
      return
    }
    if (amountError) {
      setError(amountError)
      return
    }
    if (expiryHoursError) {
      setError(expiryHoursError)
      return
    }
    if (expiryHours) {
      const hoursNum = parseInt(expiryHours)
      if (isNaN(hoursNum) || hoursNum < 1) {
        setError(t('validation.expiryHoursTooSmall') || 'Hours must be at least 1')
        return
      }
      if (hoursNum > 24) {
        setError(t('validation.expiryHoursTooLarge') || 'Hours must not exceed 24')
        return
      }
    }
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError(t('validation.invalidAmount') || 'Amount must be greater than 0')
      return
    }
    if (minDeposit > 0 && amountNum < minDeposit) {
      setError(t('validation.amountTooSmall', { min: minDeposit }) || `Amount must be at least ${minDeposit}`)
      return
    }
    if (amountNum > MAX_DEPOSIT) {
      setError(
        t('validation.amountTooLarge', { max: MAX_DEPOSIT.toLocaleString() }) ||
          `Amount must not exceed ${MAX_DEPOSIT.toLocaleString()}`
      )
      return
    }

    if (!selectedNetwork?.network?.symbol) {
      setError(t('validation.invalidNetworkSelection', { defaultValue: 'Invalid network selection' }))
      return
    }

    try {
      setLoading(true)
      const invoice = await createInvoice(
        {
          coinSymbol: selectedCoin,
          networkSymbol: selectedNetwork.network.symbol,
          amount: amount,
          description: description || undefined,
          memo: memo || undefined,
          expiryHours: expiryHours ? Number(expiryHours) : undefined,
        },
        token
      )
      const id = invoice.id || invoice.invoice?.id
      toast.success(t('invoice.createSuccess', { defaultValue: 'Invoice created successfully' }))
      router.push(`/invoices/${id}`)
    } catch (e) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {error && (
        <div className="rounded-lg bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400 px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}
      {walletError && (
        <div className="rounded-lg bg-warning-50 dark:bg-warning-950/30 text-warning-700 dark:text-warning-400 px-4 py-3 text-sm mb-4">
          {walletError}
        </div>
      )}

      {hasWallet === null && (
        <Card className="mb-4">
          <div className="p-6">
            <div className="text-surface-500">{t('wallet.loading', { defaultValue: 'Loading wallet...' })}</div>
          </div>
        </Card>
      )}

      <CoinNetworkSelector
        grouped={grouped}
        coins={coins}
        loadingCoins={loadingCoins}
        selectedCoin={selectedCoin}
        setSelectedCoin={setSelectedCoin}
        coinNetworkId={coinNetworkId}
        setCoinNetworkId={setCoinNetworkId}
        networks={networks}
      />

      <form onSubmit={onSubmit}>
        <Card>
          <div className="p-6">
            <input type="hidden" name="coinNetworkId" value={coinNetworkId} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <AmountInput
                amount={amount}
                setAmount={setAmount}
                amountError={amountError}
                setAmountError={setAmountError}
                minDeposit={minDeposit}
              />

              <div>
                <Label>{t('form.expiryHours') || 'Expiry (hours)'}</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  placeholder="24"
                  value={expiryHours}
                  onInput={(e) => {
                    const value = e.target.value
                    if (value && value.replace('-', '').length > 2) {
                      e.target.value = value.substring(0, 2)
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value

                    if (value !== '') {
                      const num = parseInt(value)
                      if (!isNaN(num) && num > 24) {
                        return
                      }
                      if (!isNaN(num) && num < 1) {
                        setExpiryHoursError(t('validation.expiryHoursTooSmall') || 'Hours must be at least 1')
                      } else if (!isNaN(num) && num > 24) {
                        setExpiryHoursError(t('validation.expiryHoursTooLarge') || 'Hours must not exceed 24')
                      } else {
                        setExpiryHoursError('')
                      }
                    } else {
                      setExpiryHoursError('')
                    }

                    setExpiryHours(value)
                  }}
                  error={expiryHoursError}
                />

                {expiryHoursError && <div className="text-danger-500 text-xs mt-1">{expiryHoursError}</div>}
                {!expiryHoursError && (
                  <small className="text-surface-500 text-xs">{t('invoices.expiryHoursRange')}</small>
                )}
              </div>
              <div className="col-span-12 sm:col-span-2 md:col-span-1">
                <Label>{t('invoices.description')}</Label>
                <Input
                  placeholder={t('invoices.descriptionPlaceholder', { defaultValue: 'Description' })}
                  value={description}
                  maxLength={500}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="col-span-12 sm:col-span-2 md:col-span-3">
                <Label>{t('invoices.note')}</Label>
                <Input
                  placeholder={t('invoices.memoPlaceholder', { defaultValue: 'Memo' })}
                  value={memo}
                  maxLength={200}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-2">
            <Button type="button" onClick={() => router.back()} disabled={loading} variant="outline-secondary">
              {t('actions.back') || 'Back'}
            </Button>
            <Button type="submit" disabled={loading || !selectedCoin || !coinNetworkId || !amount || !!amountError}>
              {loading ? t('common.saving') || 'Saving...' : t('invoice.createTitle')}
            </Button>
          </div>
        </Card>
      </form>
    </>
  )
}
