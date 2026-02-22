import { useTranslation } from 'react-i18next'

export default function BaseFeeModal({ form, editing, loading, onFormChange, onSave, onClose }) {
  const { t } = useTranslation()

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {editing ? t('admin.network.editBaseFee', { defaultValue: 'Edit Base Fee' }) : t('admin.network.addBaseFee', { defaultValue: 'Add Base Fee' })}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">{t('admin.network.networkSymbol', { defaultValue: 'Network Symbol' })} *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="BTC, ETH, BNB..."
                    value={form.network}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      if (/^[A-Z0-9]*$/.test(value) && value.length <= 20) {
                        onFormChange({ ...form, network: value })
                      }
                    }}
                    disabled={!!editing}
                    maxLength={20}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">{t('admin.network.fee', { defaultValue: 'Fee' })} *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0.001"
                    value={form.fee}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^[0-9.]*$/.test(value) && value.length <= 20) {
                        onFormChange({ ...form, fee: value })
                      }
                    }}
                    maxLength={20}
                  />
                  <small className="text-muted">
                    {t('admin.network.baseFeeHelp', { defaultValue: 'Base network fee in native currency for quick estimates' })}
                  </small>
                </div>
              </div>
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
                className="btn btn-primary"
                onClick={onSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    {t('actions.saving', { defaultValue: 'Saving...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-save me-1"></i>
                    {t('actions.save', { defaultValue: 'Save' })}
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
