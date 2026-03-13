'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import TableEmptyState from '@/components/TableEmptyState'
import SortableHeader from '../ui/SortableHeader'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'

export default function RbfTransactionTable({
  transactions,
  loading,
  pagination,
  statusBadgeClass,
  onNavigate,
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

  function formatReplacementReason(reason) {
    if (!reason) return '-'
    return reason.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <Card>
      <Table className="min-w-max">
        <thead>
          <tr className="whitespace-nowrap">
            <th>{t('admin.detail.id', { defaultValue: 'ID' })}</th>
            <th className="text-center">{t('admin.rbf.entityType', { defaultValue: 'Type' })}</th>
            <th className="text-center">{t('admin.rbf.entityId', { defaultValue: 'Entity ID' })}</th>
            <th>{t('admin.rbf.chain', { defaultValue: 'Chain' })}</th>
            <th className="text-right">{t('admin.rbf.amount', { defaultValue: 'Amount' })}</th>
            <SortableHeader field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="text-center">
              {t('admin.rbf.status', { defaultValue: 'Status' })}
            </SortableHeader>
            <th>{t('admin.rbf.txHash', { defaultValue: 'Tx Hash' })}</th>
            <th className="text-center">{t('admin.rbf.reason', { defaultValue: 'Reason' })}</th>
            <th className="text-center">{t('admin.rbf.replacementCount', { defaultValue: '#Replace' })}</th>
            <th className="text-right">{t('admin.rbf.gasBumpPercent', { defaultValue: 'Gas Bump %' })}</th>
            <th>{t('admin.rbf.from', { defaultValue: 'From' })}</th>
            <SortableHeader field="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>
              {t('admin.rbf.createdAt', { defaultValue: 'Created' })}
            </SortableHeader>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <TableEmptyState
              colSpan={12}
              icon="bx-revision"
              message={t('admin.rbf.noTransactions', { defaultValue: 'No RBF transactions found' })}
            />
          ) : (
            transactions.map((tx) => (
              <tr
                className="cursor-pointer"
                key={tx.id}
                onClick={() => onNavigate(tx.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate(tx.id)}
                tabIndex={0}
                role="link"
              >
                <td>
                  <span className="font-semibold text-primary">{tx.id}</span>
                </td>
                <td className="text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      tx.entityType === 'sweep'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                    }`}
                  >
                    {(tx.entityType || '').toUpperCase()}
                  </span>
                </td>
                <td className="text-center">
                  <span className="font-medium">{tx.entityId || '-'}</span>
                </td>
                <td>
                  <span className="text-surface-500 uppercase text-xs font-medium">
                    {tx.chainType || '-'}
                  </span>
                </td>
                <td className="text-right whitespace-nowrap">
                  <span className="font-medium">{tx.amount ?? '-'}</span>
                </td>
                <td className="whitespace-nowrap text-center">
                  <span className={statusBadgeClass(tx.status)}>
                    {String(tx.status || '').toUpperCase()}
                  </span>
                </td>
                <td>
                  {tx.txHash ? (
                    <div className="flex items-center">
                      <span className="mr-2 font-mono text-xs">{truncateHash(tx.txHash)}</span>
                      <Button
                        onClick={(e) => { e.stopPropagation(); doCopy(tx.txHash, `tx-${tx.id}`) }}
                        title={t('admin.detail.copyTxHash', { defaultValue: 'Copy hash' })}
                        size="icon-sm"
                        variant="text-secondary"
                      >
                        <i className={`bx ${copiedId === `tx-${tx.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
                      </Button>
                    </div>
                  ) : (
                    <span className="text-surface-500">-</span>
                  )}
                </td>
                <td className="text-center">
                  <span className="text-xs">{formatReplacementReason(tx.replacementReason)}</span>
                </td>
                <td className="text-center">
                  {tx.replacementCount > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                      {tx.replacementCount}
                    </span>
                  ) : (
                    <span className="text-surface-500">0</span>
                  )}
                </td>
                <td className="text-right">
                  {tx.gasBumpPercent != null ? (
                    <span className="font-medium">{tx.gasBumpPercent}%</span>
                  ) : (
                    <span className="text-surface-500">-</span>
                  )}
                </td>
                <td>
                  {tx.fromAddress ? (
                    <div className="flex items-center">
                      <span className="mr-2 font-mono text-xs">{truncateHash(tx.fromAddress)}</span>
                      <Button
                        onClick={(e) => { e.stopPropagation(); doCopy(tx.fromAddress, `from-${tx.id}`) }}
                        title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                        size="icon-sm"
                        variant="text-secondary"
                      >
                        <i className={`bx ${copiedId === `from-${tx.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
                      </Button>
                    </div>
                  ) : (
                    <span className="text-surface-500">-</span>
                  )}
                </td>
                <td>
                  <span className="whitespace-nowrap">{fmtDate(tx.createdAt)}</span>
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
