import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useToastContext } from '../../context/ToastContext'
import { getSystemWallet, getSystemWalletLedger } from '../../api/admin.ts'
import { AmountNormalizer } from '../../utils/amount_normalizer'
import LocaleDateRangePicker from '../../components/LocaleDateRangePicker'
import { formatUsd } from '../../utils/format'

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

  // Filter states (draft — applied on "Apply")
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
    if (str.includes('.')) {
      str = str.replace(/0+$/, '').replace(/\.$/, '')
    }
    return str || '0'
  }


  function parseMetadata(entry) {
    try {
      return typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata || {}
    } catch { return {} }
  }

  function getPurposeLabel(metadata) {
    if (!metadata) return null
    const purposeMap = {
      'payment_received': 'Payment Received',
      'merchant_credit': 'Merchant Credit',
      'native_coin_sweep_cost': 'Sweep Cost',
      'gas_topup_for_token_sweep': 'Gas Top-up',
      'token_sweep_cost': 'Token Sweep Cost',
    }
    return purposeMap[metadata.purpose] || purposeMap[metadata.type] || metadata.purpose || metadata.type || null
  }

  function copyToClipboard(text, e) {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
    })
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
          {/* Back Button */}
          <button
            onClick={() => navigate('/admin/system-wallets')}
            className="btn btn-outline-secondary mb-3"
          >
            <i className="bx bx-arrow-back me-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>

          {/* Wallet Info Header */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-wallet me-2"></i>
                    {wallet?.walletName || t('admin.ledger.title', { defaultValue: 'Wallet Transactions' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {wallet?.networkName || ''} &middot; {wallet?.purpose || ''} &middot; {wallet?.walletType || ''}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={loadLedger} disabled={loading}>
                  <i className="bx bx-refresh me-1"></i>
                  {t('actions.refresh', { defaultValue: 'Refresh' })}
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Wallet Details */}
              {wallet && (
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <small className="text-muted d-block mb-1">
                      <i className="bx bx-id-card me-1"></i>Wallet ID
                    </small>
                    <span className="fw-semibold">{wallet.id}</span>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block mb-1">
                      <i className="bx bx-category me-1"></i>Purpose
                    </small>
                    <span className="badge bg-label-info text-capitalize">{wallet.purpose || 'N/A'}</span>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block mb-1">
                      <i className="bx bx-chip me-1"></i>Type
                    </small>
                    {wallet.walletType === 'hot' ? (
                      <span className="badge bg-label-warning">
                        <i className="bx bx-hot me-1"></i>Hot
                      </span>
                    ) : (
                      <span className="badge bg-label-info">
                        <i className="bx bx-shield me-1"></i>Cold
                      </span>
                    )}
                  </div>
                  <div className="col-12">
                    <small className="text-muted d-block mb-1">
                      <i className="bx bx-wallet me-1"></i>Address
                    </small>
                    <div className="d-flex align-items-center gap-2">
                      <code className="text-primary" style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>
                        {wallet.address || 'N/A'}
                      </code>
                      {wallet.address && (
                        <button
                          onClick={(e) => copyToClipboard(wallet.address, e)}
                          className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                          title="Copy"
                        >
                          <i className="bx bx-copy" style={{ fontSize: '1rem' }}></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block mb-1">
                      <i className="bx bx-check-circle me-1"></i>Status
                    </small>
                    {wallet.status === 'active' ? (
                      <span className="badge bg-label-success">Active</span>
                    ) : (
                      <span className="badge bg-label-secondary">{wallet.status || 'N/A'}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Assets */}
              {assets.length > 0 && (
                <>
                  <hr className="my-3" />
                  <h6 className="mb-3">
                    <i className="bx bx-coin-stack me-1"></i>
                    Assets ({assets.length})
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr style={{ whiteSpace: 'nowrap' }}>
                          <th>Coin</th>
                          <th>Network</th>
                          <th className="text-end">Balance</th>
                          <th className="text-end">USD Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assets.map((asset, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="d-flex align-items-center">
                                <CoinImg symbol={asset.coinSymbol} networkSymbol={asset.networkSymbol} size={24} />
                                <span className="fw-medium">{asset.coinSymbol || '-'}</span>
                              </div>
                            </td>
                            <td>
                              <span className="text-muted">{asset.networkName || asset.networkSymbol || '-'}</span>
                            </td>
                            <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                              {formatAmount(asset.balance)} <span className="text-muted">{asset.coinSymbol}</span>
                            </td>
                            <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                              {asset.fiatValue ? formatUsd(asset.fiatValue.amount) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

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
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bx bx-receipt" style={{ fontSize: '4rem', opacity: 0.3, color: '#666' }}></i>
                  <h6 className="text-muted mt-3 mb-2">
                    {t('admin.ledger.noEntries', { defaultValue: 'No ledger entries found' })}
                  </h6>
                  <p className="text-muted small mb-0">
                    {t('admin.ledger.noEntriesDesc', { defaultValue: 'Try adjusting your filters to see more results' })}
                  </p>
                </div>
              ) : (
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <table className="table table-hover" style={{ minWidth: '1200px' }}>
                    <thead>
                      <tr style={{ whiteSpace: 'nowrap' }}>
                        <th>ID</th>
                        <th>{t('admin.ledger.type', { defaultValue: 'Type' })}</th>
                        <th>Coin</th>
                        <th>Code</th>
                        <th>{t('admin.ledger.state', { defaultValue: 'State' })}</th>
                        <th className="text-end">{t('admin.ledger.amount', { defaultValue: 'Amount' })}</th>
                        <th className="text-end">USD</th>
                        <th>Purpose</th>
                        <th>Tx Hash</th>
                        <th>{t('admin.ledger.createdAt', { defaultValue: 'Created' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => {
                        const isCredit = entry.entryType === 'credit'
                        const metadata = parseMetadata(entry)
                        const purposeLabel = getPurposeLabel(metadata)
                        const decimals = entry.decimals || 18
                        const amount = entry.amount || AmountNormalizer.fromRawSimple(entry.amountRaw || '0', decimals)

                        return (
                          <tr key={entry.id}>
                            <td>
                              <span className="fw-semibold text-primary">{entry.id}</span>
                            </td>
                            <td>
                              <span className={`badge ${isCredit ? 'bg-label-danger' : 'bg-label-success'}`}>
                                <i className={`bx ${isCredit ? 'bx-minus-circle' : 'bx-plus-circle'} me-1`}></i>
                                {isCredit ? 'Credit' : 'Debit'}
                              </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div className="d-flex align-items-center">
                                <CoinImg
                                  symbol={entry.coinSymbol || metadata?.coin}
                                  networkSymbol={entry.networkSymbol || metadata?.network}
                                  size={24}
                                />
                                <div>
                                  <div className="fw-medium" style={{ lineHeight: 1.2 }}>{entry.coinSymbol || metadata?.coin || '-'}</div>
                                  {(entry.networkName || metadata?.networkName) && (
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{entry.networkName || metadata?.networkName}</small>
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
                              {entry.state === 'settled' ? <span>Settled</span>
                                : entry.state === 'committed' ? <span>Committed</span>
                                : entry.state === 'pending' ? <span>Pending</span>
                                : entry.state === 'reversed' ? <span>Reversed</span>
                                : <span className="text-muted">{entry.state || 'N/A'}</span>}
                            </td>
                            <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                              <span className={`fw-medium ${isCredit ? 'text-danger' : 'text-success'}`}>
                                {isCredit ? '-' : '+'}{formatAmount(amount)}
                              </span>
                            </td>
                            <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                              <span className="text-muted">{formatUsd(entry.amountUsd)}</span>
                            </td>
                            <td>
                              <div>
                                {purposeLabel && (
                                  <div className="fw-medium" style={{ fontSize: '0.85rem' }}>{purposeLabel}</div>
                                )}
                                {metadata?.invoiceNumber && (
                                  <small className="badge bg-label-primary">{metadata.invoiceNumber}</small>
                                )}
                                {metadata?.sweepId && !metadata?.invoiceNumber && (
                                  <small className="text-muted">Sweep #{metadata.sweepId}</small>
                                )}
                                {!purposeLabel && !metadata?.invoiceNumber && !metadata?.sweepId && (
                                  <span className="text-muted">-</span>
                                )}
                              </div>
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
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

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
