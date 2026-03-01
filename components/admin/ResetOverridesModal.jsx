'use client'

import { formatRoleLabel } from '@/lib/utils/roles'

export default function ResetOverridesModal({ role, overridesCount, actionLoading, onReset, onClose }) {
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bx bx-reset text-warning me-2"></i>
              Reset All Overrides
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-warning mb-3">
              <i className="bx bx-error-circle me-1"></i>
              This will remove <strong>all {overridesCount} overrides</strong> for the <strong>{formatRoleLabel(role)}</strong> role and revert to default permissions.
            </div>
            <p className="text-muted mb-0">This action cannot be undone.</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-warning"
              onClick={onReset}
              disabled={actionLoading === '__reset__'}
            >
              {actionLoading === '__reset__' ? (
                <><span className="spinner-border spinner-border-sm me-1"></span>Resetting...</>
              ) : (
                <><i className="bx bx-reset me-1"></i>Reset All Overrides</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
