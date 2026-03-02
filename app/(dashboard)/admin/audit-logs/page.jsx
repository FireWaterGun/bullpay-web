'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import { getAuditLogs } from '@/lib/api/auditLogs'
import { formatDate } from '@/lib/utils/format'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

const ACTION_OPTIONS = [
  { value: 'list_sweeps', label: 'List Sweeps' },
  { value: 'retry_sweep', label: 'Retry Sweep' },
  { value: 'view_webhook_log', label: 'View Webhook Log' },
  { value: 'list_webhook_logs', label: 'List Webhook Logs' },
  { value: 'retry_webhook', label: 'Retry Webhook' },
  { value: 'list_audit_logs', label: 'List Audit Logs' },
  { value: 'view_audit_log', label: 'View Audit Log' },
]

const RESOURCE_TYPE_OPTIONS = [
  { value: 'sweep', label: 'Sweep' },
  { value: 'merchant_webhook_log', label: 'Merchant Webhook Log' },
  { value: 'system_audit_log', label: 'System Audit Log' },
]

const SORT_BY_OPTIONS = [
  { value: 'created_at', label: 'Created At' },
  { value: 'action', label: 'Action' },
]

export default function AuditLogList() {
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

  useEffect(() => {
    loadLogs()
  }, [currentPage, appliedFilters])

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

  async function loadLogs() {
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
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  function actionBadge(action) {
    if (!action) return '-'
    const colorMap = {
      'retry_sweep': 'warning',
      'retry_webhook': 'warning',
      'list_sweeps': 'info',
      'list_webhook_logs': 'info',
      'list_audit_logs': 'info',
      'view_webhook_log': 'secondary',
      'view_audit_log': 'secondary',
    }
    const color = colorMap[action] || 'primary'
    const label = ACTION_OPTIONS.find(o => o.value === action)?.label || action
    return <span className={`badge bg-label-${color}`}>{label}</span>
  }

  function resourceTypeText(type) {
    if (!type) return '-'
    return RESOURCE_TYPE_OPTIONS.find(o => o.value === type)?.label || type
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
                    <i className="bx bx-history me-2"></i>
                    Audit Logs
                  </h4>
                  <p className="text-muted mb-0">Track admin actions and system events</p>
                </div>
                <RefreshButton onClick={loadLogs} loading={loading} />
              </div>
            </div>

            {/* Filters */}
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">User ID</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="User ID"
                    value={userIdFilter}
                    onChange={e => setUserIdFilter(e.target.value)}
                  />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Action</label>
                  <select className="form-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                    <option value="">{t('filter.allActions', { defaultValue: 'All Actions' })}</option>
                    {ACTION_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Resource Type</label>
                  <select className="form-select" value={resourceTypeFilter} onChange={e => setResourceTypeFilter(e.target.value)}>
                    <option value="">{t('filter.allTypes', { defaultValue: 'All Types' })}</option>
                    {RESOURCE_TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Resource ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Resource ID"
                    value={resourceIdFilter}
                    onChange={e => setResourceIdFilter(e.target.value)}
                  />
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
                      <th className="text-center">User</th>
                      <th>Action</th>
                      <th>Resource Type</th>
                      <th className="text-center">Resource ID</th>
                      <th>IP Address</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      logs.map(log => (
                        <tr key={log.id} style={{ whiteSpace: 'nowrap' }}>
                          <td className="fw-medium">{log.id}</td>
                          <td className="text-center">{log.userId || '-'}</td>
                          <td>{actionBadge(log.action)}</td>
                          <td>{resourceTypeText(log.resourceType)}</td>
                          <td className="text-center">{log.resourceId || '-'}</td>
                          <td>
                            {log.ipAddress ? (
                              <code className="text-body" style={{ fontSize: '0.8rem' }}>{log.ipAddress}</code>
                            ) : '-'}
                          </td>
                          <td>{formatDate(log.createdAt)}</td>
                          <td>
                            <Link
                              href={`/admin/audit-logs/${log.id}`}
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
                      onClick={() => setCurrentPage(p => p - 1)}
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
