'use client';

import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import CoinImg from '@/components/CoinImg';
import { formatUsd } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import TableEmptyState from '@/components/TableEmptyState';
import { Button, Card } from '../ui';

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
  syncSearchParams
}) {
  const { fmtDate } = useDateFormat();
  const { t } = useAdminTranslation();

  return (
    <Card>
      <div className="p-5">
        <div className="overflow-x-auto overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="whitespace-nowrap">
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
            <tbody>
              {withdrawals.length === 0 ?
              <TableEmptyState
                colSpan={14}
                icon="bx-transfer"
                message={t('withdrawal.noTransactions', { defaultValue: 'No withdrawal transactions found' })} /> :


              withdrawals.map((withdrawal) =>
              <tr key={withdrawal.id}>
                  <td>
                    <span className="font-semibold text-primary">{withdrawal.id}</span>
                  </td>
                  <td className="text-center">
                    <span className="font-medium">{withdrawal.userId || withdrawal.user?.id || '-'}</span>
                  </td>
                  <td>
                    <span className="text-muted">
                      {(withdrawal.network?.symbol || withdrawal.coinNetwork?.network?.symbol || '').toUpperCase() || 'N/A'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center">
                      <CoinImg
                      symbol={(withdrawal.coin?.symbol || withdrawal.coinNetwork?.coin?.symbol || withdrawal.symbol || '').toUpperCase()}
                      networkSymbol={(withdrawal.network?.symbol || withdrawal.coinNetwork?.network?.symbol || '').toUpperCase()}
                      size={24}
                      className="mr-3" />
                    
                      <div>
                        <div className="font-medium leading-[1.2]">{(withdrawal.coin?.symbol || withdrawal.coinNetwork?.coin?.symbol || withdrawal.symbol || '-').toUpperCase()}</div>
                        {(withdrawal.network?.name || withdrawal.coinNetwork?.network?.name) &&
                      <small className="text-muted text-xs">{withdrawal.network?.name || withdrawal.coinNetwork?.network?.name}</small>
                      }
                      </div>
                    </div>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <span className="font-medium">
                      {formatAmount(withdrawal.amountRaw || withdrawal.amount, withdrawal.decimals || 18)} {withdrawal.coin?.symbol || withdrawal.coinNetwork?.coin?.symbol || withdrawal.symbol || ''}
                    </span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {withdrawal.amountUsd ?
                  <span className="font-medium">{formatUsd(withdrawal.amountUsd)}</span> :

                  <span className="text-muted">-</span>
                  }
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <span className="text-muted">
                      {formatAmount(withdrawal.totalFeeRaw || withdrawal.totalFee || withdrawal.feeRaw || withdrawal.fee, withdrawal.decimals || 18, 8, true)}
                    </span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {withdrawal.totalFeeUsd ?
                  <span className="text-muted">${withdrawal.totalFeeUsd}</span> :

                  <span className="text-muted">-</span>
                  }
                  </td>
                  <td className="text-center whitespace-nowrap"><span className={statusBadgeClass(withdrawal.status)}>{String(withdrawal.status || '').toUpperCase()}</span></td>
                  <td className="text-center">
                    {withdrawal.status?.toLowerCase() === 'pending' ?
                  <div className="flex gap-1 justify-center">
                        <Button

                      onClick={() => onApproveClick(withdrawal)}
                      disabled={approving || rejecting} size="sm">
                      
                          <i className="bx bx-check mr-1"></i>
                          {t('withdrawal.approve', { defaultValue: 'Approve' })}
                        </Button>
                        <Button

                      onClick={() => onRejectClick(withdrawal)}
                      disabled={approving || rejecting} variant="danger" size="sm">
                      
                          <i className="bx bx-x mr-1"></i>
                          {t('withdrawal.reject', { defaultValue: 'Reject' })}
                        </Button>
                      </div> :

                  <span className="text-muted">-</span>
                  }
                  </td>
                  <td>
                    {withdrawal.txHash ?
                  <div className="flex items-center">
                        <span className="mr-2 whitespace-nowrap">
                          {withdrawal.txHash}
                        </span>
                        {(withdrawal.network?.explorerUrl || withdrawal.coinNetwork?.network?.explorerUrl) &&
                    <Button variant="text-secondary" size="icon" className="rounded-full"
                    href={`${withdrawal.network?.explorerUrl || withdrawal.coinNetwork?.network?.explorerUrl}/tx/${withdrawal.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"

                    title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}>
                      
                            <i className="bx bx-link-external text-xl"></i>
                          </Button>
                    }
                      </div> :

                  <span className="text-muted">-</span>
                  }
                  </td>
                  <td>
                    <div className="flex items-center">
                      <span className="mr-2 whitespace-nowrap">
                        {withdrawal.fromAddress || 'N/A'}
                      </span>
                      {withdrawal.fromAddress &&
                    <Button

                      onClick={() => onCopy(withdrawal.fromAddress)}
                      title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })} size="icon" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full">
                      
                          <i className="bx bx-copy text-xl"></i>
                        </Button>
                    }
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center">
                      <span className="mr-2 whitespace-nowrap">
                        {withdrawal.toAddress || 'N/A'}
                      </span>
                      {withdrawal.toAddress &&
                    <Button

                      onClick={() => onCopy(withdrawal.toAddress)}
                      title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })} size="icon" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full">
                      
                          <i className="bx bx-copy text-xl"></i>
                        </Button>
                    }
                    </div>
                  </td>
                  <td>
                    <span className="whitespace-nowrap">{fmtDate(withdrawal.createdAt)}</span>
                  </td>
                </tr>
              )
              }
          </tbody>
        </table>
        </div>

        {pagination && pagination.total > 0 &&
        <div className="flex justify-between items-center mt-4">
            <div className="text-muted text-sm">
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
              onClick={() => {onPageChange(currentPage - 1);syncSearchParams(appliedFilters, currentPage - 1);}} variant="outline-secondary" size="sm">
              
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </Button>
              <Button

              disabled variant="outline-secondary" size="sm">
              
                {pagination.page} / {pagination.totalPages}
              </Button>
              <Button

              disabled={!pagination.hasNext || loading}
              onClick={() => {onPageChange(currentPage + 1);syncSearchParams(appliedFilters, currentPage + 1);}} variant="outline-secondary" size="sm">
              
                {t('actions.next', { defaultValue: 'Next' })}
                <i className="bx bx-chevron-right"></i>
              </Button>
            </div>
          </div>
        }
      </div>
    </Card>);

}