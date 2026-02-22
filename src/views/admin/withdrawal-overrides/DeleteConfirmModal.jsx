import { useTranslation } from 'react-i18next'

export default function DeleteConfirmModal({ loading, onConfirm, onClose }) {
  const { t } = useTranslation()

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {t('admin.withdrawal.confirmDelete', { defaultValue: 'Confirm Delete' })}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">
                {t('admin.withdrawal.deleteConfirm', {
                  defaultValue: `Are you sure you want to delete this override?`
                })}
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
