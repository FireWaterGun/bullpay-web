'use client'

import { useState, useEffect, useCallback } from 'react'

import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/app/providers'
import { getWebhookLogs } from '@/lib/api/merchantWebhookLogs'
import { useDateFormat } from '@/hooks/useDateFormat'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, Label, Select } from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import SortableHeader from '@/components/ui/SortableHeader'

const EVENT_VALUES = [
  { value: 'payment.completed', key: 'completed', defaultLabel: 'Completed' },
  { value: 'payment.expired', key: 'expired', defaultLabel: 'Expired' },
  { value: 'payment.cancelled', key: 'cancelled', defaultLabel: 'Cancelled' },
  { value: 'payment.failed', key: 'failed', defaultLabel: 'Failed' },
]

export default function MerchantWebhookLogList() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()

  const { token } = useAuth()
  const toast = useToast()

  const locale = useLocale()

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
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState('')

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({})

  function handleSort(field, order) {
    setSortBy(field)
    setSortOrder(order)
    setAppliedFilters((prev) => ({ ...prev, sortBy: field, sortOrder: order }))
    setCurrentPage(1)
  }

  const loadLogs = useCallback(async () => {
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
  }, [token, currentPage, appliedFilters, toast, t])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  function applyFilters() {
    setAppliedFilters({
      merchantId: merchantIdFilter ? Number(merchantIdFilter) : undefined,
      merchantPaymentId: paymentIdFilter ? Number(paymentIdFilter) : undefined,
      event: eventFilter || undefined,
      success: successFilter || undefined,
      fromDate: fromDateFilter || undefined,
      toDate: toDateFilter || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
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
    setSortBy('')
    setSortOrder('')
    setAppliedFilters({})
    setCurrentPage(1)
  }

  function successText(val) {
    if (val === true || val === 1) return t('admin.detail.success', { defaultValue: 'Success' })
    if (val === false || val === 0) return t('status.failed', { defaultValue: 'Failed' })
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
    const match = EVENT_VALUES.find((o) => o.value === event)
    return (
      <Badge color={color} label>
        {match ? t(`admin.webhookLog.${match.key}`, { defaultValue: match.defaultLabel }) : event}
      </Badge>
    )
  }

  function httpStatusText(status) {
    if (!status && status !== 0) return '-'
    return String(Number(status))
  }

  if (loading && logs.length === 0) {
    return <PageSpinner />
  }

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Header */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-broadcast mr-2"></i>
                    {t('admin.webhookLog.title', { defaultValue: 'Merchant Webhook Logs' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.webhookLog.description', {
                      defaultValue: 'View and monitor webhook delivery attempts to merchants',
                    })}
                  </p>
                </div>
                <RefreshButton onClick={loadLogs} loading={loading} />
              </div>
            </div>

            {/* Filters */}
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>Merchant ID</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder={t('admin.webhookLog.merchantId', { defaultValue: 'Merchant ID' })}
                    value={merchantIdFilter}
                    onChange={(e) => setMerchantIdFilter(e.target.value)}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>Payment ID</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder={t('admin.webhookLog.paymentId', { defaultValue: 'Payment ID' })}
                    value={paymentIdFilter}
                    onChange={(e) => setPaymentIdFilter(e.target.value)}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.detail.event', { defaultValue: 'Event' })}</Label>
                  <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                    <option value="">{t('filter.allEvents', { defaultValue: 'All Events' })}</option>
                    {EVENT_VALUES.map((ev) => (
                      <option key={ev.value} value={ev.value}>
                        {t(`admin.webhookLog.${ev.key}`, { defaultValue: ev.defaultLabel })}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.detail.status', { defaultValue: 'Status' })}</Label>
                  <Select value={successFilter} onChange={(e) => setSuccessFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="true">{t('admin.detail.success', { defaultValue: 'Success' })}</option>
                    <option value="false">{t('status.failed', { defaultValue: 'Failed' })}</option>
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('filter.dateRange', { defaultValue: 'Date Range' })}</Label>
                  <LocaleDateRangePicker
                    className="w-full"
                    startDate={fromDateFilter}
                    endDate={toDateFilter}
                    onChangeStart={setFromDateFilter}
                    onChangeEnd={setToDateFilter}
                    locale={locale}
                    placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
                    t={t}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={applyFilters} disabled={loading}>
                  <i className="bx bx-filter-alt mr-1"></i>
                  {t('filter.apply', { defaultValue: 'Apply Filters' })}
                </Button>
                <Button onClick={resetFilters} disabled={loading} variant="outline-secondary">
                  <i className="bx bx-reset mr-1"></i>
                  {t('filter.reset', { defaultValue: 'Reset' })}
                </Button>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card>
            <Table>
              <thead>
                <tr className="whitespace-nowrap">
                  <th>{t('admin.detail.id', { defaultValue: 'ID' })}</th>
                  <th className="text-center">{t('admin.webhookLog.merchant', { defaultValue: 'Merchant' })}</th>
                  <th className="text-center">{t('admin.webhookLog.payment', { defaultValue: 'Payment' })}</th>
                  <th>{t('admin.detail.event', { defaultValue: 'Event' })}</th>
                  <SortableHeader field="http_status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-center">{t('admin.webhookLog.http', { defaultValue: 'HTTP' })}</SortableHeader>
                  <th className="text-center">{t('admin.detail.success', { defaultValue: 'Success' })}</th>
                  <SortableHeader field="duration_ms" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-right">{t('admin.webhookLog.duration', { defaultValue: 'Duration' })}</SortableHeader>
                  <SortableHeader field="attempt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-center">{t('admin.webhookLog.attempt', { defaultValue: 'Attempt' })}</SortableHeader>
                  <th>{t('admin.detail.callbackUrl', { defaultValue: 'Callback URL' })}</th>
                  <th>{t('admin.detail.error', { defaultValue: 'Error' })}</th>
                  <SortableHeader field="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>{t('admin.detail.created', { defaultValue: 'Created' })}</SortableHeader>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <TableEmptyState
                    colSpan={12}
                    icon="bx-broadcast"
                    message={t('admin.webhookLogs.noLogs', { defaultValue: 'No webhook logs found' })}
                    sub={t('admin.webhookLogs.noLogsSub', {
                      defaultValue: 'Webhook delivery logs will appear here when payments trigger callbacks',
                    })}
                  />
                ) : (
                  logs.map((log) => (
                    <tr className="whitespace-nowrap" key={log.id}>
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
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="text-center">{log.attempt ?? '-'}</td>
                      <td>{log.callbackUrl || '-'}</td>
                      <td>
                        {log.errorMessage ? (
                          <span className="text-danger truncate inline-block max-w-[180px]" title={log.errorMessage}>
                            {log.errorMessage}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{fmtDate(log.createdAt)}</td>
                      <td>
                        <Button
                          variant="text-secondary"
                          size="icon-sm"
                          href={`/admin/merchant-webhook-logs/${log.id}`}
                          title={t('admin.detail.viewDetails', { defaultValue: 'View details' })}
                        >
                          <i className="bx bx-chevron-right"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            <div className="px-5 py-1.5">
              <Pagination pagination={pagination} onPageChange={setCurrentPage} loading={loading} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
