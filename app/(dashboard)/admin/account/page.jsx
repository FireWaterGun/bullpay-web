'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dynamic from 'next/dynamic'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { changePasswordApi } from '@/lib/api/auth'
import { get2FAStatus } from '@/lib/api/twoFactor'
import { changePasswordSchema } from '@/lib/validations/change-password'
import { logger } from '@/lib/utils/logger'

const Setup2FAModal = dynamic(() => import('@/components/TwoFactorModals').then(m => m.Setup2FAModal), { ssr: false })
const Disable2FAModal = dynamic(() => import('@/components/TwoFactorModals').then(m => m.Disable2FAModal), { ssr: false })

export default function AdminAccountPage() {
  const { t } = useAdminTranslation()
  const { token, logout } = useAuth()
  const toast = useToast()
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // ── 2FA State ──
  const [twoFAStatus, setTwoFAStatus] = useState(null)
  const [twoFALoading, setTwoFALoading] = useState(true)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)

  const fetch2FAStatus = useCallback(async () => {
    if (!token) return
    setTwoFALoading(true)
    try {
      const res = await get2FAStatus(token)
      setTwoFAStatus(res)
    } catch (err) {
      logger.error('Failed to fetch 2FA status:', err)
    } finally {
      setTwoFALoading(false)
    }
  }, [token])

  useEffect(() => {
    fetch2FAStatus()
  }, [fetch2FAStatus])

  const is2FAEnabled = twoFAStatus?.enabled && twoFAStatus?.verified

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset: resetForm,
    setError: setFormError,
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirmation: '',
      totpCode: '',
    },
  })

  const onChangePassword = async (formData) => {
    setChangingPassword(true)
    try {
      const payload = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        newPasswordConfirmation: formData.newPasswordConfirmation,
      }
      if (is2FAEnabled && formData.totpCode) {
        payload.totpCode = formData.totpCode
      }
      await changePasswordApi(token, payload)

      toast.success(
        t('admin.account.changeSuccess', {
          defaultValue: 'Password changed successfully. Please log in again.',
        })
      )
      resetForm()
      setTimeout(() => logout(), 1500)
    } catch (err) {
      const errorMsg = err?.message || err?.details || 'Password change failed'
      const errorCode = err?.code || ''
      if (errorCode === 'TWO_FACTOR_REQUIRED') {
        setFormError('totpCode', {
          message: t('admin.account.totpRequired', { defaultValue: 'Please enter your 2FA code' }),
        })
      } else if (errorMsg.toLowerCase().includes('invalid code') || errorMsg.toLowerCase().includes('too many attempts')) {
        setFormError('totpCode', { message: errorMsg })
      } else if (errorMsg.toLowerCase().includes('current password')) {
        setFormError('currentPassword', {
          message: t('admin.account.incorrectCurrent', { defaultValue: 'Current password is incorrect' }),
        })
      } else {
        logger.error('Failed to change password:', err)
        toast.error(
          t('admin.account.changeFailed', { defaultValue: 'Failed to change password. Please try again.' })
        )
      }
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Page Header */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-1">
            <i className="bx bx-user-circle me-2"></i>
            {t('admin.account.title', { defaultValue: 'My Account' })}
          </h5>
          <small className="text-muted d-block">
            {t('admin.account.description', { defaultValue: 'Manage your admin account security' })}
          </small>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">
            <i className="bx bx-key me-2"></i>
            {t('admin.account.passwordTitle', { defaultValue: 'Change Password' })}
          </h6>
        </div>
        <div className="card-body">
          <p className="text-muted mb-4">
            {t('admin.account.passwordDescription', {
              defaultValue: "For security, you'll be logged out of all devices after changing your password.",
            })}
          </p>
          <form onSubmit={handleSubmit(onChangePassword)} noValidate>
            <div className="row">
              <div className="col-md-6">
                {/* Current Password */}
                <div className="mb-4">
                  <label className="form-label" htmlFor="currentPassword">
                    {t('admin.account.currentPassword', { defaultValue: 'Current Password' })}
                  </label>
                  <div className="input-group input-group-merge">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentPassword"
                      className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...register('currentPassword')}
                    />
                    <span
                      className="input-group-text cursor-pointer"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      <i className={`bx ${showCurrentPassword ? 'bx-show' : 'bx-hide'}`}></i>
                    </span>
                  </div>
                  {errors.currentPassword && (
                    <div className="invalid-feedback d-block">{errors.currentPassword.message}</div>
                  )}
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label className="form-label" htmlFor="newPassword">
                    {t('admin.account.newPassword', { defaultValue: 'New Password' })}
                  </label>
                  <div className="input-group input-group-merge">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...register('newPassword')}
                    />
                    <span
                      className="input-group-text cursor-pointer"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      <i className={`bx ${showNewPassword ? 'bx-show' : 'bx-hide'}`}></i>
                    </span>
                  </div>
                  {errors.newPassword && (
                    <div className="invalid-feedback d-block">{errors.newPassword.message}</div>
                  )}
                  <div className="form-text">
                    {t('admin.account.requirements', {
                      defaultValue: 'Min 8 characters with uppercase, lowercase, number, and special character.',
                    })}
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="mb-4">
                  <label className="form-label" htmlFor="newPasswordConfirmation">
                    {t('admin.account.confirmPassword', { defaultValue: 'Confirm New Password' })}
                  </label>
                  <div className="input-group input-group-merge">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="newPasswordConfirmation"
                      className={`form-control ${errors.newPasswordConfirmation ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...register('newPasswordConfirmation')}
                    />
                    <span
                      className="input-group-text cursor-pointer"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`bx ${showConfirmPassword ? 'bx-show' : 'bx-hide'}`}></i>
                    </span>
                  </div>
                  {errors.newPasswordConfirmation && (
                    <div className="invalid-feedback d-block">{errors.newPasswordConfirmation.message}</div>
                  )}
                </div>

                {/* 2FA Code (only if 2FA is enabled) */}
                {is2FAEnabled && (
                  <div className="mb-4">
                    <label className="form-label" htmlFor="totpCode">
                      <i className="bx bx-shield-quarter me-1 text-warning"></i>
                      {t('admin.account.totpLabel', { defaultValue: '2FA Verification Code' })}
                    </label>
                    <input
                      type="text"
                      id="totpCode"
                      className={`form-control ${errors.totpCode ? 'is-invalid' : ''}`}
                      placeholder="000000"
                      inputMode="numeric"
                      maxLength={20}
                      autoComplete="one-time-code"
                      {...register('totpCode')}
                    />
                    {errors.totpCode && (
                      <div className="invalid-feedback d-block">{errors.totpCode.message}</div>
                    )}
                    <div className="form-text">
                      {t('admin.account.totpHint', {
                        defaultValue: 'Enter the code from your authenticator app or a backup code.',
                      })}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={changingPassword || !isValid}
                >
                  {changingPassword ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {t('admin.account.changing', { defaultValue: 'Changing...' })}
                    </>
                  ) : (
                    <>
                      <i className="bx bx-check me-1"></i>
                      {t('admin.account.changeButton', { defaultValue: 'Change Password' })}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">
            <i className="bx bx-shield-quarter me-2"></i>
            {t('admin.account.twoFactorTitle', { defaultValue: 'Two-Factor Authentication' })}
          </h6>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-start justify-content-between">
            <div className="d-flex align-items-start">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-label-primary"
                style={{ width: 48, height: 48 }}
              >
                <i className="bx bx-lock-alt fs-4 text-primary"></i>
              </div>
              <div>
                <h6 className="mb-1">
                  {t('admin.account.twoFactorLabel', { defaultValue: 'Authenticator App' })}
                </h6>
                {twoFALoading ? (
                  <div className="placeholder-glow">
                    <span className="placeholder col-8"></span>
                  </div>
                ) : is2FAEnabled ? (
                  <>
                    <span className="badge bg-success me-2">
                      <i className="bx bx-check-circle me-1"></i>
                      {t('admin.account.twoFactorEnabled', { defaultValue: 'Enabled' })}
                    </span>
                    {twoFAStatus?.verifiedAt && (
                      <small className="text-muted">
                        {t('admin.account.twoFactorSince', { defaultValue: 'Since' })}{' '}
                        {new Date(twoFAStatus.verifiedAt).toLocaleDateString()}
                      </small>
                    )}
                  </>
                ) : (
                  <>
                    <span className="badge bg-secondary me-2">
                      {t('admin.account.twoFactorDisabled', { defaultValue: 'Disabled' })}
                    </span>
                    <small className="text-muted d-block mt-1">
                      {t('admin.account.twoFactorDescription', {
                        defaultValue:
                          "Add an extra layer of security. You'll need a code from your authenticator app when you sign in.",
                      })}
                    </small>
                  </>
                )}
              </div>
            </div>
            <div>
              {twoFALoading ? (
                <button className="btn btn-outline-primary btn-sm" disabled>
                  <span className="spinner-border spinner-border-sm"></span>
                </button>
              ) : is2FAEnabled ? (
                <div className="dropdown">
                  <button
                    className="btn btn-outline-secondary btn-sm dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="bx bx-cog me-1"></i>
                    {t('common.manage', { defaultValue: 'Manage' })}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={() => setShowDisableModal(true)}
                      >
                        <i className="bx bx-power-off me-2"></i>
                        {t('admin.account.disable2FA', { defaultValue: 'Disable 2FA' })}
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowSetupModal(true)}
                >
                  <i className="bx bx-lock me-1"></i>
                  {t('admin.account.enable2FA', { defaultValue: 'Enable 2FA' })}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Modals */}
      <Setup2FAModal
        show={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={() => {
          toast.success(t('admin.account.twoFactorEnableSuccess', { defaultValue: '2FA enabled successfully!' }))
          fetch2FAStatus()
        }}
        token={token}
      />
      <Disable2FAModal
        show={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onSuccess={() => {
          toast.success(t('admin.account.twoFactorDisableSuccess', { defaultValue: '2FA disabled successfully.' }))
          fetch2FAStatus()
        }}
        token={token}
      />
    </div>
  )
}
