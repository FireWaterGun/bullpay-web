'use client';

import { useRouter } from 'next/navigation';

import CoinImg from '@/components/CoinImg';
import { formatUsd } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import { Badge, Button } from '../ui';

export function stateBadge(state) {
  if (state === 'settled') return <span>Settled</span>;
  if (state === 'committed') return <span>Committed</span>;
  if (state === 'pending') return <span>Pending</span>;
  if (state === 'reversed') return <span>Reversed</span>;
  return <span className="text-muted">{state || 'N/A'}</span>;
}

export function formatAmount(val) {
  if (!val && val !== 0) return '0';
  let str = String(val);
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '');
  }
  return str || '0';
}

export default function UserLedgerRow({ entry, t }) {
  const router = useRouter();
  const { fmtDate } = useDateFormat();
  const isCredit = entry.entryType === 'credit';

  return (
    <tr className="cursor-pointer" onClick={() => router.push(`/admin/user-ledger/${entry.id}`)}>
      <td>
        <span className="font-semibold text-primary">{entry.id}</span>
      </td>
      <td>
        <Badge className="bg-primary-50 text-primary-600">#{entry.userId}</Badge>
      </td>
      <td>
        <Badge className={`${entry.state === 'reversed' ? 'bg-surface-100 text-surface-600' : isCredit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <i className={`bx ${isCredit ? 'bx-plus-circle' : 'bx-minus-circle'} mr-1`}></i>
          {isCredit ? 'Credit' : 'Debit'}
        </Badge>
      </td>
      <td className="whitespace-nowrap">
        <div className="flex items-center">
          <CoinImg
            symbol={entry.coinSymbol}
            networkSymbol={entry.networkSymbol}
            size={24}
            className="mr-2" />
          
          <div>
            <div className="font-medium leading-[1.2]">{entry.coinSymbol || '-'}</div>
            {entry.networkName &&
            <small className="text-muted text-xs">{entry.networkName}</small>
            }
          </div>
        </div>
      </td>
      <td>
        {entry.entryCode ?
        <span className="font-medium">{entry.entryCode}</span> :

        <span className="text-muted">-</span>
        }
      </td>
      <td>
        {stateBadge(entry.state)}
      </td>
      <td className="text-right whitespace-nowrap">
        <span className={`font-medium ${entry.state === 'reversed' ? '' : isCredit ? 'text-success' : 'text-danger'}`}>
          {entry.state === 'reversed' ? '' : isCredit ? '+' : '-'}{formatAmount(entry.amount)}
        </span>
      </td>
      <td className="text-right whitespace-nowrap">
        <span className="text-muted">{formatUsd(entry.amountUsd)}</span>
      </td>
      <td>
        {entry.txHash ?
        <div className="flex items-center">
            <span className="mr-2">{entry.txHash}</span>
            {entry.explorerUrl &&
          <Button variant="text-secondary" size="icon" className="rounded-full"
          href={`${entry.explorerUrl}/tx/${entry.txHash}`}
          target="_blank"
          rel="noopener noreferrer"

          onClick={(e) => e.stopPropagation()}
          title="View on explorer">
            
                <i className="bx bx-link-external text-xl"></i>
              </Button>
          }
          </div> :

        <span className="text-muted">-</span>
        }
      </td>
      <td>
        <span className="whitespace-nowrap">{fmtDate(entry.createdAt)}</span>
      </td>
      <td>
        <Button variant="outline-primary" size="icon"
        href={`/admin/user-ledger/${entry.id}`}

        onClick={(e) => e.stopPropagation()}
        title={t('actions.view', { defaultValue: 'View' })}>
          
          <i className="bx bx-show"></i>
        </Button>
      </td>
    </tr>);

}