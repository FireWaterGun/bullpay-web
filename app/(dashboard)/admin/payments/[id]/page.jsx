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
    if (v === 'confirmed' || v === 'completed') return 'badge bg-green-50 text-green-700'
    if (v === 'detecting' || v === 'pending') return 'badge bg-amber-50 text-amber-700'
    if (v === 'confirming' || v === 'processing') return 'badge bg-cyan-50 text-cyan-700'
    if (v === 'failed' || v === 'unconfirmed') return 'badge bg-red-50 text-red-700'
    if (v === 'expired' || v === 'cancelled' || v === 'canceled') return 'badge bg-surface-100 text-surface-600'
    return 'badge bg-surface-100 text-surface-600'
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
      <div className="grow py-6">
        <div className="alert alert-warning">{t('admin.paymentDetail.notFound', { defaultValue: 'Payment not found' })}</div>
      </div>
    )
  }

  const coinSymbol = (payment.coin?.symbol || payment.coinSymbol || payment.invoice?.coin?.symbol || '').toUpperCase()
  const networkSymbol = (payment.network?.symbol || payment.networkSymbol || payment.invoice?.network?.symbol || '').toUpperCase()
  const networkName = payment.network?.name || payment.networkName || payment.invoice?.network?.name || ''
  const explorerUrl = payment.explorerUrl || payment.network?.explorerUrl || payment.invoice?.network?.explorerUrl || ''

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back button */}
          <div className="mb-4">
            <Link href="/admin/payments" className="btn btn bg-surface-100 text-surface-700 hover:bg-surface-200 shadow-none">
              <i className="bx bx-arrow-back mr-1"></i>
              Back to Payments
            </Link>
          </div>

          {/* Payment Header */}
          <div className="card mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={40} />
                  <div>
                    <h4 className="mb-0">Payment #{payment.id}</h4>
                    <div className="flex items-center gap-2 mt-1">
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
          <div className="grid grid-cols-12 gap-x-6">
            <div className="md:col-span-6">
              <div className="card mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">Payment Details</h5>
                </div>
                <div className="p-5">
                  <div className="overflow-x-auto">
                  <table className="w-full mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{payment.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Invoice ID</td>
                        <td>
                          {payment.invoiceId ? (
                            <Link
                              href={`/admin/invoices/${payment.invoiceId}`}
                              className="btn btn-sm btn bg-transparent text-primary-600 hover:bg-primary-50 shadow-none p-0 font-medium"
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
                        <td className="font-medium">{formatAmount(payment.amount)} {coinSymbol}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Actual Amount</td>
                        <td className="font-medium">{formatAmount(payment.actualAmount)} {coinSymbol}</td>
                      </tr>
                      {payment.amountUsd && (
                        <tr>
                          <td className="text-muted">{t('admin.detail.amountUsd', { defaultValue: 'Amount (USD)' })}</td>
                          <td className="font-medium">${formatAmount(payment.amountUsd)}</td>
                        </tr>
                      )}
                      {payment.usdRate && (
                        <tr>
                          <td className="text-muted">USD Rate</td>
                          <td>
                            ${formatAmount(payment.usdRate)}
                            {payment.rateSource && (
                              <small className="text-muted ml-1">({payment.rateSource})</small>
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
            </div>

            <div className="md:col-span-6">
              <div className="card mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">Transaction Info</h5>
                </div>
                <div className="p-5">
                  <div className="overflow-x-auto">
                  <table className="w-full mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
                        <td className="font-medium">{payment.userId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</td>
                        <td>
                          {payment.txHash ? (
                            <div className="flex items-center">
                              <code className="text-body mr-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {payment.txHash}
                              </code>
                              {explorerUrl && (
                                <a
                                  href={`${explorerUrl}/tx/${payment.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full shrink-0"
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
                            <div className="flex items-center">
                              <code className="text-body mr-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {payment.fromAddress}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full shrink-0"
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
                            <div className="flex items-center">
                              <code className="text-body mr-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {payment.toAddress}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full shrink-0"
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
    </div>
  )
}
