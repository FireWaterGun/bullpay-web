'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema } from '@/lib/validations/change-password'
import { changePasswordApi } from '@/lib/api/auth'
import { logger } from '@/lib/utils/logger'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, InputGroup, InputIcon, Label } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

/**
 * Change Password form card.
 */
export default function ChangePasswordCard({ token, is2FAEnabled, logout, toast, t }) {
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

  const onSubmit = async (formData) => {
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
      } else if (
        errorMsg.toLowerCase().includes('invalid code') ||
        errorMsg.toLowerCase().includes('too many attempts')
      ) {
        setFormError('totpCode', { message: errorMsg })
      } else if (errorMsg.toLowerCase().includes('current password')) {
        setFormError('currentPassword', {
          message: t('admin.account.incorrectCurrent', { defaultValue: 'Current password is incorrect' }),
        })
      } else {
        logger.error('Failed to change password:', err)
        toast.error(t('admin.account.changeFailed', { defaultValue: 'Failed to change password. Please try again.' }))
      }
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200 flex items-center">
        <span className="inline-flex items-center justify-center rounded bg-primary-50 text-primary-600 mr-3 shrink-0 w-9 h-9">
          <i className="bx bx-key text-[1.1rem]" />
        </span>
        <div>
          <h6 className="mb-0">{t('admin.account.passwordTitle', { defaultValue: 'Change Password' })}</h6>
          <small className="text-surface-500">
            {t('admin.account.passwordDescription', {
              defaultValue: "For security, you'll be logged out of all devices after changing your password.",
            })}
          </small>
        </div>
      </div>

      <div className="p-5">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-12 gap-x-6">
            <div className="md:col-span-8">
              {/* Current Password */}
              <PasswordField
                id="currentPassword"
                label={t('admin.account.currentPassword', { defaultValue: 'Current Password' })}
                show={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((v) => !v)}
                autoComplete="current-password"
                error={errors.currentPassword}
                register={register('currentPassword')}
              />

              {/* New Password */}
              <PasswordField
                id="newPassword"
                label={t('admin.account.newPassword', { defaultValue: 'New Password' })}
                show={showNewPassword}
                onToggle={() => setShowNewPassword((v) => !v)}
                autoComplete="new-password"
                error={errors.newPassword}
                register={register('newPassword')}
                hint={t('admin.account.requirements', {
                  defaultValue: 'Min 8 characters with uppercase, lowercase, number, and special character.',
                })}
              />

              {/* Confirm New Password */}
              <PasswordField
                id="newPasswordConfirmation"
                label={t('admin.account.confirmPassword', { defaultValue: 'Confirm New Password' })}
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((v) => !v)}
                autoComplete="new-password"
                error={errors.newPasswordConfirmation}
                register={register('newPasswordConfirmation')}
              />

              {/* 2FA Code */}
              {is2FAEnabled && (
                <div className="mb-3">
                  <Label htmlFor="totpCode">
                    <i className="bx bx-shield-quarter mr-1 text-warning" />
                    {t('admin.account.totpLabel', { defaultValue: '2FA Verification Code' })}
                  </Label>
                  <Input
                    type="text"
                    id="totpCode"
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={20}
                    autoComplete="one-time-code"
                    {...register('totpCode')}
                    error={errors.totpCode}
                  />
                  {errors.totpCode && (
                    <div className="text-xs text-danger-500 mt-1 block">{errors.totpCode.message}</div>
                  )}
                  <div className="text-xs text-surface-500 mt-1">
                    {t('admin.account.totpHint', {
                      defaultValue: 'Enter the code from your authenticator app or a backup code.',
                    })}
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button type="submit" disabled={changingPassword || !isValid} className="mt-2">
                {changingPassword ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    {t('admin.account.changing', { defaultValue: 'Changing...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-check mr-1" />
                    {t('admin.account.changeButton', { defaultValue: 'Change Password' })}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Card>
  )
}

/** Reusable password field with show/hide toggle. */
function PasswordField({ id, label, show, onToggle, autoComplete, error, register, hint }) {
  return (
    <div className="mb-3">
      <Label htmlFor={id}>{label}</Label>
      <InputGroup error={error}>
        <Input
          type={show ? 'text' : 'password'}
          id={id}
          placeholder="••••••••"
          autoComplete={autoComplete}
          {...register}
        />
        <InputIcon as="button" type="button" onClick={onToggle}>
          <i className={`bx ${show ? 'bx-show' : 'bx-hide'}`} />
        </InputIcon>
      </InputGroup>
      {error && <div className="text-xs text-danger-500 mt-1 block">{error.message}</div>}
      {hint && <div className="text-xs text-surface-500 mt-1">{hint}</div>}
    </div>
  )
}
