'use client'

import { useState, useMemo, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { getUserWebhookLogs } from '@/lib/api/userWebhookLogs'
import { useDateFormat } from '@/hooks/useDateFormat'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, Label, Select } from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import SortableHeader from '@/components/ui/SortableHeader'
import { EVENT_OPTIONS, successBadge, eventBadge, httpStatusBadge } from '@/components/webhook/webhookHelpers'

export default function WebhookLogsPage() {
  const router = useRouter()
  const { fmtDate } = useDateFormat()
  const { t, i18n } = useTranslation()
  const toast = useToast()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const [currentPage, setCurrentPage] = useState(1)

  // Filter states (draft)
  const [searchFilter, setSearchFilter] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [successFilter, setSuccessFilter] = useState('')
  const [fromDateFilter, setFromDateFilter] = useState('')
  const [toDateFilter, setToDateFilter] = useState('')

  // Sort state (applied immediately from table headers)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  const { copiedId, handleCopy: doCopy } = useCopyFeedback()

  function handleCopy(e, text, id) {
    e.stopPropagation()
    e.preventDefault()
    doCopy(text, id)
  }

  const { data, isLoading, isValidating, mutate } = useApi(
    ['webhook-logs', currentPage, appliedFilters],
    (token) => getUserWebhookLogs(token, { page: currentPage, limit: 20, ...appliedFilters }),
    { keepPreviousData: true }
  )
  const logs = data?.items || []
  const pagination = data?.pagination || null

  function applyFilters() {
    startTransition(() => {
      setAppliedFilters((prev) => ({
        ...prev,
        q: searchFilter || undefined,
        event: eventFilter || undefined,
        success: successFilter || undefined,
        fromDate: fromDateFilter || undefined,
        toDate: toDateFilter || undefined,
      }))
      setCurrentPage(1)
    })
  }

  function resetFilters() {
    setSearchFilter('')
    setEventFilter('')
    setSuccessFilter('')
    setFromDateFilter('')
    setToDateFilter('')
    setSortBy('created_at')
    setSortOrder('desc')
    startTransition(() => {
      setAppliedFilters({ sortBy: 'created_at', sortOrder: 'desc' })
      setCurrentPage(1)
    })
  }

  function handleSort(field, order) {
    setSortBy(field)
    setSortOrder(order)
    startTransition(() => {
      setAppliedFilters((prev) => ({ ...prev, sortBy: field, sortOrder: order }))
      setCurrentPage(1)
    })
  }

  if (isLoading && logs.length === 0) {
    return <PageSpinner />
  }

  return (
    <>
      {/* Header + Filters */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h4 className="font-semibold text-surface-900 mb-1">
              <i className="bx bx-broadcast mr-2 text-primary-500 dark:text-primary-400"></i>
              {t('webhookLog.title', { defaultValue: 'Webhook Logs' })}
            </h4>
            <p className="text-surface-500 text-sm mb-0">
              {t('webhookLog.description', { defaultValue: 'Monitor webhook delivery attempts for your payments' })}
            </p>
          </div>
          <RefreshButton onClick={() => mutate()} loading={isValidating} />
        </div>

        {/* Filters */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>{t('filter.search', { defaultValue: 'Invoice No. / Public Code' })}</Label>
              <Input
                type="text"
                placeholder="INV-00001, in_xxx"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <div>
              <Label>{t('webhookLog.event', { defaultValue: 'Event' })}</Label>
              <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                <option value="">{t('webhookLog.allEvents', { defaultValue: 'All Events' })}</option>
                {EVENT_OPTIONS.map((ev) => (
                  <option key={ev.value} value={ev.value}>
                    {ev.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>{t('webhookLog.deliveryStatus', { defaultValue: 'Delivery Status' })}</Label>
              <Select value={successFilter} onChange={(e) => setSuccessFilter(e.target.value)}>
                <option value="">{t('webhookLog.allStatuses', { defaultValue: 'All Statuses' })}</option>
                <option value="true">{t('webhookLog.success', { defaultValue: 'Success' })}</option>
                <option value="false">{t('webhookLog.failed', { defaultValue: 'Failed' })}</option>
              </Select>
            </div>
            <div>
              <Label>{t('webhookLog.dateRange', { defaultValue: 'Date Range' })}</Label>
              <LocaleDateRangePicker
                className="w-full"
                startDate={fromDateFilter}
                endDate={toDateFilter}
                onChangeStart={setFromDateFilter}
                onChangeEnd={setToDateFilter}
                locale={locale}
                placeholder={t('webhookLog.dateRange', { defaultValue: 'Select date range' })}
                t={t}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} disabled={isValidating}>
              <i className="bx bx-filter-alt mr-1"></i>
              {t('webhookLog.applyFilters', { defaultValue: 'Apply Filters' })}
            </Button>
            <Button onClick={resetFilters} disabled={isValidating} variant="outline-secondary">
              <i className="bx bx-reset mr-1"></i>
              {t('webhookLog.resetFilters', { defaultValue: 'Reset' })}
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <thead>
            <tr className="whitespace-nowrap">
              <th>{t('table.invoiceNumber', { defaultValue: 'Invoice Number' })}</th>
              <th>{t('webhookLog.event', { defaultValue: 'Event' })}</th>
              <SortableHeader field="http_status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-center">
                {t('webhookLog.httpStatus', { defaultValue: 'HTTP' })}
              </SortableHeader>
              <th className="text-center">{t('webhookLog.success', { defaultValue: 'Status' })}</th>
              <SortableHeader field="duration_ms" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-right">
                {t('webhookLog.duration', { defaultValue: 'Duration' })}
              </SortableHeader>
              <SortableHeader field="attempt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-center">
                {t('webhookLog.attempt', { defaultValue: 'Attempt' })}
              </SortableHeader>
              <th>{t('webhookLog.callbackUrl', { defaultValue: 'Callback URL' })}</th>
              <th>{t('webhookLog.error', { defaultValue: 'Error' })}</th>
              <SortableHeader field="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                {t('webhookLog.created', { defaultValue: 'Created' })}
              </SortableHeader>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <TableEmptyState
                colSpan={10}
                icon="bx-broadcast"
                message={t('webhookLog.noLogs', { defaultValue: 'No webhook logs found' })}
                sub={t('webhookLog.noLogsSub', {
                  defaultValue: 'Webhook delivery logs will appear here when payments trigger callbacks',
                })}
              />
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="whitespace-nowrap cursor-pointer hover:bg-surface-50 transition-colors" onClick={() => router.push(`/webhook-logs/${log.id}`)}>
                  <td className="whitespace-nowrap">
                    {log.invoiceId ? (
                      <div>
                        <div className="flex items-center gap-1">
                          <a
                            href={`/invoices/${log.invoiceId}`}
                            className="text-primary-500 hover:underline font-medium text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {log.invoiceNumber || log.invoicePublicCode || `#${log.invoiceId}`}
                          </a>
                          <button
                            type="button"
                            className="text-surface-400 hover:text-primary-500 transition-colors"
                            title="Copy"
                            onClick={(e) => handleCopy(e, log.invoiceNumber || log.invoicePublicCode || `#${log.invoiceId}`, `inv-${log.id}`)}
                          >
                            <i className={`bx ${copiedId === `inv-${log.id}` ? 'bx-check text-success' : 'bx-copy'} text-xs`}></i>
                          </button>
                        </div>
                        {log.invoicePublicCode && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-surface-500 font-mono">
                              {log.invoicePublicCode}
                            </span>
                            <button
                              type="button"
                              className="text-surface-400 hover:text-primary-500 transition-colors"
                              title="Copy"
                            onClick={(e) => handleCopy(e, log.invoicePublicCode, `pc-${log.id}`)}
                          >
                            <i className={`bx ${copiedId === `pc-${log.id}` ? 'bx-check text-success' : 'bx-copy'} text-xs`}></i>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td>{eventBadge(log.event)}</td>
                  <td className="text-center">{httpStatusBadge(log.httpStatus)}</td>
                  <td className="text-center">{successBadge(log.success, t)}</td>
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
                  <td>
                    <span className="truncate inline-block max-w-[200px]" title={log.callbackUrl}>
                      {log.callbackUrl || '-'}
                    </span>
                  </td>
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
                  <td onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="text-secondary"
                      size="icon-sm"
                      href={`/webhook-logs/${log.id}`}
                      title={t('webhookLog.viewDetails', { defaultValue: 'View details' })}
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
          <Pagination pagination={pagination} onPageChange={(p) => startTransition(() => setCurrentPage(p))} loading={isValidating} />
        </div>
      </Card>
    </>
  )
}
