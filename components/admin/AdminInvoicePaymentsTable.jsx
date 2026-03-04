'use client'

import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { paymentStatusBadge } from '@/components/admin/adminInvoiceHelpers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import CardEmptyState from '@/components/CardEmptyState'

/**
 * Payments table for AdminInvoiceDetail.
 * Displays all payments associated with an invoice.
 */
export default function AdminInvoicePaymentsTable({ payments, coinSymbol, network, onCopy }) {
  const { t } = useAdminTranslation()
  const { fmtDate } = useDateFormat()
  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bx bx-transfer me-2"></i>
          Payments ({payments.length})
        </h5>
      </div>
      <div className="card-body">
        {payments.length === 0 ? (
          <CardEmptyState
            icon="bx-credit-card"
            message="No payments recorded for this invoice"
          />
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table table-hover" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '60px' }}>{t('admin.detail.id', { defaultValue: 'ID' })}</th>
                  <th style={{ minWidth: '100px' }}>{t('admin.detail.status', { defaultValue: 'Status' })}</th>
                  <th className="text-end" style={{ minWidth: '150px' }}>{t('admin.detail.amount', { defaultValue: 'Amount' })}</th>
                  <th className="text-end" style={{ minWidth: '150px' }}>{t('admin.detail.actualAmount', { defaultValue: 'Actual Amount' })}</th>
                  <th style={{ minWidth: '120px' }}>{t('admin.detail.confirmations', { defaultValue: 'Confirmations' })}</th>
                  <th style={{ minWidth: '680px' }}>{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</th>
                  <th style={{ minWidth: '420px' }}>{t('admin.detail.fromAddress', { defaultValue: 'From Address' })}</th>
                  <th style={{ minWidth: '420px' }}>{t('admin.detail.toAddress', { defaultValue: 'To Address' })}</th>
                  <th style={{ minWidth: '140px' }}>{t('admin.detail.detected', { defaultValue: 'Detected' })}</th>
                  <th style={{ minWidth: '140px' }}>{t('status.confirmed', { defaultValue: 'Confirmed' })}</th>
                  <th style={{ minWidth: '140px' }}>{t('status.completed', { defaultValue: 'Completed' })}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <span className="fw-semibold text-primary">{payment.id}</span>
                    </td>
                    <td className="text-nowrap">
                      <span className={paymentStatusBadge(payment.status)}>
                        {String(payment.status || '').toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end text-nowrap">
                      <span className="fw-medium">
                        {formatAmount(payment.amount)} {coinSymbol}
                      </span>
                    </td>
                    <td className="text-end text-nowrap">
                      <span className="fw-medium">
                        {formatAmount(payment.actualAmount)} {coinSymbol}
                      </span>
                    </td>
                    <td className="text-center text-nowrap">
                      {payment.confirmations != null ? payment.confirmations : '-'}
                      {payment.requiredConfirmations != null && (
                        <small className="text-muted"> / {payment.requiredConfirmations}</small>
                      )}
                    </td>
                    <td>
                      {payment.txHash ? (
                        <div className="d-flex align-items-center">
                          <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                            {payment.txHash}
                          </span>
                          {network?.explorerUrl && (
                            <a
                              href={`${network.explorerUrl}/tx/${payment.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                              title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
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
                      {payment.fromAddress ? (
                        <div className="d-flex align-items-center">
                          <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                            {payment.fromAddress}
                          </span>
                          <button
                            className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                            onClick={() => onCopy(payment.fromAddress)}
                            title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                          >
                            <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {payment.toAddress ? (
                        <div className="d-flex align-items-center">
                          <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                            {payment.toAddress}
                          </span>
                          <button
                            className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                            onClick={() => onCopy(payment.toAddress)}
                            title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                          >
                            <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {payment.detectedAt ? fmtDate(payment.detectedAt) : <span className="text-muted">-</span>}
                      </span>
                    </td>
                    <td>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {payment.confirmedAt ? fmtDate(payment.confirmedAt) : <span className="text-muted">-</span>}
                      </span>
                    </td>
                    <td>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {payment.completedAt ? fmtDate(payment.completedAt) : <span className="text-muted">-</span>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
