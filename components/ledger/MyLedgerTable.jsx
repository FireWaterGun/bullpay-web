'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import CoinImg from '@/components/CoinImg';
import { formatUsd } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import { formatAmount, getEntryCodeLabel, userStateBadge } from '@/components/ledger/ledgerUtils';
import TableEmptyState from '@/components/TableEmptyState';
import { Card, Pagination } from '@/components/ui'
import Table from '@/components/ui/Table';

export default function MyLedgerTable({
  entries,
  pagination,
  loading,
  currentPage,
  setCurrentPage,
  syncSearchParams,
  appliedFilters
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { fmtDate } = useDateFormat();

  return (
    <Card>
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-surface-200 text-left text-xs uppercase text-surface-500 whitespace-nowrap">
                <th className="px-3 py-2">{t('userLedger.id', { defaultValue: 'ID' })}</th>
                <th className="px-3 py-2">{t('userLedger.coin', { defaultValue: 'Coin' })}</th>
                <th className="px-3 py-2">{t('userLedger.code', { defaultValue: 'Code' })}</th>
                <th className="px-3 py-2">{t('userLedger.state', { defaultValue: 'State' })}</th>
                <th className="px-3 py-2 text-right">{t('userLedger.amount', { defaultValue: 'Amount' })}</th>
                <th className="px-3 py-2 text-right">{t('userLedger.usd', { defaultValue: 'USD' })}</th>
                <th className="px-3 py-2">{t('userLedger.txHash', { defaultValue: 'Tx Hash' })}</th>
                <th className="px-3 py-2">{t('userLedger.createdAt', { defaultValue: 'Created' })}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {entries.length === 0 ?
              <TableEmptyState
                colSpan={9}
                icon="bx-book-content"
                message={t('userLedger.noEntries', { defaultValue: 'No ledger entries found' })}
                sub={t('userLedger.noEntriesSub', { defaultValue: 'Your transaction history will appear here' })} /> :


              entries.map((entry) => {
                const isCredit = entry.entryType === 'credit';

                return (
                  <tr key={entry.id} className="hover:bg-surface-50 dark:hover:bg-white/4 cursor-pointer" onClick={() => router.push(`/ledger/${entry.id}`)}>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-primary-600">{entry.id}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={24} className="mr-2" />
                          <div>
                            <div className="font-medium leading-[1.2]">{entry.coinSymbol || '-'}</div>
                            {entry.networkName &&
                          <small className="text-surface-500 text-xs">{entry.networkName}</small>
                          }
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {entry.entryCode ?
                      <span className="mr-2" title={getEntryCodeLabel(entry.entryCode, t)}>{entry.entryCode}</span> :

                      <span className="text-surface-500">-</span>
                      }
                      </td>
                      <td className="px-3 py-2">{userStateBadge(entry.state, t)}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <span className="font-medium">
                          {isCredit ? '+' : '-'}{formatAmount(entry.amount)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <span className="text-surface-500">{formatUsd(entry.amountUsd)}</span>
                      </td>
                      <td className="px-3 py-2">
                        {entry.txHash ?
                      <div className="flex items-center">
                            <span className="mr-2">{entry.txHash}</span>
                            {entry.explorerUrl &&
                        <a href={`${entry.explorerUrl}/tx/${entry.txHash}`} target="_blank" rel="noopener noreferrer"
                        className="text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                        onClick={(e) => e.stopPropagation()} title={t('userLedger.viewExplorer', { defaultValue: 'View on Explorer' })}>
                                <i className="bx bx-link-external text-xl"></i>
                              </a>
                        }
                          </div> :

                      <span className="text-surface-500">-</span>
                      }
                      </td>
                      <td className="px-3 py-2">
                        <span className="whitespace-nowrap">{fmtDate(entry.createdAt)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/ledger/${entry.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-primary-300 text-primary-600 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-400 dark:hover:bg-primary-900/30"
                      onClick={(e) => e.stopPropagation()}
                      title={t('actions.view', { defaultValue: 'View' })}>
                          <i className="bx bx-show"></i>
                        </Link>
                      </td>
                    </tr>);

              })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          pagination={pagination}
          loading={loading}
          onPageChange={(page) => { setCurrentPage(page); syncSearchParams(appliedFilters, page); }}
        />
      </div>
    </Card>);

}