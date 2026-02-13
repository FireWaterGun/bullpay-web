import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getGasTopups } from '../../api/admin.ts'
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
    pol: ['polygon'],
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

function CoinImg({ symbol, networkSymbol, size = 28 }) {
  const [idx, setIdx] = useState(0)
  const [netIdx, setNetIdx] = useState(0)
  const candidates = useMemo(
    () => getCoinAssetCandidates(symbol, null),
    [symbol]
  )
  const networkCandidates = useMemo(
    () => getCoinAssetCandidates(networkSymbol, null),
    [networkSymbol]
  )
  const src = candidates[Math.min(idx, candidates.length - 1)]
  const netSrc = networkCandidates[Math.min(netIdx, networkCandidates.length - 1)]
  const badgeSize = 16

  return (
    <div className="position-relative me-2" style={{ width: size, height: size, flexShrink: 0 }}>
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

export default function GasTopups() {
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
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initSweepId = searchParams.get('sweepId') || ''
  const initFromAddress = searchParams.get('fromAddress') || ''
  const initDateFrom = searchParams.get('dateFrom') || ''
  const initDateTo = searchParams.get('dateTo') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [topups, setTopups] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)

  // Filter states
  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [sweepIdFilter, setSweepIdFilter] = useState(initSweepId)
  const [fromAddressFilter, setFromAddressFilter] = useState(initFromAddress)
  const [dateFromFilter, setDateFromFilter] = useState(initDateFrom)
  const [dateToFilter, setDateToFilter] = useState(initDateTo)

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initSweepId) f.sweepId = Number(initSweepId)
    if (initFromAddress) f.fromAddress = initFromAddress
    if (initDateFrom) f.dateFrom = initDateFrom
    if (initDateTo) f.dateTo = initDateTo
    return f
  })

  useEffect(() => {
    loadTopups()
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
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      sweepId: sweepIdFilter ? Number(sweepIdFilter) : undefined,
      fromAddress: fromAddressFilter || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setCoinNetworkIdFilter('')
    setSweepIdFilter('')
    setFromAddressFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    setSearchParams({}, { replace: true })
  }

  async function loadTopups() {
    try {
      setLoading(true)
      const data = await getGasTopups(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setTopups(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load gas topups:', error)
      toast.error(t('gasTopup.loadError', { defaultValue: 'Failed to load gas topups' }))
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(amountRaw, decimals = 18) {
    if (!amountRaw) return '0'
    try {
      const value = AmountNormalizer.fromRawSimple(amountRaw.toString(), decimals)
      const num = Number(value)
      if (!Number.isFinite(num)) return value
      let result = num.toFixed(8)
      result = result.replace(/\.?0+$/, '')
      return result
    } catch (e) {
      return amountRaw.toString()
    }
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
    const v = String(s || '').toLowerCase()
    if (v === 'pending') return 'badge bg-label-warning'
    if (v === 'processing') return 'badge bg-label-info'
    if (v === 'completed') return 'badge bg-label-success'
    if (v === 'failed') return 'badge bg-label-danger'
    if (v === 'skipped') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
  }

  function truncateAddress(addr) {
    if (!addr || addr.length <= 16) return addr || 'N/A'
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`
  }

  if (loading && topups.length === 0) {
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
                    <i className="bx bx-gas-pump me-2"></i>
                    Gas Topups
                  </h4>
                  <p className="text-muted mb-0">
                    View gas topup transactions created by the system
                  </p>
                </div>
                <button className="btn btn-primary" onClick={loadTopups} disabled={loading}>
                  <i className="bx bx-refresh me-1"></i>
                  {t('actions.refresh', { defaultValue: 'Refresh' })}
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-2 col-sm-6">
                  <label className="form-label small mb-1">Status</label>
                  <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="skipped">Skipped</option>
                  </select>
                </div>
                <div className="col-md-2 col-sm-6">
                  <label className="form-label small mb-1">Coin Network ID</label>
                  <input type="number" className="form-control form-control-sm" placeholder="Coin Network ID" value={coinNetworkIdFilter} onChange={(e) => setCoinNetworkIdFilter(e.target.value)} />
                </div>
                <div className="col-md-2 col-sm-6">
                  <label className="form-label small mb-1">Sweep ID</label>
                  <input type="number" className="form-control form-control-sm" placeholder="Sweep ID" value={sweepIdFilter} onChange={(e) => setSweepIdFilter(e.target.value)} />
                </div>
                <div className="col-md-2 col-sm-6">
                  <label className="form-label small mb-1">From Address</label>
                  <input type="text" className="form-control form-control-sm" placeholder="From Address" value={fromAddressFilter} onChange={(e) => setFromAddressFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">Date Range</label>
                  <LocaleDateRangePicker
                    startDate={dateFromFilter}
                    endDate={dateToFilter}
                    onChangeStart={setDateFromFilter}
                    onChangeEnd={setDateToFilter}
                    locale={locale}
                    placeholder="Select date range"
                    t={t}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary btn-sm" onClick={applyFilters} disabled={loading}>
                  <i className="bx bx-filter-alt me-1"></i>
                  {t('filter.apply', { defaultValue: 'Apply Filters' })}
                </button>
                <button className="btn btn-outline-secondary btn-sm" onClick={resetFilters} disabled={loading}>
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
                      <th>Coin</th>
                      <th className="text-center">Sweep ID</th>
                      <th className="text-end">Topup Gas</th>
                      <th className="text-end">Required Gas</th>
                      <th className="text-center">Status</th>
                      <th>Tx Hash</th>
                      <th>From Address</th>
                      <th>To Address</th>
                      <th className="text-center">Retry</th>
                      <th>Created</th>
                      <th>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topups.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="text-center text-muted py-4">
                          {t('admin.gasTopup.noTopups', { defaultValue: 'No gas topups found' })}
                        </td>
                      </tr>
                    ) : (
                      topups.map((topup) => {
                        const coinSymbol = (topup.coinNetwork?.coin?.symbol || topup.coinSymbol || '').toUpperCase()
                        const networkSymbol = (topup.coinNetwork?.network?.symbol || topup.networkSymbol || '').toUpperCase()
                        const networkName = topup.coinNetwork?.network?.name || topup.networkName || ''
                        const decimals = topup.coinNetwork?.decimals || topup.decimals || 18

                        return (
                          <tr key={topup.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/gas-topups/${topup.id}`)}>
                            <td>
                              <span className="fw-semibold text-primary">{topup.id}</span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} />
                                <div>
                                  <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{coinSymbol}</div>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{networkName || networkSymbol}</div>
                                </div>
                              </div>
                            </td>
                            <td className="text-center">
                              {topup.sweepId ? (
                                <span className="fw-semibold">{topup.sweepId}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-end text-nowrap">
                              <span className="fw-semibold">
                                {formatAmount(topup.topupGasRaw, decimals)}
                              </span>
                            </td>
                            <td className="text-end text-nowrap">
                              <span className="text-muted">
                                {formatAmount(topup.requiredGasRaw, decimals)}
                              </span>
                            </td>
                            <td className="text-center text-nowrap">
                              <span className={statusBadgeClass(topup.status)}>
                                {String(topup.status || '').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              {topup.txHash ? (
                                <div className="d-flex align-items-center">
                                  <span className="me-2">{topup.txHash}</span>
                                  <button
                                    className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                    onClick={() => copyToClipboard(topup.txHash)}
                                    title="Copy tx hash"
                                  >
                                    <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {topup.fromAddress ? (
                                <div className="d-flex align-items-center">
                                  <span className="me-2">{topup.fromAddress}</span>
                                  <button
                                    className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                    onClick={() => copyToClipboard(topup.fromAddress)}
                                    title="Copy address"
                                  >
                                    <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {topup.toAddress ? (
                                <div className="d-flex align-items-center">
                                  <span className="me-2">{topup.toAddress}</span>
                                  <button
                                    className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                    onClick={() => copyToClipboard(topup.toAddress)}
                                    title="Copy address"
                                  >
                                    <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-center">
                              <span className={topup.retryCount > 0 ? 'text-warning fw-semibold' : 'text-muted'}>
                                {topup.retryCount || 0}
                              </span>
                            </td>
                            <td className="text-nowrap" style={{ fontSize: '0.85rem' }}>
                              {formatDate(topup.createdAt)}
                            </td>
                            <td className="text-nowrap" style={{ fontSize: '0.85rem' }}>
                              {topup.completedAt ? formatDate(topup.completedAt) : <span className="text-muted">-</span>}
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
