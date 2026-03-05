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
    const label = opt?.label || event
    const colorMap = { success: 'bg-green-100 text-green-700', warning: 'bg-yellow-100 text-yellow-700', secondary: 'bg-surface-100 text-surface-600', danger: 'bg-red-100 text-red-700', info: 'bg-blue-100 text-blue-700' }
    const cls = colorMap[opt?.color] || colorMap.info
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
  }

  function httpStatusBadge(status) {
    if (!status && status !== 0) return '-'
    const code = Number(status)
    let cls = 'bg-surface-100 text-surface-600'
    if (code >= 200 && code < 300) cls = 'bg-green-100 text-green-700'
    else if (code >= 400 && code < 500) cls = 'bg-yellow-100 text-yellow-700'
    else if (code >= 500) cls = 'bg-red-100 text-red-700'
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{code}</span>
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
      <div className="rounded-lg bg-yellow-50 text-yellow-700 px-4 py-3 text-sm">{t('webhookLog.notFound', { defaultValue: 'Webhook log not found' })}</div>
    )
  }

  return (
    <>
      {/* Back button */}
      <div className="mb-4">
        <Link href="/webhook-logs" className="btn btn-outline-secondary inline-flex items-center gap-1">
          <i className="bx bx-arrow-back"></i>
          {t('webhookLog.backToList', { defaultValue: 'Back to Webhook Logs' })}
        </Link>
      </div>

      {/* Header */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-surface-100">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full flex items-center justify-center ${log.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                style={{ width: 48, height: 48 }}
              >
                <i className={`bx ${log.success ? 'bx-check' : 'bx-x'} text-2xl`}></i>
              </div>
              <div>
                <h4 className="font-semibold text-surface-900 mb-0">
                  {t('webhookLog.detail', { defaultValue: 'Webhook Log Detail' })} #{log.id}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {eventBadge(log.event)}
                  <span className="text-surface-400">&bull;</span>
                  <span>{log.success ? t('webhookLog.success', { defaultValue: 'Success' }) : t('webhookLog.failed', { defaultValue: 'Failed' })}</span>
                  <span className="text-surface-400">&bull;</span>
                  <span>HTTP {httpStatusBadge(log.httpStatus)}</span>
                </div>
              </div>
            </div>
            <RefreshButton onClick={loadLog} loading={loading} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Webhook Details */}
        <div className="card">
          <div className="px-6 py-4 border-b border-surface-100">
            <h5 className="font-semibold text-surface-900 mb-0">{t('webhookLog.webhookDetails', { defaultValue: 'Webhook Details' })}</h5>
          </div>
          <div className="p-6">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-surface-500 py-2 pr-4" style={{ width: '40%' }}>ID</td>
                  <td className="py-2 font-medium">{log.id}</td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.paymentId', { defaultValue: 'Payment ID' })}</td>
                  <td className="py-2 font-medium">{log.merchantPaymentId || '-'}</td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.event', { defaultValue: 'Event' })}</td>
                  <td className="py-2">{eventBadge(log.event)}</td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.callbackUrl', { defaultValue: 'Callback URL' })}</td>
                  <td className="py-2">
                    <code className="text-xs break-all">{log.callbackUrl || '-'}</code>
                  </td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.created', { defaultValue: 'Created' })}</td>
                  <td className="py-2">{fmtDate(log.createdAt)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Delivery Info */}
        <div className="card">
          <div className="px-6 py-4 border-b border-surface-100">
            <h5 className="font-semibold text-surface-900 mb-0">{t('webhookLog.deliveryInfo', { defaultValue: 'Delivery Info' })}</h5>
          </div>
          <div className="p-6">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-surface-500 py-2 pr-4" style={{ width: '40%' }}>{t('webhookLog.httpStatus', { defaultValue: 'HTTP Status' })}</td>
                  <td className="py-2">{httpStatusBadge(log.httpStatus)}</td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.success', { defaultValue: 'Success' })}</td>
                  <td className="py-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {log.success ? t('webhookLog.success', { defaultValue: 'Success' }) : t('webhookLog.failed', { defaultValue: 'Failed' })}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.duration', { defaultValue: 'Duration' })}</td>
                  <td className="py-2">
                    {log.durationMs != null ? (
                      <span className={log.durationMs > 5000 ? 'text-red-600 font-medium' : ''}>
                        {log.durationMs.toLocaleString()}ms
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.attempt', { defaultValue: 'Attempt' })}</td>
                  <td className="py-2">{log.attempt ?? '-'}</td>
                </tr>
                {log.errorMessage && (
                  <tr>
                    <td className="text-surface-500 py-2 pr-4">{t('webhookLog.error', { defaultValue: 'Error' })}</td>
                    <td className="py-2">
                      <span className="text-red-600">{log.errorMessage}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Request Payload */}
      {log.requestPayload && (
        <div className="card mt-6">
          <div className="px-6 py-4 border-b border-surface-100">
            <h5 className="font-semibold text-surface-900 mb-0">{t('webhookLog.requestPayload', { defaultValue: 'Request Payload' })}</h5>
          </div>
          <div className="p-6">
            <pre
              className="bg-surface-50 rounded-lg p-4 mb-0 text-xs overflow-auto"
              style={{ maxHeight: 400 }}
            >
              {formatJson(log.requestPayload)}
            </pre>
          </div>
        </div>
      )}

      {/* Response Body */}
      {log.responseBody && (
        <div className="card mt-6">
          <div className="px-6 py-4 border-b border-surface-100">
            <h5 className="font-semibold text-surface-900 mb-0">{t('webhookLog.responseBody', { defaultValue: 'Response Body' })}</h5>
          </div>
          <div className="p-6">
            <pre
              className="bg-surface-50 rounded-lg p-4 mb-0 text-xs overflow-auto"
              style={{ maxHeight: 400 }}
            >
              {formatJson(log.responseBody)}
            </pre>
          </div>
        </div>
      )}
    </>
  )
}
