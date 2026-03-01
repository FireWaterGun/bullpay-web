'use client'

export default function AddressActionModal({
  selectedAddress,
  actionType,
  actionConfig,
  actionReason,
  setActionReason,
  skipLockPeriod,
  setSkipLockPeriod,
  actionLoading,
  onAction,
  onClose,
}) {
  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !actionLoading && onClose()}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={`bx ${actionConfig.icon} me-2`}></i>
              {actionConfig.title}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={actionLoading}></button>
          </div>
          <div className="modal-body">
            <div className="card mb-3" style={{ backgroundColor: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}>
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
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={actionLoading}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${actionConfig.btnClass}`}
              onClick={onAction}
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
  )
}
