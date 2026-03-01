'use client'

import { useTranslation } from 'react-i18next'
import { useState, useEffect, useMemo } from 'react'
import { createInvoice } from '@/lib/api/invoices'
import { useAuth, useToast } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { listCoins } from '@/lib/api/coins'
import CoinNetworkSelector from '@/components/invoices/CoinNetworkSelector'
import AmountInput, { MAX_DEPOSIT } from '@/components/invoices/AmountInput'

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

  const [coins, setCoins] = useState([])
  const [loadingCoins, setLoadingCoins] = useState(false)
  const [selectedCoin, setSelectedCoin] = useState('')
  const [networks, setNetworks] = useState([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingCoins(true)
        const data = await listCoins(token)
        if (mounted) setCoins(data || [])
      } catch (e) {
        // non-blocking
      } finally { setLoadingCoins(false) }
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

  const selectedNetwork = useMemo(() => {
    return networks.find(n => String(n.id) === String(coinNetworkId))
  }, [networks, coinNetworkId])

  const minDeposit = useMemo(() => {
    const min = selectedNetwork?.minDeposit ? parseFloat(selectedNetwork.minDeposit) : 0
    return min
  }, [selectedNetwork])

  useEffect(() => {
    if (!selectedCoin) {
      setNetworks([])
      setCoinNetworkId('')
      return
    }

    const group = grouped[selectedCoin]
    if (group && group.items) {
      setNetworks(group.items)

      if (group.items.length === 1) {
        setCoinNetworkId(String(group.items[0].id))
      } else if (!group.items.some((i) => String(i.id) === String(coinNetworkId))) {
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
      setError(t('validation.amountTooLarge', { max: MAX_DEPOSIT.toLocaleString() }) || `Amount must not exceed ${MAX_DEPOSIT.toLocaleString()}`)
      return
    }

    if (!selectedNetwork?.network?.symbol) {
      setError('Invalid network selection')
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
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        {error && <div className="alert alert-danger">{error}</div>}
        {walletError && <div className="alert alert-warning">{walletError}</div>}

        {hasWallet === null && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="text-muted">{t('wallet.loading', { defaultValue: 'Loading wallet...' })}</div>
            </div>
          </div>
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

        <form onSubmit={onSubmit} className="card">
          <div className="card-body">
            <input type="hidden" name="coinNetworkId" value={coinNetworkId} />
            <div className="row g-3">
              <AmountInput
                amount={amount}
                setAmount={setAmount}
                amountError={amountError}
                setAmountError={setAmountError}
                minDeposit={minDeposit}
              />
              <div className="col-sm-6 col-md-4">
                <label className="form-label">{t('form.expiryHours') || 'Expiry (hours)'}</label>
                <input
                  className={`form-control ${expiryHoursError ? 'is-invalid' : ''}`}
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
                />
                {expiryHoursError && <div className="invalid-feedback d-block">{expiryHoursError}</div>}
                {!expiryHoursError && (
                  <small className="text-muted">
                    {t('invoices.expiryHoursRange')}
                  </small>
                )}
              </div>
              <div className="col-sm-6 col-md-6">
                <label className="form-label">{t('invoices.description')}</label>
                <input
                  className="form-control"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="col-sm-6 col-md-6">
                <label className="form-label">{t('invoices.note')}</label>
                <input
                  className="form-control"
                  placeholder="Memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="card-footer d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => router.back()} disabled={loading}>
              {t('actions.back') || 'Back'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !selectedCoin || !coinNetworkId || !amount || !!amountError}>
              {loading ? t('common.saving') || 'Saving...' : t('invoice.createTitle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
