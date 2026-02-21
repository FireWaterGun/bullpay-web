import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import {
  getWithdrawalAddressById,
  flagWithdrawalAddress,
  unflagWithdrawalAddress,
  forceVerifyWithdrawalAddress,
  deleteWithdrawalAddress,
} from '../../api/admin.ts'
import CoinImg from '../../components/CoinImg'
import { copyToClipboard as copyText } from '../../utils/clipboard'

export default function WithdrawalAddressDetail() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const navigate = useNavigate()
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState(null)

  // Action modal states
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState('')
  const [actionReason, setActionReason] = useState('')
  const [skipLockPeriod, setSkipLockPeriod] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadAddress()
  }, [id])

  async function loadAddress() {
    try {
      setLoading(true)
      const res = await getWithdrawalAddressById(token, parseInt(id))
      // API returns { address: { id, userId, address: "0x...", ... } }
      const addr = res?.address && typeof res.address === 'object' ? res.address : res
      setAddress(addr)
    } catch (error) {
      console.error('Failed to load withdrawal address:', error)
      toast.error('Failed to load withdrawal address')
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
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success('Copied to clipboard!')
    else toast.error('Failed to copy')
  }

  function statusBadgeClass(s) {
    const v = String(s || '').toLowerCase()
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
    return String(s || 'N/A')
  }

  function openActionModal(type) {
    setActionType(type)
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
    if (!actionReason.trim() || actionReason.trim().length < 10) {
      toast.error('Please provide a reason (minimum 10 characters)')
      return
    }

    try {
      setActionLoading(true)
      const addrId = parseInt(id)

      switch (actionType) {
        case 'flag':
          await flagWithdrawalAddress(token, addrId, actionReason.trim())
          toast.success('Address flagged successfully')
          break
        case 'unflag':
          await unflagWithdrawalAddress(token, addrId, actionReason.trim())
          toast.success('Address unflagged successfully')
          break
        case 'forceVerify':
          await forceVerifyWithdrawalAddress(token, addrId, actionReason.trim(), skipLockPeriod)
          toast.success('Address force verified successfully')
          break
        case 'delete':
          await deleteWithdrawalAddress(token, addrId, actionReason.trim())
          toast.success('Address permanently deleted')
          navigate('/admin/withdrawal-addresses', { replace: true })
          return
      }

      setShowActionModal(false)
      setActionReason('')
      loadAddress()
    } catch (error) {
      console.error(`Failed to ${actionType} address:`, error)
      toast.error(`Failed to ${actionType} address`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
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

  if (!address) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
          <h5 className="text-muted mt-3">Address not found</h5>
          <button className="btn btn-primary mt-3" onClick={() => navigate('/admin/withdrawal-addresses')}>
            <i className="bx bx-arrow-back me-1"></i>Back to Addresses
          </button>
        </div>
      </div>
    )
  }

  const coinSymbol = (address.coinSymbol || '').toUpperCase()
  const networkSymbol = (address.networkSymbol || '').toUpperCase()
  const isPending = address.status === 'pending_verification'
  const isFlagged = !!address.isFlagged
  const isVerified = !!address.isVerified
  const actionConfig = getActionConfig()

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Back Button */}
          <button onClick={() => navigate('/admin/withdrawal-addresses')} className="btn btn-outline-secondary mb-3">
            <i className="bx bx-arrow-back me-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>

          {/* Header Card */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={40} className="me-1" />
                  <div>
                    <h4 className="mb-0">
                      Withdrawal Address #{address.id}
                    </h4>
                    <span className="text-muted">{coinSymbol} on {networkSymbol}</span>
                  </div>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button className="btn btn-outline-primary btn-sm" onClick={loadAddress} disabled={loading}>
                    <i className="bx bx-refresh me-1"></i>Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Details */}
            <div className="col-lg-8">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bx bx-detail me-2"></i>Address Details</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <small className="text-muted d-block mb-1">Address ID</small>
                      <span className="fw-semibold">{address.id}</span>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted d-block mb-1">User ID</small>
                      <span className="fw-semibold">{address.userId}</span>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted d-block mb-1">Label</small>
                      <span>{address.label ? address.label : <span className="text-muted">—</span>}</span>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted d-block mb-1">Coin / Network</small>
                      <div className="d-flex align-items-center gap-2">
                        <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={20} className="me-1" />
                        <span className="fw-medium">{coinSymbol}</span>
                        <span className="text-muted">/ {networkSymbol}</span>
                      </div>
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block mb-1">Address</small>
                      <div className="d-flex align-items-center gap-2">
                        <code className="text-primary" style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>
                          {address.address || 'N/A'}
                        </code>
                        {address.address && (
                          <button
                            className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                            onClick={() => handleCopy(address.address)}
                            title="Copy"
                          >
                            <i className="bx bx-copy" style={{ fontSize: '1rem' }}></i>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted d-block mb-1">Created</small>
                      <span>{formatDate(address.createdAt)}</span>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted d-block mb-1">Updated</small>
                      <span>{formatDate(address.updatedAt)}</span>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted d-block mb-1">Usage Count</small>
                      <span className="fw-semibold">{address.usageCount ?? 0}</span>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted d-block mb-1">Total Withdrawn</small>
                      <span className="fw-semibold">{address.totalWithdrawn || '0'}</span>
                    </div>
                    {address.lockUntil && (
                      <div className="col-sm-6">
                        <small className="text-muted d-block mb-1">Lock Until</small>
                        <span>{formatDate(address.lockUntil)}</span>
                        {address.isLocked && <span className="badge bg-label-warning ms-2">Locked</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Audit Log */}
              {address.auditLogs && address.auditLogs.length > 0 && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0"><i className="bx bx-history me-2"></i>Audit Log</h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-sm mb-0">
                        <thead>
                          <tr>
                            <th>Action</th>
                            <th>Admin</th>
                            <th>Reason</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {address.auditLogs.map((log, idx) => (
                            <tr key={idx}>
                              <td><span className="fw-medium">{log.action}</span></td>
                              <td>{log.adminId || log.performedBy || '—'}</td>
                              <td className="text-muted" style={{ maxWidth: 300, whiteSpace: 'normal' }}>{log.reason || '—'}</td>
                              <td className="text-nowrap">{formatDate(log.createdAt || log.timestamp)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status & Actions Sidebar */}
            <div className="col-lg-4">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0"><i className="bx bx-info-circle me-2"></i>Status</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <small className="text-muted d-block mb-1">Status</small>
                    <span className={statusBadgeClass(address.status)} style={{ fontSize: '0.85rem' }}>
                      {statusLabel(address.status)}
                    </span>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted d-block mb-1">Verified</small>
                    {isVerified ? (
                      <span className="text-success fw-medium"><i className="bx bx-check-circle me-1"></i>Verified</span>
                    ) : (
                      <span className="text-muted"><i className="bx bx-x-circle me-1"></i>Not Verified</span>
                    )}
                  </div>
                  <div className="mb-3">
                    <small className="text-muted d-block mb-1">Flagged</small>
                    {isFlagged ? (
                      <span className="text-warning fw-medium"><i className="bx bx-flag me-1"></i>Flagged</span>
                    ) : (
                      <span className="text-muted">Not Flagged</span>
                    )}
                  </div>
                  {address.flaggedReason && (
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">Flag Reason</small>
                      <span className="text-warning" style={{ fontSize: '0.85rem' }}>{address.flaggedReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Card */}
              {address.status !== 'deleted' && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0"><i className="bx bx-cog me-2"></i>Actions</h5>
                  </div>
                  <div className="card-body d-grid gap-2">
                    {!isFlagged ? (
                      <button className="btn btn-outline-warning" onClick={() => openActionModal('flag')}>
                        <i className="bx bx-flag me-2"></i>Flag Address
                      </button>
                    ) : (
                      <button className="btn btn-outline-success" onClick={() => openActionModal('unflag')}>
                        <i className="bx bx-check-circle me-2"></i>Remove Flag
                      </button>
                    )}
                    {!isVerified && (
                      <button className="btn btn-outline-info" onClick={() => openActionModal('forceVerify')}>
                        <i className="bx bx-shield-quarter me-2"></i>Force Verify
                      </button>
                    )}
                    <hr className="my-1" />
                    <button className="btn btn-outline-danger" onClick={() => openActionModal('delete')}>
                      <i className="bx bx-trash me-2"></i>Delete Permanently
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
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
                        <strong>#{address.id}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">User ID</small>
                        <strong>{address.userId}</strong>
                      </div>
                      <div className="col-12">
                        <small className="text-muted d-block">Address</small>
                        <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{address.address}</code>
                      </div>
                    </div>
                  </div>
                </div>

                {actionType === 'delete' && (
                  <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                    <i className="bx bx-error-circle me-2" style={{ fontSize: '1.25rem' }}></i>
                    <div>This action is <strong>irreversible</strong>. The address will be permanently deleted.</div>
                  </div>
                )}

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
                      id="skipLockPeriodDetail"
                      checked={skipLockPeriod}
                      onChange={(e) => setSkipLockPeriod(e.target.checked)}
                      disabled={actionLoading}
                    />
                    <label className="form-check-label" htmlFor="skipLockPeriodDetail">
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
