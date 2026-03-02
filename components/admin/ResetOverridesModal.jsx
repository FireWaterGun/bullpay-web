'use client'

import { formatRoleLabel } from '@/lib/utils/roles'
import { useTranslation } from 'react-i18next'

export default function ResetOverridesModal({ role, overridesCount, actionLoading, onReset, onClose }) {
  const { t } = useTranslation('common')

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bx bx-reset text-warning me-2"></i>
              {t('admin.permissions.resetTitle', { defaultValue: 'Reset All Overrides' })}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-warning mb-3">
              <i className="bx bx-error-circle me-1"></i>
              {t('admin.permissions.resetConfirm', { defaultValue: 'This will remove all {{count}} overrides for this role and restore default permissions.', count: overridesCount })}
            </div>
            <p className="text-muted mb-0">{t('admin.permissions.cannotBeUndone', { defaultValue: 'This action cannot be undone.' })}</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>{t('actions.cancel', { defaultValue: 'Cancel' })}</button>
            <button
              className="btn btn-warning"
              onClick={onReset}
              disabled={actionLoading === '__reset__'}
            >
              {actionLoading === '__reset__' ? (
                <><span className="spinner-border spinner-border-sm me-1"></span>{t('admin.permissions.resetting', { defaultValue: 'Resetting...' })}</>
              ) : (
                <><i className="bx bx-reset me-1"></i>{t('admin.permissions.resetTitle', { defaultValue: 'Reset All Overrides' })}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
