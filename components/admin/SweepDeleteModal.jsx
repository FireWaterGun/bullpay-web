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
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {t('admin.sweep.confirmDelete', { defaultValue: 'Confirm Delete' })}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">
                {target.type === 'coin'
                  ? t('admin.sweep.deleteCoinConfirm', { defaultValue: `Are you sure you want to delete override for ${target.id}?`, id: target.id })
                  : t('admin.sweep.deleteNetworkConfirm', { defaultValue: `Are you sure you want to delete override for network ${target.id}?`, id: target.id })
                }
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
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
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    {t('actions.deleting', { defaultValue: 'Deleting...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-trash me-1"></i>
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
