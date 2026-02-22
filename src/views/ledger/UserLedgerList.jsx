import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getUserLedgerEntries } from '../../api/admin.ts'
import LocaleDateRangePicker from '../../components/LocaleDateRangePicker'
import { formatUsd } from '../../utils/format'
import CoinImg from '../../components/CoinImg'
import { listCoins } from '../../api/coins.ts'

export default function UserLedgerList() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const initType = searchParams.get('type') || ''
  const initUserId = searchParams.get('userId') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initEntryCode = searchParams.get('entryCode') || ''
  const initState = searchParams.get('state') || ''
  const initStartDate = searchParams.get('startDate') || ''
  const initEndDate = searchParams.get('endDate') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [coinNetworks, setCoinNetworks] = useState([])

  // Filter states (draft — applied on "Apply")
  const [typeFilter, setTypeFilter] = useState(initType)
  const [userIdFilter, setUserIdFilter] = useState(initUserId)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [entryCodeFilter, setEntryCodeFilter] = useState(initEntryCode)
  const [stateFilter, setStateFilter] = useState(initState)
  const [startDateFilter, setStartDateFilter] = useState(initStartDate)
  const [endDateFilter, setEndDateFilter] = useState(initEndDate)

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initType) f.type = initType
    if (initUserId) f.userId = Number(initUserId)
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initEntryCode) f.entryCode = initEntryCode
    if (initState) f.state = initState
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
      type: typeFilter || undefined,
      userId: userIdFilter ? Number(userIdFilter) : undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      entryCode: entryCodeFilter || undefined,
      state: stateFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setTypeFilter('')
    setUserIdFilter('')
    setCoinNetworkIdFilter('')
    setEntryCodeFilter('')
    setStateFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    setSearchParams({}, { replace: true })
  }

  async function loadEntries() {
    try {
      setLoading(true)
      const data = await getUserLedgerEntries(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setEntries(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load user ledger entries:', error)
      toast.error(t('admin.ledger.loadError', { defaultValue: 'Failed to load ledger entries' }))
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

  function stateBadge(state) {
    if (state === 'settled') return <span>Settled</span>
    if (state === 'committed') return <span>Committed</span>
    if (state === 'pending') return <span>Pending</span>
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
                    <i className="bx bx-user me-2"></i>
                    {t('admin.ledger.userLedger', { defaultValue: 'User Ledger' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.ledger.userLedgerDesc', { defaultValue: 'View all user ledger entries' })}
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
                  <label className="form-label">{t('filter.entryType', { defaultValue: 'Entry Type' })}</label>
                  <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="credit">{t('filter.credit', { defaultValue: 'Credit' })}</option>
                    <option value="debit">{t('filter.debit', { defaultValue: 'Debit' })}</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.entryCode', { defaultValue: 'Entry Code' })}</label>
                  <select className="form-select" value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="DP">DP - Deposit</option>
                    <option value="WA">WA - Wallet Actual</option>
                    <option value="WF">WF - Wallet Fee</option>
                    <option value="WR">WR - Wallet Refund</option>
                    <option value="FR">FR - Fee Refund</option>
                    <option value="XI">XI - Internal In</option>
                    <option value="XO">XO - Internal Out</option>
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
                  <label className="form-label">{t('filter.userId', { defaultValue: 'User ID' })}</label>
                  <input type="number" className="form-control" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</label>
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
                <table className="table table-hover" style={{ minWidth: '1200px' }}>
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>ID</th>
                      <th>User ID</th>
                      <th>{t('admin.ledger.type', { defaultValue: 'Type' })}</th>
                      <th>{t('admin.ledger.coin', { defaultValue: 'Coin' })}</th>
                      <th>Code</th>
                      <th>{t('admin.ledger.state', { defaultValue: 'State' })}</th>
                      <th className="text-end">{t('admin.ledger.amount', { defaultValue: 'Amount' })}</th>
                      <th className="text-end">USD</th>
                      <th>Tx Hash</th>
                      <th>{t('admin.ledger.createdAt', { defaultValue: 'Created' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="text-center text-muted py-4">
                          {t('admin.ledger.noEntries', { defaultValue: 'No ledger entries found' })}
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => {
                        const isCredit = entry.entryType === 'credit'

                        return (
                          <tr key={entry.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/user-ledger/${entry.id}`)}>
                            <td>
                              <span className="fw-semibold text-primary">{entry.id}</span>
                            </td>
                            <td>
                              <span className="badge bg-label-primary">#{entry.userId}</span>
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
                                  navigate(`/admin/user-ledger/${entry.id}`)
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
