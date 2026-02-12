import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getAdminPayments } from '../../api/admin.ts'
import { formatAmount } from '../../utils/format'
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
    usdc: ['usd-coin'],
    bnb: ['binance'],
    bsc: ['binance'],
    trx: ['tron'],
    arb: ['arbitrum'],
    op: ['optimism'],
    base: ['base'],
    ln: ['lightning'],
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

export default function AdminPaymentList() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter states (draft — applied on "Apply")
  const [statusFilter, setStatusFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [invoiceIdFilter, setInvoiceIdFilter] = useState('')
  const [txHashFilter, setTxHashFilter] = useState('')
  const [fromDateFilter, setFromDateFilter] = useState('')
  const [toDateFilter, setToDateFilter] = useState('')
  const [sortByFilter, setSortByFilter] = useState('')
  const [sortOrderFilter, setSortOrderFilter] = useState('')

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({})

  useEffect(() => {
    loadPayments()
  }, [currentPage, appliedFilters])

  function applyFilters() {
    setAppliedFilters({
      status: statusFilter || undefined,
      userId: userIdFilter ? Number(userIdFilter) : undefined,
      invoiceId: invoiceIdFilter ? Number(invoiceIdFilter) : undefined,
      txHash: txHashFilter || undefined,
      fromDate: fromDateFilter || undefined,
      toDate: toDateFilter || undefined,
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined,
    })
    setCurrentPage(1)
  }

  function resetFilters() {
    setStatusFilter('')
    setUserIdFilter('')
    setInvoiceIdFilter('')
    setTxHashFilter('')
    setFromDateFilter('')
    setToDateFilter('')
    setSortByFilter('')
    setSortOrderFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
  }

  async function loadPayments() {
    try {
      setLoading(true)
      const data = await getAdminPayments(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setPayments(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load payments:', error)
      toast.error(t('admin.payments.loadError', { defaultValue: 'Failed to load payments' }))
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

  function statusBadgeClass(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'confirmed' || v === 'completed') return 'badge bg-label-success'
    if (v === 'detecting' || v === 'pending') return 'badge bg-label-warning'
    if (v === 'confirming' || v === 'processing') return 'badge bg-label-info'
    if (v === 'failed' || v === 'unconfirmed') return 'badge bg-label-danger'
    if (v === 'expired' || v === 'cancelled' || v === 'canceled') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
    }).catch(() => {
      toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
    })
  }

  if (loading && payments.length === 0) {
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
                    {t('admin.payments.title', { defaultValue: 'Payments' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.payments.description', { defaultValue: 'View all blockchain payment transactions' })}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={loadPayments} disabled={loading}>
                  <i className="bx bx-refresh me-1"></i>
                  {t('actions.refresh', { defaultValue: 'Refresh' })}
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.status', { defaultValue: 'Status' })}</label>
                  <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    <option value="pending">{t('status.pending', { defaultValue: 'Pending' })}</option>
                    <option value="detecting">{t('status.detecting', { defaultValue: 'Detecting' })}</option>
                    <option value="confirming">{t('status.confirming', { defaultValue: 'Confirming' })}</option>
                    <option value="confirmed">{t('status.confirmed', { defaultValue: 'Confirmed' })}</option>
                    <option value="completed">{t('status.completed', { defaultValue: 'Completed' })}</option>
                    <option value="expired">{t('status.expired', { defaultValue: 'Expired' })}</option>
                    <option value="failed">{t('status.failed', { defaultValue: 'Failed' })}</option>
                    <option value="refunded">{t('status.refunded', { defaultValue: 'Refunded' })}</option>
                    <option value="unconfirmed">{t('status.unconfirmed', { defaultValue: 'Unconfirmed' })}</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.userId', { defaultValue: 'User ID' })}</label>
                  <input type="number" className="form-control form-control-sm" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.invoiceId', { defaultValue: 'Invoice ID' })}</label>
                  <input type="number" className="form-control form-control-sm" placeholder={t('filter.invoiceId', { defaultValue: 'Invoice ID' })} value={invoiceIdFilter} onChange={(e) => setInvoiceIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.txHash', { defaultValue: 'Tx Hash' })}</label>
                  <input type="text" className="form-control form-control-sm" placeholder="0x..." value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.dateRange', { defaultValue: 'Date Range' })}</label>
                  <LocaleDateRangePicker
                    startDate={fromDateFilter}
                    endDate={toDateFilter}
                    onChangeStart={setFromDateFilter}
                    onChangeEnd={setToDateFilter}
                    locale={locale}
                    placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
                    t={t}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.sortBy', { defaultValue: 'Sort By' })}</label>
                  <select className="form-select form-select-sm" value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="created_at">{t('filter.createdAt', { defaultValue: 'Created At' })}</option>
                    <option value="amount_raw">{t('filter.amount', { defaultValue: 'Amount' })}</option>
                    <option value="status">{t('filter.status', { defaultValue: 'Status' })}</option>
                    <option value="confirmations">{t('filter.confirmations', { defaultValue: 'Confirmations' })}</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</label>
                  <select className="form-select form-select-sm" value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="asc">{t('filter.ascending', { defaultValue: 'Ascending' })}</option>
                    <option value="desc">{t('filter.descending', { defaultValue: 'Descending' })}</option>
                  </select>
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
                      <th>{t('table.id', { defaultValue: 'ID' })}</th>
                      <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
                      <th className="text-center">{t('table.invoiceId', { defaultValue: 'Invoice ID' })}</th>
                      <th>{t('table.coin', { defaultValue: 'Coin' })}</th>
                      <th className="text-end">{t('table.amount', { defaultValue: 'Amount' })}</th>
                      <th className="text-end">{t('table.usd', { defaultValue: 'USD' })}</th>
                      <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                      <th>{t('table.confirmations', { defaultValue: 'Confirmations' })}</th>
                      <th>{t('table.txHash', { defaultValue: 'Tx Hash' })}</th>
                      <th>{t('table.fromAddress', { defaultValue: 'From Address' })}</th>
                      <th>{t('table.toAddress', { defaultValue: 'To Address' })}</th>
                      <th>{t('table.created', { defaultValue: 'Created' })}</th>
                      <th>{t('table.confirmed', { defaultValue: 'Confirmed' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan="14" className="text-center text-muted py-4">
                          {t('admin.payments.noPayments', { defaultValue: 'No payments found' })}
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => {
                        const coinSymbol = (payment.coin?.symbol || payment.coinSymbol || payment.invoice?.coin?.symbol || '').toUpperCase()
                        const networkSymbol = (payment.network?.symbol || payment.networkSymbol || payment.invoice?.network?.symbol || '').toUpperCase()
                        const networkName = payment.network?.name || payment.networkName || payment.invoice?.network?.name || ''
                        const explorerUrl = payment.explorerUrl || payment.network?.explorerUrl || payment.invoice?.network?.explorerUrl || ''

                        return (
                          <tr key={payment.id}>
                            <td>
                              <span className="fw-semibold text-primary">{payment.id}</span>
                            </td>
                            <td className="text-center">
                              <span className="fw-medium">{payment.userId || '-'}</span>
                            </td>
                            <td className="text-center">
                              {payment.invoiceId ? (
                                <button
                                  className="btn btn-sm btn-text-primary p-0 fw-medium"
                                  onClick={() => navigate(`/admin/invoices/${payment.invoiceId}`)}
                                >
                                  #{payment.invoiceId}
                                </button>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div className="d-flex align-items-center">
                                <CoinImg
                                  symbol={coinSymbol}
                                  networkSymbol={networkSymbol}
                                  size={24}
                                />
                                <div>
                                  <div className="fw-medium" style={{ lineHeight: 1.2 }}>{coinSymbol || '-'}</div>
                                  {networkName && (
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{networkName}</small>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-end text-nowrap">
                              <span className="fw-medium">
                                {formatAmount(payment.amount)} {coinSymbol}
                              </span>
                            </td>
                            <td className="text-end text-nowrap">
                              {payment.amountUsd ? (
                                <span className="fw-medium">${formatAmount(payment.amountUsd)}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-nowrap text-center">
                              <span className={statusBadgeClass(payment.status)}>
                                {String(payment.status || '').toUpperCase()}
                              </span>
                            </td>
                            <td className="text-center">
                              {payment.confirmations != null ? (
                                <span>{payment.confirmations}/{payment.requiredConfirmations ?? '-'}</span>
                              ) : '-'}
                            </td>
                            <td>
                              {payment.txHash ? (
                                <div className="d-flex align-items-center">
                                  <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                                    {payment.txHash}
                                  </span>
                                  {explorerUrl && (
                                    <a
                                      href={`${explorerUrl}/tx/${payment.txHash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
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
                              {payment.fromAddress ? (
                                <div className="d-flex align-items-center">
                                  <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                                    {payment.fromAddress}
                                  </span>
                                  <button
                                    className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                    onClick={() => copyToClipboard(payment.fromAddress)}
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
                              {payment.toAddress ? (
                                <div className="d-flex align-items-center">
                                  <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                                    {payment.toAddress}
                                  </span>
                                  <button
                                    className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                    onClick={() => copyToClipboard(payment.toAddress)}
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
                              <span style={{ whiteSpace: 'nowrap' }}>{formatDate(payment.createdAt || payment.created_at)}</span>
                            </td>
                            <td>
                              <span style={{ whiteSpace: 'nowrap' }}>
                                {payment.confirmedAt ? formatDate(payment.confirmedAt) : <span className="text-muted">-</span>}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary"
                                onClick={() => navigate(`/admin/payments/${payment.id}`)}
                                title="View detail"
                              >
                                <i className="bx bx-show" style={{ fontSize: '1.25rem' }}></i>
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
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled
                    >
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
