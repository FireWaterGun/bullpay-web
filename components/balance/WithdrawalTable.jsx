'use client'

import CoinImg from '@/components/CoinImg'
import { formatCoinAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { statusBadgeClass, formatStatusLabel } from './withdrawalHelpers'
import CardEmptyState from '@/components/CardEmptyState'

const EMPTY_WITHDRAWALS = []

export default function WithdrawalTable({ withdrawals = EMPTY_WITHDRAWALS, onViewDetail, onApprove, onReject, t }) {
  const { fmtDate } = useDateFormat()
  if (!withdrawals.length) {
    return (
      <CardEmptyState
        icon="bx-transfer"
        message={t?.('withdrawals.empty', { defaultValue: 'No withdrawals found' }) || 'No withdrawals found'}
        sub={t?.('withdrawals.emptySub', { defaultValue: 'Your withdrawal history will appear here' }) || 'Your withdrawal history will appear here'}
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th>ID</th>
            <th>{t?.('withdrawals.user', { defaultValue: 'User' }) || 'User'}</th>
            <th>{t?.('withdrawals.coin', { defaultValue: 'Coin' }) || 'Coin'}</th>
            <th>{t?.('withdrawals.amount', { defaultValue: 'Amount' }) || 'Amount'}</th>
            <th>{t?.('withdrawals.address', { defaultValue: 'Address' }) || 'Address'}</th>
            <th>{t?.('withdrawals.status', { defaultValue: 'Status' }) || 'Status'}</th>
            <th>{t?.('withdrawals.date', { defaultValue: 'Date' }) || 'Date'}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((w) => (
            <tr key={w.id}>
              <td className="font-semibold">#{w.id}</td>
              <td>{w.user?.email || w.userId || '-'}</td>
              <td>
                <div className="flex items-center gap-1">
                  <CoinImg symbol={w.coinSymbol || w.coin?.symbol} size={20} />
                  <span>{w.coinSymbol || w.coin?.symbol || '-'}</span>
                </div>
              </td>
              <td>{formatCoinAmount(w.amountDecimal || w.amount || 0)}</td>
              <td>
                <span className="font-monospace text-sm truncate inline-block" style={{ maxWidth: 120 }}>
                  {w.address || w.withdrawalAddress?.address || '-'}
                </span>
              </td>
              <td>
                <span className={statusBadgeClass(w.status)}>
                  {formatStatusLabel(w.status)}
                </span>
              </td>
              <td><span className="text-sm">{fmtDate(w.createdAt)}</span></td>
              <td>
                <div className="dropdown">
                  <button className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none">
                    <i className="bx bx-dots-vertical-rounded"></i>
                  </button>
                  <ul className="absolute z-50 mt-1 min-w-[160px] bg-white border border-surface-200 rounded-lg shadow-lg py-1 right-0">
                    <li>
                      <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => onViewDetail?.(w)}>
                        <i className="bx bx-show mr-2"></i>{t?.('common.view', { defaultValue: 'View' }) || 'View'}
                      </button>
                    </li>
                    {w.status === 'pending' && onApprove && (
                      <li>
                        <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer text-success" onClick={() => onApprove?.(w)}>
                          <i className="bx bx-check mr-2"></i>{t?.('common.approve', { defaultValue: 'Approve' }) || 'Approve'}
                        </button>
                      </li>
                    )}
                    {w.status === 'pending' && onReject && (
                      <li>
                        <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer text-danger" onClick={() => onReject?.(w)}>
                          <i className="bx bx-x mr-2"></i>{t?.('common.reject', { defaultValue: 'Reject' }) || 'Reject'}
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
