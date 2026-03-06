'use client';

import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useRouter } from 'next/navigation';

import CoinImg from '@/components/CoinImg';
import { formatUsd } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import TableEmptyState from '@/components/TableEmptyState';
import { Badge, Button, Card } from '../ui';
import Table from '@/components/ui/Table';

function formatAmount(val) {
  if (!val && val !== 0) return '0';
  let str = String(val);
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '');
  }
  return str || '0';
}

function accountTypeBadge(type) {
  if (type === 'revenue') return <span>Revenue</span>;
  if (type === 'expense') return <span>Expense</span>;
  return <span className="text-surface-500">{type || 'N/A'}</span>;
}

function stateBadge(state) {
  if (state === 'settled') return <span>Settled</span>;
  if (state === 'committed') return <span>Committed</span>;
  if (state === 'reversed') return <span>Reversed</span>;
  return <span className="text-surface-500">{state || 'N/A'}</span>;
}

export default function PlatformLedgerTable({
  entries,
  pagination,
  loading,
  currentPage,
  setCurrentPage,
  syncSearchParams,
  appliedFilters
}) {
  const { t } = useAdminTranslation();
  const router = useRouter();
  const { fmtDate } = useDateFormat();

  return (
    <Card>
      <div className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="whitespace-nowrap">
                <th>ID</th>
                <th>Account</th>
                <th>Type</th>
                <th>Coin</th>
                <th>Code</th>
                <th>State</th>
                <th className="text-right">Amount</th>
                <th className="text-right">USD</th>
                <th>Tx Hash</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ?
              <TableEmptyState
                colSpan={11}
                icon="bx-receipt"
                message={t('admin.platformLedger.noEntries', { defaultValue: 'No revenue & expense entries found' })} /> :


              entries.map((entry) => {
                const isCredit = entry.entryType === 'credit';

                return (
                  <tr className="cursor-pointer" key={entry.id} onClick={() => router.push(`/admin/platform-ledger/${entry.id}`)}>
                      <td>
                        <span className="font-semibold text-primary">{entry.id}</span>
                      </td>
                      <td>
                        {accountTypeBadge(entry.accountType)}
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
                          <small className="text-surface-500 text-xs">{entry.networkName}</small>
                          }
                          </div>
                        </div>
                      </td>
                      <td>
                        {entry.entryCode ?
                      <span className="font-medium">{entry.entryCode}</span> :

                      <span className="text-surface-500">-</span>
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
                        <span className="text-surface-500">{formatUsd(entry.amountUsd)}</span>
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

                      <span className="text-surface-500">-</span>
                      }
                      </td>
                      <td>
                        <span className="whitespace-nowrap">{fmtDate(entry.createdAt)}</span>
                      </td>
                      <td>
                        <Button variant="outline-primary" size="icon"
                      href={`/admin/platform-ledger/${entry.id}`}

                      onClick={(e) => e.stopPropagation()}
                      title={t('actions.view', { defaultValue: 'View' })}>
                        
                          <i className="bx bx-show"></i>
                        </Button>
                      </td>
                    </tr>);

              })
              }
            </tbody>
          </table>
        </div>

        {pagination && pagination.total > 0 &&
        <div className="flex justify-between items-center mt-4">
            <div className="text-surface-500 text-sm">
              {t('invoices.showingEntries', {
              start: pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
              defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
            })}
            </div>
            <div className="inline-flex rounded-lg shadow-sm">
              <Button

              disabled={!pagination.hasPrev || loading}
              onClick={() => {setCurrentPage((p) => p - 1);syncSearchParams(appliedFilters, currentPage - 1);}} variant="outline-secondary" size="sm">
              
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </Button>
              <Button disabled variant="outline-secondary" size="sm">
                {pagination.page} / {pagination.totalPages}
              </Button>
              <Button

              disabled={!pagination.hasNext || loading}
              onClick={() => {setCurrentPage((p) => p + 1);syncSearchParams(appliedFilters, currentPage + 1);}} variant="outline-secondary" size="sm">
              
                {t('actions.next', { defaultValue: 'Next' })}
                <i className="bx bx-chevron-right"></i>
              </Button>
            </div>
          </div>
        }
      </div>
    </Card>);

}