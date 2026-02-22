import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getPlatformLedgerEntries } from '../../api/admin.ts'
import LocaleDateRangePicker from '../../components/LocaleDateRangePicker'
import { formatUsd } from '../../utils/format'
import CoinImg from '../../components/CoinImg'
import { listCoins } from '../../api/coins.ts'

export default function PlatformLedgerList() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
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

  // Filter states
  const [accountTypeFilter, setAccountTypeFilter] = useState(initAccountType)
  const [entryTypeFilter, setEntryTypeFilter] = useState(initEntryType)
  const [entryCodeFilter, setEntryCodeFilter] = useState(initEntryCode)
  const [stateFilter, setStateFilter] = useState(initState)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [txHashFilter, setTxHashFilter] = useState(initTxHash)
  const [startDateFilter, setStartDateFilter] = useState(initStartDate)
  const [endDateFilter, setEndDateFilter] = useState(initEndDate)

  // Applied filters
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

  const entryCodeLabels = {
    'WF': 'Withdrawal Fee',
    'FR': 'Fee Refund',
    'SG': 'Sweep Gas Topup',
    'SC': 'Sweep Gas Cost',
    'WG': 'Withdrawal Gas',
    'XI': 'Internal Transfer In',
    'XO': 'Internal Transfer Out',
  }

  function accountTypeBadge(type) {
    if (type === 'revenue') return <span>Revenue</span>
    if (type === 'expense') return <span>Expense</span>
    return <span className="text-muted">{type || 'N/A'}</span>
  }

  function stateBadge(state) {
    if (state === 'settled') return <span>Settled</span>
    if (state === 'committed') return <span>Committed</span>
    if (state === 'reversed') return <span>Reversed</span>
    return <span className="text-muted">{state || 'N/A'}</span>
  }

  function formatAmount(val) {
    if (!val && val !== 0) return '0'
    let str = String(val)
    if (str.includes('.')) {
      str = str.replace(/0+$/, '').replace(/\.$/, '')
    }
    return str || '0'
  }


  function truncateHash(hash) {
    if (!hash) return ''
    if (hash.length <= 16) return hash
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
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
          {/* Header */}
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
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Account Type</label>
                  <select className="form-select" value={accountTypeFilter} onChange={(e) => setAccountTypeFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Entry Type</label>
                  <select className="form-select" value={entryTypeFilter} onChange={(e) => setEntryTypeFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Entry Code</label>
                  <select className="form-select" value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="WF">WF - Withdrawal Fee</option>
                    <option value="FR">FR - Fee Refund</option>
                    <option value="SG">SG - Sweep Gas Topup</option>
                    <option value="SC">SC - Sweep Gas Cost</option>
                    <option value="WG">WG - Withdrawal Gas</option>
                    <option value="XI">XI - Internal Transfer In</option>
                    <option value="XO">XO - Internal Transfer Out</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">State</label>
                  <select className="form-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="committed">Committed</option>
                    <option value="settled">Settled</option>
                    <option value="reversed">Reversed</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Coin / Network</label>
                  <div className="dropdown">
                    <button
                      className="form-select d-flex align-items-center justify-content-between"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{ textAlign: 'left' }}
                    >
                      {coinNetworkIdFilter ? (() => {
                        const cn = coinNetworks.find(c => String(c.id) === String(coinNetworkIdFilter))
                        if (!cn) return 'All'
                        const sym = (cn.coin?.symbol || '').toUpperCase()
                        const net = (cn.network?.symbol || '').toUpperCase()
                        return (
                          <span className="d-flex align-items-center gap-2">
                            <CoinImg symbol={sym} networkSymbol={net} size={22} />
                            <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{sym}</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{net}</span>
                          </span>
                        )
                      })() : <span className="text-muted">All</span>}
                    </button>
                    <ul className="dropdown-menu w-100" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      <li>
                        <button className="dropdown-item" onClick={() => setCoinNetworkIdFilter('')}>
                          <span className="text-muted">All</span>
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      {coinNetworks.map((cn) => {
                        const sym = (cn.coin?.symbol || '').toUpperCase()
                        const net = (cn.network?.symbol || '').toUpperCase()
                        return (
                          <li key={cn.id}>
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => setCoinNetworkIdFilter(String(cn.id))}>
                              <CoinImg symbol={sym} networkSymbol={net} size={28} />
                              <div>
                                <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{sym}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{net}</div>
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Tx Hash</label>
                  <input type="text" className="form-control" placeholder="Tx Hash" value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
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

          {/* Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="table table-hover">
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>ID</th>
                      <th>Account</th>
                      <th>Type</th>
                      <th>Coin</th>
                      <th>Code</th>
                      <th>State</th>
                      <th className="text-end">Amount</th>
                      <th className="text-end">USD</th>
                      <th>Tx Hash</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="text-center text-muted py-4">
                          {t('admin.platformLedger.noEntries', { defaultValue: 'No revenue & expense entries found' })}
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => {
                        const isCredit = entry.entryType === 'credit'

                        return (
                          <tr key={entry.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/platform-ledger/${entry.id}`)}>
                            <td>
                              <span className="fw-semibold text-primary">{entry.id}</span>
                            </td>
                            <td>
                              {accountTypeBadge(entry.accountType)}
                            </td>
                            <td>
                              <span className={`badge ${isCredit ? 'bg-label-success' : 'bg-label-danger'}`}>
                                <i className={`bx ${isCredit ? 'bx-plus-circle' : 'bx-minus-circle'} me-1`}></i>
                                {isCredit ? 'Credit' : 'Debit'}
                              </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div className="d-flex align-items-center">
                                <CoinImg
                                  symbol={entry.coinSymbol}
                                  networkSymbol={entry.networkSymbol}
                                  size={24}
                                  className="me-2"
                                />
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
                                <span className="fw-medium">{entry.entryCode}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {stateBadge(entry.state)}
                            </td>
                            <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                              <span className={`fw-medium ${entry.state === 'reversed' ? '' : (isCredit ? 'text-success' : 'text-danger')}`}>
                                {entry.state === 'reversed' ? '' : (isCredit ? '+' : '-')}{formatAmount(entry.amount)}
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
                                    <a
                                      href={`${entry.explorerUrl}/tx/${entry.txHash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                      onClick={(e) => e.stopPropagation()}
                                      title="View on explorer"
                                    >
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
                              <button
                                className="btn btn-sm btn-icon btn-outline-primary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/admin/platform-ledger/${entry.id}`)
                                }}
                                title={t('actions.view', { defaultValue: 'View' })}
                              >
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
