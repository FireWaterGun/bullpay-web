'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import CoinImg from '@/components/CoinImg'
import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import TableEmptyState from '@/components/TableEmptyState'
import SortableHeader from '../ui/SortableHeader'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Spinner from '../ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'

export default function SweepTransactionTable({
  sweeps,
  loading,
  pagination,
  retryingId,
  formatAmount,
  handleCopy,
  statusBadgeClass,
  onNavigate,
  onRetry,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
}) {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const { copiedId, handleCopy: doCopy } = useCopyFeedback()

  function truncateHash(hash) {
    if (!hash) return '-'
    if (hash.length <= 16) return hash
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }

  return (
    <Card>
      <Table className="min-w-max">
        <thead>
          <tr className="whitespace-nowrap">
            <th>{t('admin.detail.id', { defaultValue: 'ID' })}</th>
            <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
            <th>{t('admin.chain', { defaultValue: 'Chain' })}</th>
            <th>{t('admin.sweep.coin', { defaultValue: 'Coin' })}</th>
            <SortableHeader field="amount" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="text-right">{t('admin.sweep.amount', { defaultValue: 'Amount' })}</SortableHeader>
            <th className="text-right">{t('admin.sweep.actualAmount', { defaultValue: 'Actual Amount' })}</th>
            <th className="text-right">{t('table.usd', { defaultValue: 'USD' })}</th>
            <th className="text-center">{t('admin.sweep.status', { defaultValue: 'Status' })}</th>
            <th>{t('admin.sweep.txHash', { defaultValue: 'Tx Hash' })}</th>
            <th>{t('admin.sweep.from', { defaultValue: 'From Address' })}</th>
            <th>{t('admin.sweep.to', { defaultValue: 'To Address' })}</th>
            <SortableHeader field="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>{t('admin.sweep.createdAt', { defaultValue: 'Created Date' })}</SortableHeader>
            <SortableHeader field="completed_at" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>{t('admin.sweep.completedAt', { defaultValue: 'Completed Date' })}</SortableHeader>
            <th className="text-center">{t('admin.sweep.actions', { defaultValue: 'Actions' })}</th>
          </tr>
        </thead>
        <tbody>
          {sweeps.length === 0 ? (
            <TableEmptyState
              colSpan={14}
              icon="bx-refresh"
              message={t('admin.sweep.noTransactions', { defaultValue: 'No sweep transactions found' })}
            />
          ) : (
            sweeps.map((sweep) => (
              <tr
                className="cursor-pointer"
                key={sweep.id}
                onClick={() => onNavigate(sweep.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate(sweep.id)}
                tabIndex={0}
                role="link"
              >
                <td>
                  <span className="font-semibold text-primary">{sweep.id}</span>
                </td>
                <td className="text-center">
                  <span className="font-medium">{sweep.userId || sweep.user?.id || '-'}</span>
                </td>
                <td>
                  <span className="text-surface-500">
                    {(sweep.coinNetwork?.network?.symbol || '').toUpperCase() || 'N/A'}
                  </span>
                </td>
                <td className="whitespace-nowrap">
                  <div className="flex items-center">
                    <CoinImg
                      symbol={(sweep.coinNetwork?.coin?.symbol || '').toUpperCase()}
                      networkSymbol={(sweep.coinNetwork?.network?.symbol || '').toUpperCase()}
                      size={24}
                      className="mr-3"
                    />

                    <div>
                      <div className="font-medium leading-[1.2]">
                        {(sweep.coinNetwork?.coin?.symbol || '-').toUpperCase()}
                      </div>
                      {sweep.coinNetwork?.network?.name && (
                        <small className="text-surface-500 text-xs">{sweep.coinNetwork.network.name}</small>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-right whitespace-nowrap">
                  <span className="font-medium">
                    {formatAmount(
                      sweep.amountRaw,
                      sweep.decimals,
                      sweep.coinNetwork?.coin?.symbol,
                      sweep.coinNetwork?.network?.symbol
                    )}{' '}
                    <span className="text-surface-500">{sweep.coinNetwork?.coin?.symbol || ''}</span>
                  </span>
                </td>
                <td className="text-right whitespace-nowrap">
                  <span>
                    {sweep.actualAmountRaw
                      ? formatAmount(
                          sweep.actualAmountRaw,
                          sweep.decimals,
                          sweep.coinNetwork?.coin?.symbol,
                          sweep.coinNetwork?.network?.symbol
                        )
                      : '-'}{' '}
                    {sweep.actualAmountRaw && (
                      <span className="text-surface-500">{sweep.coinNetwork?.coin?.symbol || ''}</span>
                    )}
                  </span>
                </td>
                <td className="text-right whitespace-nowrap">
                  {sweep.amountUsd ? (
                    <span className="font-medium">{formatUsd(sweep.amountUsd)}</span>
                  ) : (
                    <span className="text-surface-500">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap text-center">
                  <span className={statusBadgeClass(sweep.status)}>{String(sweep.status || '').toUpperCase()}</span>
                </td>
                <td>
                  {sweep.txHash ? (
                    <div className="flex items-center">
                      <span className="mr-2 font-mono text-xs">{truncateHash(sweep.txHash)}</span>
                      <Button
                        variant="text-secondary"
                        size="icon-sm"
                        href={`${sweep.coinNetwork?.network?.explorerUrl}/tx/${sweep.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
                      >
                        <i className="bx bx-link-external"></i>
                      </Button>
                    </div>
                  ) : (
                    <span className="text-surface-500">-</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center">
                    <span className="mr-2 font-mono text-xs">{truncateHash(sweep.fromAddress)}</span>
                    {sweep.fromAddress && (
                      <Button
                        onClick={(e) => { e.stopPropagation(); doCopy(sweep.fromAddress, `from-${sweep.id}`) }}
                        title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                        size="icon-sm"
                        variant="text-secondary"
                      >
                        <i className={`bx ${copiedId === `from-${sweep.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
                      </Button>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex items-center">
                    <span className="mr-2 font-mono text-xs">{truncateHash(sweep.toAddress)}</span>
                    {sweep.toAddress && (
                      <Button
                        onClick={(e) => { e.stopPropagation(); doCopy(sweep.toAddress, `to-${sweep.id}`) }}
                        title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                        size="icon-sm"
                        variant="text-secondary"
                      >
                        <i className={`bx ${copiedId === `to-${sweep.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
                      </Button>
                    )}
                  </div>
                </td>
                <td>
                  <span className="whitespace-nowrap">{fmtDate(sweep.createdAt)}</span>
                </td>
                <td>
                  <span className="whitespace-nowrap">
                    {sweep.completedAt ? fmtDate(sweep.completedAt) : <span className="text-surface-500">-</span>}
                  </span>
                </td>
                <td className="text-center">
                  {['failed', 'error'].includes(String(sweep.status || '').toLowerCase()) ? (
                    <Button
                      disabled={retryingId === sweep.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onRetry(sweep.id)
                      }}
                      title={t('admin.sweepDetail.retrySweep', { defaultValue: 'Retry sweep' })}
                      size="sm"
                      className="border border-warning-500 text-warning-500 bg-transparent hover:bg-warning-500 hover:text-white"
                    >
                      {retryingId === sweep.id ? (
                        <Spinner className="w-4 h-4" />
                      ) : (
                        <>
                          <i className="bx bx-refresh mr-1"></i>Retry
                        </>
                      )}
                    </Button>
                  ) : (
                    <span className="text-surface-500">-</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <div className="px-5 py-1.5">
        <Pagination pagination={pagination} onPageChange={onPageChange} loading={loading} />
      </div>
    </Card>
  )
}
