'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import CoinImg from '@/components/CoinImg'
import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { formatAmount, getEntryCodeLabel, userStateBadge } from '@/components/ledger/ledgerUtils'
import TableEmptyState from '@/components/TableEmptyState'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'

export default function MyLedgerTable({
  entries,
  pagination,
  loading,
  currentPage,
  setCurrentPage,
  syncSearchParams,
  appliedFilters,
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const { fmtDate } = useDateFormat()

  return (
    <Card>
      <Table>
        <thead>
          <tr className="whitespace-nowrap">
            <th>{t('userLedger.id', { defaultValue: 'ID' })}</th>
            <th>{t('userLedger.coin', { defaultValue: 'Coin' })}</th>
            <th>{t('userLedger.code', { defaultValue: 'Code' })}</th>
            <th>{t('userLedger.state', { defaultValue: 'State' })}</th>
            <th className="text-right">{t('userLedger.amount', { defaultValue: 'Amount' })}</th>
            <th className="text-right">{t('userLedger.usd', { defaultValue: 'USD' })}</th>
            <th>{t('userLedger.txHash', { defaultValue: 'Tx Hash' })}</th>
            <th>{t('userLedger.createdAt', { defaultValue: 'Created' })}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <TableEmptyState
              colSpan={9}
              icon="bx-book-content"
              message={t('userLedger.noEntries', { defaultValue: 'No ledger entries found' })}
              sub={t('userLedger.noEntriesSub', { defaultValue: 'Your transaction history will appear here' })}
            />
          ) : (
            entries.map((entry) => {
              const isCredit = entry.entryType === 'credit'

              return (
                <tr key={entry.id} className="cursor-pointer" onClick={() => router.push(`/ledger/${entry.id}`)}>
                  <td>
                    <span className="font-semibold text-primary-600">{entry.id}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center">
                      <CoinImg
                        symbol={entry.coinSymbol}
                        networkSymbol={entry.networkSymbol}
                        size={24}
                        className="mr-2"
                      />
                      <div>
                        <div className="font-medium leading-[1.2]">{entry.coinSymbol || '-'}</div>
                        {entry.networkName && <small className="text-surface-500 text-xs">{entry.networkName}</small>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {entry.entryCode ? (
                      <span className="mr-2" title={getEntryCodeLabel(entry.entryCode, t)}>
                        {entry.entryCode}
                      </span>
                    ) : (
                      <span className="text-surface-500">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap">{userStateBadge(entry.state, t)}</td>
                  <td className="text-right whitespace-nowrap">
                    <span className="font-medium">
                      {isCredit ? '+' : '-'}
                      {formatAmount(entry.amount)}
                    </span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <span className="text-surface-500">{formatUsd(entry.amountUsd)}</span>
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
                            className="text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                            onClick={(e) => e.stopPropagation()}
                            title={t('userLedger.viewExplorer', { defaultValue: 'View on Explorer' })}
                          >
                            <i className="bx bx-link-external text-xl"></i>
                          </a>
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
                      href={`/ledger/${entry.id}`}
                      onClick={(e) => e.stopPropagation()}
                      title={t('actions.view', { defaultValue: 'View' })}
                    >
                      <i className="bx bx-show text-[1rem]"></i>
                    </Button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </Table>

      {/* Pagination */}
      <div className="px-5 py-1.5">
        <Pagination
          pagination={pagination}
          loading={loading}
          onPageChange={(page) => {
            setCurrentPage(page)
            syncSearchParams(appliedFilters, page)
          }}
        />
      </div>
    </Card>
  )
}
