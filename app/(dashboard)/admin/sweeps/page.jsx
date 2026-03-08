'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/app/providers'
import { getSweeps, forceSweep } from '@/lib/api/admin'
import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { useCoins } from '@/hooks/useCoins'
import SweepTransactionFilters from '@/components/admin/SweepTransactionFilters'
import SweepTransactionTable from '@/components/admin/SweepTransactionTable'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Card from '@/components/ui/Card'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function SweepTransactions() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()
  const router = useRouter()

  const locale = useLocale()

  const initStatus = searchParams.get('status') || ''
  const initUserId = searchParams.get('userId') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initFromAddress = searchParams.get('fromAddress') || ''
  const initStartDate = searchParams.get('startDate') || ''
  const initEndDate = searchParams.get('endDate') || ''
  const initSortBy = searchParams.get('sortBy') || ''
  const rawSortOrder = searchParams.get('sortOrder') || ''
  const initSortOrder = ['asc', 'desc'].includes(rawSortOrder) ? rawSortOrder : ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [sweeps, setSweeps] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [retryingId, setRetryingId] = useState(null)
  const { coins: coinNetworks } = useCoins()

  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [userIdFilter, setUserIdFilter] = useState(initUserId)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [fromAddressFilter, setFromAddressFilter] = useState(initFromAddress)
  const [startDateFilter, setStartDateFilter] = useState(initStartDate)
  const [endDateFilter, setEndDateFilter] = useState(initEndDate)
  const [sortBy, setSortBy] = useState(initSortBy)
  const [sortOrder, setSortOrder] = useState(initSortOrder)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initUserId) f.userId = Number(initUserId)
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
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

  const loadSweeps = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getSweeps(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setSweeps(data.sweeps || data.items || [])

      const meta = data.meta || data.pagination
      if (meta) {
        setPagination({
          page: meta.currentPage || meta.page || currentPage,
          limit: meta.perPage || meta.limit || 20,
          total: meta.total || 0,
          totalPages: meta.lastPage || meta.totalPages || 1,
          hasPrev: meta.previousPageUrl !== null || (meta.currentPage || meta.page || 1) > 1,
          hasNext:
            meta.nextPageUrl !== null || (meta.currentPage || meta.page || 1) < (meta.lastPage || meta.totalPages || 1),
        })
      } else {
        setPagination(null)
      }
    } catch (error) {
      logger.error('Failed to load sweep transactions:', error)
      toast.error(t('admin.sweep.loadError', { defaultValue: 'Failed to load sweep transactions' }))
    } finally {
      setLoading(false)
    }
  }, [token, currentPage, appliedFilters, toast, t])

  useEffect(() => {
    loadSweeps()
  }, [loadSweeps])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, v)
    })
    if (page > 1) params.set('page', page)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  function applyFilters() {
    const f = {
      status: statusFilter || undefined,
      userId: userIdFilter ? Number(userIdFilter) : undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
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
    setUserIdFilter('')
    setCoinNetworkIdFilter('')
    setFromAddressFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setSortBy('')
    setSortOrder('')
    setAppliedFilters({})
    setCurrentPage(1)
    window.history.replaceState(null, '', window.location.pathname)
  }

  async function handleRetry(sweepId) {
    try {
      setRetryingId(sweepId)
      await forceSweep(token, sweepId)
      toast.success(t('admin.sweep.retrySuccess', { defaultValue: 'Sweep retry initiated successfully' }))
      loadSweeps()
    } catch (error) {
      logger.error('Failed to retry sweep:', error)
      toast.error(t('admin.sweep.retryError', { defaultValue: 'Failed to retry sweep' }))
    } finally {
      setRetryingId(null)
    }
  }

  function formatAmount(amountRaw, decimals, coinSymbol, networkSymbol) {
    if (!amountRaw || !decimals) return '0'

    try {
      const chain = AmountNormalizer.detectChain(coinSymbol || '', networkSymbol || '')
      return AmountNormalizer.fromRaw(amountRaw.toString(), chain, decimals)
    } catch (error) {
      logger.error('Failed to format amount:', error)
      const amount = Number(amountRaw) / Math.pow(10, decimals)
      return amount.toString()
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  function handlePageChange(page) {
    setCurrentPage(page)
    syncSearchParams(appliedFilters, page)
  }

  if (loading && sweeps.length === 0) {
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
                    <i className="bx bx-transfer mr-2"></i>
                    {t('admin.sweep.transactions', { defaultValue: 'Sweeps' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.sweep.transactionsDesc', {
                      defaultValue: 'View all sweep transactions and their status',
                    })}
                  </p>
                </div>
                <RefreshButton onClick={loadSweeps} loading={loading} />
              </div>
            </div>
            <SweepTransactionFilters
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              userIdFilter={userIdFilter}
              setUserIdFilter={setUserIdFilter}
              fromAddressFilter={fromAddressFilter}
              setFromAddressFilter={setFromAddressFilter}
              coinNetworkIdFilter={coinNetworkIdFilter}
              setCoinNetworkIdFilter={setCoinNetworkIdFilter}
              startDateFilter={startDateFilter}
              setStartDateFilter={setStartDateFilter}
              endDateFilter={endDateFilter}
              setEndDateFilter={setEndDateFilter}
              coinNetworks={coinNetworks}
              locale={locale}
              loading={loading}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </Card>

          <SweepTransactionTable
            sweeps={sweeps}
            loading={loading}
            pagination={pagination}
            retryingId={retryingId}
            formatAmount={formatAmount}
            handleCopy={handleCopy}
            statusBadgeClass={(s) => getStatusBadgeClass(s, 'sweep')}
            onNavigate={(id) => router.push(`/admin/sweeps/${id}`)}
            onRetry={handleRetry}
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
