'use client'

import { useState, useEffect } from 'react'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getUserBalances, getUserBalancesSummary } from '@/lib/api/admin'
import { useDateFormat } from '@/hooks/useDateFormat'
import SummaryCard from '@/components/admin/RevenueSummaryCard'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'

function roleBadgeClass(role) {
  const v = String(role || '').toLowerCase()
  if (v === 'super_admin') return 'badge bg-red-50 text-red-700'
  if (v === 'admin') return 'badge bg-amber-50 text-amber-700'
  if (v === 'business_user') return 'badge bg-cyan-50 text-cyan-700'
  if (v === 'support_agent') return 'badge bg-surface-100 text-surface-600'
  return 'badge bg-primary-50 text-primary-600'
}

export default function UserBalanceListPage() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const SORT_BY_OPTIONS = [
    { value: 'totalValueUsd', label: t('admin.userBalance.totalValueUsd', { defaultValue: 'Total Value (USD)' }) },
    { value: 'totalAssets', label: t('admin.userBalance.totalAssets', { defaultValue: 'Total Assets' }) },
    { value: 'updatedAt', label: t('admin.detail.updatedAt', { defaultValue: 'Updated At' }) },
  ]
  const { token } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()

  const initSortBy = searchParams.get('sortBy') || ''
  const initSortOrder = searchParams.get('sortOrder') || ''
  const initMinValue = searchParams.get('minValueUsd') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const [sortByFilter, setSortByFilter] = useState(initSortBy)
  const [sortOrderFilter, setSortOrderFilter] = useState(initSortOrder)
  const [minValueFilter, setMinValueFilter] = useState(initMinValue)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initSortBy) f.sortBy = initSortBy
    if (initSortOrder) f.sortOrder = initSortOrder
    if (initMinValue) f.minValueUsd = Number(initMinValue)
    return f
  })

  useEffect(() => { loadUsers() }, [currentPage, appliedFilters])
  // Load summary once on mount (parallel with first loadUsers via React batching)
  useEffect(() => { loadSummary() }, [])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)) })
    if (page > 1) params.set('page', page)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  function applyFilters() {
    const f = {
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined,
      minValueUsd: minValueFilter ? Number(minValueFilter) : undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setSortByFilter('')
    setSortOrderFilter('')
    setMinValueFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    syncSearchParams({}, 1)
  }

  async function loadSummary() {
    if (!token) return
    try {
      setSummaryLoading(true)
      const data = await getUserBalancesSummary(token)
      setSummary(data)
    } catch (error) {
      logger.error('Failed to load balance summary:', error)
    } finally {
      setSummaryLoading(false)
    }
  }

  async function loadUsers() {
    if (!token) return
    try {
      setLoading(true)
      const data = await getUserBalances(token, { page: currentPage, limit: 20, ...appliedFilters })
      setUsers(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load user balances:', error)
      toast.error(t('admin.userBalance.loadError', { defaultValue: 'Failed to load user balances' }))
    } finally {
      setLoading(false)
    }
  }

  if (loading && users.length === 0 && !summary) {
    return <PageSpinner />
  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <div className="card mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-wallet mr-2"></i>
                    {t('admin.userBalances.title', { defaultValue: 'User Balances' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.userBalances.description', { defaultValue: 'Overview of all user balances across the platform' })}
                  </p>
                </div>
                <RefreshButton onClick={() => { loadUsers(); loadSummary() }} loading={loading} />
              </div>
            </div>
          </div>

          {summary && (
            <div className="grid grid-cols-12 gap-x-6 gap-4 mb-4">
              <SummaryCard title={t('admin.userBalance.totalUsers', { defaultValue: 'Total Users' })} value={summary.totalUsers ?? 0} icon="bx-group" color="primary" />
              <SummaryCard title={t('admin.userBalance.totalValueUsd', { defaultValue: 'Total Value (USD)' })} value={`$${summary.totalValueUsd ?? '0.00'}`} icon="bx-dollar-circle" color="success" />
              <SummaryCard title={t('admin.userBalance.averageUsd', { defaultValue: 'Average (USD)' })} value={`$${summary.averageValueUsd ?? '0.00'}`} icon="bx-bar-chart-alt-2" color="info" />
              <SummaryCard title={t('admin.userBalance.withBalance', { defaultValue: 'With Balance' })} value={summary.totalUsersWithBalance ?? summary.usersWithBalance ?? 0} icon="bx-user-check" color="warning" />
            </div>
          )}

          <div className="card mb-4">
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">{t('filter.sortBy', { defaultValue: 'Sort By' })}</label>
                  <select className="form-input" value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    {SORT_BY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</label>
                  <select className="form-input" value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="asc">{t('filter.ascending', { defaultValue: t('admin.detail.ascending', { defaultValue: 'Ascending' }) })}</option>
                    <option value="desc">{t('filter.descending', { defaultValue: t('admin.detail.descending', { defaultValue: 'Descending' }) })}</option>
                  </select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">{t('admin.userBalances.minValue', { defaultValue: 'Min Value (USD)' })}</label>
                  <input type="number" className="form-input" placeholder="0.00" value={minValueFilter} onChange={(e) => setMinValueFilter(e.target.value)} min="0" step="0.01" />
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

          <div className="card">
            <div className="p-5">
              <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>{t('table.userId', { defaultValue: 'User ID' })}</th>
                      <th>{t('table.email', { defaultValue: 'Email' })}</th>
                      <th>{t('table.name', { defaultValue: 'Name' })}</th>
                      <th className="text-center">{t('table.role', { defaultValue: 'Role' })}</th>
                      <th className="text-center">{t('admin.userBalances.totalAssets', { defaultValue: 'Assets' })}</th>
                      <th className="text-right">{t('admin.userBalances.totalValueUsd', { defaultValue: 'Value (USD)' })}</th>
                      <th>{t('admin.userBalances.valuedAt', { defaultValue: 'Valued At' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <TableEmptyState
                        colSpan={8}
                        icon="bx-money"
                        message={t('admin.userBalances.noData', { defaultValue: 'No user balances found' })}
                        sub={t('admin.userBalances.noDataSub', { defaultValue: 'No users match the current search' })}
                      />
                    ) : (
                      users.map((u) => (
                        <tr key={u.userId}>
                          <td><span className="font-semibold text-primary">{u.userId}</span></td>
                          <td><span style={{ fontSize: '0.85rem' }}>{u.email || '-'}</span></td>
                          <td><span className="font-medium">{u.fullName || '-'}</span></td>
                          <td className="text-center">
                            <span className={roleBadgeClass(u.role)}>
                              {String(u.role || '').replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="text-center"><span className="font-medium">{u.totalAssets ?? 0}</span></td>
                          <td className="text-right whitespace-nowrap"><span className="font-bold">${u.totalValueUsd || '0.00'}</span></td>
                          <td><span style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{fmtDate(u.valuedAt)}</span></td>
                          <td>
                            <Link
                              href={`/admin/user-balances/${u.userId}`}
                              className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none"
                              title={t('admin.detail.viewDetail', { defaultValue: 'View detail' })}
                            >
                              <i className="bx bx-show" style={{ fontSize: '1.25rem' }}></i>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.total > 0 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-muted text-sm">
                    {t('invoices.showingEntries', {
                      start: pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0,
                      end: Math.min(pagination.page * pagination.limit, pagination.total),
                      total: pagination.total,
                      defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
                    })}
                  </div>
                  <div className="inline-flex rounded-lg shadow-sm">
                    <button className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm" disabled={!pagination.hasPrev || loading} onClick={() => { setCurrentPage(p => p - 1); syncSearchParams(appliedFilters, currentPage - 1) }}>
                      <i className="bx bx-chevron-left"></i> {t('actions.prev', { defaultValue: 'Previous' })}
                    </button>
                    <button className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm" disabled>{pagination.page} / {pagination.totalPages}</button>
                    <button className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm" disabled={!pagination.hasNext || loading} onClick={() => { setCurrentPage(p => p + 1); syncSearchParams(appliedFilters, currentPage + 1) }}>
                      {t('actions.next', { defaultValue: 'Next' })} <i className="bx bx-chevron-right"></i>
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
