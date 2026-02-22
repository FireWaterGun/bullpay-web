import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getMyLedgerEntries } from '../../api/userLedger.ts'
import { listCoins } from '../../api/coins.ts'
import MyLedgerFilterPanel from './MyLedgerFilterPanel'
import MyLedgerTable from './MyLedgerTable'

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
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [searchParams, setSearchParams] = useSearchParams()

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
    setSearchParams(params, { replace: true })
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
    setSearchParams({}, { replace: true })
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
      console.error('Failed to load ledger entries:', error)
      toast.error(t('userLedger.loadError', { defaultValue: 'Failed to load ledger entries' }))
    } finally {
      setLoading(false)
    }
  }

  if (loading && entries.length === 0) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Header + Filters */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-book-content me-2"></i>
                    {t('userLedger.title', { defaultValue: 'My Ledger' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('userLedger.description', { defaultValue: 'View your ledger entries and transaction history' })}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={loadEntries} disabled={loading}>
                  <i className="bx bx-refresh me-1"></i>
                  {t('actions.refresh', { defaultValue: 'Refresh' })}
                </button>
              </div>
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
        </div>
      </div>
    </div>
  )
}
