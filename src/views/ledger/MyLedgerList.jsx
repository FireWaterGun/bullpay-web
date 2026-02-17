import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getMyLedgerEntries } from '../../api/userLedger.ts'

function getCoinAssetCandidates(symbol) {
  const sym = String(symbol || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const aliases = {
    btc: ['bitcoin'], eth: ['ethereum'], doge: ['dogecoin'], sol: ['solana'],
    matic: ['polygon'], pol: ['polygon'], ada: ['cardano'], xmr: ['monero'],
    zec: ['zcash'], usdt: ['usdterc20', 'tether'],
  }
  const names = [sym, ...(aliases[sym] || [])]
  if (sym.startsWith('usdt') && !names.includes('usdt')) names.push('usdt')
  const exts = ['svg', 'png']
  const byAssets = names.flatMap((n) => exts.map((ext) => `/assets/img/coins/${n}.${ext}`))
  return Array.from(new Set([...byAssets, '/assets/img/coins/default.svg']))
}

function CoinImg({ symbol, networkSymbol, size = 24 }) {
  const [idx, setIdx] = useState(0)
  const [netIdx, setNetIdx] = useState(0)
  const candidates = useMemo(() => getCoinAssetCandidates(symbol), [symbol])
  const networkCandidates = useMemo(() => getCoinAssetCandidates(networkSymbol), [networkSymbol])
  const src = candidates[Math.min(idx, candidates.length - 1)]
  const netSrc = networkCandidates[Math.min(netIdx, networkCandidates.length - 1)]
  const badgeSize = 16

  return (
    <div className="position-relative me-2" style={{ width: size, height: size, flexShrink: 0 }}>
      <img src={src} alt={symbol} width={size} height={size} style={{ objectFit: 'cover' }}
        onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))} />
      {networkSymbol && networkSymbol !== symbol &&
       !(symbol === 'POL' && networkSymbol === 'MATIC') && (
        <div className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
          style={{ bottom: -2, right: -2, width: badgeSize, height: badgeSize, backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '2px' }}>
          <img src={netSrc} alt={networkSymbol} width={badgeSize - 4} height={badgeSize - 4}
            className="rounded-circle" style={{ objectFit: 'cover' }}
            onError={() => setNetIdx((i) => (i + 1 < networkCandidates.length ? i + 1 : i))} />
        </div>
      )}
    </div>
  )
}

const ENTRY_CODE_LABELS = {
  'DP': 'Deposit',
  'WA': 'Withdrawal Amount',
  'WF': 'Withdrawal Fee',
  'WR': 'Withdrawal Reversal',
  'FR': 'Fee Revenue',
  'XI': 'Internal Transfer In',
  'XO': 'Internal Transfer Out',
}

export default function MyLedgerList() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  function getDateRange(preset) {
    const now = new Date()
    const fmt = (d) => d.toISOString().slice(0, 10)
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
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

  const initType = searchParams.get('entryType') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initEntryCode = searchParams.get('entryCode') || ''
  const initState = searchParams.get('state') || ''
  const initDatePreset = searchParams.get('datePreset') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)

  // Filter states (draft — applied on "Apply")
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [entryCodeFilter, setEntryCodeFilter] = useState(initEntryCode)
  const [stateFilter, setStateFilter] = useState(initState)
  const [datePresetFilter, setDatePresetFilter] = useState(initDatePreset)

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initEntryCode) f.entryCode = initEntryCode
    if (initState) f.state = initState
    if (initDatePreset) {
      f.datePreset = initDatePreset
      const range = getDateRange(initDatePreset)
      if (range.startDate) f.startDate = range.startDate
      if (range.endDate) f.endDate = range.endDate
    }
    return f
  })

  useEffect(() => {
    loadEntries()
  }, [currentPage, appliedFilters])

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

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  function formatAmount(val) {
    if (!val && val !== 0) return '0'
    let str = String(val)
    if (str.includes('.')) str = str.replace(/0+$/, '').replace(/\.$/, '')
    return str || '0'
  }

  function formatUsd(val) {
    if (!val && val !== 0) return '$0.00'
    const num = parseFloat(val)
    if (Math.abs(num) < 0.01 && num !== 0) {
      return '$' + num.toFixed(8).replace(/0+$/, '').replace(/\.$/, '.00')
    }
    return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function stateBadge(state) {
    if (state === 'settled') return <span className="badge bg-label-success">{t('userLedger.settled', { defaultValue: 'Settled' })}</span>
    if (state === 'committed') return <span className="badge bg-label-warning">{t('userLedger.committed', { defaultValue: 'Committed' })}</span>
    if (state === 'reversed') return <span className="badge bg-label-danger">{t('userLedger.reversed', { defaultValue: 'Reversed' })}</span>
    return <span className="badge bg-label-secondary">{state || 'N/A'}</span>
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
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.entryCode', { defaultValue: 'Entry Code' })}</label>
                  <select className="form-select" value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="DP">DP - {t('userLedger.code.DP', { defaultValue: 'Deposit' })}</option>
                    <option value="WA">WA - {t('userLedger.code.WA', { defaultValue: 'Withdrawal Amount' })}</option>
                    <option value="WF">WF - {t('userLedger.code.WF', { defaultValue: 'Withdrawal Fee' })}</option>
                    <option value="WR">WR - {t('userLedger.code.WR', { defaultValue: 'Withdrawal Reversal' })}</option>
                    <option value="FR">FR - {t('userLedger.code.FR', { defaultValue: 'Fee Revenue' })}</option>
                    <option value="XI">XI - {t('userLedger.code.XI', { defaultValue: 'Internal Transfer In' })}</option>
                    <option value="XO">XO - {t('userLedger.code.XO', { defaultValue: 'Internal Transfer Out' })}</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.state', { defaultValue: 'State' })}</label>
                  <select className="form-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="committed">{t('filter.committed', { defaultValue: 'Committed' })}</option>
                    <option value="settled">{t('filter.settled', { defaultValue: 'Settled' })}</option>
                    <option value="reversed">{t('filter.reversed', { defaultValue: 'Reversed' })}</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.coinNetworkId', { defaultValue: 'Coin Network ID' })}</label>
                  <input type="number" className="form-control" placeholder={t('filter.coinNetworkId', { defaultValue: 'Coin Network ID' })} value={coinNetworkIdFilter} onChange={(e) => setCoinNetworkIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.dateRange', { defaultValue: 'Date Range' })}</label>
                  <select className="form-select" value={datePresetFilter} onChange={(e) => setDatePresetFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="today">{t('filter.today', { defaultValue: 'Today' })}</option>
                    <option value="yesterday">{t('filter.yesterday', { defaultValue: 'Yesterday' })}</option>
                    <option value="last7">{t('filter.last7days', { defaultValue: 'Last 7 Days' })}</option>
                    <option value="last30">{t('filter.last30days', { defaultValue: 'Last 30 Days' })}</option>
                    <option value="thisMonth">{t('filter.thisMonth', { defaultValue: 'This Month' })}</option>
                    <option value="lastMonth">{t('filter.lastMonth', { defaultValue: 'Last Month' })}</option>
                  </select>
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

          {/* Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="table table-hover" style={{ minWidth: '900px' }}>
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>ID</th>
                      <th>{t('userLedger.coin', { defaultValue: 'Coin' })}</th>
                      <th>{t('userLedger.code', { defaultValue: 'Code' })}</th>
                      <th>{t('userLedger.state', { defaultValue: 'State' })}</th>
                      <th className="text-end">{t('userLedger.amount', { defaultValue: 'Amount' })}</th>
                      <th className="text-end">USD</th>
                      <th>{t('userLedger.txHash', { defaultValue: 'Tx Hash' })}</th>
                      <th>{t('userLedger.createdAt', { defaultValue: 'Created' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-4">
                          {t('userLedger.noEntries', { defaultValue: 'No ledger entries found' })}
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => {
                        const isCredit = entry.entryType === 'credit'

                        return (
                          <tr key={entry.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/ledger/${entry.id}`)}>
                            <td>
                              <span className="fw-semibold text-primary">{entry.id}</span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div className="d-flex align-items-center">
                                <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={24} />
                                <div>
                                  <div className="fw-medium" style={{ lineHeight: 1.2 }}>{entry.coinSymbol || '-'}</div>
                                  {entry.networkName && (
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{entry.networkName}</small>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              {entry.entryCode ? (
                                <span className="fw-medium" title={ENTRY_CODE_LABELS[entry.entryCode] || entry.entryCode}>{entry.entryCode}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>{stateBadge(entry.state)}</td>
                            <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                              <span className="fw-medium">
                                {isCredit ? '+' : '-'}{formatAmount(entry.amount)}
                              </span>
                            </td>
                            <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                              <span className="text-muted">{formatUsd(entry.amountUsd)}</span>
                            </td>
                            <td>
                              {entry.txHash ? (
                                <div className="d-flex align-items-center">
                                  <span className="me-2">{entry.txHash}</span>
                                  {entry.explorerUrl && (
                                    <a href={`${entry.explorerUrl}/tx/${entry.txHash}`} target="_blank" rel="noopener noreferrer"
                                      className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                      onClick={(e) => e.stopPropagation()} title="View on explorer">
                                      <i className="bx bx-link-external" style={{ fontSize: '1.25rem' }}></i>
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <span style={{ whiteSpace: 'nowrap' }}>{formatDate(entry.createdAt)}</span>
                            </td>
                            <td>
                              <button className="btn btn-sm btn-icon btn-outline-primary"
                                onClick={(e) => { e.stopPropagation(); navigate(`/ledger/${entry.id}`) }}
                                title={t('actions.view', { defaultValue: 'View' })}>
                                <i className="bx bx-show"></i>
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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
                    <button className="btn btn-outline-secondary btn-sm"
                      disabled={!pagination.hasPrev || loading}
                      onClick={() => { setCurrentPage(currentPage - 1); syncSearchParams(appliedFilters, currentPage - 1) }}>
                      <i className="bx bx-chevron-left"></i>
                      {t('actions.prev', { defaultValue: 'Previous' })}
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" disabled>
                      {pagination.page} / {pagination.totalPages}
                    </button>
                    <button className="btn btn-outline-secondary btn-sm"
                      disabled={!pagination.hasNext || loading}
                      onClick={() => { setCurrentPage(currentPage + 1); syncSearchParams(appliedFilters, currentPage + 1) }}>
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
