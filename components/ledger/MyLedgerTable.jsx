'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import CoinImg from '@/components/CoinImg';
import { formatUsd } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import TableEmptyState from '@/components/TableEmptyState';
import { Card } from '../ui'

const ENTRY_CODE_LABELS = {
  'DP': 'Deposit',
  'WA': 'Withdrawal Amount',
  'WF': 'Withdrawal Fee',
  'WR': 'Withdrawal Reversal',
  'FR': 'Fee Revenue',
  'XI': 'Internal Transfer In',
  'XO': 'Internal Transfer Out'
};

function getEntryCodeLabel(code, t) {
  return t ? t(`userLedger.code.${code}`, { defaultValue: ENTRY_CODE_LABELS[code] || code }) : ENTRY_CODE_LABELS[code] || code;
}

function formatAmount(val) {
  if (!val && val !== 0) return '0';
  let str = String(val);
  if (str.includes('.')) str = str.replace(/0+$/, '').replace(/\.$/, '');
  return str || '0';
}

function stateText(state, t) {
  const colorMap = {
    settled: 'bg-green-100 text-green-700',
    committed: 'bg-blue-100 text-blue-700',
    reversed: 'bg-surface-100 text-surface-600'
  };
  const cls = colorMap[state] || '';
  if (cls) return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{t(`userLedger.${state}`, { defaultValue: state.charAt(0).toUpperCase() + state.slice(1) })}</span>;
  return <span className="text-surface-500">{state || 'N/A'}</span>;
}

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
              <tr className="border-b text-left text-xs uppercase text-surface-500 whitespace-nowrap">
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
            <tbody className="divide-y">
              {entries.length === 0 ?
              <TableEmptyState
                colSpan={9}
                icon="bx-book-content"
                message={t('userLedger.noEntries', { defaultValue: 'No ledger entries found' })}
                sub={t('userLedger.noEntriesSub', { defaultValue: 'Your transaction history will appear here' })} /> :


              entries.map((entry) => {
                const isCredit = entry.entryType === 'credit';

                return (
                  <tr key={entry.id} className="hover:bg-surface-50 cursor-pointer" onClick={() => router.push(`/ledger/${entry.id}`)}>
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
                      <td className="px-3 py-2">{stateText(entry.state, t)}</td>
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
                        className="text-surface-400 hover:text-primary-600"
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
                        <Link href={`/ledger/${entry.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-primary-300 text-primary-600 hover:bg-primary-50"
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
            <div className="flex">
              <button className="px-3 py-1.5 text-sm border border-surface-300 rounded-l-lg hover:bg-surface-50 disabled:opacity-50"
            disabled={!pagination.hasPrev || loading}
            onClick={() => {setCurrentPage((p) => p - 1);syncSearchParams(appliedFilters, currentPage - 1);}}>
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </button>
              <button className="px-3 py-1.5 text-sm border-y border-surface-300 bg-surface-50" disabled>
                {pagination.page} / {pagination.totalPages}
              </button>
              <button className="px-3 py-1.5 text-sm border border-surface-300 rounded-r-lg hover:bg-surface-50 disabled:opacity-50"
            disabled={!pagination.hasNext || loading}
            onClick={() => {setCurrentPage((p) => p + 1);syncSearchParams(appliedFilters, currentPage + 1);}}>
                {t('actions.next', { defaultValue: 'Next' })}
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          </div>
        }
      </div>
    </Card>);

}