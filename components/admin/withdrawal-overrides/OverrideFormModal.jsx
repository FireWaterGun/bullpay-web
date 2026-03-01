'use client'

import { useTranslation } from 'react-i18next'

export default function OverrideFormModal({ modalType, editingKey, formData, setFormData, loading, onSave, onClose }) {
  const { t } = useTranslation()

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {editingKey
                  ? t('admin.withdrawal.editOverride', { defaultValue: 'Edit Override' })
                  : t('admin.withdrawal.addOverride', { defaultValue: 'Add Override' })
                }
              </h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">
                    {modalType === 'coin' && t('admin.withdrawal.coinSymbol', { defaultValue: 'Coin Symbol' })}
                    {modalType === 'network' && t('admin.withdrawal.networkName', { defaultValue: 'Network Name' })}
                    {modalType === 'coinNetwork' && t('admin.withdrawal.coinNetworkId', { defaultValue: 'CoinNetwork ID' })}
                    *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.key}
                    onChange={(e) => {
                      const value = e.target.value
                      if (modalType === 'coinNetwork') {
                        if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                          setFormData({ ...formData, key: value })
                        }
                      } else {
                        if (value === '' || (/^[a-zA-Z0-9]*$/.test(value) && value.length <= 20)) {
                          setFormData({ ...formData, key: value })
                        }
                      }
                    }}
                    disabled={!!editingKey}
                    placeholder={modalType === 'coinNetwork' ? '999999' : 'BTC, ETH, etc.'}
                    maxLength={20}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.minimum}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                        setFormData({ ...formData, minimum: value })
                      }
                    }}
                    maxLength={20}
                  />
                </div>
                {modalType === 'coinNetwork' && (
                  <div className="col-md-6">
                    <label className="form-label">{t('admin.withdrawal.maximum', { defaultValue: 'Maximum' })}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.maximum}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                          setFormData({ ...formData, maximum: value })
                        }
                      }}
                      maxLength={20}
                    />
                  </div>
                )}
                <div className="col-12">
                  <label className="form-label">{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</label>
                  <select
                    className="form-select"
                    value={formData.feeType}
                    onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                {formData.feeType === 'percentage' && (
                  <>
                    <div className="col-md-4">
                      <label className="form-label">{t('admin.withdrawal.feePercentage', { defaultValue: 'Fee %' })}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.feePercentage}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, feePercentage: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">{t('admin.withdrawal.feeMin', { defaultValue: 'Min Fee' })}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.feeMin}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, feeMin: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">{t('admin.withdrawal.feeMax', { defaultValue: 'Max Fee' })}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.feeMax}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, feeMax: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                  </>
                )}
                {formData.feeType === 'fixed' && (
                  <div className="col-12">
                    <label className="form-label">{t('admin.withdrawal.feeFixed', { defaultValue: 'Fixed Fee' })}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.feeFixed}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                          setFormData({ ...formData, feeFixed: value })
                        }
                      }}
                      maxLength={20}
                    />
                  </div>
                )}
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
