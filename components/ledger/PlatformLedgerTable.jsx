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
  revenue: 'success',
  expense: 'danger',
  adjustment: 'info',
}

const STATE_BADGE = {
  settled: 'success',
  committed: 'warning',
  reversed: 'secondary',
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
            <th>{t('admin.platformLedger.colId', { defaultValue: 'ID' })}</th>
            <th>{t('admin.platformLedger.colAccount', { defaultValue: 'Account' })}</th>
            <th>{t('admin.platformLedger.colType', { defaultValue: 'Type' })}</th>
            <th>{t('admin.platformLedger.colCoin', { defaultValue: 'Coin' })}</th>
            <th>{t('admin.platformLedger.colCode', { defaultValue: 'Code' })}</th>
            <th>{t('admin.platformLedger.colState', { defaultValue: 'State' })}</th>
            <th className="text-right">{t('admin.platformLedger.colAmount', { defaultValue: 'Amount' })}</th>
            <th className="text-right">{t('admin.platformLedger.colUsd', { defaultValue: 'USD' })}</th>
            <th>{t('admin.platformLedger.colTxHash', { defaultValue: 'Tx Hash' })}</th>
            <th>{t('admin.platformLedger.colCreated', { defaultValue: 'Created' })}</th>
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
                      const accountColor = ACCOUNT_BADGE[entry.accountType]
                      return accountColor ? (
                        <Badge color={accountColor} label>
                          {t(`admin.platformLedger.${entry.accountType}`, { defaultValue: entry.accountType })}
                        </Badge>
                      ) : (
                        <span className="text-surface-500">{entry.accountType || '-'}</span>
                      )
                    })()}
                  </td>
                  <td>
                    <Badge color={entry.state === 'reversed' ? 'secondary' : isCredit ? 'success' : 'danger'} label>
                      <i className={`bx ${isCredit ? 'bx-plus-circle' : 'bx-minus-circle'} mr-1`}></i>
                      {isCredit
                        ? t('admin.platformLedger.credit', { defaultValue: 'Credit' })
                        : t('admin.platformLedger.debit', { defaultValue: 'Debit' })}
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
                      const stateColor = STATE_BADGE[entry.state]
                      return stateColor ? (
                        <Badge color={stateColor} label>
                          {t(`admin.platformLedger.${entry.state}`, { defaultValue: entry.state })}
                        </Badge>
                      ) : (
                        <span className="text-surface-500">{entry.state || '-'}</span>
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
                      variant="text-secondary"
                      size="icon-sm"
                      href={`/admin/platform-ledger/${entry.id}`}
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

      {pagination && pagination.total > 0 && (
        <div className="px-5 py-1.5">
          <Pagination pagination={pagination} onPageChange={handlePageChange} loading={loading} />
        </div>
      )}
    </Card>
  )
}
