import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getWithdrawals, approveWithdrawal, rejectWithdrawal } from '../../api/admin.ts'
import { AmountNormalizer } from '../../utils/amount_normalizer'
import LocaleDatePicker from '../../components/LocaleDatePicker'

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

export default function WithdrawalTransactions() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const [loading, setLoading] = useState(false)
  const [withdrawals, setWithdrawals] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter states (draft — applied on "Apply")
  const [statusFilter, setStatusFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({})

  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadWithdrawals()
  }, [currentPage, appliedFilters])

  function applyFilters() {
    setAppliedFilters({
      status: statusFilter || undefined,
      userId: userIdFilter || undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      search: searchFilter || undefined,
    })
    setCurrentPage(1)
  }

  function resetFilters() {
    setStatusFilter('')
    setUserIdFilter('')
    setCoinNetworkIdFilter('')
    setSearchFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
  }

  async function loadWithdrawals() {
    try {
      setLoading(true)
      const data = await getWithdrawals(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setWithdrawals(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load withdrawal transactions:', error)
      toast.error(t('withdrawal.loadError', { defaultValue: 'Failed to load withdrawal transactions' }))
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(amountRaw, decimals = 18, maxFrac = 8, keepTrailingZeros = false) {
    if (!amountRaw) return keepTrailingZeros ? '0.' + '0'.repeat(maxFrac) : '0'
    try {
      const value = AmountNormalizer.fromRawSimple(amountRaw.toString(), decimals)
      const num = Number(value)
      if (!Number.isFinite(num)) return value
      
      // Limit decimal places
      let result = num.toFixed(maxFrac)
      
      // Remove trailing zeros only if not explicitly keeping them
      if (!keepTrailingZeros) {
        result = result.replace(/\.?0+$/, '')
      }
      
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

  function handleApproveClick(withdrawal) {
    setSelectedWithdrawal(withdrawal)
    setShowApproveModal(true)
  }

  function handleRejectClick(withdrawal) {
    setSelectedWithdrawal(withdrawal)
    setRejectReason('')
    setShowRejectModal(true)
  }

  async function handleApprove() {
    if (!selectedWithdrawal) return

    try {
      setApproving(true)
      await approveWithdrawal(token, selectedWithdrawal.id, 'Withdrawal approved after verification')
      
      toast.success(t('withdrawal.approveSuccess', { defaultValue: 'Withdrawal approved successfully' }))
      setShowApproveModal(false)
      setSelectedWithdrawal(null)
      loadWithdrawals() // Reload the list
    } catch (error) {
      console.error('Failed to approve withdrawal:', error)
      toast.error(t('withdrawal.approveError', { defaultValue: 'Failed to approve withdrawal' }))
    } finally {
      setApproving(false)
    }
  }

  async function handleReject() {
    if (!selectedWithdrawal || !rejectReason.trim()) {
      toast.error(t('withdrawal.rejectReasonRequired', { defaultValue: 'Please provide a reason for rejection' }))
      return
    }

    if (rejectReason.trim().length < 10) {
      toast.error(t('withdrawal.rejectReasonTooShort', { defaultValue: 'The reason field must have at least 10 characters' }))
      return
    }

    try {
      setRejecting(true)
      await rejectWithdrawal(token, selectedWithdrawal.id, rejectReason.trim())
      
      toast.success(t('withdrawal.rejectSuccess', { defaultValue: 'Withdrawal rejected successfully' }))
      setShowRejectModal(false)
      setSelectedWithdrawal(null)
      setRejectReason('')
      loadWithdrawals() // Reload the list
    } catch (error) {
      console.error('Failed to reject withdrawal:', error)
      toast.error(t('withdrawal.rejectError', { defaultValue: 'Failed to reject withdrawal' }))
    } finally {
      setRejecting(false)
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
    const v = String(s || '').toUpperCase()
    if (v === 'PENDING') return 'badge bg-label-warning'
    if (v === 'PROCESSING' || v === 'APPROVED') return 'badge bg-label-info'
    if (v === 'COMPLETED' || v === 'SUCCESS') return 'badge bg-label-success'
    if (v === 'FAILED' || v === 'REJECTED' || v === 'ERROR') return 'badge bg-label-danger'
    if (v === 'CANCELLED' || v === 'CANCELED') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
  }

  if (loading && withdrawals.length === 0) {
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
                    <i className="bx bx-money-withdraw me-2"></i>
                    {t('withdrawal.transactions', { defaultValue: 'Withdrawal' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('withdrawal.transactionsDesc', { defaultValue: 'View all withdrawal transactions and their status' })}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={loadWithdrawals} disabled={loading}>
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
                    <option value="waiting_for_gas">{t('status.waiting_for_gas', { defaultValue: 'Waiting for Gas' })}</option>
                    <option value="processing">{t('status.processing', { defaultValue: 'Processing' })}</option>
                    <option value="completed">{t('status.completed', { defaultValue: 'Completed' })}</option>
                    <option value="failed">{t('status.failed', { defaultValue: 'Failed' })}</option>
                    <option value="cancelled">{t('status.cancelled', { defaultValue: 'Cancelled' })}</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.userId', { defaultValue: 'User ID' })}</label>
                  <input type="number" className="form-control form-control-sm" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.coinNetworkId', { defaultValue: 'Coin Network ID' })}</label>
                  <input type="number" className="form-control form-control-sm" placeholder={t('filter.coinNetworkId', { defaultValue: 'Coin Network ID' })} value={coinNetworkIdFilter} onChange={(e) => setCoinNetworkIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">{t('filter.search', { defaultValue: 'Search' })}</label>
                  <input type="text" className="form-control form-control-sm" placeholder={t('filter.searchPlaceholder', { defaultValue: 'tx_hash, address, email...' })} value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} />
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

          {/* Transactions Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="table table-hover" style={{ minWidth: '1200px' }}>
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>ID</th>
                      <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
                      <th>{t('withdrawal.chain', { defaultValue: 'Chain' })}</th>
                      <th>{t('withdrawal.coin', { defaultValue: 'Coin' })}</th>
                      <th className="text-end">{t('withdrawal.amount', { defaultValue: 'Amount' })}</th>
                      <th className="text-end">{t('table.usd', { defaultValue: 'USD' })}</th>
                      <th className="text-end">{t('withdrawal.fee', { defaultValue: 'Fee' })}</th>
                      <th className="text-end">{t('withdrawal.feeUsd', { defaultValue: 'Fee USD' })}</th>
                      <th className="text-center">{t('withdrawal.status', { defaultValue: 'Status' })}</th>
                      <th className="text-center">{t('withdrawal.actions', { defaultValue: 'Actions' })}</th>
                      <th>{t('withdrawal.txHash', { defaultValue: 'Tx Hash' })}</th>
                      <th>{t('withdrawal.fromAddress', { defaultValue: 'From Address' })}</th>
                      <th>{t('withdrawal.toAddress', { defaultValue: 'To Address' })}</th>
                      <th>{t('withdrawal.createdAt', { defaultValue: 'Created Date' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan="14" className="text-center text-muted py-4">
                          {t('withdrawal.noTransactions', { defaultValue: 'No withdrawal transactions found' })}
                        </td>
                      </tr>
                    ) : (
                    withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id}>
                        <td>
                          <span className="fw-semibold text-primary">{withdrawal.id}</span>
                        </td>
                        <td className="text-center">
                          <span className="fw-medium">{withdrawal.userId || withdrawal.user?.id || '-'}</span>
                        </td>
                        <td>
                          <span className="text-muted">
                            {(withdrawal.network?.symbol || withdrawal.coinNetwork?.network?.symbol || '').toUpperCase() || 'N/A'}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div className="d-flex align-items-center">
                            <CoinImg
                              symbol={(withdrawal.coin?.symbol || withdrawal.coinNetwork?.coin?.symbol || withdrawal.symbol || '').toUpperCase()}
                              networkSymbol={(withdrawal.network?.symbol || withdrawal.coinNetwork?.network?.symbol || '').toUpperCase()}
                              size={24}
                            />
                            <div>
                              <div className="fw-medium" style={{ lineHeight: 1.2 }}>{(withdrawal.coin?.symbol || withdrawal.coinNetwork?.coin?.symbol || withdrawal.symbol || '-').toUpperCase()}</div>
                              {(withdrawal.network?.name || withdrawal.coinNetwork?.network?.name) && (
                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>{withdrawal.network?.name || withdrawal.coinNetwork?.network?.name}</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-end text-nowrap">
                          <span className="fw-medium">
                            {formatAmount(withdrawal.amountRaw || withdrawal.amount, withdrawal.decimals || 18)} {withdrawal.coin?.symbol || withdrawal.coinNetwork?.coin?.symbol || withdrawal.symbol || ''}
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          {withdrawal.amountUsd ? (
                            <span className="fw-medium">${Number(withdrawal.amountUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-end text-nowrap">
                          <span className="text-muted">
                            {formatAmount(withdrawal.totalFeeRaw || withdrawal.totalFee || withdrawal.feeRaw || withdrawal.fee, withdrawal.decimals || 18, 8, true)}
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          {withdrawal.networkFeeUsd ? (
                            <span className="text-muted">${Number(withdrawal.networkFeeUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-center text-nowrap"><span className={statusBadgeClass(withdrawal.status)}>{String(withdrawal.status || '').toUpperCase()}</span></td>
                        <td className="text-center">
                          {withdrawal.status?.toLowerCase() === 'pending' ? (
                            <div className="d-flex gap-1 justify-content-center">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleApproveClick(withdrawal)}
                                disabled={approving || rejecting}
                              >
                                <i className="bx bx-check me-1"></i>
                                {t('withdrawal.approve', { defaultValue: 'Approve' })}
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleRejectClick(withdrawal)}
                                disabled={approving || rejecting}
                              >
                                <i className="bx bx-x me-1"></i>
                                {t('withdrawal.reject', { defaultValue: 'Reject' })}
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {withdrawal.txHash ? (
                            <div className="d-flex align-items-center">
                              <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                                {withdrawal.txHash}
                              </span>
                              {(withdrawal.network?.explorerUrl || withdrawal.coinNetwork?.network?.explorerUrl) && (
                                <a 
                                  href={`${withdrawal.network?.explorerUrl || withdrawal.coinNetwork?.network?.explorerUrl}/tx/${withdrawal.txHash}`}
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
                          <div className="d-flex align-items-center">
                            <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                              {withdrawal.fromAddress || 'N/A'}
                            </span>
                            {withdrawal.fromAddress && (
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                onClick={() => copyToClipboard(withdrawal.fromAddress)}
                                title="Copy address"
                              >
                                <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
                              {withdrawal.toAddress || 'N/A'}
                            </span>
                            {withdrawal.toAddress && (
                              <button
                                className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                onClick={() => copyToClipboard(withdrawal.toAddress)}
                                title="Copy address"
                              >
                                <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ whiteSpace: 'nowrap' }}>{formatDate(withdrawal.createdAt)}</span>
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

      {/* Approve Confirmation Modal */}
      {showApproveModal && selectedWithdrawal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !approving && setShowApproveModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {t('withdrawal.approveConfirm', { defaultValue: 'Approve Withdrawal' })}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowApproveModal(false)} disabled={approving}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">{t('withdrawal.approveMessage', { defaultValue: 'Are you sure you want to approve this withdrawal?' })}</p>
                <div className="card" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e3e3' }}>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-6">
                        <small className="text-muted d-block">{t('common.id', { defaultValue: 'ID' })}</small>
                        <strong>{selectedWithdrawal.id}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">{t('admin.user', { defaultValue: 'User' })}</small>
                        <strong>{selectedWithdrawal.user?.email || 'N/A'}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">{t('withdrawal.amount', { defaultValue: 'Amount' })}</small>
                        <strong className="text-nowrap">{formatAmount(selectedWithdrawal.amountRaw || selectedWithdrawal.amount, selectedWithdrawal.decimals || 18)} {selectedWithdrawal.coin?.symbol || selectedWithdrawal.coinNetwork?.coin?.symbol || selectedWithdrawal.symbol}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">{t('withdrawal.fee', { defaultValue: 'Fee' })}</small>
                        <strong>{formatAmount(selectedWithdrawal.totalFeeRaw || selectedWithdrawal.totalFee || selectedWithdrawal.feeRaw || selectedWithdrawal.fee, selectedWithdrawal.decimals || 18, 8, true)} {selectedWithdrawal.coin?.symbol || selectedWithdrawal.coinNetwork?.coin?.symbol || selectedWithdrawal.symbol}</strong>
                      </div>
                      <div className="col-12">
                        <small className="text-muted d-block">{t('withdrawal.toAddress', { defaultValue: 'To Address' })}</small>
                        <code className="small">{selectedWithdrawal.toAddress}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApproveModal(false)} disabled={approving}>
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button type="button" className="btn btn-primary" onClick={handleApprove} disabled={approving}>
                  {approving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      {t('withdrawal.approving', { defaultValue: 'Approving...' })}
                    </>
                  ) : (
                    t('withdrawal.approve', { defaultValue: 'Approve' })
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && selectedWithdrawal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !rejecting && setShowRejectModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {t('withdrawal.rejectConfirm', { defaultValue: 'Reject Withdrawal' })}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)} disabled={rejecting}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">{t('withdrawal.rejectMessage', { defaultValue: 'Are you sure you want to reject this withdrawal?' })}</p>
                <div className="card mb-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e3e3' }}>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-6">
                        <small className="text-muted d-block">{t('common.id', { defaultValue: 'ID' })}</small>
                        <strong>{selectedWithdrawal.id}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">{t('admin.user', { defaultValue: 'User' })}</small>
                        <strong>{selectedWithdrawal.user?.email || 'N/A'}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">{t('withdrawal.amount', { defaultValue: 'Amount' })}</small>
                        <strong className="text-nowrap">{formatAmount(selectedWithdrawal.amountRaw || selectedWithdrawal.amount, selectedWithdrawal.decimals || 18)} {selectedWithdrawal.coin?.symbol || selectedWithdrawal.coinNetwork?.coin?.symbol || selectedWithdrawal.symbol}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">{t('withdrawal.fee', { defaultValue: 'Fee' })}</small>
                        <strong>{formatAmount(selectedWithdrawal.totalFeeRaw || selectedWithdrawal.totalFee || selectedWithdrawal.feeRaw || selectedWithdrawal.fee, selectedWithdrawal.decimals || 18, 8, true)} {selectedWithdrawal.coin?.symbol || selectedWithdrawal.coinNetwork?.coin?.symbol || selectedWithdrawal.symbol}</strong>
                      </div>
                      <div className="col-12">
                        <small className="text-muted d-block">{t('withdrawal.toAddress', { defaultValue: 'To Address' })}</small>
                        <code className="small">{selectedWithdrawal.toAddress}</code>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Reason input */}
                <div className="mb-3">
                  <label htmlFor="rejectReason" className="form-label">
                    {t('withdrawal.rejectReason', { defaultValue: 'Reason for rejection' })} <span className="text-danger">*</span>
                  </label>
                  <textarea 
                    id="rejectReason"
                    className={`form-control ${rejectReason.trim().length > 0 && rejectReason.trim().length < 10 ? 'is-invalid' : ''}`}
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t('withdrawal.rejectReasonPlaceholder', { defaultValue: 'e.g., Suspicious activity detected' })}
                    disabled={rejecting}
                  />
                  <div className="d-flex justify-content-between mt-1">
                    <small className={`${rejectReason.trim().length > 0 && rejectReason.trim().length < 10 ? 'text-danger' : 'text-muted'}`}>
                      {rejectReason.trim().length < 10 
                        ? t('withdrawal.rejectReasonMinLength', { defaultValue: 'Minimum 10 characters required' })
                        : t('common.optional', { defaultValue: '' })
                      }
                    </small>
                    <small className="text-muted">
                      {rejectReason.trim().length}/10
                    </small>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)} disabled={rejecting}>
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button type="button" className="btn btn-danger" onClick={handleReject} disabled={rejecting || rejectReason.trim().length < 10}>
                  {rejecting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      {t('withdrawal.rejecting', { defaultValue: 'Rejecting...' })}
                    </>
                  ) : (
                    t('withdrawal.reject', { defaultValue: 'Reject' })
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
