'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getUserWebhookLog } from '@/lib/api/userWebhookLogs'
import { useDateFormat } from '@/hooks/useDateFormat'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

const EVENT_OPTIONS = [
  { value: 'payment.completed', label: 'Completed', color: 'success' },
  { value: 'payment.expired', label: 'Expired', color: 'warning' },
  { value: 'payment.cancelled', label: 'Cancelled', color: 'secondary' },
  { value: 'payment.failed', label: 'Failed', color: 'danger' },
]

export default function WebhookLogDetailPage() {
  const { fmtDate } = useDateFormat()
  const { t } = useTranslation()
  const { id } = useParams()
  const { token } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState(null)

  useEffect(() => {
    loadLog()
  }, [id])

  async function loadLog() {
    try {
      setLoading(true)
      const data = await getUserWebhookLog(token, id)
      setLog(data)
    } catch (error) {
      logger.error('Failed to load webhook log:', error)
      toast.error(t('webhookLog.loadError', { defaultValue: 'Failed to load webhook log' }))
    } finally {
      setLoading(false)
    }
  }

  function eventBadge(event) {
    if (!event) return '-'
    const opt = EVENT_OPTIONS.find((o) => o.value === event)
    const color = opt?.color || 'info'
    const label = opt?.label || event
    return <span className={`badge bg-label-${color}`}>{label}</span>
  }

  function httpStatusBadge(status) {
    if (!status && status !== 0) return '-'
    const code = Number(status)
    let color = 'secondary'
    if (code >= 200 && code < 300) color = 'success'
    else if (code >= 400 && code < 500) color = 'warning'
    else if (code >= 500) color = 'danger'
    return <span className={`badge bg-label-${color}`}>{code}</span>
  }

  function formatJson(val) {
    if (!val) return null
    try {
      const obj = typeof val === 'string' ? JSON.parse(val) : val
      return JSON.stringify(obj, null, 2)
    } catch {
      return String(val)
    }
  }

  if (loading && !log) {
    return <PageSpinner />
  }

  if (!log) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-warning">{t('webhookLog.notFound', { defaultValue: 'Webhook log not found' })}</div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Back button */}
          <div className="mb-4">
            <Link href="/webhook-logs" className="btn btn-label-secondary">
              <i className="bx bx-arrow-back me-1"></i>
              {t('webhookLog.backToList', { defaultValue: 'Back to Webhook Logs' })}
            </Link>
          </div>

          {/* Header */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center bg-label-${log.success ? 'success' : 'danger'}`}
                    style={{ width: 48, height: 48 }}
                  >
                    <i className={`bx ${log.success ? 'bx-check' : 'bx-x'} fs-4`}></i>
                  </div>
                  <div>
                    <h4 className="mb-0">
                      {t('webhookLog.detail', { defaultValue: 'Webhook Log Detail' })} #{log.id}
                    </h4>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      {eventBadge(log.event)}
                      <span className="text-muted">•</span>
                      <span>{log.success ? t('webhookLog.success', { defaultValue: 'Success' }) : t('webhookLog.failed', { defaultValue: 'Failed' })}</span>
                      <span className="text-muted">•</span>
                      <span>HTTP {httpStatusBadge(log.httpStatus)}</span>
                    </div>
                  </div>
                </div>
                <RefreshButton onClick={loadLog} loading={loading} />
              </div>
            </div>
          </div>

          <div className="row">
            {/* Left: Webhook Details */}
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">{t('webhookLog.webhookDetails', { defaultValue: 'Webhook Details' })}</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>ID</td>
                        <td className="fw-medium">{log.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('webhookLog.paymentId', { defaultValue: 'Payment ID' })}</td>
                        <td className="fw-medium">{log.merchantPaymentId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('webhookLog.event', { defaultValue: 'Event' })}</td>
                        <td>{eventBadge(log.event)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('webhookLog.callbackUrl', { defaultValue: 'Callback URL' })}</td>
                        <td>
                          <code className="small">{log.callbackUrl || '-'}</code>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('webhookLog.created', { defaultValue: 'Created' })}</td>
                        <td>{fmtDate(log.createdAt)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Delivery Info */}
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">{t('webhookLog.deliveryInfo', { defaultValue: 'Delivery Info' })}</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('webhookLog.httpStatus', { defaultValue: 'HTTP Status' })}</td>
                        <td>{httpStatusBadge(log.httpStatus)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('webhookLog.success', { defaultValue: 'Success' })}</td>
                        <td>
                          <span className={`badge bg-label-${log.success ? 'success' : 'danger'}`}>
                            {log.success ? t('webhookLog.success', { defaultValue: 'Success' }) : t('webhookLog.failed', { defaultValue: 'Failed' })}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('webhookLog.duration', { defaultValue: 'Duration' })}</td>
                        <td>
                          {log.durationMs != null ? (
                            <span className={log.durationMs > 5000 ? 'text-danger fw-medium' : ''}>
                              {log.durationMs.toLocaleString()}ms
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('webhookLog.attempt', { defaultValue: 'Attempt' })}</td>
                        <td>{log.attempt ?? '-'}</td>
                      </tr>
                      {log.errorMessage && (
                        <tr>
                          <td className="text-muted">{t('webhookLog.error', { defaultValue: 'Error' })}</td>
                          <td>
                            <span className="text-danger">{log.errorMessage}</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Request Payload */}
          {log.requestPayload && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">{t('webhookLog.requestPayload', { defaultValue: 'Request Payload' })}</h5>
              </div>
              <div className="card-body">
                <pre
                  className="bg-lighter rounded p-3 mb-0"
                  style={{ maxHeight: 400, overflow: 'auto', fontSize: '0.82rem' }}
                >
                  {formatJson(log.requestPayload)}
                </pre>
              </div>
            </div>
          )}

          {/* Response Body */}
          {log.responseBody && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">{t('webhookLog.responseBody', { defaultValue: 'Response Body' })}</h5>
              </div>
              <div className="card-body">
                <pre
                  className="bg-lighter rounded p-3 mb-0"
                  style={{ maxHeight: 400, overflow: 'auto', fontSize: '0.82rem' }}
                >
                  {formatJson(log.responseBody)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
