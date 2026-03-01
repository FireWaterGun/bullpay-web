'use client'

import { useTranslation } from 'react-i18next'

export default function SlippageModal({ form, editing, loading, onFormChange, onSave, onClose }) {
  const { t } = useTranslation()

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {editing ? t('admin.network.editSlippage', { defaultValue: 'Edit Slippage' }) : t('admin.network.addSlippage', { defaultValue: 'Add Slippage' })}
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
                  <label className="form-label">{t('admin.network.slippagePercent', { defaultValue: 'Slippage %' })} *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0.15"
                    value={form.percent}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^[0-9.]*$/.test(value) && value.length <= 20) {
                        onFormChange({ ...form, percent: value })
                      }
                    }}
                    maxLength={20}
                  />
                  <small className="text-muted">
                    {t('admin.network.slippageHelp', { defaultValue: 'Network-specific slippage percentage for fee volatility protection (e.g., 0.15 = 15%)' })}
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
