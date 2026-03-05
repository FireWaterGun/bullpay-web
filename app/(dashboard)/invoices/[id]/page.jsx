'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { getInvoice } from '@/lib/api/invoices'
import { useAuth } from '@/app/providers'
import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useInvoiceEvents } from '@/hooks/useInvoiceEvents'
import CoinImg from '@/components/CoinImg'
import { statusClass } from '@/components/invoices/invoiceDetailHelpers'
import InvoicePaymentsTable from '@/components/invoices/InvoicePaymentsTable'
import InvoiceDetailActions from '@/components/invoices/InvoiceDetailActions'
import RefreshButton from '@/components/RefreshButton'

export default function InvoiceDetailPage() {
  const { fmtDateTime } = useDateFormat()
  const { t } = useTranslation()
  const params = useParams()
  const id = params?.id
  const { token } = useAuth()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadInvoice = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getInvoice(id, token)
      setInvoice(res)
    } catch (e) {
      setError(
        typeof e?.message === 'string'
          ? e.message
          : 'Failed to load invoice'
      )
    } finally {
      setLoading(false)
    }
  }, [id, token])

  // Subscribe to invoice events
  useInvoiceEvents(id, {
    onPaymentReceived: () => loadInvoice(),
    onStatusChanged: () => loadInvoice(),
    onUpdated: () => loadInvoice(),
    onPaymentCompleted: () => loadInvoice(),
  })

  useEffect(() => {
    if (id && token) loadInvoice()
  }, [loadInvoice])

  // Extract coin and network info from invoice response
  const coinSym = (invoice?.coin?.symbol || invoice?.coinSymbol || '').toUpperCase()
  const networkSym = (invoice?.network?.symbol || invoice?.networkSymbol || '').toUpperCase()
  const networkName = invoice?.network?.name || ''
  const explorer = invoice?.network?.explorerUrl || ''
  const cn = invoice ? {
    coin: invoice.coin,
    network: invoice.network,
    decimals: invoice.decimals,
  } : null

  return (
    <>
      {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm mb-4">{error}</div>}
      {loading ? (
        <div className="card">
          <div className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-surface-200 rounded w-1/2"></div>
              <div className="h-4 bg-surface-200 rounded w-1/3"></div>
              <div className="h-4 bg-surface-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      ) : !invoice ? (
        <div className="text-surface-500">{t('invoices.notFound') || 'Not found'}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Invoice preview */}
          <div className="lg:col-span-9">
            <div className="card">
              <div className="p-6">
                <div>
                  <h5 className="font-semibold text-surface-900 mb-1 flex items-center gap-2">
                    <span>{invoice.publicCode || invoice.code || invoice.id}</span>
                    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass(invoice.status)}`}>
                      {invoice.status ? t(`invoices.${invoice.status.toLowerCase()}`, { defaultValue: invoice.status }) : '-'}
                    </span>
                    <RefreshButton onClick={loadInvoice} loading={loading} />
                  </h5>
                  <div className="text-surface-500 text-sm">
                    {t('invoices.createdAt') || 'Created'}: {fmtDateTime(invoice.createdAt || invoice.created_at)}
                  </div>
                  {invoice.expiryAt && (
                    <div className="text-surface-500 text-sm">
                      {t('invoices.expiryAt') || 'Expires'}: {fmtDateTime(invoice.expiryAt)}
                    </div>
                  )}
                </div>

                <hr className="my-5 border-surface-100" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="form-label">{t('invoices.chain') || 'Chain'}</label>
                    <div className="font-medium text-surface-500">{networkSym || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="form-label">{t('invoices.coin') || 'Coin'}</label>
                    <div className="flex items-center">
                      <CoinImg coin={cn?.coin} symbol={coinSym} networkSymbol={networkSym} size={32} className="mr-2" />
                      <div>
                        <div className="font-medium">{coinSym}</div>
                        <div className="text-surface-500 text-sm">{networkName}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">{t('invoices.amount') || 'Amount'}</label>
                    <div className="font-medium">
                      {formatAmount(invoice.amount)} {coinSym}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">{t('invoices.paidAmount') || 'Paid Amount'}</label>
                    <div className="font-medium">
                      {formatAmount(invoice.paidAmount || 0)} {coinSym}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div>
                    <label className="form-label">{t('invoices.paymentAddress') || 'Payment Address'}</label>
                    <div className="flex items-center">
                      <code className="mr-2 break-all flex-grow text-sm">{invoice.paymentAddress || '-'}</code>
                      {explorer && invoice.paymentAddress && (
                        <a
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50 shrink-0"
                          href={`${explorer.replace(/\/$/, '')}/address/${invoice.paymentAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="bx bx-link-external"></i>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="form-label">{t('invoices.description') || 'Description'}</label>
                  <div className="text-surface-500">{invoice.description || invoice.memo || '-'}</div>
                </div>

                <div className="mt-5">
                  <h6 className="font-semibold text-surface-900 mb-2">{t('invoices.payments') || 'Payments'}</h6>
                  <InvoicePaymentsTable
                    payments={invoice.payments}
                    coinSym={coinSym}
                    explorer={explorer}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <InvoiceDetailActions invoice={invoice} explorer={explorer} />
        </div>
      )}
    </>
  )
}
