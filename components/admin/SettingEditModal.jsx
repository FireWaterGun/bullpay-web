'use client'

import React from 'react'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { formatLabel } from '@/components/admin/settingsUtils'

export default function SettingEditModal({
  modalSetting,
  modalValue,
  setModalValue,
  modalLoading,
  onClose,
  onSave,
}) {
  const { t } = useAdminTranslation()

  if (!modalSetting) return null

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{t('admin.settings.editSetting', { defaultValue: 'Edit Setting' })}</h5>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">{t('admin.settings.descriptionLabel', { defaultValue: 'Description' })}</label>
                  <p className="mb-0 fw-semibold">{modalSetting.description || '-'}</p>
                </div>
                <div className="col-12">
                  <label className="form-label">{t('admin.settings.keyName', { defaultValue: 'Key' })}</label>
                  <p className="mb-0"><code>{modalSetting.keyName}</code></p>
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t('admin.settings.dataType', { defaultValue: 'Type' })}</label>
                  <p className="mb-0">{modalSetting.dataType}</p>
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t('admin.settings.scope', { defaultValue: 'Scope' })}</label>
                  <p className="mb-0">{formatLabel(modalSetting.scope || 'global')}{modalSetting.entityId ? ` #${modalSetting.entityId}` : ''}</p>
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t('admin.settings.defaultValue', { defaultValue: 'Default' })}</label>
                  <p className="mb-0">{modalSetting.defaultValue || '-'}</p>
                </div>
                <div className="col-12">
                  <hr className="my-0" />
                </div>
                <div className="col-12">
                  <label className="form-label">{t('admin.settings.value', { defaultValue: 'Value' })} *</label>
                  {modalSetting.dataType === 'boolean' ? (
                    <select className="form-select" value={modalValue} onChange={e => setModalValue(e.target.value)} disabled={modalLoading}>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : modalSetting.dataType === 'json' || modalSetting.dataType === 'array' ? (
                    <textarea className="form-control font-monospace" rows="5" value={modalValue} onChange={e => setModalValue(e.target.value)} disabled={modalLoading} style={{ fontSize: '0.85rem' }} />
                  ) : (
                    <input
                      type={modalSetting.dataType === 'integer' || modalSetting.dataType === 'decimal' ? 'number' : 'text'}
                      className="form-control"
                      value={modalValue}
                      onChange={e => setModalValue(e.target.value)}
                      disabled={modalLoading}
                      step={modalSetting.dataType === 'decimal' ? 'any' : undefined}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={modalLoading}>
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button type="button" className="btn btn-primary" onClick={onSave} disabled={modalLoading}>
                {modalLoading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>{t('actions.saving', { defaultValue: 'Saving...' })}</>
                ) : (
                  <><i className="bx bx-save me-1"></i>{t('actions.save', { defaultValue: 'Save' })}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
