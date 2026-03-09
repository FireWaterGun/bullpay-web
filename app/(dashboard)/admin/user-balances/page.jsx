'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'

import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getUserBalances, getUserBalancesSummary } from '@/lib/api/admin'
import { useDateFormat } from '@/hooks/useDateFormat'
import SummaryCard from '@/components/admin/RevenueSummaryCard'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import { badgeBase } from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import SortableHeader from '@/components/ui/SortableHeader'

function roleBadgeClass(role) {
  const v = String(role || '').toLowerCase()
  if (v === 'super_admin') return `${badgeBase} bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300`
  if (v === 'admin') return `${badgeBase} bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300`
  if (v === 'business_user') return `${badgeBase} bg-info-50 text-info-700 dark:bg-info-500/15 dark:text-info-300`
  if (v === 'support_agent') return `${badgeBase} bg-surface-100 text-surface-600 dark:bg-white/8 dark:text-surface-400`
  return `${badgeBase} bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400`
}

export default function UserBalanceListPage() {
  const router = useRouter()
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()

  const { token } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()

  const initSortBy = searchParams.get('sortBy') || ''
  const rawSortOrder = searchParams.get('sortOrder') || ''
  const initSortOrder = ['asc', 'desc'].includes(rawSortOrder) ? rawSortOrder : ''
  const initMinValue = searchParams.get('minValueUsd') || ''
  const initSearch = searchParams.get('search') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const [sortBy, setSortBy] = useState(initSortBy)
  const [sortOrder, setSortOrder] = useState(initSortOrder)
  const [minValueFilter, setMinValueFilter] = useState(initMinValue)
  const [searchFilter, setSearchFilter] = useState(initSearch)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initSortBy) f.sortBy = initSortBy
    if (initSortOrder) f.sortOrder = initSortOrder
    if (initMinValue) f.minValueUsd = Number(initMinValue)
    if (initSearch) f.search = initSearch
    return f
  })

  function handleSort(field, order) {
    setSortBy(field)
    setSortOrder(order)
    const f = { ...appliedFilters, sortBy: field, sortOrder: order }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  const loadSummary = useCallback(async () => {
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
  }, [token])

  const loadUsers = useCallback(async () => {
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
  }, [token, currentPage, appliedFilters, toast, t])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])
  // Load summary once on mount (parallel with first loadUsers via React batching)
  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v))
    })
    if (page > 1) params.set('page', page)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  function applyFilters() {
    const f = {
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
      minValueUsd: minValueFilter ? Number(minValueFilter) : undefined,
      search: searchFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setSortBy('')
    setSortOrder('')
    setMinValueFilter('')
    setSearchFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    syncSearchParams({}, 1)
  }

  if (loading && users.length === 0 && !summary) {
    return <PageSpinner />
  }

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-wallet mr-2"></i>
                    {t('admin.userBalances.title', { defaultValue: 'User Balances' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.userBalances.description', {
                      defaultValue: 'Overview of all user balances across the platform',
                    })}
                  </p>
                </div>
                <RefreshButton
                  onClick={() => {
                    loadUsers()
                    loadSummary()
                  }}
                  loading={loading}
                />
              </div>
            </div>
            {summary && (
              <div className="grid grid-cols-12 gap-x-6 gap-4 p-5">
                <SummaryCard
                  title={t('admin.userBalance.totalUsers', { defaultValue: 'Total Users' })}
                  value={summary.totalUsers ?? 0}
                  icon="bx-group"
                  color="primary"
                />
                <SummaryCard
                  title={t('admin.userBalance.totalValueUsd', { defaultValue: 'Total Value (USD)' })}
                  value={`$${summary.totalValueUsd ?? '0.00'}`}
                  icon="bx-dollar-circle"
                  color="success"
                />
                <SummaryCard
                  title={t('admin.userBalance.averageUsd', { defaultValue: 'Average (USD)' })}
                  value={`$${summary.averageValueUsd ?? '0.00'}`}
                  icon="bx-bar-chart-alt-2"
                  color="info"
                />
                <SummaryCard
                  title={t('admin.userBalance.withBalance', { defaultValue: 'With Balance' })}
                  value={summary.totalUsersWithBalance ?? summary.usersWithBalance ?? 0}
                  icon="bx-user-check"
                  color="warning"
                />
              </div>
            )}
          </Card>

          <Card className="mb-4">
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('filter.search', { defaultValue: 'Search' })}</Label>
                  <Input
                    type="text"
                    placeholder={t('admin.userBalances.searchPlaceholder', { defaultValue: 'Email, name...' })}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.userBalances.minValue', { defaultValue: 'Min Value (USD)' })}</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={minValueFilter}
                    onChange={(e) => setMinValueFilter(e.target.value)}
                    min="0"
                    step="0.01"
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

          <Card>
            <Table>
              <thead>
                <tr className="whitespace-nowrap">
                  <th>{t('table.userId', { defaultValue: 'User ID' })}</th>
                  <th>{t('table.email', { defaultValue: 'Email' })}</th>
                  <th>{t('table.name', { defaultValue: 'Name' })}</th>
                  <th className="text-center">{t('table.role', { defaultValue: 'Role' })}</th>
                  <SortableHeader field="totalAssets" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-center">{t('admin.userBalances.totalAssets', { defaultValue: 'Assets' })}</SortableHeader>
                  <SortableHeader field="totalValueUsd" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-right">
                    {t('admin.userBalances.totalValueUsd', { defaultValue: 'Value (USD)' })}
                  </SortableHeader>
                  <SortableHeader field="updatedAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>{t('admin.userBalances.valuedAt', { defaultValue: 'Valued At' })}</SortableHeader>
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
                    <tr key={u.userId} className="cursor-pointer" onClick={() => router.push(`/admin/user-balances/${u.userId}`)}>
                      <td>
                        <span className="font-semibold text-primary">{u.userId}</span>
                      </td>
                      <td>
                        <span className="text-[0.85rem]">{u.email || '-'}</span>
                      </td>
                      <td>
                        <span className="font-medium">{u.fullName || '-'}</span>
                      </td>
                      <td className="text-center">
                        <span className={roleBadgeClass(u.role)}>
                          {String(u.role || '')
                            .replace(/_/g, ' ')
                            .toUpperCase()}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="font-medium">{u.totalAssets ?? 0}</span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span className="font-bold">${u.totalValueUsd || '0.00'}</span>
                      </td>
                      <td>
                        <span className="whitespace-nowrap text-[0.85rem]">{fmtDate(u.valuedAt)}</span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="text-secondary"
                          size="icon-sm"
                          href={`/admin/user-balances/${u.userId}`}
                          title={t('admin.detail.viewDetail', { defaultValue: 'View detail' })}
                        >
                          <i className="bx bx-show text-[1rem]"></i>
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
