'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

export default function SlippageModal({ form, editing, loading, onFormChange, onSave, onClose }) {
  const { t } = useAdminTranslation()

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center block" tabIndex="-1">
        <div className="w-full max-w-lg mx-4">
          <div className="bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-200">
              <h5 className="text-lg font-semibold text-surface-800">
                {editing ? t('admin.network.editSlippage', { defaultValue: 'Edit Slippage' }) : t('admin.network.addSlippage', { defaultValue: 'Add Slippage' })}
              </h5>
              <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="col-span-12">
                  <label className="form-label">{t('admin.network.networkSymbol', { defaultValue: 'Network Symbol' })} *</label>
                  <input
                    type="text"
                    className="form-input"
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
                <div className="col-span-12">
                  <label className="form-label">{t('admin.network.slippagePercent', { defaultValue: 'Slippage %' })} *</label>
                  <input
                    type="text"
                    className="form-input"
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
            <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
              <button
                type="button"
                className="btn btn bg-surface-200 text-surface-700 hover:bg-surface-300"
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
                    <span className="spinner w-4 h-4 mr-2"></span>
                    {t('actions.saving', { defaultValue: 'Saving...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-save mr-1"></i>
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
