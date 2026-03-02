'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

export default function DeleteConfirmModal({ target, loading, onConfirm, onClose }) {
  const { t } = useAdminTranslation()

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {t('admin.network.confirmDelete', { defaultValue: 'Confirm Delete' })}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">
                {target.type === 'baseFee'
                  ? t('admin.network.deleteBaseFeeConfirm', { defaultValue: `Are you sure you want to delete base fee for ${target.network}?`, network: target.network })
                  : t('admin.network.deleteSlippageConfirm', { defaultValue: `Are you sure you want to delete slippage for ${target.network}?`, network: target.network })
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
