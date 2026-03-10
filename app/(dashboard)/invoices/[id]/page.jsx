'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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

/** Derive display status — show 'expired' if past expiryAt even when DB status is still 'pending'. */
function effectiveStatus(invoice) {
  if (invoice.status === 'pending' && invoice.expiryAt && new Date(invoice.expiryAt) < new Date()) {
    return 'expired'
  }
  return invoice.status
}
import InvoiceDetailActions from '@/components/invoices/InvoiceDetailActions'
import RefreshButton from '@/components/RefreshButton'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Label } from '@/components/ui/Input'

export default function InvoiceDetailPage() {
  const { fmtDateTime } = useDateFormat()
  const { t } = useTranslation()
  const params = useParams()
  const id = params?.id
  const { token } = useAuth()
  const [invoice, setInvoice] = useState(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const hasLoadedRef = useRef(false)

  const loadInvoice = useCallback(async () => {
    if (hasLoadedRef.current) {
      setRefreshing(true)
    } else {
      setInitialLoading(true)
    }
    setError('')
    try {
      const res = await getInvoice(id, token)
      setInvoice(res)
      hasLoadedRef.current = true
    } catch (e) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to load invoice')
    } finally {
      setInitialLoading(false)
      setRefreshing(false)
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
  }, [id, token, loadInvoice])

  // Extract coin and network info from invoice response
  const coinSym = (invoice?.coin?.symbol || invoice?.coinSymbol || '').toUpperCase()
  const networkSym = (invoice?.network?.symbol || invoice?.networkSymbol || '').toUpperCase()
  const networkName = invoice?.network?.name || ''
  const explorer = invoice?.network?.explorerUrl || ''
  const cn = invoice
    ? {
        coin: invoice.coin,
        network: invoice.network,
        decimals: invoice.decimals,
      }
    : null

  return (
    <>
      {/* Back button */}
      <div className="mb-4">
        <Button variant="outline-secondary" className="gap-1" href="/invoices">
          <i className="bx bx-arrow-back"></i>
          {t('invoices.backToList', { defaultValue: 'Back to Invoices' })}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400 px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}
      {initialLoading && !invoice ? (
        <Card>
          <div className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-surface-200 rounded w-1/2"></div>
              <div className="h-4 bg-surface-200 rounded w-1/3"></div>
              <div className="h-4 bg-surface-200 rounded w-2/3"></div>
            </div>
          </div>
        </Card>
      ) : !invoice ? (
        <div className="text-surface-500">{t('invoices.notFound') || 'Not found'}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Invoice preview */}
          <div className="lg:col-span-9">
            <Card>
              <div className="p-6">
                <div>
                  <h5 className="font-semibold text-surface-900 mb-1 flex items-center gap-2">
                    <span>{invoice.invoiceNumber || invoice.id}</span>
                    <span
                      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass(effectiveStatus(invoice))}`}
                    >
                      {effectiveStatus(invoice)
                        ? t(`invoices.${effectiveStatus(invoice).toLowerCase()}`, { defaultValue: effectiveStatus(invoice) })
                        : '-'}
                    </span>
                    <RefreshButton onClick={loadInvoice} loading={refreshing} />
                  </h5>
                  {invoice.publicCode && (
                    <div className="text-surface-500 text-xs font-mono mt-0.5 flex items-center gap-1">
                      {t('invoices.paymentId', { defaultValue: 'Payment ID' })}: {invoice.publicCode}
                      <Button
                        variant="text-secondary"
                        size="icon-sm"
                        href={`/pay/${invoice.publicCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t('invoices.viewPaymentPage', { defaultValue: 'View payment page' })}
                      >
                        <i className="bx bx-link-external text-sm"></i>
                      </Button>
                    </div>
                  )}
                  <div className="text-surface-500 text-sm">
                    {t('invoices.createdAt') || 'Created'}: {fmtDateTime(invoice.createdAt || invoice.created_at)}
                  </div>
                  {invoice.expiryAt && (
                    <div className="text-surface-500 text-sm">
                      {t('invoices.expiryAt') || 'Expires'}: {fmtDateTime(invoice.expiryAt)}
                    </div>
                  )}
                </div>

                <hr className="my-5 border-surface-200" />

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>{t('invoices.chain') || 'Chain'}</Label>
                    <div className="font-medium text-surface-500">{networkSym || 'N/A'}</div>
                  </div>
                  <div>
                    <Label>{t('invoices.coin') || 'Coin'}</Label>
                    <div className="flex items-center">
                      <CoinImg coin={cn?.coin} symbol={coinSym} networkSymbol={networkSym} size={32} className="mr-2" />
                      <div>
                        <div className="font-medium">{coinSym}</div>
                        <div className="text-surface-500 text-sm">{networkName}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>{t('invoices.amount') || 'Amount'}</Label>
                    <div className="font-medium">
                      {formatAmount(invoice.amount)} {coinSym}
                    </div>
                  </div>
                  <div>
                    <Label>{t('invoices.paidAmount') || 'Paid Amount'}</Label>
                    <div className="font-medium">
                      {formatAmount(invoice.paidAmount || 0)} {coinSym}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div>
                    <Label>{t('invoices.paymentAddress') || 'Payment Address'}</Label>
                    <div className="flex items-center">
                      <code className="mr-2 break-all flex-grow text-sm">{invoice.paymentAddress || '-'}</code>
                      {explorer && invoice.paymentAddress && (
                        <a
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50 dark:hover:bg-white/6 shrink-0"
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
                  <Label>{t('invoices.description') || 'Description'}</Label>
                  <div className="text-surface-500">{invoice.description || '-'}</div>
                </div>

                <div className="mt-5">
                  <h6 className="font-semibold text-surface-900 mb-2">{t('invoices.payments') || 'Payments'}</h6>
                  <InvoicePaymentsTable payments={invoice.payments} coinSym={coinSym} explorer={explorer} />
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Actions */}
          <InvoiceDetailActions invoice={invoice} explorer={explorer} effectiveStatus={effectiveStatus(invoice)} />
        </div>
      )}
    </>
  )
}
