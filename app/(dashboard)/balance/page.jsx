'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { listCoins } from '@/lib/api/coins'
import { getBalancesWithFiat } from '@/lib/api/balance'
import { formatCoinAmount, formatUsd } from '@/lib/utils/format'
import CoinImg, { NetworkIcon } from '@/components/CoinImg'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import CardEmptyState from '@/components/CardEmptyState'

export default function BalancePage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const [balances, setBalances] = useState([])
  const [totalBalance, setTotalBalance] = useState(null)
  const [fiat, setFiat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showZero, setShowZero] = useState(false)

  useEffect(() => {
    if (token) loadBalances()
  }, [token])

  async function loadBalances() {
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
  }

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
      <div className="card mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-surface-500 block mb-1 text-sm">
                {t('balance.totalValue', { defaultValue: 'Total Balance (USD)' })}
              </span>
              <h3 className="text-2xl font-bold text-surface-900">
                {loading ? '...' : formatUsd(totalValueUsd)}
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                className="form-input w-4 h-4 accent-primary-600"
                type="checkbox"
                checked={showZero}
                onChange={(e) => setShowZero(e.target.checked)}
              />
              <span className="text-sm text-surface-600">
                {t('balance.showZero', { defaultValue: 'Show zero balances' })}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Balance List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="spinner text-primary-600 w-8 h-8 border-[3px]"></div>
        </div>
      ) : filteredBalances.length === 0 ? (
        <div className="card">
          <div className="p-6">
            <CardEmptyState
              icon="bx-wallet"
              message={t('balance.empty', { defaultValue: 'No balances found' })}
              sub={t('balance.emptySub', { defaultValue: 'Your balances will appear here once you receive payments' })}
            />
          </div>
        </div>
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
              <div key={b.coinNetworkId} className="card h-full">
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
                      <span className="text-surface-500 text-sm">{t('balance.available', { defaultValue: 'Available' })}</span>
                      <span className="font-semibold text-surface-900">{formatCoinAmount(available)}</span>
                    </div>
                    {parseFloat(locked) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-surface-500 text-sm">{t('balance.locked', { defaultValue: 'Locked' })}</span>
                        <span className="text-amber-500">{formatCoinAmount(locked)}</span>
                      </div>
                    )}
                    {parseFloat(pending) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-surface-500 text-sm">{t('balance.pending', { defaultValue: 'Pending' })}</span>
                        <span className="text-blue-500">{formatCoinAmount(pending)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/wallet/withdraw/${b.coinNetworkId}`}
                      className="btn btn-sm btn-outline-primary flex-1"
                    >
                      <i className="bx bx-upload mr-1"></i>
                      {t('balance.withdraw', { defaultValue: 'Withdraw' })}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
