import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getSystemLedgerEntries } from '../../api/admin.ts'
import LocaleDateRangePicker from '../../components/LocaleDateRangePicker'

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

function CoinImg({ symbol, networkSymbol, size = 24 }) {
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

export default function SystemLedgerList() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter states (draft — applied on "Apply")
  const [typeFilter, setTypeFilter] = useState('')
  const [walletIdFilter, setWalletIdFilter] = useState('')
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState('')
  const [entryCodeFilter, setEntryCodeFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [txHashFilter, setTxHashFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({})

  useEffect(() => {
    loadEntries()
  }, [currentPage, appliedFilters])

  function applyFilters() {
    setAppliedFilters({
      type: typeFilter || undefined,
      walletId: walletIdFilter ? Number(walletIdFilter) : undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      entryCode: entryCodeFilter || undefined,
      state: stateFilter || undefined,
      txHash: txHashFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    })
    setCurrentPage(1)
  }

  function resetFilters() {
    setTypeFilter('')
    setWalletIdFilter('')
    setCoinNetworkIdFilter('')
    setEntryCodeFilter('')
    setStateFilter('')
    setTxHashFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
  }

  async function loadEntries() {
    try {
      setLoading(true)
      const data = await getSystemLedgerEntries(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setEntries(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load system ledger entries:', error)
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

  // Entry code labels
  const entryCodeLabels = {
    'SP': 'Settlement Payment',
    'SC': 'Sweep Cost',
    'SG': 'Sweep Gas',
    'WA': 'Wallet Actual',
    'WF': 'Wallet Fee',
    'WG': 'Wallet Gas',
    'WD': 'Withdrawal',
    'DP': 'Deposit',
    'FE': 'Fee',
    'AJ': 'Adjustment',
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

  function stateBadge(state) {
    if (state === 'settled') return <span className="badge bg-label-success">Settled</span>
    if (state === 'committed') return <span className="badge bg-label-info">Committed</span>
    if (state === 'pending') return <span className="badge bg-label-warning">Pending</span>
    if (state === 'reversed') return <span className="badge bg-label-danger">Reversed</span>
    return <span className="badge bg-label-secondary">{state || 'N/A'}</span>
  }

  function truncateHash(hash) {
    if (!hash) return ''
    if (hash.length <= 16) return hash
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }

  function copyToClipboard(text, e) {
    e.stopPropagation()
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
    })
  }

  function formatAmount(val) {
    if (!val && val !== 0) return '0'
    // Use the string value directly, just trim trailing zeros
    let str = String(val)
    if (str.includes('.')) {
      str = str.replace(/0+$/, '').replace(/\.$/, '')
    }
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
                    <i className="bx bx-server me-2"></i>
                    {t('admin.ledger.systemLedger', { defaultValue: 'System Ledger' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.ledger.systemLedgerDesc', { defaultValue: 'View all system ledger entries' })}
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
                  <label className="form-label small mb-1">{t('filter.entryType', { defaultValue: 'Entry Type' })}</label>
                  <select className="form-select form-select-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="credit">{t('filter.credit', { defaultValue: 'Credit' })}</option>
                    <option value="debit">{t('filter.debit', { defaultValue: 'Debit' })}</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.entryCode', { defaultValue: 'Entry Code' })}</label>
                  <select className="form-select form-select-sm" value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
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
                  <label className="form-label small mb-1">{t('filter.state', { defaultValue: 'State' })}</label>
                  <select className="form-select form-select-sm" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="committed">{t('filter.committed', { defaultValue: 'Committed' })}</option>
                    <option value="settled">{t('filter.settled', { defaultValue: 'Settled' })}</option>
                    <option value="reversed">{t('filter.reversed', { defaultValue: 'Reversed' })}</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.walletId', { defaultValue: 'Wallet ID' })}</label>
                  <input type="number" className="form-control form-control-sm" placeholder={t('filter.walletId', { defaultValue: 'Wallet ID' })} value={walletIdFilter} onChange={(e) => setWalletIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.coinNetworkId', { defaultValue: 'Coin Network ID' })}</label>
                  <input type="number" className="form-control form-control-sm" placeholder={t('filter.coinNetworkId', { defaultValue: 'Coin Network ID' })} value={coinNetworkIdFilter} onChange={(e) => setCoinNetworkIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.txHash', { defaultValue: 'Tx Hash' })}</label>
                  <input type="text" className="form-control form-control-sm" placeholder={t('filter.txHash', { defaultValue: 'Tx Hash' })} value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.dateRange', { defaultValue: 'Date Range' })}</label>
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
                <table className="table table-hover" style={{ minWidth: '1200px' }}>
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>ID</th>
                      <th>{t('admin.ledger.type', { defaultValue: 'Type' })}</th>
                      <th>{t('admin.ledger.state', { defaultValue: 'State' })}</th>
                      <th>{t('admin.ledger.coin', { defaultValue: 'Coin' })}</th>
                      <th>Code</th>
                      <th className="text-end">{t('admin.ledger.amount', { defaultValue: 'Amount' })}</th>
                      <th className="text-end">USD</th>
                      <th>Purpose</th>
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
                        const metadata = parseMetadata(entry)
                        const networkSymbol = metadata?.networkSymbol || ''
                        const purposeLabel = getPurposeLabel(metadata)

                        return (
                          <tr key={entry.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/ledger/system/${entry.id}`)}>
                            <td>
                              <span className="fw-semibold text-primary">{entry.id}</span>
                            </td>
                            <td>
                              <span className={`badge ${isCredit ? 'bg-label-danger' : 'bg-label-success'}`}>
                                <i className={`bx ${isCredit ? 'bx-minus-circle' : 'bx-plus-circle'} me-1`}></i>
                                {isCredit ? 'Credit' : 'Debit'}
                              </span>
                            </td>
                            <td>
                              {stateBadge(entry.state)}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div className="d-flex align-items-center">
                                <CoinImg
                                  symbol={entry.coinSymbol}
                                  networkSymbol={entry.networkSymbol}
                                  size={24}
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
                            <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                              <span className={`fw-medium ${isCredit ? 'text-danger' : 'text-success'}`}>
                                {isCredit ? '-' : '+'}{formatAmount(entry.amount)}
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
                            <td>
                              <button
                                className="btn btn-sm btn-icon btn-outline-primary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/admin/ledger/system/${entry.id}`)
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
                      onClick={() => setCurrentPage(currentPage - 1)}
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
                      onClick={() => setCurrentPage(currentPage + 1)}
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
