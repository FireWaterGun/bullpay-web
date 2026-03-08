'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'

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
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

export default function AdminInvoiceDetail() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const { id } = useParams()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [invoice, setInvoice] = useState(null)

  const loadInvoice = useCallback(async () => {
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
  }, [token, id, toast, t])

  useEffect(() => {
    loadInvoice()
  }, [loadInvoice])

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (loading && !invoice) {
    return <PageSpinner />
  }

  if (!invoice) {
    return (
      <div className="grow pb-6">
        <Alert variant="warning">{t('admin.invoiceDetail.notFound', { defaultValue: 'Invoice not found' })}</Alert>
      </div>
    )
  }

  const coinSymbol = (invoice.coin?.symbol || invoice.coinSymbol || '').toUpperCase()
  const networkSymbol = (invoice.network?.symbol || invoice.networkSymbol || '').toUpperCase()
  const networkName = invoice.network?.name || invoice.networkName || ''
  const payments = invoice.payments || []

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <AdminBreadcrumb items={[
            { label: t('admin.invoices.title', { defaultValue: 'Invoices' }), href: '/admin/invoices', icon: 'bx-receipt' },
            { label: `#${invoice.id}` },
          ]} />

          {/* Invoice Header */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={40} />
                  <div>
                    <h4 className="mb-0">
                      {t('admin.invoiceDetail.invoice', { defaultValue: 'Invoice' })} #{invoice.id}
                      {invoice.invoiceNumber && (
                        <small className="text-surface-500 ml-2">({invoice.invoiceNumber})</small>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={statusBadgeClass(invoice.status)}>
                        {String(invoice.status || '').toUpperCase()}
                      </span>
                      <span className="text-surface-500">•</span>
                      <span className="text-surface-500">
                        {coinSymbol} · {networkName || networkSymbol}
                      </span>
                    </div>
                  </div>
                </div>
                <RefreshButton onClick={loadInvoice} loading={loading} />
              </div>
            </div>
          </Card>

          {/* Invoice Details */}
          <div className="grid grid-cols-12 gap-x-6">
            <div className="col-span-12 md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    {t('admin.invoiceDetail.invoiceDetails', { defaultValue: 'Invoice Details' })}
                  </h5>
                </div>
                <div className="p-5">
                  <Table responsive={false} className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{invoice.id}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.detail.invoiceNumber', { defaultValue: 'Invoice Number' })}
                        </td>
                        <td className="font-medium">{invoice.invoiceNumber || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.detail.publicCode', { defaultValue: 'Public Code' })}
                        </td>
                        <td className="font-medium">
                          {invoice.publicCode ? (
                            <span className="flex items-center gap-2">
                              {invoice.publicCode}
                              <Button
                                variant="text-secondary"
                                size="icon-sm"
                                href={`/invoice/${invoice.publicCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={t('admin.invoiceDetail.viewPaymentPage', { defaultValue: 'View payment page' })}
                              >
                                <i className="bx bx-link-external text-base"></i>
                              </Button>
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.status', { defaultValue: 'Status' })}</td>
                        <td>
                          <span className={statusBadgeClass(invoice.status)}>
                            {String(invoice.status || '').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.amount', { defaultValue: 'Amount' })}</td>
                        <td className="font-medium">
                          {formatAmount(invoice.amount)} {coinSymbol}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.detail.paidAmount', { defaultValue: 'Paid Amount' })}
                        </td>
                        <td className="font-medium">
                          {formatAmount(invoice.paidAmount)} {coinSymbol}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.detail.remaining', { defaultValue: 'Remaining' })}
                        </td>
                        <td className="font-medium">
                          {formatAmount(invoice.remainingAmount)} {coinSymbol}
                          {invoice.isFullyPaid && (
                            <Badge color="success" label className="ml-2">
                              {t('admin.detail.fullyPaid', { defaultValue: 'Fully Paid' })}
                            </Badge>
                          )}
                        </td>
                      </tr>
                      {invoice.amountUsd && (
                        <tr>
                          <td className="text-surface-500">
                            {t('admin.detail.amountUsd', { defaultValue: 'Amount (USD)' })}
                          </td>
                          <td className="font-medium">${formatAmount(invoice.amountUsd)}</td>
                        </tr>
                      )}
                      {invoice.usdRate && (
                        <tr>
                          <td className="text-surface-500">
                            {t('admin.detail.usdRate', { defaultValue: 'USD Rate' })}
                          </td>
                          <td>
                            ${formatAmount(invoice.usdRate)}
                            {invoice.rateSource && (
                              <small className="text-surface-500 ml-1">({invoice.rateSource})</small>
                            )}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.coin', { defaultValue: 'Coin' })}</td>
                        <td>
                          <div className="flex items-center">
                            <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} className="mr-2" />
                            <span>{coinSymbol}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.network', { defaultValue: 'Network' })}</td>
                        <td>{networkName || networkSymbol || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                        <td>{fmtDate(invoice.createdAt || invoice.created_at)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.expiresAt', { defaultValue: 'Expires' })}</td>
                        <td>{fmtDate(invoice.expiryAt || invoice.expiry_at)}</td>
                      </tr>
                      {invoice.paidAt && (
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.paidAt', { defaultValue: 'Paid At' })}</td>
                          <td>{fmtDate(invoice.paidAt || invoice.paid_at)}</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card>
            </div>

            <div className="col-span-12 md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">{t('admin.detail.userAddress', { defaultValue: 'User & Address' })}</h5>
                </div>
                <div className="p-5">
                  <Table responsive={false} className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">
                          {t('admin.detail.userId', { defaultValue: 'User ID' })}
                        </td>
                        <td className="font-medium">{invoice.userId || invoice.user?.id || '-'}</td>
                      </tr>
                      {invoice.user?.email && (
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.email', { defaultValue: 'Email' })}</td>
                          <td className="font-medium">{invoice.user.email}</td>
                        </tr>
                      )}
                      {invoice.merchantId && (
                        <tr>
                          <td className="text-surface-500">
                            {t('admin.invoiceDetail.merchantId', { defaultValue: 'Merchant ID' })}
                          </td>
                          <td className="font-medium">{invoice.merchantId}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.detail.paymentAddress', { defaultValue: 'Payment Address' })}
                        </td>
                        <td>
                          {invoice.paymentAddress ? (
                            <div className="flex items-center">
                              <code className="mr-2 text-[0.8rem] break-all">{invoice.paymentAddress}</code>
                              <Button
                                onClick={() => handleCopy(invoice.paymentAddress)}
                                title={t('actions.copy', { defaultValue: 'Copy' })}
                                size="icon-sm"
                                variant="text-secondary"
                                className="shrink-0"
                              >
                                <i className="bx bx-copy"></i>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-surface-500">-</span>
                          )}
                        </td>
                      </tr>
                      {invoice.memo && (
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.memo', { defaultValue: 'Memo' })}</td>
                          <td>{invoice.memo}</td>
                        </tr>
                      )}
                      {invoice.description && (
                        <tr>
                          <td className="text-surface-500">
                            {t('admin.detail.description', { defaultValue: 'Description' })}
                          </td>
                          <td>{invoice.description}</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card>
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
