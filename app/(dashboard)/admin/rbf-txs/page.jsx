'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { getRbfTxs } from '@/lib/api/admin'
import RbfTransactionFilters from '@/components/admin/RbfTransactionFilters'
import RbfTransactionTable from '@/components/admin/RbfTransactionTable'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Card from '@/components/ui/Card'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function RbfTransactions() {
  const { t } = useAdminTranslation()
  const toast = useToast()
  const searchParams = useNextSearchParams()
  const router = useRouter()
  const locale = useLocale()

  const initStatus = searchParams.get('status') || ''
  const initEntityType = searchParams.get('entityType') || ''
  const initChainType = searchParams.get('chainType') || ''
  const initTxHash = searchParams.get('txHash') || ''
  const initFromAddress = searchParams.get('fromAddress') || ''
  const initStartDate = searchParams.get('startDate') || ''
  const initEndDate = searchParams.get('endDate') || ''
  const initSortBy = searchParams.get('sortBy') || ''
  const rawSortOrder = searchParams.get('sortOrder') || ''
  const initSortOrder = ['asc', 'desc'].includes(rawSortOrder) ? rawSortOrder : ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [currentPage, setCurrentPage] = useState(initPage)

  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [entityTypeFilter, setEntityTypeFilter] = useState(initEntityType)
  const [chainTypeFilter, setChainTypeFilter] = useState(initChainType)
  const [txHashFilter, setTxHashFilter] = useState(initTxHash)
  const [fromAddressFilter, setFromAddressFilter] = useState(initFromAddress)
  const [startDateFilter, setStartDateFilter] = useState(initStartDate)
  const [endDateFilter, setEndDateFilter] = useState(initEndDate)
  const [sortBy, setSortBy] = useState(initSortBy)
  const [sortOrder, setSortOrder] = useState(initSortOrder)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initEntityType) f.entityType = initEntityType
    if (initChainType) f.chainType = initChainType
    if (initTxHash) f.txHash = initTxHash
    if (initFromAddress) f.fromAddress = initFromAddress
    if (initStartDate) f.startDate = initStartDate
    if (initEndDate) f.endDate = initEndDate
    if (initSortBy) f.sortBy = initSortBy
    if (initSortOrder) f.sortOrder = initSortOrder
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

  const { data, isLoading, isValidating, mutate } = useApi(
    ['admin-rbf-txs', currentPage, appliedFilters],
    (token) => getRbfTxs(token, { page: currentPage, limit: 20, ...appliedFilters }),
    { onError: () => toast.error('Failed to load RBF transactions'), keepPreviousData: true }
  )
  const transactions = data?.items || []
  const pagination = data?.pagination || null

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
      status: statusFilter || undefined,
      entityType: entityTypeFilter || undefined,
      chainType: chainTypeFilter || undefined,
      txHash: txHashFilter || undefined,
      fromAddress: fromAddressFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setEntityTypeFilter('')
    setChainTypeFilter('')
    setTxHashFilter('')
    setFromAddressFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setSortBy('')
    setSortOrder('')
    setAppliedFilters({})
    setCurrentPage(1)
    window.history.replaceState(null, '', window.location.pathname)
  }

  function handlePageChange(page) {
    startTransition(() => setCurrentPage(page))
    syncSearchParams(appliedFilters, page)
  }

  if (isLoading && transactions.length === 0) {
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
                    <i className="bx bx-revision mr-2"></i>
                    {t('admin.rbf.title', { defaultValue: 'RBF Transactions' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.rbf.description', {
                      defaultValue: 'Monitor Replace-By-Fee transaction replacements',
                    })}
                  </p>
                </div>
                <RefreshButton onClick={() => mutate()} loading={isValidating} />
              </div>
            </div>
            <RbfTransactionFilters
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              entityTypeFilter={entityTypeFilter}
              setEntityTypeFilter={setEntityTypeFilter}
              chainTypeFilter={chainTypeFilter}
              setChainTypeFilter={setChainTypeFilter}
              txHashFilter={txHashFilter}
              setTxHashFilter={setTxHashFilter}
              fromAddressFilter={fromAddressFilter}
              setFromAddressFilter={setFromAddressFilter}
              startDateFilter={startDateFilter}
              setStartDateFilter={setStartDateFilter}
              endDateFilter={endDateFilter}
              setEndDateFilter={setEndDateFilter}
              locale={locale}
              loading={isValidating}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </Card>

          <RbfTransactionTable
            transactions={transactions}
            loading={isValidating}
            pagination={pagination}
            statusBadgeClass={(s) => getStatusBadgeClass(s, 'rbf')}
            onNavigate={(id) => router.push(`/admin/rbf-txs/${id}`)}
            onPageChange={handlePageChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </div>
      </div>
    </div>
  )
}
