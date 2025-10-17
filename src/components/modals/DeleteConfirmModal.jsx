import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  if (!show) return null

  return (
    <div 
      className="modal show d-block" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} 
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-dialog-centered" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {title || t('crypto.confirmDelete', { defaultValue: 'Confirm Delete' })}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>
          
          <div className="modal-body">
            <p className="mb-2">
              {message}
            </p>
                        
            <div className="alert alert-danger mt-3 mb-0">
              <div className="d-flex align-items-start">
                <i className="bx bx-error-circle fs-4 me-2"></i>
                <div>
                  <strong>Warning:</strong>
                  <br />
                  {t('crypto.deleteWarning', { 
                    defaultValue: 'This action cannot be undone.' 
                  })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-label-secondary" 
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
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  {t('actions.deleting', { defaultValue: 'Deleting...' })}
                </>
              ) : (
                <>
                  <i className="bx bx-trash me-2"></i>
                  {t('actions.delete', { defaultValue: 'Delete' })}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
