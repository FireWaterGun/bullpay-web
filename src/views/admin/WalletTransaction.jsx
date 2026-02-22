import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useToastContext } from '../../context/ToastContext'
import { getSystemWallet, getSystemWalletLedger } from '../../api/admin.ts'
import { copyToClipboard as copyText } from '../../utils/clipboard'
import LocaleDateRangePicker from '../../components/LocaleDateRangePicker'
import WalletInfoCard from './WalletInfoCard'
import WalletLedgerTable from './WalletLedgerTable'

export default function WalletTransaction() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
  const { walletId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const [loading, setLoading] = useState(false)
  const [walletLoading, setWalletLoading] = useState(true)
  const [entries, setEntries] = useState([])
  const [pagination, setPagination] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1)

  const initState = searchParams.get('state') || ''
  const initEntryType = searchParams.get('entryType') || ''
  const initEntryCode = searchParams.get('entryCode') || ''
  const initTxHash = searchParams.get('txHash') || ''
  const initStartDate = searchParams.get('startDate') || ''
  const initEndDate = searchParams.get('endDate') || ''

  const [stateFilter, setStateFilter] = useState(initState)
  const [entryTypeFilter, setEntryTypeFilter] = useState(initEntryType)
  const [entryCodeFilter, setEntryCodeFilter] = useState(initEntryCode)
  const [txHashFilter, setTxHashFilter] = useState(initTxHash)
  const [startDateFilter, setStartDateFilter] = useState(initStartDate)
  const [endDateFilter, setEndDateFilter] = useState(initEndDate)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initState) f.state = initState
    if (initEntryType) f.entryType = initEntryType
    if (initEntryCode) f.entryCode = initEntryCode
    if (initTxHash) f.txHash = initTxHash
    if (initStartDate) f.startDate = initStartDate
    if (initEndDate) f.endDate = initEndDate
    return f
  })

  useEffect(() => {
    loadWallet()
  }, [walletId])

  useEffect(() => {
    if (wallet) loadLedger()
  }, [currentPage, appliedFilters, wallet])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, v) })
    if (page > 1) params.set('page', page)
    setSearchParams(params, { replace: true })
  }

  function applyFilters() {
    const f = {
      state: stateFilter || undefined,
      entryType: entryTypeFilter || undefined,
      entryCode: entryCodeFilter || undefined,
      txHash: txHashFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStateFilter('')
    setEntryTypeFilter('')
    setEntryCodeFilter('')
    setTxHashFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    setSearchParams({}, { replace: true })
  }

  async function loadWallet() {
    try {
      setWalletLoading(true)
      const data = await getSystemWallet(token, parseInt(walletId))
      setWallet(data)
    } catch (error) {
      console.error('Failed to load wallet:', error)
      toast.error(t('admin.wallet.loadError', { defaultValue: 'Failed to load wallet details' }))
    } finally {
      setWalletLoading(false)
    }
  }

  async function loadLedger() {
    try {
      setLoading(true)
      const data = await getSystemWalletLedger(token, parseInt(walletId), {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setEntries(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load ledger:', error)
      toast.error(t('admin.ledger.loadError', { defaultValue: 'Failed to load transactions' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text, e) {
    if (e) e.stopPropagation()
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
  }

  if (walletLoading && !wallet) {
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

  const assets = wallet?.assets || []

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <button
            onClick={() => navigate('/admin/system-wallets')}
            className="btn btn-outline-secondary mb-3"
          >
            <i className="bx bx-arrow-back me-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>

          <WalletInfoCard
            wallet={wallet}
            assets={assets}
            t={t}
            loading={loading}
            onRefresh={loadLedger}
            onCopy={handleCopy}
          />

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bx bx-filter me-2"></i>
                {t('admin.ledger.filters', { defaultValue: 'Filters' })}
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.entryType', { defaultValue: 'Entry Type' })}</label>
                  <select className="form-select" value={entryTypeFilter} onChange={(e) => setEntryTypeFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.entryCode', { defaultValue: 'Entry Code' })}</label>
                  <select className="form-select" value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="WA">WA - Wallet Actual</option>
                    <option value="WF">WF - Wallet Fee</option>
                    <option value="WG">WG - Wallet Gas</option>
                    <option value="SP">SP - Settlement Payment</option>
                    <option value="SG">SG - Sweep Gas</option>
                    <option value="SC">SC - Sweep Cost</option>
                    <option value="XI">XI - Internal In</option>
                    <option value="XO">XO - Internal Out</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.state', { defaultValue: 'State' })}</label>
                  <select className="form-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="committed">Committed</option>
                    <option value="settled">Settled</option>
                    <option value="reversed">Reversed</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.txHash', { defaultValue: 'Tx Hash' })}</label>
                  <input type="text" className="form-control" placeholder="0x..." value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.dateRange', { defaultValue: 'Date Range' })}</label>
                  <LocaleDateRangePicker
                    startDate={startDateFilter}
                    endDate={endDateFilter}
                    onChangeStart={setStartDateFilter}
                    onChangeEnd={setEndDateFilter}
                    locale={locale}
                    placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
                    t={t}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary" onClick={applyFilters} disabled={loading}>
                  <i className="bx bx-filter-alt me-1"></i>
                  {t('filter.apply', { defaultValue: 'Apply Filters' })}
                </button>
                <button className="btn btn-outline-secondary" onClick={resetFilters} disabled={loading}>
                  <i className="bx bx-reset me-1"></i>
                  {t('filter.reset', { defaultValue: 'Reset' })}
                </button>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="card">
            <div className="card-body">
              <WalletLedgerTable entries={entries} loading={loading} t={t} />

              {pagination && pagination.total > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted small">
                    {t('invoices.showingEntries', {
                      start: pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0,
                      end: Math.min(pagination.page * pagination.limit, pagination.total),
                      total: pagination.total,
                      defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
                    })}
                  </div>
                  <div className="btn-group">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={!pagination.hasPrev || loading}
                      onClick={() => { setCurrentPage(currentPage - 1); syncSearchParams(appliedFilters, currentPage - 1) }}
                    >
                      <i className="bx bx-chevron-left"></i>
                      {t('actions.prev', { defaultValue: 'Previous' })}
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" disabled>
                      {pagination.page} / {pagination.totalPages}
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={!pagination.hasNext || loading}
                      onClick={() => { setCurrentPage(currentPage + 1); syncSearchParams(appliedFilters, currentPage + 1) }}
                    >
                      {t('actions.next', { defaultValue: 'Next' })}
                      <i className="bx bx-chevron-right"></i>
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
