'use client'

import { useTranslation } from 'react-i18next'

export default function ConfigurationForm({ formData, handleChange, handleSubmit, loading, isEdit, onCancel }) {
  const { t } = useTranslation()

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <span className="badge bg-primary rounded-pill me-2">3</span>
          {t('crypto.configuration', { defaultValue: 'Configuration' })}
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row g-4">

              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.contractAddress', { defaultValue: 'Contract Address' })}
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="contractAddress"
                  name="contractAddress"
                  value={formData.contractAddress}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0x..."
                />
                <small className="text-muted">
                  {t('crypto.contractAddressHelp', { defaultValue: 'Leave empty for native coins' })}
                </small>
              </div>

              {/* Decimals */}
              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.decimals', { defaultValue: 'Decimals' })}
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="decimals"
                  name="decimals"
                  value={formData.decimals}
                  onChange={handleChange}
                  disabled={loading || isEdit}
                  min="0"
                  max="18"
                  placeholder="18"
                />
                <small className="text-muted">
                  {isEdit
                    ? t('crypto.decimalsReadOnly', { defaultValue: 'Decimals cannot be changed after creation' })
                    : t('crypto.coinNetworkDecimalsHelp', { defaultValue: 'Override coin decimals if needed' })
                  }
                </small>
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.status', { defaultValue: 'Status' })} <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="active">{t('crypto.statusActive', { defaultValue: 'Active' })}</option>
                  <option value="inactive">{t('crypto.statusInactive', { defaultValue: 'Inactive' })}</option>
                  <option value="maintenance">{t('crypto.statusMaintenance', { defaultValue: 'Maintenance' })}</option>
                </select>
                <small className="text-muted">
                  {t('crypto.statusHelp', { defaultValue: 'Current status of this coin-network pair' })}
                </small>
              </div>

              {/* Withdraw Toggle */}
              <div className="col-md-6">
                <div className="d-flex align-items-center justify-content-between p-3 border rounded">
                  <div>
                    <h6 className="mb-1">{t('crypto.withdrawEnabled', { defaultValue: 'Withdraw Enabled' })}</h6>
                    <small className="text-muted">{t('crypto.allowWithdrawals', { defaultValue: 'Allow users to withdraw' })}</small>
                  </div>
                  <div className="form-check form-switch form-switch-lg m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="withdrawEnabled"
                      id="withdrawEnabled"
                      checked={formData.withdrawEnabled}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="withdrawEnabled"></label>
                  </div>
                </div>
              </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-2 justify-content-end mt-5">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              <i className="bx bx-x me-1"></i>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !formData.coinId || !formData.networkId}
            >
              <i className={`bx ${loading ? 'bx-loader-alt bx-spin' : 'bx-save'} me-1`}></i>
              {loading
                ? t('common.saving', { defaultValue: 'Saving...' })
                : isEdit
                  ? t('actions.update', { defaultValue: 'Update' })
                  : t('actions.create', { defaultValue: 'Create' })
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
