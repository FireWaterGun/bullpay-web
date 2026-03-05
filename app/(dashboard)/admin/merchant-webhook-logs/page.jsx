'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getWebhookLogs } from '@/lib/api/merchantWebhookLogs'
import { useDateFormat } from '@/hooks/useDateFormat'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'

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
  const { fmtDate } = useDateFormat()
  const { t, i18n } = useAdminTranslation()
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
      toast.error(t('admin.webhookLog.loadError', { defaultValue: 'Failed to load webhook logs' }))
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
    return <PageSpinner />
  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Header */}
          <div className="card mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-broadcast mr-2"></i>
                    Merchant Webhook Logs
                  </h4>
                  <p className="text-muted mb-0">View and monitor webhook delivery attempts to merchants</p>
                </div>
                <RefreshButton onClick={loadLogs} loading={loading} />
              </div>
            </div>

            {/* Filters */}
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">Merchant ID</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={t('admin.webhookLog.merchantId', { defaultValue: 'Merchant ID' })}
                    value={merchantIdFilter}
                    onChange={e => setMerchantIdFilter(e.target.value)}
                  />
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">Payment ID</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder={t('admin.webhookLog.paymentId', { defaultValue: 'Payment ID' })}
                    value={paymentIdFilter}
                    onChange={e => setPaymentIdFilter(e.target.value)}
                  />
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">{t('admin.detail.event', { defaultValue: 'Event' })}</label>
                  <select className="form-input" value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
                    <option value="">{t('filter.allEvents', { defaultValue: 'All Events' })}</option>
                    {EVENT_OPTIONS.map(ev => (
                      <option key={ev.value} value={ev.value}>{ev.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">{t('admin.detail.status', { defaultValue: 'Status' })}</label>
                  <select className="form-input" value={successFilter} onChange={e => setSuccessFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="true">{t('admin.detail.success', { defaultValue: 'Success' })}</option>
                    <option value="false">{t('status.failed', { defaultValue: 'Failed' })}</option>
                  </select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
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
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">{t('filter.sortBy', { defaultValue: 'Sort By' })}</label>
                  <select className="form-input" value={sortByFilter} onChange={e => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    {SORT_BY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</label>
                  <select className="form-input" value={sortOrderFilter} onChange={e => setSortOrderFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="asc">{t('filter.ascending', { defaultValue: t('admin.detail.ascending', { defaultValue: 'Ascending' }) })}</option>
                    <option value="desc">{t('filter.descending', { defaultValue: t('admin.detail.descending', { defaultValue: 'Descending' }) })}</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="btn btn-primary" onClick={applyFilters} disabled={loading}>
                  <i className="bx bx-filter-alt mr-1"></i>
                  {t('filter.apply', { defaultValue: 'Apply Filters' })}
                </button>
                <button className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100" onClick={resetFilters} disabled={loading}>
                  <i className="bx bx-reset mr-1"></i>
                  {t('filter.reset', { defaultValue: 'Reset' })}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="p-5">
              <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>{t('admin.detail.id', { defaultValue: 'ID' })}</th>
                      <th className="text-center">Merchant</th>
                      <th className="text-center">Payment</th>
                      <th>{t('admin.detail.event', { defaultValue: 'Event' })}</th>
                      <th className="text-center">HTTP</th>
                      <th className="text-center">{t('admin.detail.success', { defaultValue: 'Success' })}</th>
                      <th className="text-right">Duration</th>
                      <th className="text-center">Attempt</th>
                      <th>{t('admin.detail.callbackUrl', { defaultValue: 'Callback URL' })}</th>
                      <th>{t('admin.detail.error', { defaultValue: 'Error' })}</th>
                      <th>{t('admin.detail.created', { defaultValue: 'Created' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <TableEmptyState
                        colSpan={12}
                        icon="bx-broadcast"
                        message={t('admin.webhookLogs.noLogs', { defaultValue: 'No webhook logs found' })}
                        sub={t('admin.webhookLogs.noLogsSub', { defaultValue: 'Webhook delivery logs will appear here when payments trigger callbacks' })}
                      />
                    ) : (
                      logs.map(log => (
                        <tr key={log.id} style={{ whiteSpace: 'nowrap' }}>
                          <td className="font-medium">{log.id}</td>
                          <td className="text-center">{log.merchantId || '-'}</td>
                          <td className="text-center">{log.merchantPaymentId || '-'}</td>
                          <td>{eventText(log.event)}</td>
                          <td className="text-center">{httpStatusText(log.httpStatus)}</td>
                          <td className="text-center">{successText(log.success)}</td>
                          <td className="text-right">
                            {log.durationMs != null ? (
                              <span className={log.durationMs > 5000 ? 'text-danger font-medium' : ''}>
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
                              <span className="text-danger truncate inline-block" style={{ maxWidth: 180 }} title={log.errorMessage}>
                                {log.errorMessage}
                              </span>
                            ) : '-'}
                          </td>
                          <td>{fmtDate(log.createdAt)}</td>
                          <td>
                            <Link
                              href={`/admin/merchant-webhook-logs/${log.id}`}
                              className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full"
                              title={t('admin.detail.viewDetails', { defaultValue: 'View details' })}
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
                <div className="flex justify-between items-center mt-4">
                  <div className="text-muted text-sm">
                    Showing {pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                  </div>
                  <div className="inline-flex rounded-lg shadow-sm">
                    <button
                      className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm"
                      disabled={!pagination.hasPrev || loading}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <i className="bx bx-chevron-left"></i>
                      Previous
                    </button>
                    <button className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm" disabled>
                      {pagination.page} / {pagination.totalPages}
                    </button>
                    <button
                      className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm"
                      disabled={!pagination.hasNext || loading}
                      onClick={() => setCurrentPage(p => p + 1)}
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
