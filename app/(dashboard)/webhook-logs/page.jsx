'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getUserWebhookLogs } from '@/lib/api/userWebhookLogs'
import { useDateFormat } from '@/hooks/useDateFormat'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'

const EVENT_OPTIONS = [
  { value: 'payment.completed', label: 'Completed', color: 'success' },
  { value: 'payment.expired', label: 'Expired', color: 'warning' },
  { value: 'payment.cancelled', label: 'Cancelled', color: 'secondary' },
  { value: 'payment.failed', label: 'Failed', color: 'danger' },
]

const SORT_BY_OPTIONS = [
  { value: 'created_at', label: 'Created At' },
  { value: 'duration_ms', label: 'Duration' },
  { value: 'http_status', label: 'HTTP Status' },
  { value: 'attempt', label: 'Attempt' },
]

export default function WebhookLogsPage() {
  const { fmtDate } = useDateFormat()
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter states (draft)
  const [paymentIdFilter, setPaymentIdFilter] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [successFilter, setSuccessFilter] = useState('')
  const [fromDateFilter, setFromDateFilter] = useState('')
  const [toDateFilter, setToDateFilter] = useState('')
  const [sortByFilter, setSortByFilter] = useState('')
  const [sortOrderFilter, setSortOrderFilter] = useState('')

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({})

  useEffect(() => {
    loadLogs()
  }, [currentPage, appliedFilters])

  function applyFilters() {
    setAppliedFilters({
      merchantPaymentId: paymentIdFilter ? Number(paymentIdFilter) : undefined,
      event: eventFilter || undefined,
      success: successFilter || undefined,
      fromDate: fromDateFilter || undefined,
      toDate: toDateFilter || undefined,
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined,
    })
    setCurrentPage(1)
  }

  function resetFilters() {
    setPaymentIdFilter('')
    setEventFilter('')
    setSuccessFilter('')
    setFromDateFilter('')
    setToDateFilter('')
    setSortByFilter('')
    setSortOrderFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
  }

  async function loadLogs() {
    try {
      setLoading(true)
      const data = await getUserWebhookLogs(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setLogs(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load webhook logs:', error)
      toast.error(t('webhookLog.loadError', { defaultValue: 'Failed to load webhook logs' }))
    } finally {
      setLoading(false)
    }
  }

  function successBadge(val) {
    if (val === true || val === 1)
      return <span className="badge bg-label-success">{t('webhookLog.success', { defaultValue: 'Success' })}</span>
    if (val === false || val === 0)
      return <span className="badge bg-label-danger">{t('webhookLog.failed', { defaultValue: 'Failed' })}</span>
    return '-'
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

  if (loading && logs.length === 0) {
    return <PageSpinner />
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-broadcast me-2"></i>
                    {t('webhookLog.title', { defaultValue: 'Webhook Logs' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('webhookLog.description', { defaultValue: 'Monitor webhook delivery attempts for your payments' })}
                  </p>
                </div>
                <RefreshButton onClick={loadLogs} loading={loading} />
              </div>
            </div>

            {/* Filters */}
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('webhookLog.paymentId', { defaultValue: 'Payment ID' })}</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder={t('webhookLog.paymentId', { defaultValue: 'Payment ID' })}
                    value={paymentIdFilter}
                    onChange={(e) => setPaymentIdFilter(e.target.value)}
                  />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('webhookLog.event', { defaultValue: 'Event' })}</label>
                  <select className="form-select" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                    <option value="">{t('webhookLog.allEvents', { defaultValue: 'All Events' })}</option>
                    {EVENT_OPTIONS.map((ev) => (
                      <option key={ev.value} value={ev.value}>
                        {ev.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('webhookLog.success', { defaultValue: 'Status' })}</label>
                  <select className="form-select" value={successFilter} onChange={(e) => setSuccessFilter(e.target.value)}>
                    <option value="">{t('webhookLog.allStatuses', { defaultValue: 'All Statuses' })}</option>
                    <option value="true">{t('webhookLog.success', { defaultValue: 'Success' })}</option>
                    <option value="false">{t('webhookLog.failed', { defaultValue: 'Failed' })}</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('webhookLog.dateRange', { defaultValue: 'Date Range' })}</label>
                  <LocaleDateRangePicker
                    startDate={fromDateFilter}
                    endDate={toDateFilter}
                    onChangeStart={setFromDateFilter}
                    onChangeEnd={setToDateFilter}
                    locale={locale}
                    placeholder={t('webhookLog.dateRange', { defaultValue: 'Select date range' })}
                    t={t}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('webhookLog.sortBy', { defaultValue: 'Sort By' })}</label>
                  <select className="form-select" value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('webhookLog.default', { defaultValue: 'Default' })}</option>
                    {SORT_BY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('webhookLog.sortOrder', { defaultValue: 'Sort Order' })}</label>
                  <select className="form-select" value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
                    <option value="">{t('webhookLog.default', { defaultValue: 'Default' })}</option>
                    <option value="asc">{t('webhookLog.ascending', { defaultValue: 'Ascending' })}</option>
                    <option value="desc">{t('webhookLog.descending', { defaultValue: 'Descending' })}</option>
                  </select>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary" onClick={applyFilters} disabled={loading}>
                  <i className="bx bx-filter-alt me-1"></i>
                  {t('webhookLog.applyFilters', { defaultValue: 'Apply Filters' })}
                </button>
                <button className="btn btn-outline-secondary" onClick={resetFilters} disabled={loading}>
                  <i className="bx bx-reset me-1"></i>
                  {t('webhookLog.resetFilters', { defaultValue: 'Reset' })}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="table table-hover">
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>{t('webhookLog.paymentId', { defaultValue: 'Payment' })}</th>
                      <th>{t('webhookLog.event', { defaultValue: 'Event' })}</th>
                      <th className="text-center">{t('webhookLog.httpStatus', { defaultValue: 'HTTP' })}</th>
                      <th className="text-center">{t('webhookLog.success', { defaultValue: 'Status' })}</th>
                      <th className="text-end">{t('webhookLog.duration', { defaultValue: 'Duration' })}</th>
                      <th className="text-center">{t('webhookLog.attempt', { defaultValue: 'Attempt' })}</th>
                      <th>{t('webhookLog.callbackUrl', { defaultValue: 'Callback URL' })}</th>
                      <th>{t('webhookLog.error', { defaultValue: 'Error' })}</th>
                      <th>{t('webhookLog.created', { defaultValue: 'Created' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <TableEmptyState
                        colSpan={10}
                        icon="bx-broadcast"
                        message={t('webhookLog.noLogs', { defaultValue: 'No webhook logs found' })}
                        sub={t('webhookLog.noLogsSub', { defaultValue: 'Webhook delivery logs will appear here when payments trigger callbacks' })}
                      />
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} style={{ whiteSpace: 'nowrap' }}>
                          <td className="fw-medium">{log.merchantPaymentId || '-'}</td>
                          <td>{eventBadge(log.event)}</td>
                          <td className="text-center">{httpStatusBadge(log.httpStatus)}</td>
                          <td className="text-center">{successBadge(log.success)}</td>
                          <td className="text-end">
                            {log.durationMs != null ? (
                              <span className={log.durationMs > 5000 ? 'text-danger fw-medium' : ''}>
                                {log.durationMs.toLocaleString()}ms
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="text-center">{log.attempt ?? '-'}</td>
                          <td>
                            <span className="text-truncate d-inline-block" style={{ maxWidth: 200 }} title={log.callbackUrl}>
                              {log.callbackUrl || '-'}
                            </span>
                          </td>
                          <td>
                            {log.errorMessage ? (
                              <span className="text-danger text-truncate d-inline-block" style={{ maxWidth: 180 }} title={log.errorMessage}>
                                {log.errorMessage}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>{fmtDate(log.createdAt)}</td>
                          <td>
                            <Link
                              href={`/webhook-logs/${log.id}`}
                              className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                              title={t('webhookLog.viewDetails', { defaultValue: 'View details' })}
                            >
                              <i className="bx bx-chevron-right"></i>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.total > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted small">
                    {t('webhookLog.showing', { defaultValue: 'Showing' })}{' '}
                    {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}{' '}
                    –{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                    {t('webhookLog.of', { defaultValue: 'of' })}{' '}
                    {pagination.total}{' '}
                    {t('webhookLog.entries', { defaultValue: 'entries' })}
                  </div>
                  <div className="btn-group">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={!pagination.hasPrev || loading}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <i className="bx bx-chevron-left"></i>
                      {t('webhookLog.previous', { defaultValue: 'Previous' })}
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" disabled>
                      {pagination.page} / {pagination.totalPages}
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={!pagination.hasNext || loading}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      {t('webhookLog.next', { defaultValue: 'Next' })}
                      <i className="bx bx-chevron-right"></i>
                    </button>
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
