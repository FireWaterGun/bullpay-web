'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

export function ChainSettingModal({ show, loading, editingChain, chainForm, setChainForm, onClose, onSave, getTitle }) {
  const { t } = useAdminTranslation()

  if (!show) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center block" tabIndex="-1">
        <div className="w-full max-w-lg mx-4">
          <div className="bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-200">
              <h5 className="text-lg font-semibold text-surface-800">
                {editingChain
                  ? t('admin.evm.editChainSetting', { defaultValue: `Edit ${getTitle()}` })
                  : t('admin.evm.addChainSetting', { defaultValue: `Add ${getTitle()}` })
                }
              </h5>
              <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="col-span-12">
                  <label className="form-label">{t('admin.evm.chainId', { defaultValue: 'Chain ID' })} *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="1, 56, 137..."
                    value={chainForm.chainId}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^[0-9]*$/.test(value) && value.length <= 20) {
                        setChainForm({ ...chainForm, chainId: value })
                      }
                    }}
                    disabled={!!editingChain}
                    maxLength={20}
                  />
                </div>
                <div className="col-span-12">
                  <label className="form-label">{t('admin.evm.value', { defaultValue: 'Value' })} *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0.1, 1.2, 100..."
                    value={chainForm.value}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^[0-9.]*$/.test(value) && value.length <= 20) {
                        setChainForm({ ...chainForm, value })
                      }
                    }}
                    maxLength={20}
                  />
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

export function DeleteConfirmModal({ show, loading, deleteTarget, onClose, onConfirm }) {
  const { t } = useAdminTranslation()

  if (!show) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center block" tabIndex="-1">
        <div className="w-full max-w-lg mx-4">
          <div className="bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-200">
              <h5 className="text-lg font-semibold text-surface-800">
                {t('admin.evm.confirmDelete', { defaultValue: 'Confirm Delete' })}
              </h5>
              <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="p-5">
              <p className="mb-0">
                {t('admin.evm.deleteChainConfirm', {
                  defaultValue: `Are you sure you want to delete chain ${deleteTarget.chainId}?`,
                  chainId: deleteTarget.chainId
                })}
              </p>
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
                className="btn btn-danger"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner w-4 h-4 mr-2"></span>
                    {t('actions.deleting', { defaultValue: 'Deleting...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-trash mr-1"></i>
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
