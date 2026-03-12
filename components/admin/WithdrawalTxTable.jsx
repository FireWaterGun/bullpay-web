'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import CoinImg from '@/components/CoinImg'
import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import TableEmptyState from '@/components/TableEmptyState'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'

export default function WithdrawalTxTable({
  withdrawals,
  pagination,
  loading,
  currentPage,
  approving,
  rejecting,
  appliedFilters,
  formatAmount,
  statusBadgeClass,
  onCopy,
  onApproveClick,
  onRejectClick,
  onPageChange,
  syncSearchParams,
}) {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const router = useRouter()
  const { copiedId, handleCopy } = useCopyFeedback()

  function truncateHash(hash) {
    if (!hash) return '-'
    if (hash.length <= 16) return hash
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }

  return (
    <Card>
      <Table className="text-sm min-w-max">
        <thead>
          <tr className="border-b border-surface-200 text-left text-xs uppercase text-surface-500 whitespace-nowrap">
            <th>{t('admin.detail.id', { defaultValue: 'ID' })}</th>
            <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
            <th>{t('withdrawal.chain', { defaultValue: 'Chain' })}</th>
            <th>{t('withdrawal.coin', { defaultValue: 'Coin' })}</th>
            <th className="text-right">{t('withdrawal.amount', { defaultValue: 'Amount' })}</th>
            <th className="text-right">{t('table.usd', { defaultValue: 'USD' })}</th>
            <th className="text-right">{t('withdrawal.fee', { defaultValue: 'Fee' })}</th>
            <th className="text-right">{t('withdrawal.feeUsd', { defaultValue: 'Fee USD' })}</th>
            <th className="text-center">{t('withdrawal.status', { defaultValue: 'Status' })}</th>
            <th className="text-center">{t('withdrawal.actions', { defaultValue: 'Actions' })}</th>
            <th>{t('withdrawal.txHash', { defaultValue: 'Tx Hash' })}</th>
            <th>{t('withdrawal.fromAddress', { defaultValue: 'From Address' })}</th>
            <th>{t('withdrawal.toAddress', { defaultValue: 'To Address' })}</th>
            <th>{t('withdrawal.createdAt', { defaultValue: 'Created Date' })}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {withdrawals.length === 0 ? (
            <TableEmptyState
              colSpan={14}
              icon="bx-transfer"
              message={t('withdrawal.noTransactions', { defaultValue: 'No withdrawal transactions found' })}
            />
          ) : (
            withdrawals.map((withdrawal) => (
              <tr key={withdrawal.id} onClick={() => router.push(`/admin/withdrawals/${withdrawal.id}`)} className="cursor-pointer hover:bg-surface-50 dark:hover:bg-white/[0.02] transition-colors">
                <td>
                  <Link href={`/admin/withdrawals/${withdrawal.id}`} className="font-semibold text-primary hover:underline">
                    {withdrawal.id}
                  </Link>
                </td>
                <td className="text-center">
                  <span className="font-medium">{withdrawal.userId || withdrawal.user?.id || '-'}</span>
                </td>
                <td>
                  <span className="text-surface-500">
                    {(withdrawal.network?.symbol || withdrawal.coinNetwork?.network?.symbol || '').toUpperCase() || '-'}
                  </span>
                </td>
                <td className="whitespace-nowrap">
                  <div className="flex items-center">
                    <CoinImg
                      symbol={(
                        withdrawal.coin?.symbol ||
                        withdrawal.coinNetwork?.coin?.symbol ||
                        withdrawal.symbol ||
                        ''
                      ).toUpperCase()}
                      networkSymbol={(
                        withdrawal.network?.symbol ||
                        withdrawal.coinNetwork?.network?.symbol ||
                        ''
                      ).toUpperCase()}
                      size={24}
                      className="mr-3"
                    />

                    <div>
                      <div className="font-medium leading-[1.2]">
                        {(
                          withdrawal.coin?.symbol ||
                          withdrawal.coinNetwork?.coin?.symbol ||
                          withdrawal.symbol ||
                          '-'
                        ).toUpperCase()}
                      </div>
                      {(withdrawal.network?.name || withdrawal.coinNetwork?.network?.name) && (
                        <small className="text-surface-500 text-xs">
                          {withdrawal.network?.name || withdrawal.coinNetwork?.network?.name}
                        </small>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-right whitespace-nowrap">
                  <span className="font-medium">
                    {formatAmount(withdrawal.amountRaw || withdrawal.amount, withdrawal.decimals || 18)}{' '}
                    {withdrawal.coin?.symbol || withdrawal.coinNetwork?.coin?.symbol || withdrawal.symbol || ''}
                  </span>
                </td>
                <td className="text-right whitespace-nowrap">
                  {withdrawal.amountUsd ? (
                    <span className="font-medium">{formatUsd(withdrawal.amountUsd)}</span>
                  ) : (
                    <span className="text-surface-500">-</span>
                  )}
                </td>
                <td className="text-right whitespace-nowrap">
                  <span className="text-surface-500">
                    {formatAmount(
                      withdrawal.totalFeeRaw || withdrawal.totalFee || withdrawal.feeRaw || withdrawal.fee,
                      withdrawal.decimals || 18,
                      8,
                      true
                    )}
                  </span>
                </td>
                <td className="text-right whitespace-nowrap">
                  {withdrawal.totalFeeUsd ? (
                    <span className="text-surface-500">${withdrawal.totalFeeUsd}</span>
                  ) : (
                    <span className="text-surface-500">-</span>
                  )}
                </td>
                <td className="text-center whitespace-nowrap">
                  <span className={statusBadgeClass(withdrawal.status)}>
                    {t(`status.${String(withdrawal.status || '').toLowerCase()}`, {
                      defaultValue: String(withdrawal.status || '').toUpperCase(),
                    })}
                  </span>
                </td>
                <td className="text-center" onClick={e => e.stopPropagation()}>
                  {withdrawal.status?.toLowerCase() === 'pending' ? (
                    <div className="flex gap-1 justify-center">
                      <Button onClick={() => onApproveClick(withdrawal)} disabled={approving || rejecting} size="sm">
                        <i className="bx bx-check mr-1"></i>
                        {t('withdrawal.approve', { defaultValue: 'Approve' })}
                      </Button>
                      <Button
                        onClick={() => onRejectClick(withdrawal)}
                        disabled={approving || rejecting}
                        variant="danger"
                        size="sm"
                      >
                        <i className="bx bx-x mr-1"></i>
                        {t('withdrawal.reject', { defaultValue: 'Reject' })}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-surface-500">-</span>
                  )}
                </td>
                <td onClick={e => e.stopPropagation()}>
                  {withdrawal.txHash ? (
                    <div className="flex items-center">
                      <span className="mr-2 font-mono text-xs">{truncateHash(withdrawal.txHash)}</span>
                      {(withdrawal.network?.explorerUrl || withdrawal.coinNetwork?.network?.explorerUrl) && (
                        <Button
                          variant="text-secondary"
                          size="icon-sm"
                          href={`${withdrawal.network?.explorerUrl || withdrawal.coinNetwork?.network?.explorerUrl}/tx/${withdrawal.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
                        >
                          <i className="bx bx-link-external text-[1rem]"></i>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="text-surface-500">-</span>
                  )}
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="flex items-center">
                    <span className="mr-2 font-mono text-xs">{truncateHash(withdrawal.fromAddress)}</span>
                    {withdrawal.fromAddress && (
                      <Button
                        onClick={() => handleCopy(withdrawal.fromAddress, `from-${withdrawal.id}`)}
                        title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                        size="icon-sm"
                        variant="text-secondary"
                      >
                        <i className={`bx ${copiedId === `from-${withdrawal.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
                      </Button>
                    )}
                  </div>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="flex items-center">
                    <span className="mr-2 font-mono text-xs">{truncateHash(withdrawal.toAddress)}</span>
                    {withdrawal.toAddress && (
                      <Button
                        onClick={() => handleCopy(withdrawal.toAddress, `to-${withdrawal.id}`)}
                        title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                        size="icon-sm"
                        variant="text-secondary"
                      >
                        <i className={`bx ${copiedId === `to-${withdrawal.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
                      </Button>
                    )}
                  </div>
                </td>
                <td>
                  <span className="whitespace-nowrap">{fmtDate(withdrawal.createdAt)}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {pagination && pagination.total > 0 && (
        <div className="px-5 py-1.5">
          <Pagination
            pagination={{
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              limit: pagination.limit,
              hasPrev: pagination.hasPrev,
              hasNext: pagination.hasNext,
            }}
            loading={loading}
            onPageChange={(newPage) => {
              onPageChange(newPage)
              syncSearchParams(appliedFilters, newPage)
            }}
          />
        </div>
      )}
    </Card>
  )
}
