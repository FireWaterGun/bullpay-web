import { formatRoleLabel } from '../../utils/roles'
import { STATUS_OPTIONS, ROLE_OPTIONS, statusBadgeClass, roleBadgeClass } from './userListHelpers'

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
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !modalLoading && onClose()}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={`bx ${config.icon} me-2`}></i>
              {config.title}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={modalLoading}></button>
          </div>
          <div className="modal-body">
            {/* User info */}
            <div className="rounded p-3 mb-3" style={{ backgroundColor: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}>
              <div className="row g-2">
                <div className="col-6">
                  <small className="text-muted d-block">User ID</small>
                  <strong>{selectedUser.id}</strong>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Email</small>
                  <strong>{selectedUser.email}</strong>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">{t('admin.users.role', { defaultValue: 'Role' })}</small>
                  <span className={roleBadgeClass(selectedUser.role)}>{formatRoleLabel(selectedUser.role)}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">{t('table.status', { defaultValue: 'Status' })}</small>
                  <span className={statusBadgeClass(selectedUser.status)}>{String(selectedUser.status || '').toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Change Status */}
            {modalType === 'changeStatus' && (
              <>
                <div className="mb-3">
                  <label className="form-label">{t('admin.users.newStatus', { defaultValue: 'New Status' })} <span className="text-danger">*</span></label>
                  <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} disabled={modalLoading}>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{formatRoleLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('admin.users.reason', { defaultValue: 'Reason' })}</label>
                  <textarea
                    className="form-control"
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

            {/* Change Role */}
            {modalType === 'changeRole' && (
              <div className="mb-3">
                <label className="form-label">{t('admin.users.newRole', { defaultValue: 'New Role' })} <span className="text-danger">*</span></label>
                <select className="form-select" value={newRole} onChange={(e) => setNewRole(e.target.value)} disabled={modalLoading}>
                  {ROLE_OPTIONS.map(r => (
                    <option key={r} value={r}>{formatRoleLabel(r)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset Password */}
            {modalType === 'resetPassword' && (
              <>
                <div className="alert alert-danger py-2 mb-3" role="alert">
                  <i className="bx bx-error me-1"></i>
                  {t('admin.users.resetPasswordWarning', { defaultValue: 'This will immediately change the user\'s password.' })}
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('admin.users.newPassword', { defaultValue: 'New Password' })} <span className="text-danger">*</span></label>
                  <input
                    type="password"
                    className="form-control"
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

            {/* Disable 2FA */}
            {modalType === 'disable2FA' && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                <i className="bx bx-error me-1"></i>
                {t('admin.users.disable2FAWarning', { defaultValue: 'This will disable two-factor authentication for this user. They will need to set it up again.' })}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={modalLoading}>
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
                  <span className="spinner-border spinner-border-sm me-1"></span>
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
