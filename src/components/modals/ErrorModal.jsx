import { useTranslation } from 'react-i18next'

/**
 * Reusable Error Modal
 *
 * @param {boolean} show - Show/hide modal
 * @param {function} onClose - Callback when modal is closed
 * @param {string} title - Modal title (optional, defaults to 'Operation Failed')
 * @param {string} message - Error message to display
 */
export default function ErrorModal({
  show,
  onClose,
  title,
  message
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
              {title || t('crypto.operationFailed', { defaultValue: 'Operation Failed' })}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <p className="mb-0">{message}</p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
            >
              {t('actions.close', { defaultValue: 'Close' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
