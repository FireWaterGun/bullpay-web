'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/app/providers'
import { getRbfTxs } from '@/lib/api/admin'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import RbfTransactionFilters from '@/components/admin/RbfTransactionFilters'
import RbfTransactionTable from '@/components/admin/RbfTransactionTable'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Card from '@/components/ui/Card'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function RbfTransactions() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
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

  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState(null)
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

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getRbfTxs(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setTransactions(data.items || [])

      const meta = data.pagination
      if (meta) {
        setPagination({
          page: meta.page || currentPage,
          limit: meta.limit || 20,
          total: meta.total || 0,
          totalPages: meta.totalPages || 1,
          hasPrev: meta.hasPrev ?? (meta.page || 1) > 1,
          hasNext: meta.hasNext ?? (meta.page || 1) < (meta.totalPages || 1),
        })
      } else {
        setPagination(null)
      }
    } catch (error) {
      logger.error('Failed to load RBF transactions:', error)
      toast.error('Failed to load RBF transactions')
    } finally {
      setLoading(false)
    }
  }, [token, currentPage, appliedFilters, toast])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

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

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  function handlePageChange(page) {
    setCurrentPage(page)
    syncSearchParams(appliedFilters, page)
  }

  if (loading && transactions.length === 0) {
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
                <RefreshButton onClick={loadTransactions} loading={loading} />
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
              loading={loading}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </Card>

          <RbfTransactionTable
            transactions={transactions}
            loading={loading}
            pagination={pagination}
            handleCopy={handleCopy}
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
