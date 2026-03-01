'use client'

import { formatAmount, formatDate } from '@/lib/utils/format'
import { paymentStatusBadge } from '@/components/admin/adminInvoiceHelpers'

/**
 * Payments table for AdminInvoiceDetail.
 * Displays all payments associated with an invoice.
 */
export default function AdminInvoicePaymentsTable({ payments, coinSymbol, network, onCopy }) {
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
          <div className="text-center text-muted py-4">
            No payments recorded for this invoice
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table table-hover" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '60px' }}>ID</th>
                  <th style={{ minWidth: '100px' }}>Status</th>
                  <th className="text-end" style={{ minWidth: '150px' }}>Amount</th>
                  <th className="text-end" style={{ minWidth: '150px' }}>Actual Amount</th>
                  <th style={{ minWidth: '120px' }}>Confirmations</th>
                  <th style={{ minWidth: '680px' }}>Tx Hash</th>
                  <th style={{ minWidth: '420px' }}>From Address</th>
                  <th style={{ minWidth: '420px' }}>To Address</th>
                  <th style={{ minWidth: '140px' }}>Detected</th>
                  <th style={{ minWidth: '140px' }}>Confirmed</th>
                  <th style={{ minWidth: '140px' }}>Completed</th>
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
                      {payment.fromAddress ? (
                        <div className="d-flex align-items-center">
                          <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                            {payment.fromAddress}
                          </span>
                          <button
                            className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                            onClick={() => onCopy(payment.fromAddress)}
                            title="Copy address"
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
                            title="Copy address"
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
                        {payment.detectedAt ? formatDate(payment.detectedAt) : <span className="text-muted">-</span>}
                      </span>
                    </td>
                    <td>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {payment.confirmedAt ? formatDate(payment.confirmedAt) : <span className="text-muted">-</span>}
                      </span>
                    </td>
                    <td>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {payment.completedAt ? formatDate(payment.completedAt) : <span className="text-muted">-</span>}
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
