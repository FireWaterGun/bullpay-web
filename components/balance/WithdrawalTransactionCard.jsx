'use client'

import CoinImg from '@/components/CoinImg'
import { formatCoinAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { statusBadgeClass, formatStatusLabel } from './withdrawalHelpers'

export default function WithdrawalTransactionCard({ withdrawal, onClick, t }) {
  const { fmtDate } = useDateFormat()
  if (!withdrawal) return null

  return (
    <div
      className="card mb-2 border"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <div className="py-2 px-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CoinImg
              symbol={withdrawal.coinSymbol || withdrawal.coin?.symbol}
              networkSymbol={withdrawal.networkSymbol || withdrawal.network?.symbol}
              size={28}
            />
            <div>
              <div className="font-semibold text-sm">
                {formatCoinAmount(withdrawal.amountDecimal || withdrawal.amount || 0)}{' '}
                {withdrawal.coinSymbol || withdrawal.coin?.symbol || ''}
              </div>
              <div className="text-surface-500 text-sm">
                {withdrawal.networkSymbol || withdrawal.network?.symbol || ''} &middot; {fmtDate(withdrawal.createdAt)}
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
