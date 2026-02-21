import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getWithdrawals, approveWithdrawal, rejectWithdrawal } from '../../api/admin.ts'
import { AmountNormalizer } from '../../utils/amount_normalizer'
import LocaleDatePicker from '../../components/LocaleDatePicker'
import { formatUsd, formatCoinAmount } from '../../utils/format'
import CoinImg from '../../components/CoinImg'
import { copyToClipboard as copyText } from '../../utils/clipboard'
import { listCoins } from '../../api/coins.ts'

export default function WithdrawalTransactions() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const initStatus = searchParams.get('status') || ''
  const initUserId = searchParams.get('userId') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initSearch = searchParams.get('search') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [withdrawals, setWithdrawals] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [coinNetworks, setCoinNetworks] = useState([])

  // Filter states (draft — applied on "Apply")
  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [userIdFilter, setUserIdFilter] = useState(initUserId)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [searchFilter, setSearchFilter] = useState(initSearch)

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initUserId) f.userId = initUserId
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initSearch) f.search = initSearch
    return f
  })

  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadWithdrawals()
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
      status: statusFilter || undefined,
      userId: userIdFilter || undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      search: searchFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setUserIdFilter('')
    setCoinNetworkIdFilter('')
    setSearchFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    setSearchParams({}, { replace: true })
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

  function formatAmount(amountRaw, decimals = 18) {
    if (!amountRaw) return '0'
    try {
      const value = AmountNormalizer.fromRawSimple(amountRaw.toString(), decimals)
      return formatCoinAmount(value)
    } catch (e) {
      return amountRaw.toString()
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
    else toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
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
      window.dispatchEvent(new Event('withdrawal-status-changed'))
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
      window.dispatchEvent(new Event('withdrawal-status-changed'))
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
                  <label className="form-label">{t('filter.status', { defaultValue: 'Status' })}</label>
                  <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
                  <label className="form-label">{t('filter.userId', { defaultValue: 'User ID' })}</label>
                  <input type="number" className="form-control" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</label>
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle w-100 d-flex align-items-center justify-content-between"
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
                  <label className="form-label">{t('filter.search', { defaultValue: 'Search' })}</label>
                  <input type="text" className="form-control" placeholder={t('filter.searchPlaceholder', { defaultValue: 'tx_hash, address, email...' })} value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} />
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
                              className="me-3"
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
                            <span className="fw-medium">{formatUsd(withdrawal.amountUsd)}</span>
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
                          {withdrawal.totalFeeUsd ? (
                            <span className="text-muted">${withdrawal.totalFeeUsd}</span>
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
                                onClick={() => handleCopy(withdrawal.fromAddress)}
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
                                onClick={() => handleCopy(withdrawal.toAddress)}
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
