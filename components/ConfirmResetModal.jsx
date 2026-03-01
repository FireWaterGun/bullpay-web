'use client'

/**
 * Reusable confirmation modal using Sneat/Bootstrap 5 classes.
 * Replaces browser `confirm()` for a consistent, non-blocking UX.
 */
export default function ConfirmResetModal({ title, message, onConfirm, onClose, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) {
  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">{message}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>{cancelLabel}</button>
              <button type="button" className="btn btn-primary" onClick={onConfirm}>{confirmLabel}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
