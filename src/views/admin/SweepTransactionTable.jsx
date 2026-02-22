import { useTranslation } from 'react-i18next'
import CoinImg from '../../components/CoinImg'
import { formatUsd, formatDate } from '../../utils/format'

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
}) {
  const { t } = useTranslation()

  return (
    <div className="card">
      <div className="card-body">
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="table table-hover" style={{ minWidth: '1200px' }}>
            <thead>
              <tr style={{ whiteSpace: 'nowrap' }}>
                <th>ID</th>
                <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
                <th>{t('admin.chain', { defaultValue: 'Chain' })}</th>
                <th>{t('admin.sweep.coin', { defaultValue: 'Coin' })}</th>
                <th className="text-end">{t('admin.sweep.amount', { defaultValue: 'Amount' })}</th>
                <th className="text-end">{t('admin.sweep.actualAmount', { defaultValue: 'Actual Amount' })}</th>
                <th className="text-end">{t('table.usd', { defaultValue: 'USD' })}</th>
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
              {sweeps.length === 0 ? (
                <tr>
                  <td colSpan="14" className="text-center text-muted py-4">
                    {t('admin.sweep.noTransactions', { defaultValue: 'No sweep transactions found' })}
                  </td>
                </tr>
              ) : (
                sweeps.map((sweep) => (
                  <tr key={sweep.id} style={{ cursor: 'pointer' }} onClick={() => onNavigate(sweep.id)}>
                    <td>
                      <span className="fw-semibold text-primary">{sweep.id}</span>
                    </td>
                    <td className="text-center">
                      <span className="fw-medium">{sweep.userId || sweep.user?.id || '-'}</span>
                    </td>
                    <td>
                      <span className="text-muted">
                        {(sweep.coinNetwork?.network?.symbol || '').toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="d-flex align-items-center">
                        <CoinImg
                          symbol={(sweep.coinNetwork?.coin?.symbol || '').toUpperCase()}
                          networkSymbol={(sweep.coinNetwork?.network?.symbol || '').toUpperCase()}
                          size={24}
                          className="me-3"
                        />
                        <div>
                          <div className="fw-medium" style={{ lineHeight: 1.2 }}>{(sweep.coinNetwork?.coin?.symbol || '-').toUpperCase()}</div>
                          {sweep.coinNetwork?.network?.name && (
                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{sweep.coinNetwork.network.name}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-end text-nowrap">
                      <span className="fw-medium">
                        {formatAmount(
                          sweep.amountRaw,
                          sweep.decimals,
                          sweep.coinNetwork?.coin?.symbol,
                          sweep.coinNetwork?.network?.symbol
                        )}{' '}
                        <span className="text-muted">{sweep.coinNetwork?.coin?.symbol || ''}</span>
                      </span>
                    </td>
                    <td className="text-end text-nowrap">
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
                    <td className="text-end text-nowrap">
                      {sweep.amountUsd ? (
                        <span className="fw-medium">{formatUsd(sweep.amountUsd)}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="text-nowrap text-center"><span className={statusBadgeClass(sweep.status)}>{String(sweep.status || '').toUpperCase()}</span></td>
                    <td>
                      {sweep.txHash ? (
                        <div className="d-flex align-items-center">
                          <span className="me-2">
                            {sweep.txHash}
                          </span>
                          <a
                            href={`${sweep.coinNetwork?.network?.explorerUrl}/tx/${sweep.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                            title="View on explorer"
                          >
                            <i className="bx bx-link-external" style={{ fontSize: '1.25rem' }}></i>
                          </a>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-2">
                          {sweep.fromAddress || 'N/A'}
                        </span>
                        {sweep.fromAddress && (
                          <button
                            className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                            onClick={() => handleCopy(sweep.fromAddress)}
                            title="Copy address"
                          >
                            <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-2">
                          {sweep.toAddress || 'N/A'}
                        </span>
                        {sweep.toAddress && (
                          <button
                            className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                            onClick={() => handleCopy(sweep.toAddress)}
                            title="Copy address"
                          >
                            <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ whiteSpace: 'nowrap' }}>{formatDate(sweep.createdAt)}</span>
                    </td>
                    <td>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {sweep.completedAt ? formatDate(sweep.completedAt) : <span className="text-muted">-</span>}
                      </span>
                    </td>
                    <td className="text-center">
                      {['failed', 'error'].includes(String(sweep.status || '').toLowerCase()) ? (
                        <button
                          className="btn btn-sm btn-outline-warning"
                          disabled={retryingId === sweep.id}
                          onClick={(e) => { e.stopPropagation(); onRetry(sweep.id) }}
                          title="Retry sweep"
                        >
                          {retryingId === sweep.id ? (
                            <span className="spinner-border spinner-border-sm"></span>
                          ) : (
                            <><i className="bx bx-refresh me-1"></i>Retry</>
                          )}
                        </button>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.total > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted small">
              {t('invoices.showingEntries', {
                start: pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0,
                end: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total,
                defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
              })}
            </div>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={!pagination.hasPrev || loading}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled
              >
                {pagination.page} / {pagination.totalPages}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={!pagination.hasNext || loading}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                {t('actions.next', { defaultValue: 'Next' })}
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
