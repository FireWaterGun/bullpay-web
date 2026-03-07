'use client'

import { useState, useEffect, useCallback } from 'react'

import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/app/providers'
import { getAuditLogs } from '@/lib/api/auditLogs'
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

const ACTION_VALUES = [
  { value: 'list_sweeps', key: 'listSweeps', defaultLabel: 'List Sweeps' },
  { value: 'retry_sweep', key: 'retrySweep', defaultLabel: 'Retry Sweep' },
  { value: 'view_webhook_log', key: 'viewWebhookLog', defaultLabel: 'View Webhook Log' },
  { value: 'list_webhook_logs', key: 'listWebhookLogs', defaultLabel: 'List Webhook Logs' },
  { value: 'retry_webhook', key: 'retryWebhook', defaultLabel: 'Retry Webhook' },
  { value: 'list_audit_logs', key: 'listAuditLogs', defaultLabel: 'List Audit Logs' },
  { value: 'view_audit_log', key: 'viewAuditLog', defaultLabel: 'View Audit Log' },
]

const RESOURCE_TYPE_VALUES = [
  { value: 'sweep', key: 'sweep', defaultLabel: 'Sweep' },
  { value: 'merchant_webhook_log', key: 'merchantWebhookLog', defaultLabel: 'Merchant Webhook Log' },
  { value: 'system_audit_log', key: 'systemAuditLog', defaultLabel: 'System Audit Log' },
]

export default function AuditLogList() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()

  const SORT_BY_OPTIONS = [
    { value: 'created_at', label: t('admin.detail.createdAt', { defaultValue: 'Created At' }) },
    { value: 'action', label: t('admin.auditLog.action', { defaultValue: 'Action' }) },
  ]
  const { token } = useAuth()
  const toast = useToast()

  const locale = useLocale()

  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter states (draft)
  const [userIdFilter, setUserIdFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [resourceTypeFilter, setResourceTypeFilter] = useState('')
  const [resourceIdFilter, setResourceIdFilter] = useState('')
  const [fromDateFilter, setFromDateFilter] = useState('')
  const [toDateFilter, setToDateFilter] = useState('')
  const [sortByFilter, setSortByFilter] = useState('')
  const [sortOrderFilter, setSortOrderFilter] = useState('')

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({})

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAuditLogs(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setLogs(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load audit logs:', error)
      toast.error(t('admin.auditLog.loadError', { defaultValue: 'Failed to load audit logs' }))
    } finally {
      setLoading(false)
    }
  }, [token, currentPage, appliedFilters, toast, t])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  function applyFilters() {
    setAppliedFilters({
      userId: userIdFilter ? Number(userIdFilter) : undefined,
      action: actionFilter || undefined,
      resourceType: resourceTypeFilter || undefined,
      resourceId: resourceIdFilter || undefined,
      fromDate: fromDateFilter || undefined,
      toDate: toDateFilter || undefined,
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined,
    })
    setCurrentPage(1)
  }

  function resetFilters() {
    setUserIdFilter('')
    setActionFilter('')
    setResourceTypeFilter('')
    setResourceIdFilter('')
    setFromDateFilter('')
    setToDateFilter('')
    setSortByFilter('')
    setSortOrderFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
  }

  function actionBadge(action) {
    if (!action) return '-'
    const colorMap = {
      retry_sweep: 'warning',
      retry_webhook: 'warning',
      list_sweeps: 'info',
      list_webhook_logs: 'info',
      list_audit_logs: 'info',
      view_webhook_log: 'secondary',
      view_audit_log: 'secondary',
    }
    const color = colorMap[action] || 'primary'
    const label = ACTION_VALUES.find((o) => o.value === action)
    return (
      <Badge color={color} label>
        {label ? t(`admin.auditLog.${label.key}`, { defaultValue: label.defaultLabel }) : action}
      </Badge>
    )
  }

  function resourceTypeText(type) {
    if (!type) return '-'
    const match = RESOURCE_TYPE_VALUES.find((o) => o.value === type)
    return match ? t(`admin.auditLog.${match.key}`, { defaultValue: match.defaultLabel }) : type
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
                    <i className="bx bx-history mr-2"></i>
                    {t('admin.auditLog.title', { defaultValue: 'Audit Logs' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.auditLog.description', { defaultValue: 'Track admin actions and system events' })}
                  </p>
                </div>
                <RefreshButton onClick={loadLogs} loading={loading} />
              </div>
            </div>

            {/* Filters */}
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.detail.userId', { defaultValue: 'User ID' })}</Label>
                  <Input
                    type="number"
                    placeholder={t('admin.detail.userId', { defaultValue: 'User ID' })}
                    value={userIdFilter}
                    onChange={(e) => setUserIdFilter(e.target.value)}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.detail.action', { defaultValue: 'Action' })}</Label>
                  <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                    <option value="">{t('filter.allActions', { defaultValue: 'All Actions' })}</option>
                    {ACTION_VALUES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {t(`admin.auditLog.${o.key}`, { defaultValue: o.defaultLabel })}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.auditLog.resourceType', { defaultValue: 'Resource Type' })}</Label>
                  <Select value={resourceTypeFilter} onChange={(e) => setResourceTypeFilter(e.target.value)}>
                    <option value="">{t('filter.allTypes', { defaultValue: 'All Types' })}</option>
                    {RESOURCE_TYPE_VALUES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {t(`admin.auditLog.${o.key}`, { defaultValue: o.defaultLabel })}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.auditLog.resourceId', { defaultValue: 'Resource ID' })}</Label>
                  <Input
                    type="text"
                    placeholder={t('admin.auditLog.resourceId', { defaultValue: 'Resource ID' })}
                    value={resourceIdFilter}
                    onChange={(e) => setResourceIdFilter(e.target.value)}
                  />
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
                    <option value="asc">{t('filter.ascending', { defaultValue: 'Ascending' })}</option>
                    <option value="desc">{t('filter.descending', { defaultValue: 'Descending' })}</option>
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
                  <th className="text-center">{t('admin.auditLog.user', { defaultValue: 'User' })}</th>
                  <th>{t('admin.detail.action', { defaultValue: 'Action' })}</th>
                  <th>{t('admin.auditLog.resourceType', { defaultValue: 'Resource Type' })}</th>
                  <th className="text-center">{t('admin.auditLog.resourceId', { defaultValue: 'Resource ID' })}</th>
                  <th>{t('admin.auditLog.ipAddress', { defaultValue: 'IP Address' })}</th>
                  <th>{t('admin.detail.created', { defaultValue: 'Created' })}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <TableEmptyState
                    colSpan={8}
                    icon="bx-shield"
                    message={t('admin.auditLogs.noLogs', { defaultValue: 'No audit logs found' })}
                    sub={t('admin.auditLogs.noLogsSub', { defaultValue: 'No audit logs match the current filters' })}
                  />
                ) : (
                  logs.map((log) => (
                    <tr className="whitespace-nowrap" key={log.id}>
                      <td className="font-medium">{log.id}</td>
                      <td className="text-center">{log.userId || '-'}</td>
                      <td>{actionBadge(log.action)}</td>
                      <td>{resourceTypeText(log.resourceType)}</td>
                      <td className="text-center">{log.resourceId || '-'}</td>
                      <td>
                        {log.ipAddress ? <code className="text-surface-800 text-[0.8rem]">{log.ipAddress}</code> : '-'}
                      </td>
                      <td>{fmtDate(log.createdAt)}</td>
                      <td>
                        <Button
                          variant="text-secondary"
                          size="icon-sm"
                          href={`/admin/audit-logs/${log.id}`}
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
