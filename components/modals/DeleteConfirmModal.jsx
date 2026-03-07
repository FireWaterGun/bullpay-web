'use client';

import { useTranslation } from 'react-i18next';
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

/**
 * Reusable Delete Confirmation Modal
 *
 * @param {boolean} show - Show/hide modal
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onConfirm - Callback when delete is confirmed
 * @param {boolean} loading - Loading state during deletion
 * @param {string} title - Modal title (optional)
 * @param {string} message - Confirmation message
 * @param {string} itemName - Name of item to delete (optional)
 * @param {string} itemDetails - Additional details to show (optional)
 */
export default function DeleteConfirmModal({
  show,
  onClose,
  onConfirm,
  loading = false,
  title,
  message,
  itemName,
  itemDetails
}) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"

      onClick={onClose}>
      
      <div
        className="w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}>
        
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              {title || t('crypto.confirmDelete', { defaultValue: 'Confirm Delete' })}
            </h5>
            <button
              type="button"
              className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"
              onClick={onClose}
              disabled={loading}>
              <i className="bx bx-x"></i>
            </button>
          </div>

          <div className="p-5">
            <p className="mb-2">
              {message}
            </p>

            <Alert className="mt-3 mb-0">
              <div className="flex items-start">
                <i className="bx bx-error-circle text-2xl mr-2"></i>
                <div>
                  <strong>Warning:</strong>
                  <br />
                  {t('crypto.deleteWarning', {
                    defaultValue: 'This action cannot be undone.'
                  })}
                </div>
              </div>
            </Alert>
          </div>

          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button
              type="button"

              onClick={onClose}
              disabled={loading} className="bg-surface-100 text-surface-700 hover:bg-surface-200 shadow-none">
              
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="button"

              onClick={onConfirm}
              disabled={loading} variant="danger">
              
              {loading ?
              <>
                  <Spinner role="status" className="w-4 h-4 mr-2" />
                  {t('actions.deleting', { defaultValue: 'Deleting...' })}
                </> :

              <>
                  <i className="bx bx-trash mr-2"></i>
                  {t('actions.delete', { defaultValue: 'Delete' })}
                </>
              }
            </Button>
          </div>
        </div>
      </div>
    </div>);

}