'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useRouter } from 'next/navigation'

import CoinImg from '@/components/CoinImg'
import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import TableEmptyState from '@/components/TableEmptyState'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Pagination from '../ui/Pagination'
import Table from '../ui/Table'

function formatAmount(val) {
  if (!val && val !== 0) return '0'
  let str = String(val)
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '')
  }
  return str || '0'
}

const ACCOUNT_BADGE = {
  revenue: { color: 'success', label: 'Revenue' },
  expense: { color: 'danger', label: 'Expense' },
  adjustment: { color: 'info', label: 'Adjustment' },
}

const STATE_BADGE = {
  settled: { color: 'success', label: 'Settled' },
  committed: { color: 'warning', label: 'Committed' },
  reversed: { color: 'secondary', label: 'Reversed' },
}

export default function PlatformLedgerTable({
  entries,
  pagination,
  loading,
  currentPage,
  setCurrentPage,
  syncSearchParams,
  appliedFilters,
}) {
  const { t } = useAdminTranslation()
  const router = useRouter()
  const { fmtDate } = useDateFormat()

  function handlePageChange(page) {
    setCurrentPage(page)
    syncSearchParams(appliedFilters, page)
  }

  return (
    <Card>
      <Table>
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
          {entries.length === 0 ? (
            <TableEmptyState
              colSpan={11}
              icon="bx-receipt"
              message={t('admin.platformLedger.noEntries', { defaultValue: 'No revenue & expense entries found' })}
            />
          ) : (
            entries.map((entry) => {
              const isCredit = entry.entryType === 'credit'

              return (
                <tr
                  className="cursor-pointer"
                  key={entry.id}
                  onClick={() => router.push(`/admin/platform-ledger/${entry.id}`)}
                >
                  <td>
                    <span className="font-semibold text-primary">{entry.id}</span>
                  </td>
                  <td>
                    {(() => {
                      const account = ACCOUNT_BADGE[entry.accountType]
                      return account ? (
                        <Badge color={account.color} label>
                          {account.label}
                        </Badge>
                      ) : (
                        <span className="text-surface-500">{entry.accountType || 'N/A'}</span>
                      )
                    })()}
                  </td>
                  <td>
                    <Badge color={entry.state === 'reversed' ? 'secondary' : isCredit ? 'success' : 'danger'} label>
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
                      <span className="font-medium">{entry.entryCode}</span>
                    ) : (
                      <span className="text-surface-500">-</span>
                    )}
                  </td>
                  <td>
                    {(() => {
                      const state = STATE_BADGE[entry.state]
                      return state ? (
                        <Badge color={state.color} label>
                          {state.label}
                        </Badge>
                      ) : (
                        <span className="text-surface-500">{entry.state || 'N/A'}</span>
                      )
                    })()}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <span
                      className={`font-medium ${entry.state === 'reversed' ? '' : isCredit ? 'text-success' : 'text-danger'}`}
                    >
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
                        <span className="mr-2">{entry.txHash}</span>
                        {entry.explorerUrl && (
                          <Button
                            variant="text-secondary"
                            size="icon-sm"
                            href={`${entry.explorerUrl}/tx/${entry.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="View on explorer"
                          >
                            <i className="bx bx-link-external"></i>
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
                      variant="outline-primary"
                      size="icon-sm"
                      href={`/admin/platform-ledger/${entry.id}`}
                      onClick={(e) => e.stopPropagation()}
                      title={t('actions.view', { defaultValue: 'View' })}
                    >
                      <i className="bx bx-show"></i>
                    </Button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </Table>

      {pagination && pagination.total > 0 && (
        <div className="px-5 py-1.5">
          <Pagination pagination={pagination} onPageChange={handlePageChange} loading={loading} />
        </div>
      )}
    </Card>
  )
}
