'use client'

import { formatRoleLabel } from '@/lib/utils/roles'
import { STATUS_OPTIONS, ROLE_OPTIONS, statusBadgeClass, roleBadgeClass } from '@/components/admin/userListHelpers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import { Input, Label, Select } from '../ui/Input'
import Spinner from '../ui/Spinner'

const ASSIGNABLE_ROLES = {
  super_admin: ['regular_user', 'business_user', 'support_agent', 'admin'],
  admin: ['regular_user', 'business_user', 'support_agent'],
  support_agent: ['regular_user', 'business_user'],
}

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
  currentUserRole,
}) {
  function getModalConfig() {
    switch (modalType) {
      case 'changeStatus':
        return {
          title: t('admin.users.changeStatus', { defaultValue: 'Change User Status' }),
          btnVariant: 'warning',
          btnLabel: t('admin.users.updateStatus', { defaultValue: 'Update Status' }),
          icon: 'bx-user-check',
        }
      case 'changeRole':
        return {
          title: t('admin.users.changeRole', { defaultValue: 'Change User Role' }),
          btnVariant: 'primary',
          btnLabel: t('admin.users.updateRole', { defaultValue: 'Update Role' }),
          icon: 'bx-shield',
        }
      case 'resetPassword':
        return {
          title: t('admin.users.resetPassword', { defaultValue: 'Reset Password' }),
          btnVariant: 'danger',
          btnLabel: t('admin.users.resetPasswordBtn', { defaultValue: 'Reset Password' }),
          icon: 'bx-lock-open',
        }
      case 'disable2FA':
        return {
          title: t('admin.users.disable2FA', { defaultValue: 'Disable 2FA' }),
          btnVariant: 'danger',
          btnLabel: t('admin.users.disable2FABtn', { defaultValue: 'Disable 2FA' }),
          icon: 'bx-shield-x',
        }
      case 'forceVerifyEmail':
        return {
          title: t('admin.users.forceVerifyEmail', { defaultValue: 'Force Verify Email' }),
          btnVariant: 'success',
          btnLabel: t('admin.users.verifyEmailBtn', { defaultValue: 'Verify Email' }),
          icon: 'bx-envelope',
        }
      default:
        return { title: '', btnVariant: 'primary', btnLabel: '', icon: '' }
    }
  }

  const config = getModalConfig()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={() => !modalLoading && onClose()}
    >
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              <i className={`bx ${config.icon} mr-2`}></i>
              {config.title}
            </h5>
            <button
              type="button"
              className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"
              onClick={onClose}
              disabled={modalLoading}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>
          <div className="p-5">
            <div className="rounded p-3 mb-3 bg-surface-100 border border-surface-200">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <small className="text-surface-500 block">
                    {t('admin.detail.userId', { defaultValue: 'User ID' })}
                  </small>
                  <strong>{selectedUser.id}</strong>
                </div>
                <div className="min-w-0">
                  <small className="text-surface-500 block">{t('admin.detail.email', { defaultValue: 'Email' })}</small>
                  <strong className="block truncate">{selectedUser.email}</strong>
                </div>
                <div>
                  <small className="text-surface-500 block">{t('admin.users.role', { defaultValue: 'Role' })}</small>
                  <span className={roleBadgeClass(selectedUser.role)}>{formatRoleLabel(selectedUser.role)}</span>
                </div>
                <div>
                  <small className="text-surface-500 block">{t('table.status', { defaultValue: 'Status' })}</small>
                  <span className={statusBadgeClass(selectedUser.status)}>
                    {String(selectedUser.status || '').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {modalType === 'changeStatus' && (
              <>
                <div className="mb-3">
                  <Label>
                    {t('admin.users.newStatus', { defaultValue: 'New Status' })} <span className="text-danger">*</span>
                  </Label>
                  <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} disabled={modalLoading}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {formatRoleLabel(s)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="mb-3">
                  <Label>{t('admin.users.reason', { defaultValue: 'Reason' })}</Label>
                  <Input
                    rows="3"
                    placeholder={t('admin.users.reasonPlaceholder', {
                      defaultValue: 'Enter reason (optional, max 500 characters)...',
                    })}
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
                <Label>
                  {t('admin.users.newRole', { defaultValue: 'New Role' })} <span className="text-danger">*</span>
                </Label>
                <Select value={newRole} onChange={(e) => setNewRole(e.target.value)} disabled={modalLoading}>
                  {(ASSIGNABLE_ROLES[currentUserRole] || []).map((r) => (
                    <option key={r} value={r}>
                      {formatRoleLabel(r)}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {modalType === 'resetPassword' && (
              <>
                <Alert role="alert" className="py-2 mb-3">
                  <i className="bx bx-error mr-1"></i>
                  {t('admin.users.resetPasswordWarning', {
                    defaultValue: "This will immediately change the user's password.",
                  })}
                </Alert>
                <div className="mb-3">
                  <Label>
                    {t('admin.users.newPassword', { defaultValue: 'New Password' })}{' '}
                    <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="password"
                    placeholder={t('admin.users.newPasswordPlaceholder', {
                      defaultValue: 'Enter new password (8-128 characters)...',
                    })}
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
              <Alert role="alert" className="py-2 mb-3">
                <i className="bx bx-error mr-1"></i>
                {t('admin.users.disable2FAWarning', {
                  defaultValue:
                    'This will disable two-factor authentication for this user. They will need to set it up again.',
                })}
              </Alert>
            )}

            {modalType === 'forceVerifyEmail' && (
              <Alert role="alert" variant="info" className="py-2 mb-3">
                <i className="bx bx-info-circle mr-1"></i>
                {t('admin.users.forceVerifyEmailWarning', {
                  defaultValue:
                    'This will mark the email as verified and activate the account if it is pending.',
                })}
              </Alert>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button type="button" onClick={onClose} disabled={modalLoading} variant="outline-secondary">
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="button" variant={config.btnVariant} onClick={onSubmit} disabled={modalLoading}>
              {modalLoading ? (
                <>
                  <Spinner className="w-4 h-4 mr-1" />
                  {t('invoices.loading', { defaultValue: 'Loading...' })}
                </>
              ) : (
                config.btnLabel
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
