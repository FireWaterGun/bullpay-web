'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getTempWalletHistory } from '@/lib/api/admin'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Table from '../ui/Table'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function TempWalletHistoryDetail() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const { id } = useParams()
  const router = useRouter()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState(null)

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getTempWalletHistory(token, id)
      setHistory(data)
    } catch (error) {
      logger.error('Failed to load temp wallet history:', error)
      toast.error(t('admin.tempWallet.loadHistoryError', { defaultValue: 'Failed to load history' }))
    } finally {
      setLoading(false)
    }
  }, [token, id, toast, t])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const { copiedId, handleCopy } = useCopyFeedback()

  if (loading) {
    return <PageSpinner />
  }

  if (!history) {
    return (
      <div className="grow py-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[3rem] text-surface-500"></i>
          <p className="text-surface-500 mt-2">
            {t('admin.tempWalletHistory.notFound', { defaultValue: 'History not found' })}
          </p>
          <Button onClick={() => router.back()}>{t('actions.back', { defaultValue: 'Back' })}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Button variant="outline-secondary" className="mb-3" href="/admin/temp-wallet-histories">
            <i className="bx bx-arrow-back mr-2"></i>
            {t('admin.tempWalletHistory.backToHistories', { defaultValue: 'Back to Histories' })}
          </Button>

          {/* Header Card */}
          <Card className="mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-history mr-2"></i>
                    {t('admin.tempWalletHistory.title', { defaultValue: 'Usage History' })} #{history.id}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={getStatusBadgeClass(history.status, 'tempWalletHistory')}>
                      {String(history.status || '').toUpperCase()}
                    </span>
                    {history.tempWalletId && (
                      <Badge color="secondary">{`${t('admin.tempWallet.wallet', { defaultValue: 'Wallet' })} #${history.tempWalletId}`}</Badge>
                    )}
                    {history.invoiceId && (
                      <Badge color="secondary">{`${t('admin.invoiceDetail.invoice', { defaultValue: 'Invoice' })} #${history.invoiceId}`}</Badge>
                    )}
                  </div>
                </div>
                <RefreshButton onClick={loadHistory} loading={loading} />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-x-6">
            {/* History Details */}
            <div className="col-span-12 md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    <i className="bx bx-detail mr-2"></i>
                    {t('admin.detail.details', { defaultValue: 'Details' })}
                  </h5>
                </div>
                <div className="p-5">
                  <Table responsive={false} className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{history.id}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.status', { defaultValue: 'Status' })}</td>
                        <td>
                          <span className={getStatusBadgeClass(history.status, 'tempWalletHistory')}>
                            {String(history.status || '').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.tempWalletHistory.tempWalletId', { defaultValue: 'Temp Wallet ID' })}
                        </td>
                        <td>
                          <Link
                            href={`/admin/temp-wallets/${history.tempWalletId}`}
                            className="font-medium text-primary"
                          >
                            {history.tempWalletId}
                          </Link>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.detail.invoiceId', { defaultValue: 'Invoice ID' })}
                        </td>
                        <td>
                          {history.invoiceId ? (
                            <Link href={`/admin/invoices/${history.invoiceId}`} className="font-medium text-primary">
                              {history.invoiceId}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
                        <td className="font-medium">{history.userId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.detail.coinNetworkId', { defaultValue: 'Coin Network ID' })}
                        </td>
                        <td className="font-medium">{history.coinNetworkId || '-'}</td>
                      </tr>
                      {history.address && (
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.address', { defaultValue: 'Address' })}</td>
                          <td>
                            <div className="flex items-center">
                              <code className="text-surface-800 mr-2 text-[0.8rem] break-all">{history.address}</code>
                              <Button
                                onClick={() => handleCopy(history.address, 'addr-twh')}
                                title={t('actions.copy', { defaultValue: 'Copy' })}
                                size="icon-sm"
                                variant="text-secondary"
                                className="shrink-0"
                              >
                                <i className={`bx ${copiedId === 'addr-twh' ? 'bx-check text-success' : 'bx-copy'}`}></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {history.amount != null && (
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.amount', { defaultValue: 'Amount' })}</td>
                          <td className="font-bold">{history.amount}</td>
                        </tr>
                      )}
                      {history.sweepTxHash && (
                        <tr>
                          <td className="text-surface-500">
                            {t('admin.tempWallet.sweepTxHash', { defaultValue: 'Sweep Tx Hash' })}
                          </td>
                          <td>
                            <div className="flex items-center">
                              <code className="text-surface-800 mr-2 text-xs break-all">{history.sweepTxHash}</code>
                              <Button
                                onClick={() => handleCopy(history.sweepTxHash, 'sweep-twh')}
                                title={t('actions.copy', { defaultValue: 'Copy' })}
                                size="icon-sm"
                                variant="text-secondary"
                                className="shrink-0"
                              >
                                <i className={`bx ${copiedId === 'sweep-twh' ? 'bx-check text-success' : 'bx-copy'}`}></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Timestamps */}
            <div className="col-span-12 md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    <i className="bx bx-time-five mr-2"></i>
                    {t('admin.detail.timestamps', { defaultValue: 'Timestamps' })}
                  </h5>
                </div>
                <div className="p-5">
                  <Table responsive={false} className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">
                          {t('admin.detail.created', { defaultValue: 'Created' })}
                        </td>
                        <td>{fmtDate(history.createdAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
                        <td>{fmtDate(history.updatedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.tempWalletHistory.assignedAt', { defaultValue: 'Assigned At' })}
                        </td>
                        <td>{fmtDate(history.assignedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.tempWalletHistories.firstDeposit', { defaultValue: 'First Deposit' })}
                        </td>
                        <td>{fmtDate(history.firstDepositAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.tempWalletHistory.sweptAt', { defaultValue: 'Swept At' })}
                        </td>
                        <td>{fmtDate(history.sweptAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">
                          {t('admin.tempWalletHistory.releasedAt', { defaultValue: 'Released At' })}
                        </td>
                        <td>{fmtDate(history.releasedAt)}</td>
                      </tr>
                      {history.failedAt && (
                        <tr>
                          <td className="text-surface-500">
                            {t('admin.tempWalletHistory.failedAt', { defaultValue: 'Failed At' })}
                          </td>
                          <td className="text-danger">{fmtDate(history.failedAt)}</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card>

              {/* Failure Reason */}
              {history.failureReason && (
                <Card className="mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0 text-danger">
                      <i className="bx bx-error mr-2"></i>
                      {t('admin.detail.failureReason', { defaultValue: 'Failure Reason' })}
                    </h5>
                  </div>
                  <div className="p-5">
                    <pre className="mb-0 text-danger whitespace-pre-wrap break-all text-[0.85rem]">
                      {history.failureReason}
                    </pre>
                  </div>
                </Card>
              )}

              {/* Metadata */}
              {history.metadata && Object.keys(history.metadata).length > 0 && (
                <Card className="mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0">
                      <i className="bx bx-code-alt mr-2"></i>
                      {t('admin.detail.metadata', { defaultValue: 'Metadata' })}
                    </h5>
                  </div>
                  <div className="p-5">
                    <pre className="mb-0 whitespace-pre-wrap break-all text-[0.8rem] max-h-[300px] overflow-auto">
                      {JSON.stringify(history.metadata, null, 2)}
                    </pre>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
