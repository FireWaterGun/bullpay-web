import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getPlatformLedgerEntries } from '../../api/admin.ts'
import { listCoins } from '../../api/coins.ts'
import PlatformLedgerFilterPanel from './PlatformLedgerFilterPanel'
import PlatformLedgerTable from './PlatformLedgerTable'

export default function PlatformLedgerList() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const initAccountType = searchParams.get('accountType') || ''
  const initEntryType = searchParams.get('entryType') || ''
  const initEntryCode = searchParams.get('entryCode') || ''
  const initState = searchParams.get('state') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initTxHash = searchParams.get('txHash') || ''
  const initStartDate = searchParams.get('startDate') || ''
  const initEndDate = searchParams.get('endDate') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [coinNetworks, setCoinNetworks] = useState([])

  const [accountTypeFilter, setAccountTypeFilter] = useState(initAccountType)
  const [entryTypeFilter, setEntryTypeFilter] = useState(initEntryType)
  const [entryCodeFilter, setEntryCodeFilter] = useState(initEntryCode)
  const [stateFilter, setStateFilter] = useState(initState)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [txHashFilter, setTxHashFilter] = useState(initTxHash)
  const [startDateFilter, setStartDateFilter] = useState(initStartDate)
  const [endDateFilter, setEndDateFilter] = useState(initEndDate)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initAccountType) f.accountType = initAccountType
    if (initEntryType) f.entryType = initEntryType
    if (initEntryCode) f.entryCode = initEntryCode
    if (initState) f.state = initState
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initTxHash) f.txHash = initTxHash
    if (initStartDate) f.startDate = initStartDate
    if (initEndDate) f.endDate = initEndDate
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
    const f = {
      accountType: accountTypeFilter || undefined,
      entryType: entryTypeFilter || undefined,
      entryCode: entryCodeFilter || undefined,
      state: stateFilter || undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      txHash: txHashFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setAccountTypeFilter('')
    setEntryTypeFilter('')
    setEntryCodeFilter('')
    setStateFilter('')
    setCoinNetworkIdFilter('')
    setTxHashFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    setSearchParams({}, { replace: true })
  }

  async function loadEntries() {
    try {
      setLoading(true)
      const data = await getPlatformLedgerEntries(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setEntries(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load platform ledger entries:', error)
      toast.error(t('admin.platformLedger.loadError', { defaultValue: 'Failed to load platform ledger entries' }))
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
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-book-open me-2"></i>
                    {t('admin.platformLedger.title', { defaultValue: 'Revenue & Expenses' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.platformLedger.description', { defaultValue: 'View all revenue and expense entries' })}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={loadEntries} disabled={loading}>
                  <i className="bx bx-refresh me-1"></i>
                  {t('actions.refresh', { defaultValue: 'Refresh' })}
                </button>
              </div>
            </div>
            <PlatformLedgerFilterPanel
              accountTypeFilter={accountTypeFilter} setAccountTypeFilter={setAccountTypeFilter}
              entryTypeFilter={entryTypeFilter} setEntryTypeFilter={setEntryTypeFilter}
              entryCodeFilter={entryCodeFilter} setEntryCodeFilter={setEntryCodeFilter}
              stateFilter={stateFilter} setStateFilter={setStateFilter}
              coinNetworkIdFilter={coinNetworkIdFilter} setCoinNetworkIdFilter={setCoinNetworkIdFilter}
              txHashFilter={txHashFilter} setTxHashFilter={setTxHashFilter}
              startDateFilter={startDateFilter} setStartDateFilter={setStartDateFilter}
              endDateFilter={endDateFilter} setEndDateFilter={setEndDateFilter}
              coinNetworks={coinNetworks}
              locale={locale}
              loading={loading}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </div>

          <PlatformLedgerTable
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
