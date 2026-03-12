'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useRouter } from 'next/navigation'

import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import TableEmptyState from '@/components/TableEmptyState'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Pagination from '../ui/Pagination'
import Table from '../ui/Table'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'

function truncateHash(hash) {
  if (!hash) return '-'
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

function parseMetadata(entry) {
  try {
    return typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata || {}
  } catch {
    return {}
  }
}

function getPurposeLabel(metadata) {
  if (!metadata) return null
  const purposeMap = {
    payment_received: 'Payment Received',
    merchant_credit: 'Merchant Credit',
    native_coin_sweep_cost: 'Sweep Cost',
    gas_topup_for_token_sweep: 'Gas Top-up',
    token_sweep_cost: 'Token Sweep Cost',
  }
  return purposeMap[metadata.purpose] || purposeMap[metadata.type] || metadata.purpose || metadata.type || null
}

function stateBadge(state) {
  if (state === 'settled') return <span>Settled</span>
  if (state === 'committed') return <span>Committed</span>
  if (state === 'pending') return <span>Pending</span>
  if (state === 'reversed') return <span>Reversed</span>
  return <span className="text-surface-500">{state || 'N/A'}</span>
}

function formatAmount(val) {
  if (!val && val !== 0) return '0'
  let str = String(val)
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '')
  }
  return str || '0'
}

export default function SystemLedgerTable({

  entries,
  loading,
  pagination,
  currentPage,
  setCurrentPage,
  syncSearchParams,
  appliedFilters,
}) {
  const { t } = useAdminTranslation()
  const router = useRouter()
  const { fmtDate } = useDateFormat()
  const { copiedId, handleCopy } = useCopyFeedback()

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
            <th>{t('admin.ledger.type', { defaultValue: 'Type' })}</th>
            <th>{t('admin.ledger.coin', { defaultValue: 'Coin' })}</th>
            <th>Code</th>
            <th>{t('admin.ledger.state', { defaultValue: 'State' })}</th>
            <th className="text-right">{t('admin.ledger.amount', { defaultValue: 'Amount' })}</th>
            <th className="text-right">USD</th>
            <th>Purpose</th>
            <th>Tx Hash</th>
            <th>{t('admin.ledger.createdAt', { defaultValue: 'Created' })}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <TableEmptyState
              colSpan={11}
              icon="bx-book-content"
              message={t('admin.ledger.noEntries', { defaultValue: 'No ledger entries found' })}
            />
          ) : (
            entries.map((entry) => {
              const isCredit = entry.entryType === 'credit'
              const metadata = parseMetadata(entry)
              const purposeLabel = getPurposeLabel(metadata)

              return (
                <tr
                  className="cursor-pointer"
                  key={entry.id}
                  onClick={() => router.push(`/admin/system-ledger/${entry.id}`)}
                >
                  <td>
                    <span className="font-semibold text-primary">{entry.id}</span>
                  </td>
                  <td>
                    <Badge color={entry.state === 'reversed' ? 'secondary' : isCredit ? 'danger' : 'success'} label>
                      <i className={`bx ${isCredit ? 'bx-minus-circle' : 'bx-plus-circle'} mr-1`}></i>
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
                  <td>{stateBadge(entry.state)}</td>
                  <td className="text-right whitespace-nowrap">
                    <span
                      className={`font-medium ${entry.state === 'reversed' ? '' : isCredit ? 'text-danger' : 'text-success'}`}
                    >
                      {entry.state === 'reversed' ? '' : isCredit ? '-' : '+'}
                      {formatAmount(entry.amount)}
                    </span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <span className="text-surface-500">{formatUsd(entry.amountUsd)}</span>
                  </td>
                  <td>
                    <div>
                      {purposeLabel && <div className="font-medium text-[0.85rem]">{purposeLabel}</div>}
                      {metadata?.invoiceNumber && <Badge>{metadata.invoiceNumber}</Badge>}
                      {metadata?.sweepId && !metadata?.invoiceNumber && (
                        <small className="text-surface-500">Sweep #{metadata.sweepId}</small>
                      )}
                      {!purposeLabel && !metadata?.invoiceNumber && !metadata?.sweepId && (
                        <span className="text-surface-500">-</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {entry.txHash ? (
                      <div className="flex items-center">
                        <span className="mr-2 font-mono text-xs" title={entry.txHash}>{truncateHash(entry.txHash)}</span>
                        <Button
                          variant="text-secondary"
                          size="icon-sm"
                          onClick={(e) => { e.stopPropagation(); handleCopy(entry.txHash, `tx-${entry.id}`) }}
                          title="Copy Tx Hash"
                        >
                          <i className={`bx ${copiedId === `tx-${entry.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
                        </Button>
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
                      href={`/admin/system-ledger/${entry.id}`}
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
