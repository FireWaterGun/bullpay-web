'use client'

import CoinImg from '@/components/CoinImg'
import { formatDate, formatCoinAmount } from '@/lib/utils/format'
import { statusBadgeClass, formatStatusLabel } from './withdrawalHelpers'

export default function WithdrawalTransactionCard({ withdrawal, onClick, t }) {
  if (!withdrawal) return null

  return (
    <div
      className="card mb-2 border"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <div className="card-body py-2 px-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <CoinImg
              symbol={withdrawal.coinSymbol || withdrawal.coin?.symbol}
              networkSymbol={withdrawal.networkSymbol || withdrawal.network?.symbol}
              size={28}
            />
            <div>
              <div className="fw-semibold small">
                {formatCoinAmount(withdrawal.amountDecimal || withdrawal.amount || 0)}{' '}
                {withdrawal.coinSymbol || withdrawal.coin?.symbol || ''}
              </div>
              <div className="text-muted small">
                {withdrawal.networkSymbol || withdrawal.network?.symbol || ''} &middot; {formatDate(withdrawal.createdAt)}
              </div>
            </div>
          </div>
          <span className={statusBadgeClass(withdrawal.status)}>
            {formatStatusLabel(withdrawal.status)}
          </span>
        </div>
      </div>
    </div>
  )
}
