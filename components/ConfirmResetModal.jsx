'use client'

/**
 * Reusable confirmation modal using Sneat/Bootstrap 5 classes.
 * Replaces browser `confirm()` for a consistent, non-blocking UX.
 */
export default function ConfirmResetModal({ title, message, onConfirm, onClose, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-xl shadow-xl mx-4 w-full" style={{ maxWidth: '340px' }}>
          <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
            <h5 className="font-semibold">{title}</h5>
            <button type="button" className="text-surface-400 hover:text-surface-700 text-xl leading-none" onClick={onClose}>&times;</button>
          </div>
          <div className="p-6">
            <p className="mb-0">{message}</p>
          </div>
          <div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{cancelLabel}</button>
            <button type="button" className="btn btn-primary" onClick={onConfirm}>{confirmLabel}</button>
          </div>
      </div>
    </div>
  )
}
