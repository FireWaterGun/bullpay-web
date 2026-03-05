'use client';

import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import CoinImg from '@/components/CoinImg';
import { formatUsd } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import TableEmptyState from '@/components/TableEmptyState';
import { Button, Card, Spinner } from '../ui';

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
  onPageChange
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
                <th>{t('admin.chain', { defaultValue: 'Chain' })}</th>
                <th>{t('admin.sweep.coin', { defaultValue: 'Coin' })}</th>
                <th className="text-right">{t('admin.sweep.amount', { defaultValue: 'Amount' })}</th>
                <th className="text-right">{t('admin.sweep.actualAmount', { defaultValue: 'Actual Amount' })}</th>
                <th className="text-right">{t('table.usd', { defaultValue: 'USD' })}</th>
                <th className="text-center">{t('admin.sweep.status', { defaultValue: 'Status' })}</th>
                <th>{t('admin.sweep.txHash', { defaultValue: 'Tx Hash' })}</th>
                <th>{t('admin.sweep.from', { defaultValue: 'From Address' })}</th>
                <th>{t('admin.sweep.to', { defaultValue: 'To Address' })}</th>
                <th>{t('admin.sweep.createdAt', { defaultValue: 'Created Date' })}</th>
                <th>{t('admin.sweep.completedAt', { defaultValue: 'Completed Date' })}</th>
                <th className="text-center">{t('admin.sweep.actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody>
              {sweeps.length === 0 ?
              <TableEmptyState
                colSpan={14}
                icon="bx-refresh"
                message={t('admin.sweep.noTransactions', { defaultValue: 'No sweep transactions found' })} /> :


              sweeps.map((sweep) =>
              <tr className="cursor-pointer" key={sweep.id} onClick={() => onNavigate(sweep.id)}>
                    <td>
                      <span className="font-semibold text-primary">{sweep.id}</span>
                    </td>
                    <td className="text-center">
                      <span className="font-medium">{sweep.userId || sweep.user?.id || '-'}</span>
                    </td>
                    <td>
                      <span className="text-muted">
                        {(sweep.coinNetwork?.network?.symbol || '').toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center">
                        <CoinImg
                      symbol={(sweep.coinNetwork?.coin?.symbol || '').toUpperCase()}
                      networkSymbol={(sweep.coinNetwork?.network?.symbol || '').toUpperCase()}
                      size={24}
                      className="mr-3" />
                    
                        <div>
                          <div className="font-medium leading-[1.2]">{(sweep.coinNetwork?.coin?.symbol || '-').toUpperCase()}</div>
                          {sweep.coinNetwork?.network?.name &&
                      <small className="text-muted text-xs">{sweep.coinNetwork.network.name}</small>
                      }
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
                        <span className="text-muted">{sweep.coinNetwork?.coin?.symbol || ''}</span>
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <span>
                        {sweep.actualAmountRaw ? formatAmount(
                      sweep.actualAmountRaw,
                      sweep.decimals,
                      sweep.coinNetwork?.coin?.symbol,
                      sweep.coinNetwork?.network?.symbol
                    ) : '-'}{' '}
                        {sweep.actualAmountRaw && <span className="text-muted">{sweep.coinNetwork?.coin?.symbol || ''}</span>}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {sweep.amountUsd ?
                  <span className="font-medium">{formatUsd(sweep.amountUsd)}</span> :

                  <span className="text-muted">-</span>
                  }
                    </td>
                    <td className="whitespace-nowrap text-center"><span className={statusBadgeClass(sweep.status)}>{String(sweep.status || '').toUpperCase()}</span></td>
                    <td>
                      {sweep.txHash ?
                  <div className="flex items-center">
                          <span className="mr-2">
                            {sweep.txHash}
                          </span>
                          <Button variant="text-secondary" size="icon" className="rounded-full"
                    href={`${sweep.coinNetwork?.network?.explorerUrl}/tx/${sweep.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"

                    title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}>
                      
                            <i className="bx bx-link-external text-xl"></i>
                          </Button>
                        </div> :

                  <span className="text-muted">-</span>
                  }
                    </td>
                    <td>
                      <div className="flex items-center">
                        <span className="mr-2">
                          {sweep.fromAddress || 'N/A'}
                        </span>
                        {sweep.fromAddress &&
                    <Button

                      onClick={() => handleCopy(sweep.fromAddress)}
                      title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })} size="icon" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full">
                      
                            <i className="bx bx-copy text-xl"></i>
                          </Button>
                    }
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center">
                        <span className="mr-2">
                          {sweep.toAddress || 'N/A'}
                        </span>
                        {sweep.toAddress &&
                    <Button

                      onClick={() => handleCopy(sweep.toAddress)}
                      title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })} size="icon" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full">
                      
                            <i className="bx bx-copy text-xl"></i>
                          </Button>
                    }
                      </div>
                    </td>
                    <td>
                      <span className="whitespace-nowrap">{fmtDate(sweep.createdAt)}</span>
                    </td>
                    <td>
                      <span className="whitespace-nowrap">
                        {sweep.completedAt ? fmtDate(sweep.completedAt) : <span className="text-muted">-</span>}
                      </span>
                    </td>
                    <td className="text-center">
                      {['failed', 'error'].includes(String(sweep.status || '').toLowerCase()) ?
                  <Button

                    disabled={retryingId === sweep.id}
                    onClick={(e) => {e.stopPropagation();onRetry(sweep.id);}}
                    title={t('admin.sweepDetail.retrySweep', { defaultValue: 'Retry sweep' })} size="sm" className="border border-warning-500 text-warning-500 bg-transparent hover:bg-warning-500 hover:text-white">
                    
                          {retryingId === sweep.id ?
                    <Spinner className="w-4 h-4" /> :

                    <><i className="bx bx-refresh mr-1"></i>Retry</>
                    }
                        </Button> :

                  <span className="text-muted">-</span>
                  }
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
              onClick={() => onPageChange(pagination.page - 1)} variant="outline-secondary" size="sm">
              
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </Button>
              <Button

              disabled variant="outline-secondary" size="sm">
              
                {pagination.page} / {pagination.totalPages}
              </Button>
              <Button

              disabled={!pagination.hasNext || loading}
              onClick={() => onPageChange(pagination.page + 1)} variant="outline-secondary" size="sm">
              
                {t('actions.next', { defaultValue: 'Next' })}
                <i className="bx bx-chevron-right"></i>
              </Button>
            </div>
          </div>
        }
      </div>
    </Card>);

}