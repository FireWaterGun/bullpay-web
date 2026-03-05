'use client'

import { formatRoleLabel } from '@/lib/utils/roles'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'

export default function PermissionActionModal({ action, role, permission, reason, onPermissionChange, onReasonChange, onSubmit, onClose, disabled }) {
  const { t } = useAdminTranslation()

  const MODAL_CONFIG = {
    grant: {
      title: t('admin.permissions.grantTitle', { defaultValue: 'Grant Permission' }),
      icon: 'bx-plus-circle',
      iconColor: 'text-success',
      btnClass: 'btn-success',
      btnIcon: 'bx-check',
      btnLabel: t('admin.roles.grant', { defaultValue: 'Grant' }),
      placeholder: t('admin.permissions.grantPlaceholder', { defaultValue: 'e.g. admin.users.view' }),
      reasonPlaceholder: t('admin.permissions.grantReason', { defaultValue: 'Why is this permission being granted?' }),
      verb: t('admin.permissions.grantVerb', { defaultValue: 'grant to' }),
    },
    deny: {
      title: t('admin.permissions.denyTitle', { defaultValue: 'Deny Permission' }),
      icon: 'bx-minus-circle',
      iconColor: 'text-danger',
      btnClass: 'btn-danger',
      btnIcon: 'bx-x',
      btnLabel: t('admin.roles.deny', { defaultValue: 'Deny' }),
      placeholder: t('admin.permissions.denyPlaceholder', { defaultValue: 'e.g. admin.users.delete' }),
      reasonPlaceholder: t('admin.permissions.denyReason', { defaultValue: 'Why is this permission being denied?' }),
      verb: t('admin.permissions.denyVerb', { defaultValue: 'deny for' }),
    },
  }

  const cfg = MODAL_CONFIG[action]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              <i className={`bx ${cfg.icon} ${cfg.iconColor} mr-2`}></i>
              {cfg.title}
            </h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose}></button>
          </div>
          <div className="p-5">
            <div className="mb-3">
              <label className="form-label">{t('admin.permissions.permissionName', { defaultValue: 'Permission Name' })}</label>
              <input
                type="text"
                className="form-input"
                placeholder={cfg.placeholder}
                value={permission}
                onChange={(e) => onPermissionChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              />
              <small className="text-muted mt-1 block">
                {t('admin.permissions.enterPermission', { defaultValue: 'Enter the permission to {{verb}} {{role}}', verb: cfg.verb, role: formatRoleLabel(role) })}
              </small>
            </div>
            <div>
              <label className="form-label">{t('admin.permissions.reason', { defaultValue: 'Reason' })} <span className="text-muted">{t('admin.permissions.optional', { defaultValue: '(optional)' })}</span></label>
              <textarea
                className="form-input"
                rows="2"
                placeholder={cfg.reasonPlaceholder}
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <button className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100" onClick={onClose}>{t('actions.cancel', { defaultValue: 'Cancel' })}</button>
            <button
              className={`btn ${cfg.btnClass}`}
              onClick={onSubmit}
              disabled={!permission.trim() || disabled}
            >
              <i className={`bx ${cfg.btnIcon} mr-1`}></i>{cfg.btnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
