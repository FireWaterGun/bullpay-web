'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

export function ChainSettingModal({ show, loading, editingChain, chainForm, setChainForm, onClose, onSave, getTitle }) {
  const { t } = useAdminTranslation()

  if (!show) return null

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {editingChain
                  ? t('admin.evm.editChainSetting', { defaultValue: `Edit ${getTitle()}` })
                  : t('admin.evm.addChainSetting', { defaultValue: `Add ${getTitle()}` })
                }
              </h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">{t('admin.evm.chainId', { defaultValue: 'Chain ID' })} *</label>
                  <input
                    type="text"
                    className="form-control"
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
                <div className="col-12">
                  <label className="form-label">{t('admin.evm.value', { defaultValue: 'Value' })} *</label>
                  <input
                    type="text"
                    className="form-control"
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

export function DeleteConfirmModal({ show, loading, deleteTarget, onClose, onConfirm }) {
  const { t } = useAdminTranslation()

  if (!show) return null

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {t('admin.evm.confirmDelete', { defaultValue: 'Confirm Delete' })}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">
                {t('admin.evm.deleteChainConfirm', {
                  defaultValue: `Are you sure you want to delete chain ${deleteTarget.chainId}?`,
                  chainId: deleteTarget.chainId
                })}
              </p>
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
                className="btn btn-danger"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    {t('actions.deleting', { defaultValue: 'Deleting...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-trash me-1"></i>
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
