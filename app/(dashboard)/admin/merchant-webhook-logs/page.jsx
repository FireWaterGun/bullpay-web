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
  const [sortByFilter, setSortByFilter] = useState('')
  const [sortOrderFilter, setSortOrderFilter] = useState('')

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({})

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
    const label = EVENT_OPTIONS.find((o) => o.value === event)?.label || event
    return (
      <Badge color={color} label>
        {label}
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
                    Merchant Webhook Logs
                  </h4>
                  <p className="text-surface-500 mb-0">View and monitor webhook delivery attempts to merchants</p>
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
                    placeholder={t('admin.webhookLog.merchantId', { defaultValue: 'Merchant ID' })}
                    value={merchantIdFilter}
                    onChange={(e) => setMerchantIdFilter(e.target.value)}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>Payment ID</Label>
                  <Input
                    type="number"
                    placeholder={t('admin.webhookLog.paymentId', { defaultValue: 'Payment ID' })}
                    value={paymentIdFilter}
                    onChange={(e) => setPaymentIdFilter(e.target.value)}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.detail.event', { defaultValue: 'Event' })}</Label>
                  <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                    <option value="">{t('filter.allEvents', { defaultValue: 'All Events' })}</option>
                    {EVENT_OPTIONS.map((ev) => (
                      <option key={ev.value} value={ev.value}>
                        {ev.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.detail.status', { defaultValue: 'Status' })}</Label>
                  <Select value={successFilter} onChange={(e) => setSuccessFilter(e.target.value)}>
                    <option value="">All</option>
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
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('filter.sortBy', { defaultValue: 'Sort By' })}</Label>
                  <Select value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    {SORT_BY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</Label>
                  <Select value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="asc">
                      {t('filter.ascending', {
                        defaultValue: t('admin.detail.ascending', { defaultValue: 'Ascending' }),
                      })}
                    </option>
                    <option value="desc">
                      {t('filter.descending', {
                        defaultValue: t('admin.detail.descending', { defaultValue: 'Descending' }),
                      })}
                    </option>
                  </Select>
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
