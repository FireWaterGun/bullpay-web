'use client';
import { Button } from './ui'

/**
 * Reusable confirmation modal.
 * Replaces browser `confirm()` for a consistent, non-blocking UX.
 */
export default function ConfirmResetModal({ title, message, onConfirm, onClose, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl mx-4 w-full max-w-[340px]" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
            <h5 className="font-semibold">{title}</h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none" onClick={onClose}><i className="bx bx-x"></i></button>
          </div>
          <div className="p-6">
            <p className="mb-0">{message}</p>
          </div>
          <div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-2">
            <Button type="button" onClick={onClose} className="bg-surface-200 text-surface-700 hover:bg-surface-300">{cancelLabel}</Button>
            <Button type="button" onClick={onConfirm}>{confirmLabel}</Button>
          </div>
      </div>
    </div>);

}