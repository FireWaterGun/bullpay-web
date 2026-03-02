'use client'

import { formatRoleLabel } from '@/lib/utils/roles'
import { useTranslation } from 'react-i18next'

export default function PermissionActionModal({ action, role, permission, reason, onPermissionChange, onReasonChange, onSubmit, onClose, disabled }) {
  const { t } = useTranslation('common')

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
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={`bx ${cfg.icon} ${cfg.iconColor} me-2`}></i>
              {cfg.title}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">{t('admin.permissions.permissionName', { defaultValue: 'Permission Name' })}</label>
              <input
                type="text"
                className="form-control"
                placeholder={cfg.placeholder}
                value={permission}
                onChange={(e) => onPermissionChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              />
              <small className="text-muted mt-1 d-block">
                {t('admin.permissions.enterPermission', { defaultValue: 'Enter the permission to {{verb}} {{role}}', verb: cfg.verb, role: formatRoleLabel(role) })}
              </small>
            </div>
            <div>
              <label className="form-label">{t('admin.permissions.reason', { defaultValue: 'Reason' })} <span className="text-muted">{t('admin.permissions.optional', { defaultValue: '(optional)' })}</span></label>
              <textarea
                className="form-control"
                rows="2"
                placeholder={cfg.reasonPlaceholder}
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose}>{t('actions.cancel', { defaultValue: 'Cancel' })}</button>
            <button
              className={`btn ${cfg.btnClass}`}
              onClick={onSubmit}
              disabled={!permission.trim() || disabled}
            >
              <i className={`bx ${cfg.btnIcon} me-1`}></i>{cfg.btnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
