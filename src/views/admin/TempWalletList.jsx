import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getTempWallets } from '../../api/admin.ts'
import { listCoins } from '../../api/coins.ts'
import { formatDate } from '../../utils/format'
import { copyToClipboard as copyText } from '../../utils/clipboard'
import CoinImg from '../../components/CoinImg'

const WALLET_STATUS_OPTIONS = ['active', 'used', 'expired', 'pooled', 'assigned', 'sweeped', 'disabled']
const SORT_BY_OPTIONS = [
  { value: 'createdAt', label: 'Created At' },
  { value: 'lastAssignedAt', label: 'Last Assigned' },
  { value: 'lastSweepAt', label: 'Last Sweep' },
  { value: 'reuseCount', label: 'Reuse Count' },
]

function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'active' || v === 'pooled') return 'badge bg-label-success'
  if (v === 'assigned') return 'badge bg-label-info'
  if (v === 'used' || v === 'sweeped') return 'badge bg-label-warning'
  if (v === 'expired' || v === 'disabled') return 'badge bg-label-danger'
  return 'badge bg-label-secondary'
}

export default function TempWalletList() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initStatus = searchParams.get('status') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initAddress = searchParams.get('address') || ''
  const initSortBy = searchParams.get('sortBy') || ''
  const initSortOrder = searchParams.get('sortOrder') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [wallets, setWallets] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [coinNetworks, setCoinNetworks] = useState([])

  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [addressFilter, setAddressFilter] = useState(initAddress)
  const [sortByFilter, setSortByFilter] = useState(initSortBy)
  const [sortOrderFilter, setSortOrderFilter] = useState(initSortOrder)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initAddress) f.address = initAddress
    if (initSortBy) f.sortBy = initSortBy
    if (initSortOrder) f.sortOrder = initSortOrder
    return f
  })

  useEffect(() => { loadWallets() }, [currentPage, appliedFilters])

  useEffect(() => {
    listCoins(token).then(setCoinNetworks).catch(() => {})
  }, [])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)) })
    if (page > 1) params.set('page', page)
    setSearchParams(params, { replace: true })
  }

  function applyFilters() {
    const f = {
      status: statusFilter || undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      address: addressFilter || undefined,
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setCoinNetworkIdFilter('')
    setAddressFilter('')
    setSortByFilter('')
    setSortOrderFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    syncSearchParams({}, 1)
  }

  async function loadWallets() {
    if (!token) return
    try {
      setLoading(true)
      const data = await getTempWallets(token, { page: currentPage, limit: 20, ...appliedFilters })
      setWallets(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load temp wallets:', error)
      toast.error('Failed to load temp wallets')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (loading && wallets.length === 0) {
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
                    <i className="bx bx-wallet me-2"></i>
                    {t('admin.tempWallets.title', { defaultValue: 'Temp Wallets' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.tempWallets.description', { defaultValue: 'Monitor temporary payment wallets (read-only)' })}
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary" onClick={() => navigate('/admin/temp-wallet-histories')}>
                    <i className="bx bx-history me-1"></i>
                    {t('admin.tempWallets.usageHistories', { defaultValue: 'Usage Histories' })}
                  </button>
                  <button className="btn btn-primary" onClick={loadWallets} disabled={loading}>
                    <i className="bx bx-refresh me-1"></i>
                    {t('actions.refresh', { defaultValue: 'Refresh' })}
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.status', { defaultValue: 'Status' })}</label>
                  <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    {WALLET_STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
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
                  <label className="form-label">{t('filter.address', { defaultValue: 'Address' })}</label>
                  <input type="text" className="form-control" placeholder="0x..." value={addressFilter} onChange={(e) => setAddressFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.sortBy', { defaultValue: 'Sort By' })}</label>
                  <select className="form-select" value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    {SORT_BY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</label>
                  <select className="form-select" value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="asc">{t('filter.ascending', { defaultValue: 'Ascending' })}</option>
                    <option value="desc">{t('filter.descending', { defaultValue: 'Descending' })}</option>
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
                <table className="table table-hover">
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>{t('table.id', { defaultValue: 'ID' })}</th>
                      <th className="text-center">{t('table.invoiceId', { defaultValue: 'Invoice' })}</th>
                      <th className="text-center">{t('table.userId', { defaultValue: 'User' })}</th>
                      <th className="text-center">{t('table.coinNetworkId', { defaultValue: 'CN ID' })}</th>
                      <th>{t('table.address', { defaultValue: 'Address' })}</th>
                      <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                      <th className="text-center">{t('admin.tempWallets.reuseCount', { defaultValue: 'Reuse' })}</th>
                      <th>{t('admin.tempWallets.lastAssigned', { defaultValue: 'Last Assigned' })}</th>
                      <th>{t('table.expires', { defaultValue: 'Expires' })}</th>
                      <th>{t('table.created', { defaultValue: 'Created' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="text-center text-muted py-4">
                          {t('admin.tempWallets.noWallets', { defaultValue: 'No temp wallets found' })}
                        </td>
                      </tr>
                    ) : (
                      wallets.map((w) => (
                        <tr key={w.id}>
                          <td>
                            <span className="fw-semibold text-primary">{w.id}</span>
                          </td>
                          <td className="text-center">
                            {w.invoiceId ? (
                              <a
                                href="#"
                                className="text-primary fw-medium"
                                onClick={(e) => { e.preventDefault(); navigate(`/admin/invoices/${w.invoiceId}`) }}
                              >
                                {w.invoiceId}
                              </a>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-center">
                            <span className="fw-medium">{w.userId || '-'}</span>
                          </td>
                          <td className="text-center">
                            <span className="fw-medium">{w.coinNetworkId || '-'}</span>
                          </td>
                          <td>
                            {w.address ? (
                              <div className="d-flex align-items-center">
                                <span className="me-2" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                  {w.address}
                                </span>
                                <button
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                  onClick={() => handleCopy(w.address)}
                                  title="Copy address"
                                >
                                  <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-nowrap text-center">
                            <span className={statusBadgeClass(w.status)}>
                              {String(w.status || '').toUpperCase()}
                            </span>
                            {w.isExpired && (
                              <span className="badge bg-label-danger ms-1" style={{ fontSize: '0.6rem' }}>EXPIRED</span>
                            )}
                          </td>
                          <td className="text-center">
                            <span className="fw-medium">{w.reuseCount ?? 0}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(w.lastAssignedAt)}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(w.expiresAt)}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(w.createdAt)}</span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-icon btn-text-secondary"
                              onClick={() => navigate(`/admin/temp-wallets/${w.id}`)}
                              title="View detail"
                            >
                              <i className="bx bx-show" style={{ fontSize: '1.25rem' }}></i>
                            </button>
                          </td>
                        </tr>
                      ))
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
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled
                    >
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
