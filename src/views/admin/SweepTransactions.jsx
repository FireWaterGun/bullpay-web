import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getSweeps, forceSweep } from '../../api/admin.ts'
import { AmountNormalizer } from '../../utils/amount_normalizer'
import LocaleDateRangePicker from '../../components/LocaleDateRangePicker'

// Coin asset helpers
function getCoinAssetCandidates(symbol, logoUrl) {
  const sym = String(symbol || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const aliases = {
    btc: ['bitcoin'],
    eth: ['ethereum'],
    doge: ['dogecoin'],
    sol: ['solana'],
    matic: ['polygon'],
    ada: ['cardano'],
    xmr: ['monero'],
    zec: ['zcash'],
    usdt: ['usdterc20', 'tether'],
  }
  const names = [sym, ...(aliases[sym] || [])]
  if (sym.startsWith('usdt') && !names.includes('usdt')) names.push('usdt')
  const exts = ['svg', 'png']
  const byAssets = names.flatMap((n) =>
    exts.map((ext) => `/assets/img/coins/${n}.${ext}`)
  )
  const candidates = [
    ...byAssets,
    ...(logoUrl ? [logoUrl] : []),
    '/assets/img/coins/default.svg',
  ]
  return Array.from(new Set(candidates))
}

function CoinImg({ coin, symbol, networkSymbol, size = 32 }) {
  const [idx, setIdx] = useState(0)
  const [netIdx, setNetIdx] = useState(0)
  const candidates = useMemo(
    () => getCoinAssetCandidates(symbol, coin?.logoUrl),
    [coin?.logoUrl, symbol]
  )
  const networkCandidates = useMemo(
    () => getCoinAssetCandidates(networkSymbol, null),
    [networkSymbol]
  )
  const src = candidates[Math.min(idx, candidates.length - 1)]
  const netSrc = networkCandidates[Math.min(netIdx, networkCandidates.length - 1)]
  const badgeSize = 18
  
  return (
    <div className="position-relative me-3" style={{ width: size, height: size }}>
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        style={{ objectFit: 'cover' }}
        onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))}
      />
      {networkSymbol && networkSymbol !== symbol && 
       !(symbol === 'POL' && networkSymbol === 'MATIC') && (
        <div 
          className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
          style={{
            bottom: -2,
            right: -2,
            width: badgeSize,
            height: badgeSize,
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            padding: '2px'
          }}
        >
          <img
            src={netSrc}
            alt={networkSymbol}
            width={badgeSize - 4}
            height={badgeSize - 4}
            className="rounded-circle"
            style={{ objectFit: 'cover' }}
            onError={() => setNetIdx((i) => (i + 1 < networkCandidates.length ? i + 1 : i))}
          />
        </div>
      )}
    </div>
  )
}

export default function SweepTransactions() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

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

  // Filter states (draft — applied on "Apply")
  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [userIdFilter, setUserIdFilter] = useState(initUserId)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [startDateFilter, setStartDateFilter] = useState(initStartDate)
  const [endDateFilter, setEndDateFilter] = useState(initEndDate)
  const [sortByFilter, setSortByFilter] = useState(initSortBy)
  const [sortOrderFilter, setSortOrderFilter] = useState(initSortOrder)

  // Applied filters (sent to API)
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

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, v) })
    if (page > 1) params.set('page', page)
    setSearchParams(params, { replace: true })
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
    setSearchParams({}, { replace: true })
  }

  async function loadSweeps() {
    try {
      setLoading(true)
      const data = await getSweeps(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      // Support new API structure with data.sweeps and data.meta
      setSweeps(data.sweeps || data.items || [])
      
      // Map new meta structure to old pagination format
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
      console.error('Failed to load sweep transactions:', error)
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
      console.error('Failed to retry sweep:', error)
      toast.error(t('admin.sweep.retryError', { defaultValue: 'Failed to retry sweep' }))
    } finally {
      setRetryingId(null)
    }
  }

  function formatAmount(amountRaw, decimals, coinSymbol, networkSymbol) {
    if (!amountRaw || !decimals) return '0'
    
    try {
      // ใช้ AmountNormalizer.detectChain() แทนการ hardcode chainMap
      const chain = AmountNormalizer.detectChain(coinSymbol || '', networkSymbol || '')
      return AmountNormalizer.fromRaw(amountRaw.toString(), chain, decimals)
    } catch (error) {
      console.error('Failed to format amount:', error)
      // Fallback to simple calculation
      const amount = Number(amountRaw) / Math.pow(10, decimals)
      return amount.toString()
    }
  }

  function formatAddress(address) {
    if (!address) return 'N/A'
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
    }).catch(() => {
      toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
    })
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

  function statusBadgeClass(s) {
    const v = String(s || '').toUpperCase()
    if (v === 'PENDING') return 'badge bg-label-warning'
    if (v === 'PROCESSING' || v === 'APPROVED') return 'badge bg-label-info'
    if (v === 'COMPLETED' || v === 'SUCCESS') return 'badge bg-label-success'
    if (v === 'FAILED' || v === 'REJECTED' || v === 'ERROR') return 'badge bg-label-danger'
    if (v === 'CANCELLED' || v === 'CANCELED') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
  }

  if (loading && sweeps.length === 0) {
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
                    <i className="bx bx-transfer me-2"></i>
                    {t('admin.sweep.transactions', { defaultValue: 'Sweep' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.sweep.transactionsDesc', { defaultValue: 'View all sweep transactions and their status' })}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={loadSweeps} disabled={loading}>
                  <i className="bx bx-refresh me-1"></i>
                  {t('actions.refresh', { defaultValue: 'Refresh' })}
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.status', { defaultValue: 'Status' })}</label>
                  <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    <option value="pending">{t('status.pending', { defaultValue: 'Pending' })}</option>
                    <option value="processing">{t('status.processing', { defaultValue: 'Processing' })}</option>
                    <option value="completed">{t('status.completed', { defaultValue: 'Completed' })}</option>
                    <option value="failed">{t('status.failed', { defaultValue: 'Failed' })}</option>
                    <option value="cancelled">{t('status.cancelled', { defaultValue: 'Cancelled' })}</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.userId', { defaultValue: 'User ID' })}</label>
                  <input type="number" className="form-control" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.coinNetworkId', { defaultValue: 'Coin Network ID' })}</label>
                  <input type="number" className="form-control" placeholder={t('filter.coinNetworkId', { defaultValue: 'Coin Network ID' })} value={coinNetworkIdFilter} onChange={(e) => setCoinNetworkIdFilter(e.target.value)} />
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
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.sortBy', { defaultValue: 'Sort By' })}</label>
                  <select className="form-select" value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="created_at">{t('filter.createdAt', { defaultValue: 'Created At' })}</option>
                    <option value="amount">{t('filter.amount', { defaultValue: 'Amount' })}</option>
                    <option value="completed_at">{t('filter.completedAt', { defaultValue: 'Completed At' })}</option>
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

          {/* Transactions Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="table table-hover" style={{ minWidth: '1200px' }}>
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>ID</th>
                      <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
                      <th>{t('admin.chain', { defaultValue: 'Chain' })}</th>
                      <th>{t('admin.sweep.coin', { defaultValue: 'Coin' })}</th>
                      <th className="text-end">{t('admin.sweep.amount', { defaultValue: 'Amount' })}</th>
                      <th className="text-end">{t('admin.sweep.actualAmount', { defaultValue: 'Actual Amount' })}</th>
                      <th className="text-end">{t('table.usd', { defaultValue: 'USD' })}</th>
                      <th className="text-center">{t('admin.sweep.status', { defaultValue: 'Status' })}</th>
                      <th>{t('admin.sweep.txHash', { defaultValue: 'Tx Hash' })}</th>
                      <th>{t('admin.sweep.from', { defaultValue: 'From Address' })}</th>
                      <th>{t('admin.sweep.to', { defaultValue: 'To Address' })}</th>
                      <th>{t('admin.sweep.createdAt', { defaultValue: 'Created Date' })}</th>
                      <th>{t('admin.sweep.completedAt', { defaultValue: 'Completed Date' })}</th>
                      <th className="text-center">{t('admin.sweep.actions', { defaultValue: 'Actions' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sweeps.length === 0 ? (
                      <tr>
                        <td colSpan="14" className="text-center text-muted py-4">
                          {t('admin.sweep.noTransactions', { defaultValue: 'No sweep transactions found' })}
                        </td>
                      </tr>
                    ) : (
                      sweeps.map((sweep) => (
                        <tr key={sweep.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/sweeps/${sweep.id}`)}>
                          <td>
                            <span className="fw-semibold text-primary">{sweep.id}</span>
                          </td>
                          <td className="text-center">
                            <span className="fw-medium">{sweep.userId || sweep.user?.id || '-'}</span>
                          </td>
                          <td>
                            <span className="text-muted">
                              {(sweep.coinNetwork?.network?.symbol || '').toUpperCase() || 'N/A'}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div className="d-flex align-items-center">
                              <CoinImg
                                symbol={(sweep.coinNetwork?.coin?.symbol || '').toUpperCase()}
                                networkSymbol={(sweep.coinNetwork?.network?.symbol || '').toUpperCase()}
                                size={24}
                              />
                              <div>
                                <div className="fw-medium" style={{ lineHeight: 1.2 }}>{(sweep.coinNetwork?.coin?.symbol || '-').toUpperCase()}</div>
                                {sweep.coinNetwork?.network?.name && (
                                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>{sweep.coinNetwork.network.name}</small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-end text-nowrap">
                            <span className="fw-medium">
                              {formatAmount(
                                sweep.amountRaw, 
                                sweep.decimals, 
                                sweep.coinNetwork?.coin?.symbol,
                                sweep.coinNetwork?.network?.symbol
                              )}{' '}
                              <span className="text-muted">{sweep.coinNetwork?.coin?.symbol || ''}</span>
                            </span>
                          </td>
                          <td className="text-end text-nowrap">
                            <span>
                              {sweep.actualAmountRaw ? formatAmount(
                                sweep.actualAmountRaw, 
                                sweep.decimals, 
                                sweep.coinNetwork?.coin?.symbol,
                                sweep.coinNetwork?.network?.symbol
                              ) : '-'}{' '}
                              {sweep.actualAmountRaw && <span className="text-muted">{sweep.coinNetwork?.coin?.symbol || ''}</span>}
                            </span>
                          </td>
                          <td className="text-end text-nowrap">
                            {sweep.amountUsd ? (
                              <span className="fw-medium">${Number(sweep.amountUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-nowrap text-center"><span className={statusBadgeClass(sweep.status)}>{String(sweep.status || '').toUpperCase()}</span></td>
                          <td>
                            {sweep.txHash ? (
                              <div className="d-flex align-items-center">
                                <span className="me-2">
                                  {sweep.txHash}
                                </span>
                                <a 
                                  href={`${sweep.coinNetwork?.network?.explorerUrl}/tx/${sweep.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                  title="View on explorer"
                                >
                                  <i className="bx bx-link-external" style={{ fontSize: '1.25rem' }}></i>
                                </a>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">
                                {sweep.fromAddress || 'N/A'}
                              </span>
                              {sweep.fromAddress && (
                                <button
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                  onClick={() => copyToClipboard(sweep.fromAddress)}
                                  title="Copy address"
                                >
                                  <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">
                                {sweep.toAddress || 'N/A'}
                              </span>
                              {sweep.toAddress && (
                                <button
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                  onClick={() => copyToClipboard(sweep.toAddress)}
                                  title="Copy address"
                                >
                                  <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(sweep.createdAt)}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>
                              {sweep.completedAt ? formatDate(sweep.completedAt) : <span className="text-muted">-</span>}
                            </span>
                          </td>
                          <td className="text-center">
                            {['failed', 'error'].includes(String(sweep.status || '').toLowerCase()) ? (
                              <button
                                className="btn btn-sm btn-outline-warning"
                                disabled={retryingId === sweep.id}
                                onClick={(e) => { e.stopPropagation(); handleRetry(sweep.id) }}
                                title="Retry sweep"
                              >
                                {retryingId === sweep.id ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <><i className="bx bx-refresh me-1"></i>Retry</>
                                )}
                              </button>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
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
