'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import { getTempWalletHistory } from '@/lib/api/admin'
import { formatDate } from '@/lib/utils/format'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'assigned') return 'badge bg-label-info'
  if (v === 'deposited') return 'badge bg-label-primary'
  if (v === 'swept') return 'badge bg-label-warning'
  if (v === 'released') return 'badge bg-label-success'
  if (v === 'failed') return 'badge bg-label-danger'
  return 'badge bg-label-secondary'
}

export default function TempWalletHistoryDetail() {
  const { t } = useTranslation()
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
      toast.error('Failed to load history')
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
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: 'var(--bs-secondary-color)' }}></i>
          <p className="text-muted mt-2">History not found</p>
          <button className="btn btn-primary" onClick={() => router.back()}>Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <Link href="/admin/temp-wallet-histories" className="btn btn-outline-secondary mb-3">
            <i className="bx bx-arrow-back me-2"></i>Back to Histories
          </Link>

          {/* Header Card */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-history me-2"></i>
                    Usage History #{history.id}
                  </h4>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className={statusBadgeClass(history.status)}>
                      {String(history.status || '').toUpperCase()}
                    </span>
                    {history.tempWalletId && (
                      <span className="badge bg-label-secondary">Wallet #{history.tempWalletId}</span>
                    )}
                    {history.invoiceId && (
                      <span className="badge bg-label-secondary">Invoice #{history.invoiceId}</span>
                    )}
                  </div>
                </div>
                <RefreshButton onClick={loadHistory} loading={loading} />
              </div>
            </div>
          </div>

          <div className="row">
            {/* History Details */}
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bx bx-detail me-2"></i>Details</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>ID</td>
                        <td className="fw-medium">{history.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Status</td>
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
                            className="fw-medium text-primary"
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
                              className="fw-medium text-primary"
                            >
                              {history.invoiceId}
                            </Link>
                          ) : '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">User ID</td>
                        <td className="fw-medium">{history.userId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Coin Network ID</td>
                        <td className="fw-medium">{history.coinNetworkId || '-'}</td>
                      </tr>
                      {history.address && (
                        <tr>
                          <td className="text-muted">Address</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <code className="text-body me-2" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                {history.address}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                onClick={() => handleCopy(history.address)}
                                title="Copy"
                              >
                                <i className="bx bx-copy"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                      {history.amount != null && (
                        <tr>
                          <td className="text-muted">Amount</td>
                          <td className="fw-bold">{history.amount}</td>
                        </tr>
                      )}
                      {history.sweepTxHash && (
                        <tr>
                          <td className="text-muted">Sweep Tx Hash</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <code className="text-body me-2" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                {history.sweepTxHash}
                              </code>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill flex-shrink-0"
                                onClick={() => handleCopy(history.sweepTxHash)}
                                title="Copy"
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
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bx bx-time-five me-2"></i>Timestamps</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>Created</td>
                        <td>{formatDate(history.createdAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Updated</td>
                        <td>{formatDate(history.updatedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Assigned At</td>
                        <td>{formatDate(history.assignedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">First Deposit</td>
                        <td>{formatDate(history.firstDepositAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Swept At</td>
                        <td>{formatDate(history.sweptAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Released At</td>
                        <td>{formatDate(history.releasedAt)}</td>
                      </tr>
                      {history.failedAt && (
                        <tr>
                          <td className="text-muted">Failed At</td>
                          <td className="text-danger">{formatDate(history.failedAt)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Failure Reason */}
              {history.failureReason && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0 text-danger"><i className="bx bx-error me-2"></i>Failure Reason</h5>
                  </div>
                  <div className="card-body">
                    <pre className="mb-0 text-danger" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                      {history.failureReason}
                    </pre>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {history.metadata && Object.keys(history.metadata).length > 0 && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0"><i className="bx bx-code-alt me-2"></i>Metadata</h5>
                  </div>
                  <div className="card-body">
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
