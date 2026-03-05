'use client'

import { formatRoleLabel } from '@/lib/utils/roles'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'

export default function ResetOverridesModal({ role, overridesCount, actionLoading, onReset, onClose }) {
  const { t } = useAdminTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              <i className="bx bx-reset text-warning mr-2"></i>
              {t('admin.permissions.resetTitle', { defaultValue: 'Reset All Overrides' })}
            </h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose}></button>
          </div>
          <div className="p-5">
            <div className="alert alert-warning mb-3">
              <i className="bx bx-error-circle mr-1"></i>
              {t('admin.permissions.resetConfirm', { defaultValue: 'This will remove all {{count}} overrides for this role and restore default permissions.', count: overridesCount })}
            </div>
            <p className="text-muted mb-0">{t('admin.permissions.cannotBeUndone', { defaultValue: 'This action cannot be undone.' })}</p>
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <button className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100" onClick={onClose}>{t('actions.cancel', { defaultValue: 'Cancel' })}</button>
            <button
              className="btn btn bg-warning-500 text-white hover:bg-warning-600"
              onClick={onReset}
              disabled={actionLoading === '__reset__'}
            >
              {actionLoading === '__reset__' ? (
                <><span className="spinner w-4 h-4 mr-1"></span>{t('admin.permissions.resetting', { defaultValue: 'Resetting...' })}</>
              ) : (
                <><i className="bx bx-reset mr-1"></i>{t('admin.permissions.resetTitle', { defaultValue: 'Reset All Overrides' })}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
