'use client';

import { formatRoleLabel } from '@/lib/utils/roles';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import Button from '../ui/Button'
import { Input, Label } from '../ui/Input'

export default function PermissionActionModal({ action, role, permission, reason, onPermissionChange, onReasonChange, onSubmit, onClose, disabled }) {
  const { t } = useAdminTranslation();

  const MODAL_CONFIG = {
    grant: {
      title: t('admin.permissions.grantTitle', { defaultValue: 'Grant Permission' }),
      icon: 'bx-plus-circle',
      iconColor: 'text-success',
      btnVariant: 'success',
      btnIcon: 'bx-check',
      btnLabel: t('admin.roles.grant', { defaultValue: 'Grant' }),
      placeholder: t('admin.permissions.grantPlaceholder', { defaultValue: 'e.g. admin.users.view' }),
      reasonPlaceholder: t('admin.permissions.grantReason', { defaultValue: 'Why is this permission being granted?' }),
      verb: t('admin.permissions.grantVerb', { defaultValue: 'grant to' })
    },
    deny: {
      title: t('admin.permissions.denyTitle', { defaultValue: 'Deny Permission' }),
      icon: 'bx-minus-circle',
      iconColor: 'text-danger',
      btnVariant: 'danger',
      btnIcon: 'bx-x',
      btnLabel: t('admin.roles.deny', { defaultValue: 'Deny' }),
      placeholder: t('admin.permissions.denyPlaceholder', { defaultValue: 'e.g. admin.users.delete' }),
      reasonPlaceholder: t('admin.permissions.denyReason', { defaultValue: 'Why is this permission being denied?' }),
      verb: t('admin.permissions.denyVerb', { defaultValue: 'deny for' })
    }
  };

  const cfg = MODAL_CONFIG[action];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              <i className={`bx ${cfg.icon} ${cfg.iconColor} mr-2`}></i>
              {cfg.title}
            </h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none" onClick={onClose}><i className="bx bx-x"></i></button>
          </div>
          <div className="p-5">
            <div className="mb-3">
              <Label>{t('admin.permissions.permissionName', { defaultValue: 'Permission Name' })}</Label>
              <Input
                type="text"

                placeholder={cfg.placeholder}
                value={permission}
                onChange={(e) => onPermissionChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()} />
              
              <small className="text-surface-500 mt-1 block">
                {t('admin.permissions.enterPermission', { defaultValue: 'Enter the permission to {{verb}} {{role}}', verb: cfg.verb, role: formatRoleLabel(role) })}
              </small>
            </div>
            <div>
              <Label>{t('admin.permissions.reason', { defaultValue: 'Reason' })} <span className="text-surface-500">{t('admin.permissions.optional', { defaultValue: '(optional)' })}</span></Label>
              <Input

                rows="2"
                placeholder={cfg.reasonPlaceholder}
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)} />
              
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button onClick={onClose} variant="outline-secondary">{t('actions.cancel', { defaultValue: 'Cancel' })}</Button>
            <Button

              onClick={onSubmit}
              variant={cfg.btnVariant}
              disabled={!permission.trim() || disabled}>
              
              <i className={`bx ${cfg.btnIcon} mr-1`}></i>{cfg.btnLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>);

}