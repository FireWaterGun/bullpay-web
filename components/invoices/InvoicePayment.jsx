'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import { usePusher } from '@/app/providers'
import { getPublicInvoice, getPublicInvoiceStatus } from '@/lib/api/invoices'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { formatCoinAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import CountdownTimer from './CountdownTimer'
import PaymentQRCode from './PaymentQRCode'
import PaymentProgressCard from './PaymentProgressCard'
import PageSpinner from '@/components/PageSpinner'

export default function InvoicePayment({ code }) {
  const { t } = useTranslation()
  const toast = useToast()
  const pusher = usePusher()
  const { fmtDate } = useDateFormat()

  const [invoice, setInvoice] = useState(null)
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadInvoice = useCallback(async () => {
    if (!code) return
    try {
      setLoading(true)
      const data = await getPublicInvoice(code)
      setInvoice(data.invoice)
      setQr(data.qr)
    } catch (err) {
      setError(err?.message || 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    loadInvoice()
  }, [loadInvoice])

  // Real-time updates via Pusher
  useEffect(() => {
    if (!pusher?.subscribe || !pusher?.isConnected || !invoice?.id) return
    const channelName = `invoice.${invoice.id}`
    const channel = pusher.subscribe(channelName)

    const refreshStatus = async () => {
      try {
        const statusData = await getPublicInvoiceStatus(code)
        setInvoice(prev => prev ? { ...prev, ...statusData } : prev)
      } catch { /* ignore */ }
    }

    channel.bind('payment.received', refreshStatus)
    channel.bind('invoice.status.changed', refreshStatus)

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(channelName)
    }
  }, [pusher?.subscribe, pusher?.isConnected, invoice?.id, code])

  async function handleCopy(text) {
    const ok = await copyToClipboard(text)
    if (ok) toast.success(t('common.copied', { defaultValue: 'Copied!' }))
  }

  if (loading) {
    return <PageSpinner />
  }

  if (error || !invoice) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-danger">
          <i className="bx bx-error-circle me-1"></i>
          {error || t('invoices.notFound', { defaultValue: 'Invoice not found' })}
        </div>
      </div>
    )
  }

  const status = String(invoice.status || '').toLowerCase()
  const isPaid = status === 'paid' || status === 'completed'
  const isExpired = status === 'expired'

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          {/* Status badge */}
          <div className="text-center mb-4">
            {isPaid && (
              <div className="alert alert-success py-2">
                <i className="bx bx-check-circle me-1"></i>
                {t('invoices.paidSuccess', { defaultValue: 'Payment received successfully!' })}
              </div>
            )}
            {isExpired && (
              <div className="alert alert-danger py-2">
                <i className="bx bx-time-five me-1"></i>
                {t('invoices.expired', { defaultValue: 'This invoice has expired' })}
              </div>
            )}
          </div>

          {/* Payment Progress */}
          <PaymentProgressCard invoice={invoice} t={t} />

          {/* QR Code + Address */}
          {!isPaid && !isExpired && (
            <div className="card mb-3">
              <div className="card-body text-center">
                {qr?.dataUrl && (
                  <div className="mb-3">
                    <PaymentQRCode qrDataUrl={qr.dataUrl} size={220} />
                  </div>
                )}

                {invoice.paymentAddress && (
                  <div className="mb-3">
                    <label className="form-label small text-muted">
                      {t('invoices.sendTo', { defaultValue: 'Send to this address' })}
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control font-monospace"
                        value={invoice.paymentAddress}
                        readOnly
                        style={{ fontSize: '0.85rem' }}
                      />
                      <button className="btn btn-outline-secondary" onClick={() => handleCopy(invoice.paymentAddress)}>
                        <i className="bx bx-copy"></i>
                      </button>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <span className="text-muted small">{t('invoices.amount', { defaultValue: 'Amount' })}:</span>
                  <div className="d-flex align-items-center justify-content-center gap-2 mt-1">
                    <CoinImg symbol={invoice.coinSymbol} size={24} />
                    <span className="fs-4 fw-bold">
                      {formatCoinAmount(invoice.amountDecimal || invoice.amount || 0)}
                    </span>
                    <span className="text-muted">{invoice.coinSymbol || ''}</span>
                  </div>
                </div>

                {invoice.expiresAt && (
                  <div>
                    <small className="text-muted">
                      {t('invoices.timeRemaining', { defaultValue: 'Time remaining' })}:
                    </small>
                    <div>
                      <CountdownTimer expiresAt={invoice.expiresAt} onExpired={loadInvoice} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoice Details */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">{t('invoices.details', { defaultValue: 'Invoice Details' })}</h6>
            </div>
            <div className="card-body">
              <table className="table table-borderless table-sm mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted">ID</td>
                    <td className="fw-semibold">{invoice.id || invoice.code}</td>
                  </tr>
                  {invoice.description && (
                    <tr>
                      <td className="text-muted">{t('invoices.description', { defaultValue: 'Description' })}</td>
                      <td>{invoice.description}</td>
                    </tr>
                  )}
                  {invoice.merchantName && (
                    <tr>
                      <td className="text-muted">{t('invoices.merchant', { defaultValue: 'Merchant' })}</td>
                      <td>{invoice.merchantName}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-muted">{t('invoices.createdAt', { defaultValue: 'Created' })}</td>
                    <td>{fmtDate(invoice.createdAt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
