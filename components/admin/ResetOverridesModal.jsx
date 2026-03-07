'use client';

import { formatRoleLabel } from '@/lib/utils/roles';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

export default function ResetOverridesModal({ role, overridesCount, actionLoading, onReset, onClose }) {
  const { t } = useAdminTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              <i className="bx bx-reset text-warning mr-2"></i>
              {t('admin.permissions.resetTitle', { defaultValue: 'Reset All Overrides' })}
            </h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none" onClick={onClose}><i className="bx bx-x"></i></button>
          </div>
          <div className="p-5">
            <Alert variant="warning" className="mb-3">
              <i className="bx bx-error-circle mr-1"></i>
              {t('admin.permissions.resetConfirm', { defaultValue: 'This will remove all {{count}} overrides for this role and restore default permissions.', count: overridesCount })}
            </Alert>
            <p className="text-surface-500 mb-0">{t('admin.permissions.cannotBeUndone', { defaultValue: 'This action cannot be undone.' })}</p>
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button onClick={onClose} variant="outline-secondary">{t('actions.cancel', { defaultValue: 'Cancel' })}</Button>
            <Button

              onClick={onReset}
              disabled={actionLoading === '__reset__'} className="bg-warning-500 text-white hover:bg-warning-600">
              
              {actionLoading === '__reset__' ?
              <><Spinner className="w-4 h-4 mr-1" />{t('admin.permissions.resetting', { defaultValue: 'Resetting...' })}</> :

              <><i className="bx bx-reset mr-1"></i>{t('admin.permissions.resetTitle', { defaultValue: 'Reset All Overrides' })}</>
              }
            </Button>
          </div>
        </div>
      </div>
    </div>);

}