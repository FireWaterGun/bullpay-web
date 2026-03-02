'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dynamic from 'next/dynamic'
import { useAuth, useToast } from '@/app/providers'
import { get2FAStatus } from '@/lib/api/twoFactor'
import { changePasswordApi } from '@/lib/api/auth'
import { changePasswordSchema } from '@/lib/validations/change-password'
const Setup2FAModal = dynamic(() => import('@/components/TwoFactorModals').then(m => m.Setup2FAModal), { ssr: false })
const Disable2FAModal = dynamic(() => import('@/components/TwoFactorModals').then(m => m.Disable2FAModal), { ssr: false })
import RefreshButton from '@/components/RefreshButton'
import { logger } from '@/lib/utils/logger'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { token, logout } = useAuth()
  const toast = useToast()
  const [twoFAStatus, setTwoFAStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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

  const fetchStatus = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await get2FAStatus(token)
      setTwoFAStatus(res)
    } catch (err) {
      logger.error('Failed to fetch 2FA status:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const is2FAEnabled = twoFAStatus?.enabled && twoFAStatus?.verified

  const onChangePassword = async (formData) => {
    setChangingPassword(true)
    try {
      const payload = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        newPasswordConfirmation: formData.newPasswordConfirmation,
      }
      // Include TOTP code if 2FA is enabled and user provided one
      if (is2FAEnabled && formData.totpCode) {
        payload.totpCode = formData.totpCode
      }
      await changePasswordApi(token, payload)

      toast.success(
        t('settings.password.changeSuccess', {
          defaultValue: 'Password changed successfully. Please log in again.',
        })
      )
      resetForm()
      // Server revoked all tokens, log out client side
      setTimeout(() => logout(), 1500)
    } catch (err) {
      const errorMsg = err?.message || err?.details || 'Password change failed'
      const errorCode = err?.code || ''
      // Handle 2FA required error (in case status wasn't loaded correctly)
      if (errorCode === 'TWO_FACTOR_REQUIRED') {
        setFormError('totpCode', {
          message: t('settings.password.totpRequired', { defaultValue: 'Please enter your 2FA code' }),
        })
      } else if (errorMsg.toLowerCase().includes('invalid code') || errorMsg.toLowerCase().includes('too many attempts')) {
        setFormError('totpCode', { message: errorMsg })
      } else if (errorMsg.toLowerCase().includes('current password')) {
        setFormError('currentPassword', { message: t('settings.password.incorrectCurrent', { defaultValue: 'Current password is incorrect' }) })
      } else {
        logger.error('Failed to change password:', err)
        toast.error(t('settings.password.changeFailed', { defaultValue: 'Failed to change password. Please try again.' }))
      }
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div>
        {/* Page Header */}
        <div className="card mb-4">
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">{t('settings.title', { defaultValue: 'Settings' })}</h5>
              <small className="text-muted d-block">
                {t('settings.subtitle', { defaultValue: 'Manage your account settings and preferences' })}
              </small>
            </div>
            <RefreshButton onClick={fetchStatus} loading={loading} />
          </div>
        </div>

        {/* Change Password Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h6 className="mb-0">
              <i className="bx bx-key me-2"></i>
              {t('settings.password.title', { defaultValue: 'Change Password' })}
            </h6>
          </div>
          <div className="card-body">
            <p className="text-muted mb-4">
              {t('settings.password.description', {
                defaultValue: 'For security, you\'ll be logged out of all devices after changing your password.',
              })}
            </p>
            <form onSubmit={handleSubmit(onChangePassword)} noValidate>
              <div className="row">
                <div className="col-md-6">
                  {/* Current Password */}
                  <div className="mb-4">
                    <label className="form-label" htmlFor="currentPassword">
                      {t('settings.password.currentPassword', { defaultValue: 'Current Password' })}
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
                      {t('settings.password.newPassword', { defaultValue: 'New Password' })}
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
                      {t('settings.password.requirements', {
                        defaultValue: 'Min 8 characters with uppercase, lowercase, number, and special character.',
                      })}
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="mb-4">
                    <label className="form-label" htmlFor="newPasswordConfirmation">
                      {t('settings.password.confirmPassword', { defaultValue: 'Confirm New Password' })}
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
                        {t('settings.password.totpLabel', { defaultValue: '2FA Verification Code' })}
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
                        {t('settings.password.totpHint', {
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
                        {t('settings.password.changing', { defaultValue: 'Changing...' })}
                      </>
                    ) : (
                      <>
                        <i className="bx bx-check me-1"></i>
                        {t('settings.password.changeButton', { defaultValue: 'Change Password' })}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Security Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h6 className="mb-0">
              {t('settings.security.title', { defaultValue: 'Security' })}
            </h6>
          </div>
          <div className="card-body">
            {/* 2FA Row */}
            <div className="d-flex align-items-start justify-content-between">
              <div className="d-flex align-items-start">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3 bg-label-primary"
                  style={{ width: 48, height: 48 }}
                >
                  <i className="bx bx-lock-alt fs-4 text-primary"></i>
                </div>
                <div>
                  <h6 className="mb-1">{t('settings.2fa.title', { defaultValue: 'Two-Factor Authentication' })}</h6>
                  {loading ? (
                    <div className="placeholder-glow">
                      <span className="placeholder col-8"></span>
                    </div>
                  ) : is2FAEnabled ? (
                    <>
                      <span className="badge bg-success me-2">
                        <i className="bx bx-check-circle me-1"></i>
                        {t('settings.2fa.enabled', { defaultValue: 'Enabled' })}
                      </span>
                      {twoFAStatus?.verifiedAt && (
                        <small className="text-muted">
                          {t('settings.2fa.enabledSince', { defaultValue: 'Since' })}{' '}
                          {new Date(twoFAStatus.verifiedAt).toLocaleDateString()}
                        </small>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="badge bg-secondary me-2">
                        {t('settings.2fa.disabled', { defaultValue: 'Disabled' })}
                      </span>
                      <small className="text-muted d-block mt-1">
                        {t('settings.2fa.description', {
                          defaultValue:
                            'Add an extra layer of security. We\'ll ask for a code from your authenticator app when you sign in.',
                        })}
                      </small>
                    </>
                  )}
                </div>
              </div>
              <div>
                {loading ? (
                  <button className="btn btn-outline-primary" disabled>
                    <span className="spinner-border spinner-border-sm"></span>
                  </button>
                ) : is2FAEnabled ? (
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle"
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
                          {t('settings.2fa.disable', { defaultValue: 'Disable 2FA' })}
                        </button>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={() => setShowSetupModal(true)}>
                    <i className="bx bx-lock me-1"></i>
                    {t('settings.2fa.enable', { defaultValue: 'Enable 2FA' })}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Setup2FAModal
        show={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={() => {
          fetchStatus()
          toast.success(t('settings.2fa.enableSuccess', { defaultValue: 'Two-factor authentication enabled successfully' }))
        }}
        token={token}
      />
      <Disable2FAModal
        show={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onSuccess={() => {
          fetchStatus()
          toast.success(t('settings.2fa.disableSuccess', { defaultValue: 'Two-factor authentication has been disabled' }))
        }}
        token={token}
      />
    </div>
  )
}
