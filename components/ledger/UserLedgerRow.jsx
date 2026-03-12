'use client'

import { useRouter } from 'next/navigation'
import CoinImg from '@/components/CoinImg'
import { formatUsd } from '@/lib/utils/format'
import { formatAmount, stateBadge } from '@/components/ledger/ledgerUtils'
import { useDateFormat } from '@/hooks/useDateFormat'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

function truncateHash(hash) {
  if (!hash) return '-'
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

export default function UserLedgerRow({ entry, t }) {
  const router = useRouter()
  const { fmtDate } = useDateFormat()
  const isCredit = entry.entryType === 'credit'

  return (
    <tr className="cursor-pointer" onClick={() => router.push(`/admin/user-ledger/${entry.id}`)}>
      <td>
        <span className="font-semibold text-primary">{entry.id}</span>
      </td>
      <td>
        <Badge color="primary" label>
          #{entry.userId}
        </Badge>
      </td>
      <td>
        <Badge color={entry.state === 'reversed' ? 'secondary' : isCredit ? 'success' : 'danger'} label>
          <i className={`bx ${isCredit ? 'bx-plus-circle' : 'bx-minus-circle'} mr-1`}></i>
          {isCredit ? 'Credit' : 'Debit'}
        </Badge>
      </td>
      <td className="whitespace-nowrap">
        <div className="flex items-center">
          <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={24} className="mr-2" />

          <div>
            <div className="font-medium leading-[1.2]">{entry.coinSymbol || '-'}</div>
            {entry.networkName && <small className="text-surface-500 text-xs">{entry.networkName}</small>}
          </div>
        </div>
      </td>
      <td>
        {entry.entryCode ? (
          <span className="font-medium">{entry.entryCode}</span>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td>{stateBadge(entry.state)}</td>
      <td className="text-right whitespace-nowrap">
        <span className={`font-medium ${entry.state === 'reversed' ? '' : isCredit ? 'text-success' : 'text-danger'}`}>
          {entry.state === 'reversed' ? '' : isCredit ? '+' : '-'}
          {formatAmount(entry.amount)}
        </span>
      </td>
      <td className="text-right whitespace-nowrap">
        <span className="text-surface-500">{formatUsd(entry.amountUsd)}</span>
      </td>
      <td>
        {entry.txHash ? (
          <div className="flex items-center">
            <span className="mr-2 font-mono text-xs" title={entry.txHash}>{truncateHash(entry.txHash)}</span>
            {entry.explorerUrl && (
              <Button
                variant="text-secondary"
                size="icon"
                className="rounded-full"
                href={`${entry.explorerUrl}/tx/${entry.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="View on explorer"
              >
                <i className="bx bx-link-external text-xl"></i>
              </Button>
            )}
          </div>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td>
        <span className="whitespace-nowrap">{fmtDate(entry.createdAt)}</span>
      </td>
      <td>
        <Button
          variant="text-secondary"
          size="icon-sm"
          href={`/admin/user-ledger/${entry.id}`}
          onClick={(e) => e.stopPropagation()}
          title={t('actions.view', { defaultValue: 'View' })}
        >
          <i className="bx bx-show text-[1rem]"></i>
        </Button>
      </td>
    </tr>
  )
}
