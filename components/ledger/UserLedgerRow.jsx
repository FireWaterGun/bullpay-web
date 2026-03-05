'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CoinImg from '@/components/CoinImg'
import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'

export function stateBadge(state) {
  if (state === 'settled') return <span>Settled</span>
  if (state === 'committed') return <span>Committed</span>
  if (state === 'pending') return <span>Pending</span>
  if (state === 'reversed') return <span>Reversed</span>
  return <span className="text-muted">{state || 'N/A'}</span>
}

export function formatAmount(val) {
  if (!val && val !== 0) return '0'
  let str = String(val)
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '')
  }
  return str || '0'
}

export default function UserLedgerRow({ entry, t }) {
  const router = useRouter()
  const { fmtDate } = useDateFormat()
  const isCredit = entry.entryType === 'credit'

  return (
    <tr style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/user-ledger/${entry.id}`)}>
      <td>
        <span className="font-semibold text-primary">{entry.id}</span>
      </td>
      <td>
        <span className="badge bg-primary-50 text-primary-600">#{entry.userId}</span>
      </td>
      <td>
        <span className={`badge ${entry.state ==='reversed' ? 'bg-surface-100 text-surface-600' : (isCredit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}`}>
          <i className={`bx ${isCredit ?'bx-plus-circle' : 'bx-minus-circle'} mr-1`}></i>
          {isCredit ? 'Credit' : 'Debit'}
        </span>
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <div className="flex items-center">
          <CoinImg
            symbol={entry.coinSymbol}
            networkSymbol={entry.networkSymbol}
            size={24}
            className="mr-2"
          />
          <div>
            <div className="font-medium" style={{ lineHeight: 1.2 }}>{entry.coinSymbol || '-'}</div>
            {entry.networkName && (
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>{entry.networkName}</small>
            )}
          </div>
        </div>
      </td>
      <td>
        {entry.entryCode ? (
          <span className="font-medium">{entry.entryCode}</span>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        {stateBadge(entry.state)}
      </td>
      <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
        <span className={`font-medium ${entry.state ==='reversed' ? '' : (isCredit ? 'text-success' : 'text-danger')}`}>
          {entry.state === 'reversed' ? '' : (isCredit ? '+' : '-')}{formatAmount(entry.amount)}
        </span>
      </td>
      <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
        <span className="text-muted">{formatUsd(entry.amountUsd)}</span>
      </td>
      <td>
        {entry.txHash ? (
          <div className="flex items-center">
            <span className="mr-2">{entry.txHash}</span>
            {entry.explorerUrl && (
              <a
                href={`${entry.explorerUrl}/tx/${entry.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full"
                onClick={(e) => e.stopPropagation()}
                title="View on explorer"
              >
                <i className="bx bx-link-external" style={{ fontSize: '1.25rem' }}></i>
              </a>
            )}
          </div>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        <span style={{ whiteSpace: 'nowrap' }}>{fmtDate(entry.createdAt)}</span>
      </td>
      <td>
        <Link
          href={`/admin/user-ledger/${entry.id}`}
          className="btn btn-sm btn-icon btn border border-primary-600 text-primary-600 bg-transparent hover:bg-primary-600 hover:text-white"
          onClick={(e) => e.stopPropagation()}
          title={t('actions.view', { defaultValue: 'View' })}
        >
          <i className="bx bx-show"></i>
        </Link>
      </td>
    </tr>
  )
}
