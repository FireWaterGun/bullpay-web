'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getMyLedgerEntries } from '@/lib/api/userLedger'
import { listCoins } from '@/lib/api/coins'
import MyLedgerFilterPanel from '@/components/ledger/MyLedgerFilterPanel'
import MyLedgerTable from '@/components/ledger/MyLedgerTable'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

function getDateRange(preset) {
  const now = new Date()
  const fmt = (d) => d.toISOString().slice(0, 10)
  switch (preset) {
    case 'today': return { startDate: fmt(now), endDate: fmt(now) }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { startDate: fmt(y), endDate: fmt(y) }
    }
    case 'last7': {
      const d = new Date(now); d.setDate(d.getDate() - 6)
      return { startDate: fmt(d), endDate: fmt(now) }
    }
    case 'last30': {
      const d = new Date(now); d.setDate(d.getDate() - 29)
      return { startDate: fmt(d), endDate: fmt(now) }
    }
    case 'thisMonth': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      return { startDate: fmt(s), endDate: fmt(now) }
    }
    case 'lastMonth': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { startDate: fmt(s), endDate: fmt(e) }
    }
    default: return {}
  }
}

export default function MyLedgerList() {
  return <Suspense><MyLedgerListContent /></Suspense>
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
  const [coinNetworks, setCoinNetworks] = useState([])

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
    if (range.startDate) f.startDate = range.startDate
    if (range.endDate) f.endDate = range.endDate
    return f
  })

  useEffect(() => {
    loadEntries()
  }, [currentPage, appliedFilters])

  useEffect(() => {
    listCoins(token).then(setCoinNetworks).catch(() => {})
  }, [])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, v) })
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
      startDate: range.startDate || undefined,
      endDate: range.endDate || undefined,
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

  async function loadEntries() {
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
  }

  if (loading && entries.length === 0) {
    return <PageSpinner />
  }

  return (
    <>
      {/* Header + Filters */}
      <div className="card mb-6">
        <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center flex-wrap gap-3">
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
          entryCodeFilter={entryCodeFilter} setEntryCodeFilter={setEntryCodeFilter}
          stateFilter={stateFilter} setStateFilter={setStateFilter}
          coinNetworkIdFilter={coinNetworkIdFilter} setCoinNetworkIdFilter={setCoinNetworkIdFilter}
          datePresetFilter={datePresetFilter} setDatePresetFilter={setDatePresetFilter}
          txHashFilter={txHashFilter} setTxHashFilter={setTxHashFilter}
          coinNetworks={coinNetworks}
          loading={loading}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      </div>

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
