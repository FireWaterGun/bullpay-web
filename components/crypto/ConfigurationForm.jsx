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
                  className="form-control form-control-lg"
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
                  className="form-control form-control-lg"
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
                  {t('crypto.minWithdrawAmount', { defaultValue: 'Min Withdraw Amount' })}
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="minWithdrawAmount"
                  name="minWithdrawAmount"
                  value={formData.minWithdrawAmount}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="20"
                  pattern="^\d+(\.\d+)?$"
                  maxLength={32}
                />
              </div>

              {/* Max Withdraw Amount */}
              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.maxWithdrawAmount', { defaultValue: 'Max Withdraw Amount' })}
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="maxWithdrawAmount"
                  name="maxWithdrawAmount"
                  value={formData.maxWithdrawAmount}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="50000"
                  pattern="^\d+(\.\d+)?$"
                  maxLength={32}
                />
              </div>

              {/* Withdraw Fee (total, legacy) */}
              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.withdrawFee', { defaultValue: 'Withdraw Fee (Total)' })}
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="withdrawFee"
                  name="withdrawFee"
                  value={formData.withdrawFee}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="5"
                  pattern="^\d+(\.\d+)?$"
                  maxLength={32}
                />
              </div>

              {/* Withdraw Fee Base (auto-updated, read-only on edit) */}
              {isEdit && (
                <div className="col-md-6">
                  <label className="form-label">
                    {t('crypto.withdrawFeeBase', { defaultValue: 'Fee Base (Gas Cost)' })}
                    <span className="badge bg-label-info ms-2" style={{ fontSize: '0.65rem' }}>AUTO</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={formData.withdrawFeeBase || '-'}
                    disabled
                    readOnly
                  />
                  <small className="text-muted">
                    {t('crypto.withdrawFeeBaseHelp', { defaultValue: 'Auto-calculated from gas prices. Cannot be edited manually.' })}
                  </small>
                </div>
              )}

              {/* Withdraw Fee Percent (platform margin) */}
              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.withdrawFeePercent', { defaultValue: 'Fee Percent (%)' })}
                  <span className="badge bg-label-success ms-2" style={{ fontSize: '0.65rem' }}>MARGIN</span>
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="withdrawFeePercent"
                  name="withdrawFeePercent"
                  value={formData.withdrawFeePercent}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0.50"
                  pattern="^\d+(\.\d+)?$"
                  maxLength={10}
                />
                <small className="text-muted">
                  {t('crypto.withdrawFeePercentHelp', { defaultValue: 'Platform fee as % of withdrawal amount. This is your revenue margin.' })}
                </small>
              </div>

              {/* Daily Withdraw Limit USD */}
              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.dailyWithdrawLimitUsd', { defaultValue: 'Daily Withdraw Limit (USD)' })}
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="dailyWithdrawLimitUsd"
                  name="dailyWithdrawLimitUsd"
                  value={formData.dailyWithdrawLimitUsd}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="10000.00"
                  pattern="^\d+(\.\d{1,2})?$"
                  maxLength={17}
                />
                <small className="text-muted">
                  {t('crypto.dailyWithdrawLimitUsdHelp', { defaultValue: 'Maximum daily withdrawal limit in USD. Leave empty for no limit.' })}
                </small>
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.status', { defaultValue: 'Status' })} <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-lg"
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
