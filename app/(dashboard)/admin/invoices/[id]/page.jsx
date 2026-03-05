'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getAdminInvoice } from '@/lib/api/admin'
import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { statusBadgeClass } from '@/components/admin/adminInvoiceHelpers'
import AdminInvoicePaymentsTable from '@/components/admin/AdminInvoicePaymentsTable'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

export default function AdminInvoiceDetail() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
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
    return <PageSpinner />
  }

  if (!invoice) {
    return (
      <div className="grow py-6">
        <div className="alert alert-warning">{t('admin.invoiceDetail.notFound', { defaultValue: 'Invoice not found' })}</div>
      </div>
    )
  }

  const coinSymbol = (invoice.coin?.symbol || invoice.coinSymbol || '').toUpperCase()
  const networkSymbol = (invoice.network?.symbol || invoice.networkSymbol || '').toUpperCase()
  const networkName = invoice.network?.name || invoice.networkName || ''
  const payments = invoice.payments || []

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back button */}
          <div className="mb-4">
            <Link href="/admin/invoices" className="btn btn bg-surface-100 text-surface-700 hover:bg-surface-200 shadow-none">
              <i className="bx bx-arrow-back mr-1"></i>
              Back to Invoices
            </Link>
          </div>

          {/* Invoice Header */}
          <div className="card mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={40} />
                  <div>
                    <h4 className="mb-0">
                      Invoice #{invoice.id}
                      {invoice.invoiceNumber && (
                        <small className="text-muted ml-2">({invoice.invoiceNumber})</small>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={statusBadgeClass(invoice.status)}>
                        {String(invoice.status || '').toUpperCase()}
                      </span>
                      <span className="text-muted">•</span>
                      <span className="text-muted">{coinSymbol} on {networkName || networkSymbol}</span>
                    </div>
                  </div>
                </div>
                <RefreshButton onClick={loadInvoice} loading={loading} />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-12 gap-x-6">
            <div className="md:col-span-6">
              <div className="card mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">Invoice Details</h5>
                </div>
                <div className="p-5">
                  <table className="w-full mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{invoice.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Invoice Number</td>
                        <td className="font-medium">{invoice.invoiceNumber || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Public Code</td>
                        <td className="font-medium">{invoice.publicCode || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.status', { defaultValue: 'Status' })}</td>
                        <td>
                          <span className={statusBadgeClass(invoice.status)}>
                            {String(invoice.status || '').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.amount', { defaultValue: 'Amount' })}</td>
                        <td className="font-medium">{formatAmount(invoice.amount)} {coinSymbol}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Paid Amount</td>
                        <td className="font-medium">{formatAmount(invoice.paidAmount)} {coinSymbol}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Remaining</td>
                        <td className="font-medium">
                          {formatAmount(invoice.remainingAmount)} {coinSymbol}
                          {invoice.isFullyPaid && (
                            <span className="badge bg-green-50 text-green-700 ml-2">Fully Paid</span>
                          )}
                        </td>
                      </tr>
                      {invoice.amountUsd && (
                        <tr>
                          <td className="text-muted">{t('admin.detail.amountUsd', { defaultValue: 'Amount (USD)' })}</td>
                          <td className="font-medium">${formatAmount(invoice.amountUsd)}</td>
                        </tr>
                      )}
                      {invoice.usdRate && (
                        <tr>
                          <td className="text-muted">USD Rate</td>
                          <td>
                            ${formatAmount(invoice.usdRate)}
                            {invoice.rateSource && (
                              <small className="text-muted ml-1">({invoice.rateSource})</small>
                            )}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">{t('admin.detail.coin', { defaultValue: 'Coin' })}</td>
                        <td>
                          <div className="flex items-center">
                            <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} className="mr-2" />
                            <span>{coinSymbol}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.network', { defaultValue: 'Network' })}</td>
                        <td>{networkName || networkSymbol || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                        <td>{fmtDate(invoice.createdAt || invoice.created_at)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Expires</td>
                        <td>{fmtDate(invoice.expiryAt || invoice.expiry_at)}</td>
                      </tr>
                      {invoice.paidAt && (
                        <tr>
                          <td className="text-muted">Paid At</td>
                          <td>{fmtDate(invoice.paidAt || invoice.paid_at)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="md:col-span-6">
              <div className="card mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">User & Address</h5>
                </div>
                <div className="p-5">
                  <table className="w-full mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
                        <td className="font-medium">{invoice.userId || invoice.user?.id || '-'}</td>
                      </tr>
                      {invoice.user?.email && (
                        <tr>
                          <td className="text-muted">{t('admin.detail.email', { defaultValue: 'Email' })}</td>
                          <td className="font-medium">{invoice.user.email}</td>
                        </tr>
                      )}
                      {invoice.merchantId && (
                        <tr>
                          <td className="text-muted">Merchant ID</td>
                          <td className="font-medium">{invoice.merchantId}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Payment Address</td>
                        <td>
                          {invoice.paymentAddress ? (
                            <div className="flex items-center">
                              <code className="text-body mr-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {invoice.paymentAddress}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full shrink-0"
                                onClick={() => handleCopy(invoice.paymentAddress)}
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
