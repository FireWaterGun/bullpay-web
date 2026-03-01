'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import { getAdminInvoice } from '@/lib/api/admin'
import { formatAmount, formatDate } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { statusBadgeClass } from '@/components/admin/adminInvoiceHelpers'
import AdminInvoicePaymentsTable from '@/components/admin/AdminInvoicePaymentsTable'
import { logger } from '@/lib/utils/logger'

export default function AdminInvoiceDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [invoice, setInvoice] = useState(null)

  useEffect(() => {
    loadInvoice()
  }, [id])

  async function loadInvoice() {
    try {
      setLoading(true)
      const data = await getAdminInvoice(token, id)
      setInvoice(data)
    } catch (error) {
      logger.error('Failed to load invoice:', error)
      toast.error(t('admin.invoices.loadError', { defaultValue: 'Failed to load invoice' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (loading && !invoice) {
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

  if (!invoice) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-warning">Invoice not found</div>
      </div>
    )
  }

  const coinSymbol = (invoice.coin?.symbol || invoice.coinSymbol || '').toUpperCase()
  const networkSymbol = (invoice.network?.symbol || invoice.networkSymbol || '').toUpperCase()
  const networkName = invoice.network?.name || invoice.networkName || ''
  const payments = invoice.payments || []

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Back button */}
          <div className="mb-4">
            <Link href="/admin/invoices" className="btn btn-label-secondary">
              <i className="bx bx-arrow-back me-1"></i>
              Back to Invoices
            </Link>
          </div>

          {/* Invoice Header */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={40} />
                  <div>
                    <h4 className="mb-0">
                      Invoice #{invoice.id}
                      {invoice.invoiceNumber && (
                        <small className="text-muted ms-2">({invoice.invoiceNumber})</small>
                      )}
                    </h4>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className={statusBadgeClass(invoice.status)}>
                        {String(invoice.status || '').toUpperCase()}
                      </span>
                      <span className="text-muted">•</span>
                      <span className="text-muted">{coinSymbol} on {networkName || networkSymbol}</span>
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={loadInvoice} disabled={loading}>
                  <i className="bx bx-refresh me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="row">
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Invoice Details</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>ID</td>
                        <td className="fw-medium">{invoice.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Invoice Number</td>
                        <td className="fw-medium">{invoice.invoiceNumber || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Public Code</td>
                        <td className="fw-medium">{invoice.publicCode || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Status</td>
                        <td>
                          <span className={statusBadgeClass(invoice.status)}>
                            {String(invoice.status || '').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Amount</td>
                        <td className="fw-medium">{formatAmount(invoice.amount)} {coinSymbol}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Paid Amount</td>
                        <td className="fw-medium">{formatAmount(invoice.paidAmount)} {coinSymbol}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Remaining</td>
                        <td className="fw-medium">
                          {formatAmount(invoice.remainingAmount)} {coinSymbol}
                          {invoice.isFullyPaid && (
                            <span className="badge bg-label-success ms-2">Fully Paid</span>
                          )}
                        </td>
                      </tr>
                      {invoice.amountUsd && (
                        <tr>
                          <td className="text-muted">Amount (USD)</td>
                          <td className="fw-medium">${formatAmount(invoice.amountUsd)}</td>
                        </tr>
                      )}
                      {invoice.usdRate && (
                        <tr>
                          <td className="text-muted">USD Rate</td>
                          <td>
                            ${formatAmount(invoice.usdRate)}
                            {invoice.rateSource && (
                              <small className="text-muted ms-1">({invoice.rateSource})</small>
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
                        <td className="text-muted">Created</td>
                        <td>{formatDate(invoice.createdAt || invoice.created_at)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Expires</td>
                        <td>{formatDate(invoice.expiryAt || invoice.expiry_at)}</td>
                      </tr>
                      {invoice.paidAt && (
                        <tr>
                          <td className="text-muted">Paid At</td>
                          <td>{formatDate(invoice.paidAt || invoice.paid_at)}</td>
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
                  <h5 className="mb-0">User & Address</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>User ID</td>
                        <td className="fw-medium">{invoice.userId || invoice.user?.id || '-'}</td>
                      </tr>
                      {invoice.user?.email && (
                        <tr>
                          <td className="text-muted">Email</td>
                          <td className="fw-medium">{invoice.user.email}</td>
                        </tr>
                      )}
                      {invoice.merchantId && (
                        <tr>
                          <td className="text-muted">Merchant ID</td>
                          <td className="fw-medium">{invoice.merchantId}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Payment Address</td>
                        <td>
                          {invoice.paymentAddress ? (
                            <div className="d-flex align-items-center">
                              <code className="text-body me-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {invoice.paymentAddress}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                onClick={() => handleCopy(invoice.paymentAddress)}
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
                      {invoice.memo && (
                        <tr>
                          <td className="text-muted">Memo</td>
                          <td>{invoice.memo}</td>
                        </tr>
                      )}
                      {invoice.description && (
                        <tr>
                          <td className="text-muted">Description</td>
                          <td>{invoice.description}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <AdminInvoicePaymentsTable
            payments={payments}
            coinSymbol={coinSymbol}
            network={invoice.network}
            onCopy={handleCopy}
          />
        </div>
      </div>
    </div>
  )
}
