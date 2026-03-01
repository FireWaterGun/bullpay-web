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
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">{t('balance.title', { defaultValue: 'Balance' })}</h4>
        <button className="btn btn-primary" onClick={loadBalances} disabled={loading}>
          <i className="bx bx-refresh me-1"></i>
          {t('actions.refresh', { defaultValue: 'Refresh' })}
        </button>
      </div>

      {/* Total Value Card */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="text-muted d-block mb-1">
                {t('balance.totalValue', { defaultValue: 'Total Balance (USD)' })}
              </span>
              <h3 className="mb-0">
                {loading ? '...' : formatUsd(totalValueUsd)}
              </h3>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="showZero"
                checked={showZero}
                onChange={(e) => setShowZero(e.target.checked)}
              />
              <label className="form-check-label small" htmlFor="showZero">
                {t('balance.showZero', { defaultValue: 'Show zero balances' })}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Balance List */}
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : filteredBalances.length === 0 ? (
        <div className="card">
          <div className="card-body text-center text-muted py-4">
            {t('balance.empty', { defaultValue: 'No balances found' })}
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {filteredBalances.map((b) => {
            const symbol = b.coinSymbol || b.coin?.symbol || ''
            const networkSym = b.networkSymbol || b.network?.symbol || ''
            const available = b.availableBalance || b.confirmedBalance || b.balance || '0'
            const locked = b.lockedBalance || b.locked || '0'
            const pending = b.unconfirmedBalance || b.pending || '0'
            const valueUsd = b.valueUsd || '0'

            return (
              <div key={b.coinNetworkId} className="col-md-6 col-xl-4">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <CoinImg symbol={symbol} networkSymbol={networkSym} size={36} className="me-2" />
                      <div>
                        <h6 className="mb-0">{symbol}</h6>
                        <small className="text-muted">{b.network?.name || networkSym}</small>
                      </div>
                      <span className="ms-auto text-muted small">{formatUsd(valueUsd)}</span>
                    </div>

                    <div className="mb-2">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">{t('balance.available', { defaultValue: 'Available' })}</span>
                        <span className="fw-semibold">{formatCoinAmount(available)}</span>
                      </div>
                      {parseFloat(locked) > 0 && (
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small">{t('balance.locked', { defaultValue: 'Locked' })}</span>
                          <span className="text-warning">{formatCoinAmount(locked)}</span>
                        </div>
                      )}
                      {parseFloat(pending) > 0 && (
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small">{t('balance.pending', { defaultValue: 'Pending' })}</span>
                          <span className="text-info">{formatCoinAmount(pending)}</span>
                        </div>
                      )}
                    </div>

                    <div className="d-flex gap-2">
                      <Link
                        href={`/wallet/withdraw/${b.coinNetworkId}`}
                        className="btn btn-sm btn-outline-primary flex-grow-1"
                      >
                        <i className="bx bx-upload me-1"></i>
                        {t('balance.withdraw', { defaultValue: 'Withdraw' })}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
