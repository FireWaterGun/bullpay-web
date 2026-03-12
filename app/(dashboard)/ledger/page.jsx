'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getMyLedgerEntries } from '@/lib/api/userLedger'
import { useCoins } from '@/hooks/useCoins'
import { getDateRange } from '@/lib/utils/dateRange'
import MyLedgerFilterPanel from '@/components/ledger/MyLedgerFilterPanel'
import MyLedgerTable from '@/components/ledger/MyLedgerTable'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Card from '@/components/ui/Card'

export default function MyLedgerList() {
  return (
    <Suspense>
      <MyLedgerListContent />
    </Suspense>
  )
}

function MyLedgerListContent() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initEntryCode = searchParams.get('entryCode') || ''
  const initState = searchParams.get('state') || ''
  const initTxHash = searchParams.get('txHash') || ''
  const initDatePreset = searchParams.get('datePreset') || 'last7'
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const { coins: coinNetworks } = useCoins()

  // Filter states (draft — applied on "Apply")
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [entryCodeFilter, setEntryCodeFilter] = useState(initEntryCode)
  const [stateFilter, setStateFilter] = useState(initState)
  const [txHashFilter, setTxHashFilter] = useState(initTxHash)
  const [datePresetFilter, setDatePresetFilter] = useState(initDatePreset)

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initEntryCode) f.entryCode = initEntryCode
    if (initState) f.state = initState
    if (initTxHash) f.txHash = initTxHash
    f.datePreset = initDatePreset
    const range = getDateRange(initDatePreset)
    if (range.from) f.startDate = range.from
    if (range.to) f.endDate = range.to
    return f
  })

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getMyLedgerEntries(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setEntries(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load ledger entries:', error)
      toast.error(t('userLedger.loadError', { defaultValue: 'Failed to load ledger entries' }))
    } finally {
      setLoading(false)
    }
  }, [token, currentPage, appliedFilters, toast, t])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, v)
    })
    if (page > 1) params.set('page', page)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  function applyFilters() {
    const range = getDateRange(datePresetFilter)
    const f = {
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      entryCode: entryCodeFilter || undefined,
      state: stateFilter || undefined,
      txHash: txHashFilter || undefined,
      datePreset: datePresetFilter || undefined,
      startDate: range.from || undefined,
      endDate: range.to || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setCoinNetworkIdFilter('')
    setEntryCodeFilter('')
    setStateFilter('')
    setTxHashFilter('')
    setDatePresetFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    router.replace('?', { scroll: false })
  }

  if (loading && entries.length === 0) {
    return <PageSpinner />
  }

  return (
    <>
      {/* Header + Filters */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h4 className="font-semibold text-surface-900 mb-1">
              <i className="bx bx-book-content mr-2 text-primary-500"></i>
              {t('userLedger.title', { defaultValue: 'My Ledger' })}
            </h4>
            <p className="text-surface-500 text-sm mb-0">
              {t('userLedger.description', { defaultValue: 'View your ledger entries and transaction history' })}
            </p>
          </div>
          <RefreshButton onClick={loadEntries} loading={loading} />
        </div>
        <MyLedgerFilterPanel
          entryCodeFilter={entryCodeFilter}
          setEntryCodeFilter={setEntryCodeFilter}
          stateFilter={stateFilter}
          setStateFilter={setStateFilter}
          coinNetworkIdFilter={coinNetworkIdFilter}
          setCoinNetworkIdFilter={setCoinNetworkIdFilter}
          datePresetFilter={datePresetFilter}
          setDatePresetFilter={setDatePresetFilter}
          txHashFilter={txHashFilter}
          setTxHashFilter={setTxHashFilter}
          coinNetworks={coinNetworks}
          loading={loading}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      </Card>

      {/* Table */}
      <MyLedgerTable
        entries={entries}
        pagination={pagination}
        loading={loading}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        syncSearchParams={syncSearchParams}
        appliedFilters={appliedFilters}
      />
    </>
  )
}
