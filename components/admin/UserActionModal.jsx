'use client'

import { formatRoleLabel } from '@/lib/utils/roles'
import { STATUS_OPTIONS, ROLE_OPTIONS, statusBadgeClass, roleBadgeClass } from '@/components/admin/userListHelpers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'

export default function UserActionModal({
  t,
  modalType,
  selectedUser,
  modalLoading,
  newStatus,
  setNewStatus,
  statusReason,
  setStatusReason,
  newRole,
  setNewRole,
  newPassword,
  setNewPassword,
  onClose,
  onSubmit,
}) {
  function getModalConfig() {
    switch (modalType) {
      case 'changeStatus':
        return { title: t('admin.users.changeStatus', { defaultValue: 'Change User Status' }), btnClass: 'btn-warning', btnLabel: t('admin.users.updateStatus', { defaultValue: 'Update Status' }), icon: 'bx-user-check' }
      case 'changeRole':
        return { title: t('admin.users.changeRole', { defaultValue: 'Change User Role' }), btnClass: 'btn-primary', btnLabel: t('admin.users.updateRole', { defaultValue: 'Update Role' }), icon: 'bx-shield' }
      case 'resetPassword':
        return { title: t('admin.users.resetPassword', { defaultValue: 'Reset Password' }), btnClass: 'btn-danger', btnLabel: t('admin.users.resetPasswordBtn', { defaultValue: 'Reset Password' }), icon: 'bx-lock-open' }
      case 'disable2FA':
        return { title: t('admin.users.disable2FA', { defaultValue: 'Disable 2FA' }), btnClass: 'btn-danger', btnLabel: t('admin.users.disable2FABtn', { defaultValue: 'Disable 2FA' }), icon: 'bx-shield-x' }
      default:
        return { title: '', btnClass: '', btnLabel: '', icon: '' }
    }
  }

  const config = getModalConfig()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !modalLoading && onClose()}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              <i className={`bx ${config.icon} mr-2`}></i>
              {config.title}
            </h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose} disabled={modalLoading}></button>
          </div>
          <div className="p-5">
            <div className="rounded p-3 mb-3" style={{ backgroundColor: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}>
              <div className="grid grid-cols-12 gap-x-6 gap-2">
                <div className="col-span-6">
                  <small className="text-muted block">{t('admin.detail.userId', { defaultValue: 'User ID' })}</small>
                  <strong>{selectedUser.id}</strong>
                </div>
                <div className="col-span-6">
                  <small className="text-muted block">{t('admin.detail.email', { defaultValue: 'Email' })}</small>
                  <strong>{selectedUser.email}</strong>
                </div>
                <div className="col-span-6">
                  <small className="text-muted block">{t('admin.users.role', { defaultValue: 'Role' })}</small>
                  <span className={roleBadgeClass(selectedUser.role)}>{formatRoleLabel(selectedUser.role)}</span>
                </div>
                <div className="col-span-6">
                  <small className="text-muted block">{t('table.status', { defaultValue: 'Status' })}</small>
                  <span className={statusBadgeClass(selectedUser.status)}>{String(selectedUser.status || '').toUpperCase()}</span>
                </div>
              </div>
            </div>

            {modalType === 'changeStatus' && (
              <>
                <div className="mb-3">
                  <label className="form-label">{t('admin.users.newStatus', { defaultValue: 'New Status' })} <span className="text-danger">*</span></label>
                  <select className="form-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} disabled={modalLoading}>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{formatRoleLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('admin.users.reason', { defaultValue: 'Reason' })}</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder={t('admin.users.reasonPlaceholder', { defaultValue: 'Enter reason (optional, max 500 characters)...' })}
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    maxLength={500}
                    disabled={modalLoading}
                  />
                </div>
              </>
            )}

            {modalType === 'changeRole' && (
              <div className="mb-3">
                <label className="form-label">{t('admin.users.newRole', { defaultValue: 'New Role' })} <span className="text-danger">*</span></label>
                <select className="form-input" value={newRole} onChange={(e) => setNewRole(e.target.value)} disabled={modalLoading}>
                  {ROLE_OPTIONS.map(r => (
                    <option key={r} value={r}>{formatRoleLabel(r)}</option>
                  ))}
                </select>
              </div>
            )}

            {modalType === 'resetPassword' && (
              <>
                <div className="alert alert-danger py-2 mb-3" role="alert">
                  <i className="bx bx-error mr-1"></i>
                  {t('admin.users.resetPasswordWarning', { defaultValue: 'This will immediately change the user\'s password.' })}
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('admin.users.newPassword', { defaultValue: 'New Password' })} <span className="text-danger">*</span></label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={t('admin.users.newPasswordPlaceholder', { defaultValue: 'Enter new password (8-128 characters)...' })}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                    maxLength={128}
                    disabled={modalLoading}
                  />
                </div>
              </>
            )}

            {modalType === 'disable2FA' && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                <i className="bx bx-error mr-1"></i>
                {t('admin.users.disable2FAWarning', { defaultValue: 'This will disable two-factor authentication for this user. They will need to set it up again.' })}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <button type="button" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100" onClick={onClose} disabled={modalLoading}>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="button"
              className={`btn ${config.btnClass}`}
              onClick={onSubmit}
              disabled={modalLoading}
            >
              {modalLoading ? (
                <>
                  <span className="spinner w-4 h-4 mr-1"></span>
                  {t('invoices.loading', { defaultValue: 'Loading...' })}
                </>
              ) : (
                config.btnLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
