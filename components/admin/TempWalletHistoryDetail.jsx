'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getTempWalletHistory } from '@/lib/api/admin'
import { useDateFormat } from '@/hooks/useDateFormat'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'assigned') return 'badge bg-cyan-50 text-cyan-700'
  if (v === 'deposited') return 'badge bg-primary-50 text-primary-600'
  if (v === 'swept') return 'badge bg-amber-50 text-amber-700'
  if (v === 'released') return 'badge bg-green-50 text-green-700'
  if (v === 'failed') return 'badge bg-red-50 text-red-700'
  return 'badge bg-surface-100 text-surface-600'
}

export default function TempWalletHistoryDetail() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const { id } = useParams()
  const router = useRouter()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState(null)

  useEffect(() => { loadHistory() }, [id])

  async function loadHistory() {
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
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!history) {
    return (
      <div className="grow py-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: 'var(--bs-secondary-color)' }}></i>
          <p className="text-muted mt-2">History not found</p>
          <button className="btn btn-primary" onClick={() => router.back()}>Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Link href="/admin/temp-wallet-histories" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 mb-3">
            <i className="bx bx-arrow-back mr-2"></i>Back to Histories
          </Link>

          {/* Header Card */}
          <div className="card mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-history mr-2"></i>
                    Usage History #{history.id}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={statusBadgeClass(history.status)}>
                      {String(history.status || '').toUpperCase()}
                    </span>
                    {history.tempWalletId && (
                      <span className="badge bg-surface-100 text-surface-600">Wallet #{history.tempWalletId}</span>
                    )}
                    {history.invoiceId && (
                      <span className="badge bg-surface-100 text-surface-600">Invoice #{history.invoiceId}</span>
                    )}
                  </div>
                </div>
                <RefreshButton onClick={loadHistory} loading={loading} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-x-6">
            {/* History Details */}
            <div className="md:col-span-6">
              <div className="card mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0"><i className="bx bx-detail mr-2"></i>{t('admin.detail.details', { defaultValue: 'Details' })}</h5>
                </div>
                <div className="p-5">
                  <table className="w-full mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{history.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.status', { defaultValue: 'Status' })}</td>
                        <td>
                          <span className={statusBadgeClass(history.status)}>
                            {String(history.status || '').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Temp Wallet ID</td>
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
                        <td className="text-muted">Invoice ID</td>
                        <td>
                          {history.invoiceId ? (
                            <Link
                              href={`/admin/invoices/${history.invoiceId}`}
                              className="font-medium text-primary"
                            >
                              {history.invoiceId}
                            </Link>
                          ) : '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
                        <td className="font-medium">{history.userId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.coinNetworkId', { defaultValue: 'Coin Network ID' })}</td>
                        <td className="font-medium">{history.coinNetworkId || '-'}</td>
                      </tr>
                      {history.address && (
                        <tr>
                          <td className="text-muted">{t('admin.detail.address', { defaultValue: 'Address' })}</td>
                          <td>
                            <div className="flex items-center">
                              <code className="text-body mr-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {history.address}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full shrink-0"
                                onClick={() => handleCopy(history.address)}
                                title={t('actions.copy', { defaultValue: 'Copy' })}
                              >
                                <i className="bx bx-copy"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {history.amount != null && (
                        <tr>
                          <td className="text-muted">{t('admin.detail.amount', { defaultValue: 'Amount' })}</td>
                          <td className="font-bold">{history.amount}</td>
                        </tr>
                      )}
                      {history.sweepTxHash && (
                        <tr>
                          <td className="text-muted">Sweep Tx Hash</td>
                          <td>
                            <div className="flex items-center">
                              <code className="text-body mr-2" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                {history.sweepTxHash}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full shrink-0"
                                onClick={() => handleCopy(history.sweepTxHash)}
                                title={t('actions.copy', { defaultValue: 'Copy' })}
                              >
                                <i className="bx bx-copy"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="md:col-span-6">
              <div className="card mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0"><i className="bx bx-time-five mr-2"></i>{t('admin.detail.timestamps', { defaultValue: 'Timestamps' })}</h5>
                </div>
                <div className="p-5">
                  <table className="w-full mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                        <td>{fmtDate(history.createdAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
                        <td>{fmtDate(history.updatedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Assigned At</td>
                        <td>{fmtDate(history.assignedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">First Deposit</td>
                        <td>{fmtDate(history.firstDepositAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Swept At</td>
                        <td>{fmtDate(history.sweptAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Released At</td>
                        <td>{fmtDate(history.releasedAt)}</td>
                      </tr>
                      {history.failedAt && (
                        <tr>
                          <td className="text-muted">Failed At</td>
                          <td className="text-danger">{fmtDate(history.failedAt)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Failure Reason */}
              {history.failureReason && (
                <div className="card mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0 text-danger"><i className="bx bx-error mr-2"></i>{t('admin.detail.failureReason', { defaultValue: 'Failure Reason' })}</h5>
                  </div>
                  <div className="p-5">
                    <pre className="mb-0 text-danger" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                      {history.failureReason}
                    </pre>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {history.metadata && Object.keys(history.metadata).length > 0 && (
                <div className="card mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0"><i className="bx bx-code-alt mr-2"></i>{t('admin.detail.metadata', { defaultValue: 'Metadata' })}</h5>
                  </div>
                  <div className="p-5">
                    <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8rem', maxHeight: 300, overflow: 'auto' }}>
                      {JSON.stringify(history.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
