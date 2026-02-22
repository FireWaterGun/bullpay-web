import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getAdminPayment } from '../../api/admin.ts'
import { formatAmount, formatDate } from '../../utils/format'
import CoinImg from '../../components/CoinImg'
import { copyToClipboard as copyText } from '../../utils/clipboard'

export default function AdminPaymentDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [payment, setPayment] = useState(null)

  useEffect(() => {
    loadPayment()
  }, [id])

  async function loadPayment() {
    try {
      setLoading(true)
      const data = await getAdminPayment(token, id)
      setPayment(data)
    } catch (error) {
      console.error('Failed to load payment:', error)
      toast.error(t('admin.payments.loadError', { defaultValue: 'Failed to load payment' }))
    } finally {
      setLoading(false)
    }
  }

  function statusBadgeClass(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'confirmed' || v === 'completed') return 'badge bg-label-success'
    if (v === 'detecting' || v === 'pending') return 'badge bg-label-warning'
    if (v === 'confirming' || v === 'processing') return 'badge bg-label-info'
    if (v === 'failed' || v === 'unconfirmed') return 'badge bg-label-danger'
    if (v === 'expired' || v === 'cancelled' || v === 'canceled') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (loading && !payment) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-warning">Payment not found</div>
      </div>
    )
  }

  const coinSymbol = (payment.coin?.symbol || payment.coinSymbol || payment.invoice?.coin?.symbol || '').toUpperCase()
  const networkSymbol = (payment.network?.symbol || payment.networkSymbol || payment.invoice?.network?.symbol || '').toUpperCase()
  const networkName = payment.network?.name || payment.networkName || payment.invoice?.network?.name || ''
  const explorerUrl = payment.explorerUrl || payment.network?.explorerUrl || payment.invoice?.network?.explorerUrl || ''

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Back button */}
          <div className="mb-4">
            <button className="btn btn-label-secondary" onClick={() => navigate('/admin/payments')}>
              <i className="bx bx-arrow-back me-1"></i>
              Back to Payments
            </button>
          </div>

          {/* Payment Header */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={40} />
                  <div>
                    <h4 className="mb-0">Payment #{payment.id}</h4>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className={statusBadgeClass(payment.status)}>
                        {String(payment.status || '').toUpperCase()}
                      </span>
                      <span className="text-muted">•</span>
                      <span className="text-muted">{coinSymbol} on {networkName || networkSymbol}</span>
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={loadPayment} disabled={loading}>
                  <i className="bx bx-refresh me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="row">
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Payment Details</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>ID</td>
                        <td className="fw-medium">{payment.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Invoice ID</td>
                        <td>
                          {payment.invoiceId ? (
                            <button
                              className="btn btn-sm btn-text-primary p-0 fw-medium"
                              onClick={() => navigate(`/admin/invoices/${payment.invoiceId}`)}
                            >
                              #{payment.invoiceId}
                            </button>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Status</td>
                        <td>
                          <span className={statusBadgeClass(payment.status)}>
                            {String(payment.status || '').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Amount</td>
                        <td className="fw-medium">{formatAmount(payment.amount)} {coinSymbol}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Actual Amount</td>
                        <td className="fw-medium">{formatAmount(payment.actualAmount)} {coinSymbol}</td>
                      </tr>
                      {payment.amountUsd && (
                        <tr>
                          <td className="text-muted">Amount (USD)</td>
                          <td className="fw-medium">${formatAmount(payment.amountUsd)}</td>
                        </tr>
                      )}
                      {payment.usdRate && (
                        <tr>
                          <td className="text-muted">USD Rate</td>
                          <td>
                            ${formatAmount(payment.usdRate)}
                            {payment.rateSource && (
                              <small className="text-muted ms-1">({payment.rateSource})</small>
                            )}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Coin</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} className="me-2" />
                            <span>{coinSymbol}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Network</td>
                        <td>{networkName || networkSymbol || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Confirmations</td>
                        <td>
                          {payment.confirmations != null ? payment.confirmations : '-'}
                          {payment.requiredConfirmations != null && (
                            <small className="text-muted"> / {payment.requiredConfirmations} required</small>
                          )}
                        </td>
                      </tr>
                      {payment.currencyType && (
                        <tr>
                          <td className="text-muted">Currency Type</td>
                          <td>{payment.currencyType}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Created</td>
                        <td>{formatDate(payment.createdAt || payment.created_at)}</td>
                      </tr>
                      {payment.detectedAt && (
                        <tr>
                          <td className="text-muted">Detected At</td>
                          <td>{formatDate(payment.detectedAt)}</td>
                        </tr>
                      )}
                      {payment.confirmedAt && (
                        <tr>
                          <td className="text-muted">Confirmed At</td>
                          <td>{formatDate(payment.confirmedAt)}</td>
                        </tr>
                      )}
                      {payment.completedAt && (
                        <tr>
                          <td className="text-muted">Completed At</td>
                          <td>{formatDate(payment.completedAt)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Transaction Info</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>User ID</td>
                        <td className="fw-medium">{payment.userId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Tx Hash</td>
                        <td>
                          {payment.txHash ? (
                            <div className="d-flex align-items-center">
                              <code className="text-body me-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {payment.txHash}
                              </code>
                              {explorerUrl && (
                                <a
                                  href={`${explorerUrl}/tx/${payment.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                  title="View on explorer"
                                >
                                  <i className="bx bx-link-external"></i>
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">From Address</td>
                        <td>
                          {payment.fromAddress ? (
                            <div className="d-flex align-items-center">
                              <code className="text-body me-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {payment.fromAddress}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                onClick={() => handleCopy(payment.fromAddress)}
                                title="Copy"
                              >
                                <i className="bx bx-copy"></i>
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">To Address</td>
                        <td>
                          {payment.toAddress ? (
                            <div className="d-flex align-items-center">
                              <code className="text-body me-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {payment.toAddress}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                onClick={() => handleCopy(payment.toAddress)}
                                title="Copy"
                              >
                                <i className="bx bx-copy"></i>
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                      {payment.blockNumber && (
                        <tr>
                          <td className="text-muted">Block Number</td>
                          <td>{payment.blockNumber}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
