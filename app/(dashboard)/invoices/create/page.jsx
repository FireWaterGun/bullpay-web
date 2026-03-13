'use client'

import { useTranslation } from 'react-i18next'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createInvoice } from '@/lib/api/invoices'
import { estimateFiatToCrypto } from '@/lib/api/coins'
import { useAuth, useToast } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { useCoins } from '@/hooks/useCoins'
import CoinNetworkSelector from '@/components/crypto/CoinNetworkSelector'
import AmountInput, { MAX_DEPOSIT } from '@/components/invoices/AmountInput'
import FiatAmountInput from '@/components/invoices/FiatAmountInput'
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

  // Amount mode: 'crypto' or 'fiat'
  const [amountMode, setAmountMode] = useState('crypto')

  // Crypto mode state
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')

  // Fiat mode state
  const [fiatAmount, setFiatAmount] = useState('')
  const [fiatCurrency, setFiatCurrency] = useState('USD')
  const [fiatError, setFiatError] = useState('')
  const [estimate, setEstimate] = useState(null)
  const [estimateLoading, setEstimateLoading] = useState(false)

  const [expiryHoursError, setExpiryHoursError] = useState('')
  const [description, setDescription] = useState('')
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

  const handleCoinSelect = useCallback((coin) => {
    setSelectedCoin(coin)
    setEstimate(null)
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

  const selectedNetwork = useMemo(() => {
    return networks.find((n) => String(n.id) === String(coinNetworkId))
  }, [networks, coinNetworkId])

  const minDeposit = useMemo(() => {
    const min = selectedNetwork?.minDeposit ? parseFloat(selectedNetwork.minDeposit) : 0
    return min
  }, [selectedNetwork])

  const handleNetworkSelect = useCallback((networkId) => {
    setCoinNetworkId(networkId)
    setEstimate(null)
    if (amount && amountMode === 'crypto') {
      const network = networks.find((n) => String(n.id) === String(networkId))
      if (network) {
        const decimals = network.decimals ?? 8
        const parts = amount.split('.')
        if (parts.length === 2 && parts[1].length > decimals) {
          setAmount(`${parts[0]}.${parts[1].substring(0, decimals)}`)
          setAmountError('')
        }
      }
    }
  }, [amount, amountMode, networks])

  // Debounced fiat estimate
  const estimateTimerRef = useRef(null)

  const fetchEstimate = useCallback(
    async (fiatAmt, currency, networkId) => {
      if (!fiatAmt || !currency || !networkId) {
        setEstimate(null)
        return
      }
      const num = parseFloat(fiatAmt)
      if (isNaN(num) || num <= 0) {
        setEstimate(null)
        return
      }

      setEstimateLoading(true)
      try {
        const coinDecimals = selectedNetwork?.decimals
        const result = await estimateFiatToCrypto(Number(networkId), fiatAmt, currency, token, coinDecimals)
        setEstimate(result)
      } catch {
        setEstimate(null)
      } finally {
        setEstimateLoading(false)
      }
    },
    [token, selectedNetwork]
  )

  useEffect(() => {
    if (amountMode !== 'fiat') return

    if (estimateTimerRef.current) clearTimeout(estimateTimerRef.current)

    estimateTimerRef.current = setTimeout(() => {
      fetchEstimate(fiatAmount, fiatCurrency, coinNetworkId)
    }, 600)

    return () => {
      if (estimateTimerRef.current) clearTimeout(estimateTimerRef.current)
    }
  }, [fiatAmount, fiatCurrency, coinNetworkId, amountMode, fetchEstimate])

  // Handle mode toggle
  function handleModeToggle(mode) {
    setAmountMode(mode)
    setError('')
    setEstimate(null)
    if (mode === 'crypto') {
      setFiatAmount('')
      setFiatError('')
    } else {
      setAmount('')
      setAmountError('')
    }
  }

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

    // Validate based on mode
    if (amountMode === 'crypto') {
      if (!amount) {
        setError(t('validation.requiredFields') || 'Please fill required fields')
        return
      }
      if (amountError) {
        setError(amountError)
        return
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
    } else {
      if (!fiatAmount) {
        setError(t('validation.requiredFields') || 'Please fill required fields')
        return
      }
      if (fiatError) {
        setError(fiatError)
        return
      }
      if (!fiatCurrency) {
        setError(t('validation.selectCurrency', { defaultValue: 'Please select a currency' }))
        return
      }
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

    if (!selectedNetwork?.network?.symbol) {
      setError(t('validation.invalidNetworkSelection', { defaultValue: 'Invalid network selection' }))
      return
    }

    try {
      setLoading(true)

      const body = {
        coinSymbol: selectedCoin,
        networkSymbol: selectedNetwork.network.symbol,
        description: description || undefined,
        expiryHours: expiryHours ? Number(expiryHours) : undefined,
      }

      if (amountMode === 'crypto') {
        body.amount = amount
      } else {
        body.fiatAmount = fiatAmount
        body.fiatCurrency = fiatCurrency
      }

      const invoice = await createInvoice(body, token)
      const id = invoice.id || invoice.invoice?.id
      toast.success(t('invoice.createSuccess', { defaultValue: 'Invoice created successfully' }))
      router.push(`/invoices/${id}`)
    } catch (e) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  const isCrypto = amountMode === 'crypto'
  const isFiat = amountMode === 'fiat'
  const submitDisabled =
    loading ||
    !selectedCoin ||
    !coinNetworkId ||
    (isCrypto && (!amount || !!amountError)) ||
    (isFiat && (!fiatAmount || !!fiatError))

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
        setSelectedCoin={handleCoinSelect}
        coinNetworkId={coinNetworkId}
        setCoinNetworkId={handleNetworkSelect}
        networks={networks}
      />

      <form onSubmit={onSubmit}>
        <Card>
          <div className="p-6">
            <input type="hidden" name="coinNetworkId" value={coinNetworkId} />

            {/* Amount Mode Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-surface-600 dark:text-surface-400 mr-1">
                {t('invoices.amountMode', { defaultValue: 'Amount mode' })}:
              </span>
              <button
                type="button"
                onClick={() => handleModeToggle('crypto')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  isCrypto
                    ? 'bg-primary-50 text-primary-700 border-primary-500 shadow-sm dark:bg-primary-500/15 dark:text-primary-300 dark:border-primary-400'
                    : 'bg-card text-surface-700 border-surface-200 hover:border-primary-400 hover:bg-surface-50'
                }`}
              >
                <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M14.5 9a3.5 3.5 0 0 0-5 0M9.5 15a3.5 3.5 0 0 0 5 0M12 3v3M12 18v3" />
                </svg>
                {t('invoices.cryptoMode', { defaultValue: 'Crypto' })}
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle('fiat')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  isFiat
                    ? 'bg-primary-50 text-primary-700 border-primary-500 shadow-sm dark:bg-primary-500/15 dark:text-primary-300 dark:border-primary-400'
                    : 'bg-card text-surface-700 border-surface-200 hover:border-primary-400 hover:bg-surface-50'
                }`}
              >
                <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
                {t('invoices.fiatMode', { defaultValue: 'Fiat' })}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Crypto Amount Input or Fiat Amount Input */}
              <div className="sm:col-span-2">
                {isCrypto ? (
                  <AmountInput
                    amount={amount}
                    setAmount={setAmount}
                    amountError={amountError}
                    setAmountError={setAmountError}
                    minDeposit={minDeposit}
                    maxDecimals={selectedNetwork?.decimals ?? 8}
                  />
                ) : (
                  <FiatAmountInput
                    fiatAmount={fiatAmount}
                    setFiatAmount={setFiatAmount}
                    fiatCurrency={fiatCurrency}
                    setFiatCurrency={setFiatCurrency}
                    fiatError={fiatError}
                    setFiatError={setFiatError}
                  />
                )}
              </div>

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

                {expiryHoursError ? <div className="text-danger-500 text-xs mt-1">{expiryHoursError}</div> : null}
                {!expiryHoursError && (
                  <small className="text-surface-500 text-xs">{t('invoices.expiryHoursRange')}</small>
                )}
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <Label>{t('invoices.description')}</Label>
                <Input
                  placeholder={t('invoices.descriptionPlaceholder', { defaultValue: 'Description' })}
                  value={description}
                  maxLength={500}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Fiat Estimate Preview */}
            {isFiat && fiatAmount && coinNetworkId && (
              <div className="mt-4 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 px-4 py-3">
                <div className="text-sm text-surface-600 dark:text-surface-400">
                  {estimateLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-spin inline-block h-4 w-4">
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </span>
                      {t('invoices.estimating', { defaultValue: 'Estimating...' })}
                    </span>
                  ) : estimate ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-surface-900 dark:text-surface-100">
                          ≈ {estimate.cryptoAmount} {selectedCoin}
                        </span>
                        <span className="text-xs text-surface-500">
                          ({t('invoices.estimateNote', { defaultValue: 'approximate, rate may change' })})
                        </span>
                      </div>
                      <div className="text-xs text-surface-500">
                        1 {selectedCoin} ≈ {Number(estimate.exchangeRate).toLocaleString()} {fiatCurrency}
                      </div>
                    </div>
                  ) : fiatError ? null : (
                    <span className="text-surface-500">
                      {t('invoices.estimateUnavailable', { defaultValue: 'Rate estimate unavailable' })}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-2">
            <Button type="button" onClick={() => router.back()} disabled={loading} variant="outline-secondary">
              {t('actions.back') || 'Back'}
            </Button>
            <Button type="submit" disabled={submitDisabled}>
              {loading ? t('common.saving') || 'Saving...' : t('invoice.createTitle')}
            </Button>
          </div>
        </Card>
      </form>
    </>
  )
}
