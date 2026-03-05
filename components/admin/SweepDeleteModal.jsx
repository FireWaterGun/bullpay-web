'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

/**
 * Delete confirmation modal for sweep overrides.
 *
 * @param {Object} props
 * @param {boolean} props.show - Whether the modal is visible
 * @param {boolean} props.loading - Disables buttons and shows spinner when true
 * @param {{ id: string, type: 'coin'|'network' }} props.target - The override being deleted
 * @param {Function} props.onConfirm - Called when the Delete button is clicked
 * @param {Function} props.onClose - Called when the modal should close
 */
export default function SweepDeleteModal({ show, loading, target, onConfirm, onClose }) {
  const { t } = useAdminTranslation()

  if (!show) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center block" tabIndex="-1">
        <div className="w-full max-w-lg mx-4">
          <div className="bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-200">
              <h5 className="text-lg font-semibold text-surface-800">
                {t('admin.sweep.confirmDelete', { defaultValue: 'Confirm Delete' })}
              </h5>
              <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="p-5">
              <p className="mb-0">
                {target.type === 'coin'
                  ? t('admin.sweep.deleteCoinConfirm', { defaultValue: `Are you sure you want to delete override for ${target.id}?`, id: target.id })
                  : t('admin.sweep.deleteNetworkConfirm', { defaultValue: `Are you sure you want to delete override for network ${target.id}?`, id: target.id })
                }
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
              <button
                type="button"
                className="btn btn bg-surface-200 text-surface-700 hover:bg-surface-300"
                onClick={onClose}
                disabled={loading}
              >
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner w-4 h-4 mr-2"></span>
                    {t('actions.deleting', { defaultValue: 'Deleting...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-trash mr-1"></i>
                    {t('actions.delete', { defaultValue: 'Delete' })}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
