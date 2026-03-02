'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import { getWebhookLogs } from '@/lib/api/merchantWebhookLogs'
import { formatDate } from '@/lib/utils/format'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'

const EVENT_OPTIONS = [
  { value: 'payment.completed', label: 'Completed' },
  { value: 'payment.expired', label: 'Expired' },
  { value: 'payment.cancelled', label: 'Cancelled' },
  { value: 'payment.failed', label: 'Failed' },
]

const SORT_BY_OPTIONS = [
  { value: 'created_at', label: 'Created At' },
  { value: 'duration_ms', label: 'Duration' },
  { value: 'http_status', label: 'HTTP Status' },
  { value: 'attempt', label: 'Attempt' },
]

export default function MerchantWebhookLogList() {
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
  const [merchantIdFilter, setMerchantIdFilter] = useState('')
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
      merchantId: merchantIdFilter ? Number(merchantIdFilter) : undefined,
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
    setMerchantIdFilter('')
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
      const data = await getWebhookLogs(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setLogs(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load webhook logs:', error)
      toast.error('Failed to load webhook logs')
    } finally {
      setLoading(false)
    }
  }

  function successText(val) {
    if (val === true || val === 1) return 'Success'
    if (val === false || val === 0) return 'Failed'
    return '-'
  }

  function eventText(event) {
    if (!event) return '-'
    const colorMap = {
      'payment.completed': 'success',
      'payment.expired': 'warning',
      'payment.cancelled': 'secondary',
      'payment.failed': 'danger',
    }
    const color = colorMap[event] || 'info'
    const label = EVENT_OPTIONS.find(o => o.value === event)?.label || event
    return <span className={`badge bg-label-${color}`}>{label}</span>
  }

  function httpStatusText(status) {
    if (!status && status !== 0) return '-'
    return String(Number(status))
  }

  if (loading && logs.length === 0) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
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
                    Merchant Webhook Logs
                  </h4>
                  <p className="text-muted mb-0">View and monitor webhook delivery attempts to merchants</p>
                </div>
                <RefreshButton onClick={loadLogs} loading={loading} />
              </div>
            </div>

            {/* Filters */}
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Merchant ID</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Merchant ID"
                    value={merchantIdFilter}
                    onChange={e => setMerchantIdFilter(e.target.value)}
                  />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Payment ID</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Payment ID"
                    value={paymentIdFilter}
                    onChange={e => setPaymentIdFilter(e.target.value)}
                  />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Event</label>
                  <select className="form-select" value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
                    <option value="">{t('filter.allEvents', { defaultValue: 'All Events' })}</option>
                    {EVENT_OPTIONS.map(ev => (
                      <option key={ev.value} value={ev.value}>{ev.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={successFilter} onChange={e => setSuccessFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="true">Success</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.dateRange', { defaultValue: 'Date Range' })}</label>
                  <LocaleDateRangePicker
                    startDate={fromDateFilter}
                    endDate={toDateFilter}
                    onChangeStart={setFromDateFilter}
                    onChangeEnd={setToDateFilter}
                    locale={locale}
                    placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
                    t={t}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.sortBy', { defaultValue: 'Sort By' })}</label>
                  <select className="form-select" value={sortByFilter} onChange={e => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    {SORT_BY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</label>
                  <select className="form-select" value={sortOrderFilter} onChange={e => setSortOrderFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="asc">{t('filter.ascending', { defaultValue: 'Ascending' })}</option>
                    <option value="desc">{t('filter.descending', { defaultValue: 'Descending' })}</option>
                  </select>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary" onClick={applyFilters} disabled={loading}>
                  <i className="bx bx-filter-alt me-1"></i>
                  {t('filter.apply', { defaultValue: 'Apply Filters' })}
                </button>
                <button className="btn btn-outline-secondary" onClick={resetFilters} disabled={loading}>
                  <i className="bx bx-reset me-1"></i>
                  {t('filter.reset', { defaultValue: 'Reset' })}
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
                      <th>ID</th>
                      <th className="text-center">Merchant</th>
                      <th className="text-center">Payment</th>
                      <th>Event</th>
                      <th className="text-center">HTTP</th>
                      <th className="text-center">Success</th>
                      <th className="text-end">Duration</th>
                      <th className="text-center">Attempt</th>
                      <th>Callback URL</th>
                      <th>Error</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="text-center text-muted py-4">
                          No webhook logs found
                        </td>
                      </tr>
                    ) : (
                      logs.map(log => (
                        <tr key={log.id} style={{ whiteSpace: 'nowrap' }}>
                          <td className="fw-medium">{log.id}</td>
                          <td className="text-center">{log.merchantId || '-'}</td>
                          <td className="text-center">{log.merchantPaymentId || '-'}</td>
                          <td>{eventText(log.event)}</td>
                          <td className="text-center">{httpStatusText(log.httpStatus)}</td>
                          <td className="text-center">{successText(log.success)}</td>
                          <td className="text-end">
                            {log.durationMs != null ? (
                              <span className={log.durationMs > 5000 ? 'text-danger fw-medium' : ''}>
                                {log.durationMs.toLocaleString()}ms
                              </span>
                            ) : '-'}
                          </td>
                          <td className="text-center">{log.attempt ?? '-'}</td>
                          <td>
                            {log.callbackUrl || '-'}
                          </td>
                          <td>
                            {log.errorMessage ? (
                              <span className="text-danger text-truncate d-inline-block" style={{ maxWidth: 180 }} title={log.errorMessage}>
                                {log.errorMessage}
                              </span>
                            ) : '-'}
                          </td>
                          <td>{formatDate(log.createdAt)}</td>
                          <td>
                            <Link
                              href={`/admin/merchant-webhook-logs/${log.id}`}
                              className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                              title="View details"
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
                    Showing {pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                  </div>
                  <div className="btn-group">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={!pagination.hasPrev || loading}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      <i className="bx bx-chevron-left"></i>
                      Previous
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" disabled>
                      {pagination.page} / {pagination.totalPages}
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={!pagination.hasNext || loading}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
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
