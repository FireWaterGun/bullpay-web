'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getAdminPayment } from '@/lib/api/admin'
import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

export default function AdminPaymentDetail() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const { id } = useParams()
  const { token } = useAuth()
  const toast = useToast()
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
      logger.error('Failed to load payment:', error)
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
    return <PageSpinner />
  }

  if (!payment) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-warning">{t('admin.paymentDetail.notFound', { defaultValue: 'Payment not found' })}</div>
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
            <Link href="/admin/payments" className="btn btn-label-secondary">
              <i className="bx bx-arrow-back me-1"></i>
              Back to Payments
            </Link>
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
                <RefreshButton onClick={loadPayment} loading={loading} />
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
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="fw-medium">{payment.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Invoice ID</td>
                        <td>
                          {payment.invoiceId ? (
                            <Link
                              href={`/admin/invoices/${payment.invoiceId}`}
                              className="btn btn-sm btn-text-primary p-0 fw-medium"
                            >
                              #{payment.invoiceId}
                            </Link>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.status', { defaultValue: 'Status' })}</td>
                        <td>
                          <span className={statusBadgeClass(payment.status)}>
                            {String(payment.status || '').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.amount', { defaultValue: 'Amount' })}</td>
                        <td className="fw-medium">{formatAmount(payment.amount)} {coinSymbol}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Actual Amount</td>
                        <td className="fw-medium">{formatAmount(payment.actualAmount)} {coinSymbol}</td>
                      </tr>
                      {payment.amountUsd && (
                        <tr>
                          <td className="text-muted">{t('admin.detail.amountUsd', { defaultValue: 'Amount (USD)' })}</td>
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
                        <td className="text-muted">{t('admin.detail.coin', { defaultValue: 'Coin' })}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} className="me-2" />
                            <span>{coinSymbol}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.network', { defaultValue: 'Network' })}</td>
                        <td>{networkName || networkSymbol || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.confirmations', { defaultValue: 'Confirmations' })}</td>
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
                        <td className="text-muted">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                        <td>{fmtDate(payment.createdAt || payment.created_at)}</td>
                      </tr>
                      {payment.detectedAt && (
                        <tr>
                          <td className="text-muted">Detected At</td>
                          <td>{fmtDate(payment.detectedAt)}</td>
                        </tr>
                      )}
                      {payment.confirmedAt && (
                        <tr>
                          <td className="text-muted">Confirmed At</td>
                          <td>{fmtDate(payment.confirmedAt)}</td>
                        </tr>
                      )}
                      {payment.completedAt && (
                        <tr>
                          <td className="text-muted">Completed At</td>
                          <td>{fmtDate(payment.completedAt)}</td>
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
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
                        <td className="fw-medium">{payment.userId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</td>
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
                                  title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
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
                        <td className="text-muted">{t('admin.detail.fromAddress', { defaultValue: 'From Address' })}</td>
                        <td>
                          {payment.fromAddress ? (
                            <div className="d-flex align-items-center">
                              <code className="text-body me-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {payment.fromAddress}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                onClick={() => handleCopy(payment.fromAddress)}
                                title={t('actions.copy', { defaultValue: 'Copy' })}
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
                        <td className="text-muted">{t('admin.detail.toAddress', { defaultValue: 'To Address' })}</td>
                        <td>
                          {payment.toAddress ? (
                            <div className="d-flex align-items-center">
                              <code className="text-body me-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {payment.toAddress}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                onClick={() => handleCopy(payment.toAddress)}
                                title={t('actions.copy', { defaultValue: 'Copy' })}
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
                          <td className="text-muted">{t('admin.detail.blockNumber', { defaultValue: 'Block Number' })}</td>
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
