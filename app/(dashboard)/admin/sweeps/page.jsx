'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import { getSweeps, forceSweep } from '@/lib/api/admin'
import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { listCoins } from '@/lib/api/coins'
import SweepTransactionFilters from '@/components/admin/SweepTransactionFilters'
import SweepTransactionTable from '@/components/admin/SweepTransactionTable'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

export default function SweepTransactions() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()
  const router = useRouter()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const initStatus = searchParams.get('status') || ''
  const initUserId = searchParams.get('userId') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initStartDate = searchParams.get('startDate') || ''
  const initEndDate = searchParams.get('endDate') || ''
  const initSortBy = searchParams.get('sortBy') || ''
  const initSortOrder = searchParams.get('sortOrder') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [sweeps, setSweeps] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [retryingId, setRetryingId] = useState(null)
  const [coinNetworks, setCoinNetworks] = useState([])

  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [userIdFilter, setUserIdFilter] = useState(initUserId)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [startDateFilter, setStartDateFilter] = useState(initStartDate)
  const [endDateFilter, setEndDateFilter] = useState(initEndDate)
  const [sortByFilter, setSortByFilter] = useState(initSortBy)
  const [sortOrderFilter, setSortOrderFilter] = useState(initSortOrder)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initUserId) f.userId = Number(initUserId)
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initStartDate) f.startDate = initStartDate
    if (initEndDate) f.endDate = initEndDate
    if (initSortBy) f.sortBy = initSortBy
    if (initSortOrder) f.sortOrder = initSortOrder
    return f
  })

  useEffect(() => {
    loadSweeps()
  }, [currentPage, appliedFilters])

  useEffect(() => {
    listCoins(token).then(setCoinNetworks).catch(() => {})
  }, [])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, v) })
    if (page > 1) params.set('page', page)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  function applyFilters() {
    const f = {
      status: statusFilter || undefined,
      userId: userIdFilter ? Number(userIdFilter) : undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setUserIdFilter('')
    setCoinNetworkIdFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setSortByFilter('')
    setSortOrderFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    window.history.replaceState(null, '', window.location.pathname)
  }

  async function loadSweeps() {
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
          hasNext: meta.nextPageUrl !== null || (meta.currentPage || meta.page || 1) < (meta.lastPage || meta.totalPages || 1)
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

  function statusBadgeClass(s) {
    const v = String(s || '').toUpperCase()
    if (v === 'PENDING') return 'badge bg-label-warning'
    if (v === 'PROCESSING' || v === 'APPROVED') return 'badge bg-label-info'
    if (v === 'COMPLETED' || v === 'SUCCESS') return 'badge bg-label-success'
    if (v === 'FAILED' || v === 'REJECTED' || v === 'ERROR') return 'badge bg-label-danger'
    if (v === 'CANCELLED' || v === 'CANCELED') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
  }

  function handlePageChange(page) {
    setCurrentPage(page)
    syncSearchParams(appliedFilters, page)
  }

  if (loading && sweeps.length === 0) {
    return <PageSpinner />
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-transfer me-2"></i>
                    {t('admin.sweep.transactions', { defaultValue: 'Sweep' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.sweep.transactionsDesc', { defaultValue: 'View all sweep transactions and their status' })}
                  </p>
                </div>
                <RefreshButton onClick={loadSweeps} loading={loading} />
              </div>
            </div>
            <SweepTransactionFilters
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              userIdFilter={userIdFilter} setUserIdFilter={setUserIdFilter}
              coinNetworkIdFilter={coinNetworkIdFilter} setCoinNetworkIdFilter={setCoinNetworkIdFilter}
              startDateFilter={startDateFilter} setStartDateFilter={setStartDateFilter}
              endDateFilter={endDateFilter} setEndDateFilter={setEndDateFilter}
              sortByFilter={sortByFilter} setSortByFilter={setSortByFilter}
              sortOrderFilter={sortOrderFilter} setSortOrderFilter={setSortOrderFilter}
              coinNetworks={coinNetworks}
              locale={locale}
              loading={loading}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </div>

          <SweepTransactionTable
            sweeps={sweeps}
            loading={loading}
            pagination={pagination}
            retryingId={retryingId}
            formatAmount={formatAmount}
            handleCopy={handleCopy}
            statusBadgeClass={statusBadgeClass}
            onNavigate={(id) => router.push(`/admin/sweeps/${id}`)}
            onRetry={handleRetry}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  )
}
