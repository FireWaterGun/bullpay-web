'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { changePasswordApi } from '@/lib/api/auth'
import { changePasswordSchema } from '@/lib/validations/change-password'
import { logger } from '@/lib/utils/logger'

export default function AdminAccountPage() {
  const { t } = useAdminTranslation()
  const { token, logout } = useAuth()
  const toast = useToast()
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
    },
  })

  const onChangePassword = async (formData) => {
    setChangingPassword(true)
    try {
      await changePasswordApi(token, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        newPasswordConfirmation: formData.newPasswordConfirmation,
      })

      toast.success(
        t('admin.account.changeSuccess', {
          defaultValue: 'Password changed successfully. Please log in again.',
        })
      )
      resetForm()
      setTimeout(() => logout(), 1500)
    } catch (err) {
      const errorMsg = err?.message || err?.details || 'Password change failed'
      if (errorMsg.toLowerCase().includes('current password')) {
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
      <div className="card">
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
    </div>
  )
}
