'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dynamic from 'next/dynamic'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { changePasswordApi, updateProfileApi } from '@/lib/api/auth'
import { get2FAStatus } from '@/lib/api/twoFactor'
import { changePasswordSchema } from '@/lib/validations/change-password'
import { logger } from '@/lib/utils/logger'
import { useDateFormat } from '@/hooks/useDateFormat'
import { COMMON_TIMEZONES } from '@/lib/constants'

const Setup2FAModal = dynamic(() => import('@/components/TwoFactorModals').then(m => m.Setup2FAModal), { ssr: false })
const Disable2FAModal = dynamic(() => import('@/components/TwoFactorModals').then(m => m.Disable2FAModal), { ssr: false })

export default function AdminAccountPage() {
  const { t } = useAdminTranslation()
  const { fmtDate } = useDateFormat()
  const { token, logout, user, updateUser } = useAuth()
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
  const [selectedTimezone, setSelectedTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [savingTimezone, setSavingTimezone] = useState(false)
  const timezoneChanged = selectedTimezone !== (user?.timezone || 'UTC')

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
      {/* ══════════════════════════════════════════════════════════
          §1  PROFILE HERO CARD
          ══════════════════════════════════════════════════════════ */}
      <div className="card mb-4 overflow-hidden">
        {/* Gradient accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--bs-primary) 0%, #a855f7 50%, #06b6d4 100%)' }} />

        <div className="card-body p-4 pb-3">
          <div className="d-flex flex-column flex-sm-row align-items-start gap-4">
            {/* Avatar */}
            <div
              className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
              style={{ width: 80, height: 80, background: 'linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.16) 0%, rgba(var(--bs-primary-rgb), 0.04) 100%)' }}
            >
              <i className="bx bx-user-circle" style={{ fontSize: '2.5rem', color: 'var(--bs-primary)' }}></i>
            </div>

            {/* Info */}
            <div className="flex-grow-1 min-w-0">
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <h4 className="mb-0 text-truncate">{user?.fullName || user?.email || '-'}</h4>
                <span className="badge bg-label-primary">{t('admin.account.adminBadge', { defaultValue: 'Admin' })}</span>
              </div>

              <div className="d-flex flex-wrap gap-3 text-muted small mt-1">
                {user?.email && (
                  <span><i className="bx bx-envelope me-1"></i>{user.email}</span>
                )}
                <span>
                  <i className="bx bx-globe me-1"></i>
                  {selectedTimezone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="card-footer bg-transparent border-top py-3 px-4">
          <div className="row g-3">
            <div className="col-6 col-sm-3">
              <div className="d-flex align-items-center gap-3">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-2 bg-label-success flex-shrink-0"
                  style={{ width: 40, height: 40 }}
                >
                  <i className="bx bx-check-shield" style={{ fontSize: '1.25rem' }}></i>
                </span>
                <div className="min-w-0">
                  <div className="fw-semibold text-truncate" style={{ fontSize: '0.9rem' }}>
                    {t('admin.account.statusActive', { defaultValue: 'Active' })}
                  </div>
                  <small className="text-muted">{t('common.status', { defaultValue: 'Status' })}</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-sm-3">
              <div className="d-flex align-items-center gap-3">
                <span
                  className={`d-inline-flex align-items-center justify-content-center rounded-2 flex-shrink-0 ${is2FAEnabled ? 'bg-label-success' : 'bg-label-warning'}`}
                  style={{ width: 40, height: 40 }}
                >
                  <i className={`bx ${is2FAEnabled ? 'bx-lock-alt' : 'bx-lock-open-alt'}`} style={{ fontSize: '1.25rem' }}></i>
                </span>
                <div className="min-w-0">
                  <div className="fw-semibold text-truncate" style={{ fontSize: '0.9rem' }}>
                    {twoFALoading ? '...' : is2FAEnabled
                      ? t('admin.account.twoFactorEnabled', { defaultValue: 'Enabled' })
                      : t('admin.account.twoFactorDisabled', { defaultValue: 'Disabled' })}
                  </div>
                  <small className="text-muted">{t('admin.account.stats2FA', { defaultValue: '2FA' })}</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-sm-3">
              <div className="d-flex align-items-center gap-3">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-2 bg-label-info flex-shrink-0"
                  style={{ width: 40, height: 40 }}
                >
                  <i className="bx bx-time-five" style={{ fontSize: '1.25rem' }}></i>
                </span>
                <div className="min-w-0">
                  <div className="fw-semibold text-truncate" style={{ fontSize: '0.9rem' }}>
                    {new Date().toLocaleString(undefined, { timeZone: selectedTimezone, hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                  <small className="text-muted">{t('admin.account.statsLocalTime', { defaultValue: 'Local Time' })}</small>
                </div>
              </div>
            </div>
            <div className="col-6 col-sm-3">
              <div className="d-flex align-items-center gap-3">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-2 bg-label-primary flex-shrink-0"
                  style={{ width: 40, height: 40 }}
                >
                  <i className="bx bx-calendar" style={{ fontSize: '1.25rem' }}></i>
                </span>
                <div className="min-w-0">
                  <div className="fw-semibold text-truncate" style={{ fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString(undefined, { timeZone: selectedTimezone, month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <small className="text-muted">{t('admin.account.statsDate', { defaultValue: 'Date' })}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          §2  MAIN CONTENT — Two columns on large screens
          ══════════════════════════════════════════════════════════ */}
      <div className="row">
        {/* ── Left Column ── */}
        <div className="col-xl-8 col-lg-7">
          {/* Change Password */}
          <div className="card mb-4">
            <div className="card-header d-flex align-items-center">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-2 bg-label-primary me-3 flex-shrink-0"
                style={{ width: 36, height: 36 }}
              >
                <i className="bx bx-key" style={{ fontSize: '1.1rem' }}></i>
              </span>
              <div>
                <h6 className="mb-0">{t('admin.account.passwordTitle', { defaultValue: 'Change Password' })}</h6>
                <small className="text-muted">
                  {t('admin.account.passwordDescription', {
                    defaultValue: "For security, you'll be logged out of all devices after changing your password.",
                  })}
                </small>
              </div>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onChangePassword)} noValidate>
                <div className="row">
                  <div className="col-md-8">
                    {/* Current Password */}
                    <div className="mb-3">
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
                    <div className="mb-3">
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
                    <div className="mb-3">
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
                      <div className="mb-3">
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
                      className="btn btn-primary mt-2"
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

        {/* ── Right Column ── */}
        <div className="col-xl-4 col-lg-5">
          {/* Timezone */}
          <div className="card mb-4">
            <div className="card-header d-flex align-items-center">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-2 bg-label-info me-3 flex-shrink-0"
                style={{ width: 36, height: 36 }}
              >
                <i className="bx bx-time-five" style={{ fontSize: '1.1rem' }}></i>
              </span>
              <div>
                <h6 className="mb-0">{t('settings.timezone.title', { defaultValue: 'Timezone' })}</h6>
                <small className="text-muted">
                  {t('settings.timezone.description', { defaultValue: 'Set your preferred timezone for displaying dates and times.' })}
                </small>
              </div>
            </div>
            <div className="card-body">
              {/* Live clock preview */}
              <div className="text-center mb-4 py-3 rounded-3" style={{ background: 'rgba(var(--bs-primary-rgb), 0.06)' }}>
                <div className="fw-bold fs-3 text-primary" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}>
                  {new Date().toLocaleString(undefined, { timeZone: selectedTimezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </div>
                <small className="text-muted">{selectedTimezone.replace(/_/g, ' ')}</small>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="timezone">
                  {t('settings.timezone.label', { defaultValue: 'Timezone' })}
                </label>
                <select
                  id="timezone"
                  className="form-select"
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-primary w-100"
                disabled={savingTimezone || !timezoneChanged}
                onClick={async () => {
                  setSavingTimezone(true)
                  try {
                    await updateProfileApi(token, { timezone: selectedTimezone })
                    updateUser({ timezone: selectedTimezone })
                    toast.success(t('settings.timezone.saved', { defaultValue: 'Timezone updated successfully' }))
                  } catch (err) {
                    logger.error('Failed to update timezone:', err)
                    toast.error(t('settings.timezone.failed', { defaultValue: 'Failed to update timezone' }))
                  } finally {
                    setSavingTimezone(false)
                  }
                }}
              >
                {savingTimezone ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    {t('common.saving', { defaultValue: 'Saving...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-check me-1"></i>
                    {t('common.save', { defaultValue: 'Save' })}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Security / 2FA */}
          <div className="card mb-4">
            <div className="card-header d-flex align-items-center">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-2 bg-label-warning me-3 flex-shrink-0"
                style={{ width: 36, height: 36 }}
              >
                <i className="bx bx-shield-quarter" style={{ fontSize: '1.1rem' }}></i>
              </span>
              <div>
                <h6 className="mb-0">{t('admin.account.twoFactorTitle', { defaultValue: 'Security' })}</h6>
                <small className="text-muted">
                  {t('admin.account.twoFactorSubtitle', { defaultValue: 'Two-factor authentication & security options' })}
                </small>
              </div>
            </div>
            <div className="card-body">
              {/* 2FA Status indicator */}
              <div className="d-flex align-items-center mb-3 p-3 rounded-3" style={{
                background: is2FAEnabled
                  ? 'rgba(var(--bs-success-rgb), 0.08)'
                  : 'rgba(var(--bs-warning-rgb), 0.08)',
              }}>
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0 ${is2FAEnabled ? 'bg-label-success' : 'bg-label-warning'}`}
                  style={{ width: 44, height: 44 }}
                >
                  <i className={`bx ${is2FAEnabled ? 'bx-check-shield' : 'bx-error'} fs-5`}></i>
                </div>
                <div className="flex-grow-1 min-w-0">
                  <h6 className="mb-0 small fw-semibold">
                    {t('admin.account.twoFactorLabel', { defaultValue: 'Two-Factor Authentication' })}
                  </h6>
                  {twoFALoading ? (
                    <div className="placeholder-glow">
                      <span className="placeholder col-8 placeholder-sm"></span>
                    </div>
                  ) : is2FAEnabled ? (
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className="badge bg-success" style={{ fontSize: '0.7rem' }}>
                        <i className="bx bx-check-circle me-1"></i>
                        {t('admin.account.twoFactorEnabled', { defaultValue: 'Enabled' })}
                      </span>
                      {twoFAStatus?.verifiedAt && (
                        <small className="text-muted">
                          {t('admin.account.twoFactorSince', { defaultValue: 'Since' })}{' '}
                          {fmtDate(twoFAStatus.verifiedAt)}
                        </small>
                      )}
                    </div>
                  ) : (
                    <small className="text-muted">
                      {t('admin.account.twoFactorDisabledHint', {
                        defaultValue: 'Not enabled — your account is less secure',
                      })}
                    </small>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-muted small mb-3">
                {t('admin.account.twoFactorDescription', {
                  defaultValue: "Add an extra layer of security. We'll ask for a code from your authenticator app when you sign in.",
                })}
              </p>

              {/* Action button */}
              {twoFALoading ? (
                <button className="btn btn-outline-primary w-100" disabled>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  {t('common.loading', { defaultValue: 'Loading...' })}
                </button>
              ) : is2FAEnabled ? (
                <button
                  className="btn btn-outline-danger w-100"
                  onClick={() => setShowDisableModal(true)}
                >
                  <i className="bx bx-power-off me-1"></i>
                  {t('admin.account.disable2FA', { defaultValue: 'Disable 2FA' })}
                </button>
              ) : (
                <button
                  className="btn btn-primary w-100"
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
