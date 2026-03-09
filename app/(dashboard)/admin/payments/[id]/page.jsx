'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'

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
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function AdminPaymentDetail() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const { id } = useParams()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [payment, setPayment] = useState(null)

  const loadPayment = useCallback(async () => {
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
  }, [token, id, toast, t])

  useEffect(() => {
    loadPayment()
  }, [loadPayment])

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (loading && !payment) {
    return <PageSpinner />
  }

  if (!payment) {
    return (
      <div className="grow pb-6">
        <Alert variant="warning">{t('admin.paymentDetail.notFound', { defaultValue: 'Payment not found' })}</Alert>
      </div>
    )
  }

  const coinSymbol = (payment.coin?.symbol || payment.coinSymbol || payment.invoice?.coin?.symbol || '').toUpperCase()
  const networkSymbol = (
    payment.network?.symbol ||
    payment.networkSymbol ||
    payment.invoice?.network?.symbol ||
    ''
  ).toUpperCase()
  const networkName = payment.network?.name || payment.networkName || payment.invoice?.network?.name || ''
  const explorerUrl = payment.explorerUrl || payment.network?.explorerUrl || payment.invoice?.network?.explorerUrl || ''

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back button */}
          <div className="mb-4">
            <Button variant="outline-secondary" className="gap-1" href="/admin/payments">
              <i className="bx bx-arrow-back"></i>
              {t('admin.payments.backToList', { defaultValue: 'Back to Payments' })}
            </Button>
          </div>

          {/* Payment Header */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={40} />
                  <div>
                    <h4 className="mb-0">
                      {t('admin.paymentDetail.detailTitle', { defaultValue: 'Payment #{{id}}', id: payment.id })}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={getStatusBadgeClass(payment.status, 'payment')}>
                        {String(payment.status || '').toUpperCase()}
                      </span>
                      <span className="text-surface-500">•</span>
                      <span className="text-surface-500">
                        {coinSymbol} · {networkName || networkSymbol}
                      </span>
                    </div>
                  </div>
                </div>
                <RefreshButton onClick={loadPayment} loading={loading} />
              </div>
            </div>
          </Card>

          {/* Payment Details */}
          <div className="grid grid-cols-12 gap-x-6">
            <div className="col-span-12 md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    {t('admin.paymentDetail.paymentDetails', { defaultValue: 'Payment Details' })}
                  </h5>
                </div>
                <div className="p-5">
                  <div className="overflow-x-auto">
                    <Table responsive={false} className="mb-0">
                      <tbody>
                        <tr>
                          <td className="text-surface-500 w-2/5">{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                          <td className="font-medium">{payment.id}</td>
                        </tr>
                        <tr>
                          <td className="text-surface-500">
                            {t('admin.paymentDetail.invoiceId', { defaultValue: 'Invoice ID' })}
                          </td>
                          <td>
                            {payment.invoiceId ? (
                              <Button
                                variant="text-primary"
                                size="sm"
                                className="p-0 font-medium"
                                href={`/admin/invoices/${payment.invoiceId}`}
                              >
                                #{payment.invoiceId}
                              </Button>
                            ) : (
                              <span className="text-surface-500">-</span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.status', { defaultValue: 'Status' })}</td>
                          <td>
                            <span className={getStatusBadgeClass(payment.status, 'payment')}>
                              {String(payment.status || '').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.amount', { defaultValue: 'Amount' })}</td>
                          <td className="font-medium">
                            {formatAmount(payment.amount)} {coinSymbol}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-surface-500">
                            {t('admin.paymentDetail.actualAmount', { defaultValue: 'Actual Amount' })}
                          </td>
                          <td className="font-medium">
                            {formatAmount(payment.actualAmount)} {coinSymbol}
                          </td>
                        </tr>
                        {payment.amountUsd && (
                          <tr>
                            <td className="text-surface-500">
                              {t('admin.detail.amountUsd', { defaultValue: 'Amount (USD)' })}
                            </td>
                            <td className="font-medium">${formatAmount(payment.amountUsd)}</td>
                          </tr>
                        )}
                        {payment.usdRate && (
                          <tr>
                            <td className="text-surface-500">
                              {t('admin.detail.usdRate', { defaultValue: 'USD Rate' })}
                            </td>
                            <td>
                              ${formatAmount(payment.usdRate)}
                              {payment.rateSource && (
                                <small className="text-surface-500 ml-1">({payment.rateSource})</small>
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
                          <td className="text-surface-500">
                            {t('admin.detail.confirmations', { defaultValue: 'Confirmations' })}
                          </td>
                          <td>
                            {payment.confirmations != null ? payment.confirmations : '-'}
                            {payment.requiredConfirmations != null && (
                              <small className="text-surface-500">
                                {' '}
                                / {payment.requiredConfirmations}{' '}
                                {t('admin.paymentDetail.required', { defaultValue: 'required' })}
                              </small>
                            )}
                          </td>
                        </tr>
                        {payment.currencyType && (
                          <tr>
                            <td className="text-surface-500">
                              {t('admin.paymentDetail.currencyType', { defaultValue: 'Currency Type' })}
                            </td>
                            <td>{payment.currencyType}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                          <td>{fmtDate(payment.createdAt || payment.created_at)}</td>
                        </tr>
                        {payment.detectedAt && (
                          <tr>
                            <td className="text-surface-500">
                              {t('admin.paymentDetail.detectedAt', { defaultValue: 'Detected At' })}
                            </td>
                            <td>{fmtDate(payment.detectedAt)}</td>
                          </tr>
                        )}
                        {payment.confirmedAt && (
                          <tr>
                            <td className="text-surface-500">
                              {t('admin.paymentDetail.confirmedAt', { defaultValue: 'Confirmed At' })}
                            </td>
                            <td>{fmtDate(payment.confirmedAt)}</td>
                          </tr>
                        )}
                        {payment.completedAt && (
                          <tr>
                            <td className="text-surface-500">
                              {t('admin.paymentDetail.completedAt', { defaultValue: 'Completed At' })}
                            </td>
                            <td>{fmtDate(payment.completedAt)}</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </Card>
            </div>

            <div className="col-span-12 md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    {t('admin.paymentDetail.transactionInfo', { defaultValue: 'Transaction Info' })}
                  </h5>
                </div>
                <div className="p-5">
                  <div className="overflow-x-auto">
                    <Table responsive={false} className="mb-0">
                      <tbody>
                        <tr>
                          <td className="text-surface-500 w-2/5">
                            {t('admin.detail.userId', { defaultValue: 'User ID' })}
                          </td>
                          <td className="font-medium">{payment.userId || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</td>
                          <td>
                            {payment.txHash ? (
                              <div className="flex items-center">
                                <code className="text-surface-800 mr-2 text-[0.8rem] break-all">{payment.txHash}</code>
                                {explorerUrl && (
                                  <Button
                                    variant="text-secondary"
                                    size="icon-sm"
                                    className="shrink-0"
                                    href={`${explorerUrl}/tx/${payment.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
                                  >
                                    <i className="bx bx-link-external"></i>
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-surface-500">-</span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="text-surface-500">
                            {t('admin.detail.fromAddress', { defaultValue: 'From Address' })}
                          </td>
                          <td>
                            {payment.fromAddress ? (
                              <div className="flex items-center">
                                <code className="text-surface-800 mr-2 text-[0.8rem] break-all">
                                  {payment.fromAddress}
                                </code>
                                <Button
                                  onClick={() => handleCopy(payment.fromAddress)}
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
                        <tr>
                          <td className="text-surface-500">
                            {t('admin.detail.toAddress', { defaultValue: 'To Address' })}
                          </td>
                          <td>
                            {payment.toAddress ? (
                              <div className="flex items-center">
                                <code className="text-surface-800 mr-2 text-[0.8rem] break-all">
                                  {payment.toAddress}
                                </code>
                                <Button
                                  onClick={() => handleCopy(payment.toAddress)}
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
                        {payment.blockNumber && (
                          <tr>
                            <td className="text-surface-500">
                              {t('admin.detail.blockNumber', { defaultValue: 'Block Number' })}
                            </td>
                            <td>{payment.blockNumber}</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
