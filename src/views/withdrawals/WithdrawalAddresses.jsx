import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import {
  getWithdrawalAddresses,
  flagWithdrawalAddress,
  unflagWithdrawalAddress,
  forceVerifyWithdrawalAddress,
  deleteWithdrawalAddress,
} from '../../api/admin.ts'
import CoinImg from '../../components/CoinImg'
import { copyToClipboard as copyText } from '../../utils/clipboard'
import { listCoins } from '../../api/coins.ts'

export default function WithdrawalAddresses() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initStatus = searchParams.get('status') || ''
  const initUserId = searchParams.get('userId') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initIsFlagged = searchParams.get('isFlagged') || ''
  const initIsVerified = searchParams.get('isVerified') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [coinNetworks, setCoinNetworks] = useState([])

  // Filter states
  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [userIdFilter, setUserIdFilter] = useState(initUserId)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [isFlaggedFilter, setIsFlaggedFilter] = useState(initIsFlagged)
  const [isVerifiedFilter, setIsVerifiedFilter] = useState(initIsVerified)

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initUserId) f.userId = initUserId
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initIsFlagged) f.isFlagged = initIsFlagged === 'true'
    if (initIsVerified) f.isVerified = initIsVerified === 'true'
    return f
  })

  // Modal states
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState('') // flag, unflag, forceVerify, delete
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [actionReason, setActionReason] = useState('')
  const [skipLockPeriod, setSkipLockPeriod] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadAddresses()
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
      isFlagged: isFlaggedFilter ? isFlaggedFilter === 'true' : undefined,
      isVerified: isVerifiedFilter ? isVerifiedFilter === 'true' : undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setUserIdFilter('')
    setCoinNetworkIdFilter('')
    setIsFlaggedFilter('')
    setIsVerifiedFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    setSearchParams({}, { replace: true })
  }

  async function loadAddresses() {
    try {
      setLoading(true)
      const data = await getWithdrawalAddresses(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setAddresses(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load withdrawal addresses:', error)
      toast.error(t('withdrawal.addressLoadError', { defaultValue: 'Failed to load withdrawal addresses' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
    else toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
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
    const v = String(s || '').toLowerCase().replace(/_/g, '_')
    if (v === 'active') return 'badge bg-label-success'
    if (v === 'pending_verification') return 'badge bg-label-warning'
    if (v === 'suspended') return 'badge bg-label-danger'
    if (v === 'deleted') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
  }

  function statusLabel(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'active') return 'Active'
    if (v === 'pending_verification') return 'Pending Verification'
    if (v === 'suspended') return 'Suspended'
    if (v === 'deleted') return 'Deleted'
    return String(s || '').toUpperCase()
  }

  function openActionModal(type, addr) {
    setActionType(type)
    setSelectedAddress(addr)
    setActionReason('')
    setSkipLockPeriod(false)
    setShowActionModal(true)
  }

  function getActionConfig() {
    switch (actionType) {
      case 'flag':
        return { title: 'Flag Address', btnClass: 'btn-warning', btnLabel: 'Flag', icon: 'bx-flag' }
      case 'unflag':
        return { title: 'Remove Flag', btnClass: 'btn-success', btnLabel: 'Unflag', icon: 'bx-check-circle' }
      case 'forceVerify':
        return { title: 'Force Verify', btnClass: 'btn-info', btnLabel: 'Verify', icon: 'bx-shield-quarter' }
      case 'delete':
        return { title: 'Permanent Delete', btnClass: 'btn-danger', btnLabel: 'Delete Permanently', icon: 'bx-trash' }
      default:
        return { title: '', btnClass: '', btnLabel: '', icon: '' }
    }
  }

  async function handleAction() {
    if (!selectedAddress || !actionReason.trim()) {
      toast.error('Please provide a reason (minimum 10 characters)')
      return
    }
    if (actionReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters')
      return
    }

    try {
      setActionLoading(true)

      switch (actionType) {
        case 'flag':
          await flagWithdrawalAddress(token, selectedAddress.id, actionReason.trim())
          toast.success('Address flagged successfully')
          break
        case 'unflag':
          await unflagWithdrawalAddress(token, selectedAddress.id, actionReason.trim())
          toast.success('Address unflagged successfully')
          break
        case 'forceVerify':
          await forceVerifyWithdrawalAddress(token, selectedAddress.id, actionReason.trim(), skipLockPeriod)
          toast.success('Address force verified successfully')
          break
        case 'delete':
          await deleteWithdrawalAddress(token, selectedAddress.id, actionReason.trim())
          toast.success('Address permanently deleted')
          break
      }

      setShowActionModal(false)
      setSelectedAddress(null)
      setActionReason('')
      loadAddresses()
    } catch (error) {
      console.error(`Failed to ${actionType} address:`, error)
      toast.error(`Failed to ${actionType} address`)
    } finally {
      setActionLoading(false)
    }
  }

  function truncateAddress(addr) {
    if (!addr || addr.length <= 16) return addr || 'N/A'
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`
  }

  if (loading && addresses.length === 0) {
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

  const actionConfig = getActionConfig()

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
                    {t('withdrawal.walletAddresses', { defaultValue: 'Wallet Addresses' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('withdrawal.walletAddressesDesc', { defaultValue: 'Manage user withdrawal wallet addresses' })}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={loadAddresses} disabled={loading}>
                  <i className="bx bx-refresh me-1"></i>
                  {t('actions.refresh', { defaultValue: 'Refresh' })}
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-2 col-sm-6">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="pending_verification">Pending Verification</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="deleted">Deleted</option>
                  </select>
                </div>
                <div className="col-md-2 col-sm-6">
                  <label className="form-label">User ID</label>
                  <input type="number" className="form-control" placeholder="User ID" value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">Coin / Network</label>
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
                <div className="col-md-2 col-sm-6">
                  <label className="form-label">Flagged</label>
                  <select className="form-select" value={isFlaggedFilter} onChange={(e) => setIsFlaggedFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="true">Flagged</option>
                    <option value="false">Not Flagged</option>
                  </select>
                </div>
                <div className="col-md-2 col-sm-6">
                  <label className="form-label">Verified</label>
                  <select className="form-select" value={isVerifiedFilter} onChange={(e) => setIsVerifiedFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="true">Verified</option>
                    <option value="false">Not Verified</option>
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
                <table className="table table-hover" style={{ minWidth: '1000px' }}>
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>ID</th>
                      <th className="text-center">User ID</th>
                      <th>Coin</th>
                      <th>Label</th>
                      <th>Address</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Verified</th>
                      <th className="text-center">Flagged</th>
                      <th className="text-end">Usage</th>
                      <th className="text-end">Withdrawn</th>
                      <th className="text-center">Actions</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="text-center text-muted py-4">
                          No withdrawal addresses found
                        </td>
                      </tr>
                    ) : (
                      addresses.map((addr) => {
                        const coinSymbol = (addr.coinSymbol || '').toUpperCase()
                        const networkSymbol = (addr.networkSymbol || '').toUpperCase()
                        const isPending = addr.status === 'pending_verification'
                        const isFlagged = !!addr.isFlagged
                        const isVerified = !!addr.isVerified

                        return (
                          <tr key={addr.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/withdrawal-addresses/${addr.id}`)}>
                            <td>
                              <span className="fw-semibold text-primary">{addr.id}</span>
                            </td>
                            <td className="text-center">{addr.userId}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={28} className="me-2" />
                                <div>
                                  <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{coinSymbol}</div>
                                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{networkSymbol}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="text-muted" style={{ fontSize: '0.85rem' }}>{addr.label || '-'}</span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1" style={{ whiteSpace: 'nowrap' }}>
                                <span style={{ fontSize: '0.8rem' }}>
                                  {addr.address || 'N/A'}
                                </span>
                                {addr.address && (
                                  <button
                                    className="btn btn-sm p-0 border-0 text-muted"
                                    onClick={(e) => { e.stopPropagation(); handleCopy(addr.address) }}
                                    title="Copy address"
                                    style={{ flexShrink: 0 }}
                                  >
                                    <i className="bx bx-copy" style={{ fontSize: '0.85rem' }}></i>
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="text-center text-nowrap">
                              <span className={statusBadgeClass(addr.status)}>
                                {statusLabel(addr.status)}
                              </span>
                            </td>
                            <td className="text-center">
                              {isVerified ? (
                                <i className="bx bx-check-circle text-success" style={{ fontSize: '1.1rem' }}></i>
                              ) : (
                                <i className="bx bx-x-circle text-muted" style={{ fontSize: '1.1rem' }}></i>
                              )}
                            </td>
                            <td className="text-center">
                              {isFlagged ? (
                                <span className="badge bg-label-warning"><i className="bx bx-flag me-1"></i>Flagged</span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td className="text-end">
                              <span className="fw-medium">{addr.usageCount ?? 0}</span>
                            </td>
                            <td className="text-end">
                              <span className="fw-medium">{addr.totalWithdrawn || '0'}</span>
                            </td>
                            <td className="text-center">
                              <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                  type="button"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                                >
                                  <i className="bx bx-dots-vertical-rounded"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                  {!isFlagged ? (
                                    <li>
                                      <button className="dropdown-item" onClick={() => openActionModal('flag', addr)}>
                                        <i className="bx bx-flag me-2 text-warning"></i>Flag
                                      </button>
                                    </li>
                                  ) : (
                                    <li>
                                      <button className="dropdown-item" onClick={() => openActionModal('unflag', addr)}>
                                        <i className="bx bx-check-circle me-2 text-success"></i>Unflag
                                      </button>
                                    </li>
                                  )}
                                  {!isVerified && (
                                    <li>
                                      <button className="dropdown-item" onClick={() => openActionModal('forceVerify', addr)}>
                                        <i className="bx bx-shield-quarter me-2 text-info"></i>Force Verify
                                      </button>
                                    </li>
                                  )}
                                  {addr.status !== 'deleted' && (
                                    <>
                                      <li><hr className="dropdown-divider" /></li>
                                      <li>
                                        <button className="dropdown-item text-danger" onClick={() => openActionModal('delete', addr)}>
                                          <i className="bx bx-trash me-2"></i>Delete Permanently
                                        </button>
                                      </li>
                                    </>
                                  )}
                                </ul>
                              </div>
                            </td>
                            <td className="text-nowrap" style={{ fontSize: '0.85rem' }}>
                              {formatDate(addr.createdAt)}
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

      {/* Action Confirmation Modal */}
      {showActionModal && selectedAddress && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !actionLoading && setShowActionModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bx ${actionConfig.icon} me-2`}></i>
                  {actionConfig.title}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowActionModal(false)} disabled={actionLoading}></button>
              </div>
              <div className="modal-body">
                <div className="card mb-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e3e3' }}>
                  <div className="card-body py-2 px-3">
                    <div className="row g-2">
                      <div className="col-6">
                        <small className="text-muted d-block">Address ID</small>
                        <strong>#{selectedAddress.id}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">User ID</small>
                        <strong>{selectedAddress.userId}</strong>
                      </div>
                      <div className="col-12">
                        <small className="text-muted d-block">Address</small>
                        <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{selectedAddress.address}</code>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="mb-3">
                  <label className="form-label">Reason <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter reason (minimum 10 characters)..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    disabled={actionLoading}
                  ></textarea>
                  <small className="text-muted">{actionReason.trim().length}/500 characters</small>
                </div>

                {actionType === 'forceVerify' && (
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="skipLockPeriod"
                      checked={skipLockPeriod}
                      onChange={(e) => setSkipLockPeriod(e.target.checked)}
                      disabled={actionLoading}
                    />
                    <label className="form-check-label" htmlFor="skipLockPeriod">
                      Skip lock period
                    </label>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowActionModal(false)} disabled={actionLoading}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${actionConfig.btnClass}`}
                  onClick={handleAction}
                  disabled={actionLoading || actionReason.trim().length < 10}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className={`bx ${actionConfig.icon} me-1`}></i>
                      {actionConfig.btnLabel}
                    </>
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
