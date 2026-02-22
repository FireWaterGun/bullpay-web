export default function ConfirmActionModal({ action, loading, onConfirm, onClose, t }) {
  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !loading && onClose()}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {action === 'rotate-secret'
                ? t('merchant.rotateSecretTitle', { defaultValue: 'Rotate API Secret' })
                : t('merchant.regenerateKeyTitle', { defaultValue: 'Regenerate API Key & Secret' })
              }
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body">
            {action === 'rotate-secret' ? (
              <div className="alert alert-primary py-2 mb-0" role="alert">
                <i className="bx bx-info-circle me-1"></i>
                {t('merchant.rotateConfirm', { defaultValue: 'This will generate a new API secret. Your API key will remain the same. The old secret will stop working immediately.' })}
              </div>
            ) : (
              <div className="alert alert-danger py-2 mb-0" role="alert">
                <i className="bx bx-error me-1"></i>
                {t('merchant.regenerateConfirm', { defaultValue: 'This will generate a new API key AND secret. All existing credentials will be invalidated immediately.' })}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="button"
              className={`btn ${action === 'rotate-secret' ? 'btn-primary' : 'btn-danger'}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-1"></span>{t('merchant.processing', { defaultValue: 'Processing...' })}</>
              ) : (
                action === 'rotate-secret'
                  ? t('merchant.rotateSecret', { defaultValue: 'Rotate Secret' })
                  : t('merchant.regenerateKey', { defaultValue: 'Regenerate Key & Secret' })
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
