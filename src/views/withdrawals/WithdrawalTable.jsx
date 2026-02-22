import { useTranslation } from 'react-i18next'
import CoinImg from '../../components/CoinImg'
import { formatUsd, formatDate } from '../../utils/format'

export default function WithdrawalTable({
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
                <th>{t('withdrawal.chain', { defaultValue: 'Chain' })}</th>
                <th>{t('withdrawal.coin', { defaultValue: 'Coin' })}</th>
                <th className="text-end">{t('withdrawal.amount', { defaultValue: 'Amount' })}</th>
                <th className="text-end">{t('table.usd', { defaultValue: 'USD' })}</th>
                <th className="text-end">{t('withdrawal.fee', { defaultValue: 'Fee' })}</th>
                <th className="text-end">{t('withdrawal.feeUsd', { defaultValue: 'Fee USD' })}</th>
                <th className="text-center">{t('withdrawal.status', { defaultValue: 'Status' })}</th>
                <th className="text-center">{t('withdrawal.actions', { defaultValue: 'Actions' })}</th>
                <th>{t('withdrawal.txHash', { defaultValue: 'Tx Hash' })}</th>
                <th>{t('withdrawal.fromAddress', { defaultValue: 'From Address' })}</th>
                <th>{t('withdrawal.toAddress', { defaultValue: 'To Address' })}</th>
                <th>{t('withdrawal.createdAt', { defaultValue: 'Created Date' })}</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="14" className="text-center text-muted py-4">
                    {t('withdrawal.noTransactions', { defaultValue: 'No withdrawal transactions found' })}
                  </td>
                </tr>
              ) : (
              withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td>
                    <span className="fw-semibold text-primary">{withdrawal.id}</span>
                  </td>
                  <td className="text-center">
                    <span className="fw-medium">{withdrawal.userId || withdrawal.user?.id || '-'}</span>
                  </td>
                  <td>
                    <span className="text-muted">
                      {(withdrawal.network?.symbol || withdrawal.coinNetwork?.network?.symbol || '').toUpperCase() || 'N/A'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div className="d-flex align-items-center">
                      <CoinImg
                        symbol={(withdrawal.coin?.symbol || withdrawal.coinNetwork?.coin?.symbol || withdrawal.symbol || '').toUpperCase()}
                        networkSymbol={(withdrawal.network?.symbol || withdrawal.coinNetwork?.network?.symbol || '').toUpperCase()}
                        size={24}
                        className="me-3"
                      />
                      <div>
                        <div className="fw-medium" style={{ lineHeight: 1.2 }}>{(withdrawal.coin?.symbol || withdrawal.coinNetwork?.coin?.symbol || withdrawal.symbol || '-').toUpperCase()}</div>
                        {(withdrawal.network?.name || withdrawal.coinNetwork?.network?.name) && (
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>{withdrawal.network?.name || withdrawal.coinNetwork?.network?.name}</small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-end text-nowrap">
                    <span className="fw-medium">
                      {formatAmount(withdrawal.amountRaw || withdrawal.amount, withdrawal.decimals || 18)} {withdrawal.coin?.symbol || withdrawal.coinNetwork?.coin?.symbol || withdrawal.symbol || ''}
                    </span>
                  </td>
                  <td className="text-end text-nowrap">
                    {withdrawal.amountUsd ? (
                      <span className="fw-medium">{formatUsd(withdrawal.amountUsd)}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="text-end text-nowrap">
                    <span className="text-muted">
                      {formatAmount(withdrawal.totalFeeRaw || withdrawal.totalFee || withdrawal.feeRaw || withdrawal.fee, withdrawal.decimals || 18, 8, true)}
                    </span>
                  </td>
                  <td className="text-end text-nowrap">
                    {withdrawal.totalFeeUsd ? (
                      <span className="text-muted">${withdrawal.totalFeeUsd}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="text-center text-nowrap"><span className={statusBadgeClass(withdrawal.status)}>{String(withdrawal.status || '').toUpperCase()}</span></td>
                  <td className="text-center">
                    {withdrawal.status?.toLowerCase() === 'pending' ? (
                      <div className="d-flex gap-1 justify-content-center">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => onApproveClick(withdrawal)}
                          disabled={approving || rejecting}
                        >
                          <i className="bx bx-check me-1"></i>
                          {t('withdrawal.approve', { defaultValue: 'Approve' })}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => onRejectClick(withdrawal)}
                          disabled={approving || rejecting}
                        >
                          <i className="bx bx-x me-1"></i>
                          {t('withdrawal.reject', { defaultValue: 'Reject' })}
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {withdrawal.txHash ? (
                      <div className="d-flex align-items-center">
                        <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                          {withdrawal.txHash}
                        </span>
                        {(withdrawal.network?.explorerUrl || withdrawal.coinNetwork?.network?.explorerUrl) && (
                          <a
                            href={`${withdrawal.network?.explorerUrl || withdrawal.coinNetwork?.network?.explorerUrl}/tx/${withdrawal.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                            title="View on explorer"
                          >
                            <i className="bx bx-link-external" style={{ fontSize: '1.25rem' }}></i>
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                        {withdrawal.fromAddress || 'N/A'}
                      </span>
                      {withdrawal.fromAddress && (
                        <button
                          className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                          onClick={() => onCopy(withdrawal.fromAddress)}
                          title="Copy address"
                        >
                          <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                        {withdrawal.toAddress || 'N/A'}
                      </span>
                      {withdrawal.toAddress && (
                        <button
                          className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                          onClick={() => onCopy(withdrawal.toAddress)}
                          title="Copy address"
                        >
                          <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ whiteSpace: 'nowrap' }}>{formatDate(withdrawal.createdAt)}</span>
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
                onClick={() => { onPageChange(currentPage - 1); syncSearchParams(appliedFilters, currentPage - 1) }}
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
                onClick={() => { onPageChange(currentPage + 1); syncSearchParams(appliedFilters, currentPage + 1) }}
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
