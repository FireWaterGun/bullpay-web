'use client'

import { useState, useEffect, useCallback } from 'react'

import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getBalancesWithFiat } from '@/lib/api/balance'
import { formatCoinAmount, formatUsd } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import CardEmptyState from '@/components/CardEmptyState'
import Card from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

export default function BalancePage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const [balances, setBalances] = useState([])
  const [totalBalance, setTotalBalance] = useState(null)
  const [fiat, setFiat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showZero, setShowZero] = useState(false)

  const loadBalances = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await getBalancesWithFiat(token)
      setBalances(data.breakdown || [])
      setTotalBalance(data.totalBalance || null)
      setFiat(data.fiat || null)
    } catch (err) {
      logger.error('Failed to load balances:', err)
      toast.error(t('balance.loadError', { defaultValue: 'Failed to load balances' }))
    } finally {
      setLoading(false)
    }
  }, [token, toast, t])

  useEffect(() => {
    loadBalances()
  }, [loadBalances])

  const filteredBalances = showZero
    ? balances
    : balances.filter((b) => {
        const bal = parseFloat(b.confirmedBalance || b.availableBalance || b.balance || 0)
        return bal > 0
      })

  const totalValueUsd = fiat?.amount || totalBalance?.totalBalance || '0'

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-xl font-semibold text-surface-900">{t('balance.title', { defaultValue: 'Balance' })}</h4>
        <RefreshButton onClick={loadBalances} loading={loading} />
      </div>

      {/* Total Value Card */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-surface-500 block mb-1 text-sm">
                {t('balance.totalValue', { defaultValue: 'Total Balance (USD)' })}
              </span>
              <h3 className="text-2xl font-bold text-surface-900">{loading ? '...' : formatUsd(totalValueUsd)}</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Input
                type="checkbox"
                checked={showZero}
                onChange={(e) => setShowZero(e.target.checked)}
                className="w-4 h-4 accent-primary-600"
              />

              <span className="text-sm text-surface-600">
                {t('balance.showZero', { defaultValue: 'Show zero balances' })}
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Balance List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" className="text-primary-600" />
        </div>
      ) : filteredBalances.length === 0 ? (
        <Card>
          <div className="p-6">
            <CardEmptyState
              icon="bx-wallet"
              message={t('balance.empty', { defaultValue: 'No balances found' })}
              sub={t('balance.emptySub', { defaultValue: 'Your balances will appear here once you receive payments' })}
            />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBalances.map((b) => {
            const symbol = b.coinSymbol || b.coin?.symbol || ''
            const networkSym = b.networkSymbol || b.network?.symbol || ''
            const available = b.availableBalance || b.confirmedBalance || b.balance || '0'
            const locked = b.lockedBalance || b.locked || '0'
            const pending = b.unconfirmedBalance || b.pending || '0'
            const valueUsd = b.valueUsd || '0'

            return (
              <Card key={b.coinNetworkId} className="h-full">
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <CoinImg symbol={symbol} networkSymbol={networkSym} size={36} className="mr-2" />
                    <div>
                      <h6 className="font-semibold text-surface-900 mb-0">{symbol}</h6>
                      <small className="text-surface-500">{b.network?.name || networkSym}</small>
                    </div>
                    <span className="ml-auto text-surface-500 text-sm">{formatUsd(valueUsd)}</span>
                  </div>

                  <div className="mb-3 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-surface-500 text-sm">
                        {t('balance.available', { defaultValue: 'Available' })}
                      </span>
                      <span className="font-semibold text-surface-900">{formatCoinAmount(available)}</span>
                    </div>
                    {parseFloat(locked) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-surface-500 text-sm">
                          {t('balance.locked', { defaultValue: 'Locked' })}
                        </span>
                        <span className="text-warning-500">{formatCoinAmount(locked)}</span>
                      </div>
                    )}
                    {parseFloat(pending) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-surface-500 text-sm">
                          {t('balance.pending', { defaultValue: 'Pending' })}
                        </span>
                        <span className="text-info-500">{formatCoinAmount(pending)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="flex-1"
                      href={`/wallet/withdraw/${b.coinNetworkId}`}
                    >
                      <i className="bx bx-upload mr-1"></i>
                      {t('balance.withdraw', { defaultValue: 'Withdraw' })}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
