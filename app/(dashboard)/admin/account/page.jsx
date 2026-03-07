'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { useAuth, useToast } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { changePasswordApi, updateProfileApi } from '@/lib/api/auth';
import { get2FAStatus } from '@/lib/api/twoFactor';
import { changePasswordSchema } from '@/lib/validations/change-password';
import { logger } from '@/lib/utils/logger';
import { useDateFormat } from '@/hooks/useDateFormat';
import { COMMON_TIMEZONES } from '@/lib/constants';
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, InputGroup, InputIcon, Label, Select } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

const Setup2FAModal = dynamic(() => import('@/components/TwoFactorModals').then((m) => m.Setup2FAModal), { ssr: false });
const Disable2FAModal = dynamic(() => import('@/components/TwoFactorModals').then((m) => m.Disable2FAModal), { ssr: false });

export default function AdminAccountPage() {
  const { t } = useAdminTranslation();
  const { fmtDate } = useDateFormat();
  const { token, logout, user, updateUser } = useAuth();
  const toast = useToast();
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── 2FA State ──
  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [twoFALoading, setTwoFALoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [savingTimezone, setSavingTimezone] = useState(false);
  const timezoneChanged = selectedTimezone !== (user?.timezone || 'UTC');

  const fetch2FAStatus = useCallback(async () => {
    if (!token) return;
    setTwoFALoading(true);
    try {
      const res = await get2FAStatus(token);
      setTwoFAStatus(res);
    } catch (err) {
      logger.error('Failed to fetch 2FA status:', err);
    } finally {
      setTwoFALoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetch2FAStatus();
  }, [fetch2FAStatus]);

  const is2FAEnabled = twoFAStatus?.enabled && twoFAStatus?.verified;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset: resetForm,
    setError: setFormError
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirmation: '',
      totpCode: ''
    }
  });

  const onChangePassword = async (formData) => {
    setChangingPassword(true);
    try {
      const payload = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        newPasswordConfirmation: formData.newPasswordConfirmation
      };
      if (is2FAEnabled && formData.totpCode) {
        payload.totpCode = formData.totpCode;
      }
      await changePasswordApi(token, payload);

      toast.success(
        t('admin.account.changeSuccess', {
          defaultValue: 'Password changed successfully. Please log in again.'
        })
      );
      resetForm();
      setTimeout(() => logout(), 1500);
    } catch (err) {
      const errorMsg = err?.message || err?.details || 'Password change failed';
      const errorCode = err?.code || '';
      if (errorCode === 'TWO_FACTOR_REQUIRED') {
        setFormError('totpCode', {
          message: t('admin.account.totpRequired', { defaultValue: 'Please enter your 2FA code' })
        });
      } else if (errorMsg.toLowerCase().includes('invalid code') || errorMsg.toLowerCase().includes('too many attempts')) {
        setFormError('totpCode', { message: errorMsg });
      } else if (errorMsg.toLowerCase().includes('current password')) {
        setFormError('currentPassword', {
          message: t('admin.account.incorrectCurrent', { defaultValue: 'Current password is incorrect' })
        });
      } else {
        logger.error('Failed to change password:', err);
        toast.error(
          t('admin.account.changeFailed', { defaultValue: 'Failed to change password. Please try again.' })
        );
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="grow py-6">
      {/* ══════════════════════════════════════════════════════════
            §1  PROFILE HERO CARD
            ══════════════════════════════════════════════════════════ */}
      <Card className="mb-4 overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary-600 via-purple-500 to-cyan-500" />

        <div className="p-4 pb-3">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Avatar */}
            <div
              className="flex items-center justify-center rounded-lg shrink-0 w-20 h-20"
              style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(59, 130, 246, 0.04) 100%)' }}>
              
              <i className="bx bx-user-circle text-[2.5rem] text-primary-600"></i>
            </div>

            {/* Info */}
            <div className="grow min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="mb-0 truncate">{user?.fullName || user?.email || '-'}</h4>
                <Badge color="primary" label>{t('admin.account.adminBadge', { defaultValue: 'Admin' })}</Badge>
              </div>

              <div className="flex flex-wrap gap-3 text-surface-500 text-sm mt-1">
                {user?.email &&
                <span><i className="bx bx-envelope mr-1"></i>{user.email}</span>
                }
                <span>
                  <i className="bx bx-globe mr-1"></i>
                  {selectedTimezone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="px-5 py-3 border-t border-surface-200 bg-transparent">
          <div className="grid grid-cols-12 gap-x-6 gap-3">
            <div className="col-span-6 sm:col-span-3">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center justify-center rounded bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-300 shrink-0 w-10 h-10">

                  
                  <i className="bx bx-check-shield text-xl"></i>
                </span>
                <div className="min-w-0">
                  <div className="font-semibold truncate text-[0.9rem]">
                    {t('admin.account.statusActive', { defaultValue: 'Active' })}
                  </div>
                  <small className="text-surface-500">{t('common.status', { defaultValue: 'Status' })}</small>
                </div>
              </div>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center rounded shrink-0 ${is2FAEnabled ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-300' : 'bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-300'} w-10 h-10`}>

                  
                  <i className={`bx ${is2FAEnabled ? 'bx-lock-alt' : 'bx-lock-open-alt'} text-xl`}></i>
                </span>
                <div className="min-w-0">
                  <div className="font-semibold truncate text-[0.9rem]">
                    {twoFALoading ? '...' : is2FAEnabled ?
                    t('admin.account.twoFactorEnabled', { defaultValue: 'Enabled' }) :
                    t('admin.account.twoFactorDisabled', { defaultValue: 'Disabled' })}
                  </div>
                  <small className="text-surface-500">{t('admin.account.stats2FA', { defaultValue: '2FA' })}</small>
                </div>
              </div>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center justify-center rounded bg-info-50 dark:bg-info-500/10 text-info-700 dark:text-info-300 shrink-0 w-10 h-10">

                  
                  <i className="bx bx-time-five text-xl"></i>
                </span>
                <div className="min-w-0">
                  <div className="font-semibold truncate text-[0.9rem]">
                    {new Date().toLocaleString(undefined, { timeZone: selectedTimezone, hour: '2-digit', minute: '2-digit', hour12: false })}
                  </div>
                  <small className="text-surface-500">{t('admin.account.statsLocalTime', { defaultValue: 'Local Time' })}</small>
                </div>
              </div>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center justify-center rounded bg-primary-50 text-primary-600 shrink-0 w-10 h-10">

                  
                  <i className="bx bx-calendar text-xl"></i>
                </span>
                <div className="min-w-0">
                  <div className="font-semibold truncate text-[0.9rem]">
                    {new Date().toLocaleDateString(undefined, { timeZone: selectedTimezone, month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <small className="text-surface-500">{t('admin.account.statsDate', { defaultValue: 'Date' })}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ══════════════════════════════════════════════════════════
            §2  MAIN CONTENT — Two columns on large screens
            ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-x-6">
        {/* ── Left Column ── */}
        <div className="xl:col-span-8 lg:col-span-7 col-span-12">
          {/* Change Password */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200 flex items-center">
              <span
                className="inline-flex items-center justify-center rounded bg-primary-50 text-primary-600 mr-3 shrink-0 w-9 h-9">

                
                <i className="bx bx-key text-[1.1rem]"></i>
              </span>
              <div>
                <h6 className="mb-0">{t('admin.account.passwordTitle', { defaultValue: 'Change Password' })}</h6>
                <small className="text-surface-500">
                  {t('admin.account.passwordDescription', {
                    defaultValue: "For security, you'll be logged out of all devices after changing your password."
                  })}
                </small>
              </div>
            </div>
            <div className="p-5">
              <form onSubmit={handleSubmit(onChangePassword)} noValidate>
                <div className="grid grid-cols-12 gap-x-6">
                  <div className="md:col-span-8">
                    {/* Current Password */}
                    <div className="mb-3">
                      <Label htmlFor="currentPassword">
                        {t('admin.account.currentPassword', { defaultValue: 'Current Password' })}
                      </Label>
                      <InputGroup error={errors.currentPassword}>
                        <Input
                          type={showCurrentPassword ? 'text' : 'password'}
                          id="currentPassword"

                          placeholder="••••••••"
                          autoComplete="current-password"
                          {...register('currentPassword')} />
                        
                        <InputIcon
                          as="button"
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                          
                          <i className={`bx ${showCurrentPassword ? 'bx-show' : 'bx-hide'}`}></i>
                        </InputIcon>
                      </InputGroup>
                      {errors.currentPassword &&
                      <div className="text-xs text-danger-500 mt-1 block">{errors.currentPassword.message}</div>
                      }
                    </div>

                    {/* New Password */}
                    <div className="mb-3">
                      <Label htmlFor="newPassword">
                        {t('admin.account.newPassword', { defaultValue: 'New Password' })}
                      </Label>
                      <InputGroup error={errors.newPassword}>
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          id="newPassword"

                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...register('newPassword')} />
                        
                        <InputIcon
                          as="button"
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}>
                          
                          <i className={`bx ${showNewPassword ? 'bx-show' : 'bx-hide'}`}></i>
                        </InputIcon>
                      </InputGroup>
                      {errors.newPassword &&
                      <div className="text-xs text-danger-500 mt-1 block">{errors.newPassword.message}</div>
                      }
                      <div className="text-xs text-surface-500 mt-1">
                        {t('admin.account.requirements', {
                          defaultValue: 'Min 8 characters with uppercase, lowercase, number, and special character.'
                        })}
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="mb-3">
                      <Label htmlFor="newPasswordConfirmation">
                        {t('admin.account.confirmPassword', { defaultValue: 'Confirm New Password' })}
                      </Label>
                      <InputGroup error={errors.newPasswordConfirmation}>
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="newPasswordConfirmation"

                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...register('newPasswordConfirmation')} />
                        
                        <InputIcon
                          as="button"
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          
                          <i className={`bx ${showConfirmPassword ? 'bx-show' : 'bx-hide'}`}></i>
                        </InputIcon>
                      </InputGroup>
                      {errors.newPasswordConfirmation &&
                      <div className="text-xs text-danger-500 mt-1 block">{errors.newPasswordConfirmation.message}</div>
                      }
                    </div>

                    {/* 2FA Code (only if 2FA is enabled) */}
                    {is2FAEnabled &&
                    <div className="mb-3">
                        <Label htmlFor="totpCode">
                          <i className="bx bx-shield-quarter mr-1 text-warning"></i>
                          {t('admin.account.totpLabel', { defaultValue: '2FA Verification Code' })}
                        </Label>
                        <Input
                        type="text"
                        id="totpCode"

                        placeholder="000000"
                        inputMode="numeric"
                        maxLength={20}
                        autoComplete="one-time-code"
                        {...register('totpCode')} error={errors.totpCode} />
                      
                        {errors.totpCode &&
                      <div className="text-xs text-danger-500 mt-1 block">{errors.totpCode.message}</div>
                      }
                        <div className="text-xs text-surface-500 mt-1">
                          {t('admin.account.totpHint', {
                          defaultValue: 'Enter the code from your authenticator app or a backup code.'
                        })}
                        </div>
                      </div>
                    }

                    {/* Submit */}
                    <Button
                      type="submit"

                      disabled={changingPassword || !isValid} className="mt-2">
                      
                      {changingPassword ?
                      <>
                          <Spinner className="w-4 h-4 mr-2" />
                          {t('admin.account.changing', { defaultValue: 'Changing...' })}
                        </> :

                      <>
                          <i className="bx bx-check mr-1"></i>
                          {t('admin.account.changeButton', { defaultValue: 'Change Password' })}
                        </>
                      }
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="xl:col-span-4 lg:col-span-5 col-span-12">
          {/* Timezone */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200 flex items-center">
              <span
                className="inline-flex items-center justify-center rounded bg-info-50 dark:bg-info-500/10 text-info-700 dark:text-info-300 mr-3 shrink-0 w-9 h-9">

                
                <i className="bx bx-time-five text-[1.1rem]"></i>
              </span>
              <div>
                <h6 className="mb-0">{t('settings.timezone.title', { defaultValue: 'Timezone' })}</h6>
                <small className="text-surface-500">
                  {t('settings.timezone.description', { defaultValue: 'Set your preferred timezone for displaying dates and times.' })}
                </small>
              </div>
            </div>
            <div className="p-5">
              {/* Live clock preview */}
              <div className="text-center mb-4 py-3 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.06)' }}>
                <div className="font-bold text-[1.75rem] text-primary tabular-nums tracking-[0.05em]">
                  {new Date().toLocaleString(undefined, { timeZone: selectedTimezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </div>
                <small className="text-surface-500">{selectedTimezone.replace(/_/g, ' ')}</small>
              </div>

              <div className="mb-3">
                <Label htmlFor="timezone">
                  {t('settings.timezone.label', { defaultValue: 'Timezone' })}
                </Label>
                <Select
                  id="timezone"

                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}>
                  
                  {COMMON_TIMEZONES.map((tz) =>
                  <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  )}
                </Select>
              </div>
              <Button
                type="button"

                disabled={savingTimezone || !timezoneChanged}
                onClick={async () => {
                  setSavingTimezone(true);
                  try {
                    await updateProfileApi(token, { timezone: selectedTimezone });
                    updateUser({ timezone: selectedTimezone });
                    toast.success(t('settings.timezone.saved', { defaultValue: 'Timezone updated successfully' }));
                  } catch (err) {
                    logger.error('Failed to update timezone:', err);
                    toast.error(t('settings.timezone.failed', { defaultValue: 'Failed to update timezone' }));
                  } finally {
                    setSavingTimezone(false);
                  }
                }} className="w-full">
                
                {savingTimezone ?
                <>
                    <Spinner className="w-4 h-4 mr-2" />
                    {t('common.saving', { defaultValue: 'Saving...' })}
                  </> :

                <>
                    <i className="bx bx-check mr-1"></i>
                    {t('common.save', { defaultValue: 'Save' })}
                  </>
                }
              </Button>
            </div>
          </Card>

          {/* Security / 2FA */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200 flex items-center">
              <span
                className="inline-flex items-center justify-center rounded bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-300 mr-3 shrink-0 w-9 h-9">

                
                <i className="bx bx-shield-quarter text-[1.1rem]"></i>
              </span>
              <div>
                <h6 className="mb-0">{t('admin.account.twoFactorTitle', { defaultValue: 'Security' })}</h6>
                <small className="text-surface-500">
                  {t('admin.account.twoFactorSubtitle', { defaultValue: 'Two-factor authentication & security options' })}
                </small>
              </div>
            </div>
            <div className="p-5">
              {/* 2FA Status indicator */}
              <div className="flex items-center mb-3 p-3 rounded-lg" style={{
                background: is2FAEnabled ?
                'rgba(34, 197, 94, 0.08)' :
                'rgba(245, 158, 11, 0.08)'
              }}>
                <div
                  className={`rounded-full flex items-center justify-center mr-3 shrink-0 ${is2FAEnabled ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-300' : 'bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-300'} w-11 h-11`}>

                  
                  <i className={`bx ${is2FAEnabled ? 'bx-check-shield' : 'bx-error'} text-xl`}></i>
                </div>
                <div className="grow min-w-0">
                  <h6 className="mb-0 text-sm font-semibold">
                    {t('admin.account.twoFactorLabel', { defaultValue: 'Two-Factor Authentication' })}
                  </h6>
                  {twoFALoading ?
                  <div className="h-4 w-2/3 rounded bg-surface-200 animate-pulse"></div> :
                  is2FAEnabled ?
                  <div className="flex items-center gap-2 mt-1">
                      <Badge color="success" className="text-[0.7rem]">
                        <i className="bx bx-check-circle mr-1"></i>
                        {t('admin.account.twoFactorEnabled', { defaultValue: 'Enabled' })}
                      </Badge>
                      {twoFAStatus?.verifiedAt &&
                    <small className="text-surface-500">
                          {t('admin.account.twoFactorSince', { defaultValue: 'Since' })}{' '}
                          {fmtDate(twoFAStatus.verifiedAt)}
                        </small>
                    }
                    </div> :

                  <small className="text-surface-500">
                      {t('admin.account.twoFactorDisabledHint', {
                      defaultValue: 'Not enabled — your account is less secure'
                    })}
                    </small>
                  }
                </div>
              </div>

              {/* Description */}
              <p className="text-surface-500 text-sm mb-3">
                {t('admin.account.twoFactorDescription', {
                  defaultValue: "Add an extra layer of security. We'll ask for a code from your authenticator app when you sign in."
                })}
              </p>

              {/* Action button */}
              {twoFALoading ?
              <Button disabled variant="outline-primary" className="bg-transparent hover:bg-primary-600 hover:text-white w-full">
                  <Spinner className="w-4 h-4 mr-2" />
                  {t('common.loading', { defaultValue: 'Loading...' })}
                </Button> :
              is2FAEnabled ?
              <Button

                onClick={() => setShowDisableModal(true)} className="border border-danger-500 text-danger-500 bg-transparent hover:bg-danger-500 hover:text-white w-full">
                
                  <i className="bx bx-power-off mr-1"></i>
                  {t('admin.account.disable2FA', { defaultValue: 'Disable 2FA' })}
                </Button> :

              <Button

                onClick={() => setShowSetupModal(true)} className="w-full">
                
                  <i className="bx bx-lock mr-1"></i>
                  {t('admin.account.enable2FA', { defaultValue: 'Enable 2FA' })}
                </Button>
              }
            </div>
          </Card>
        </div>
      </div>

      {/* 2FA Modals */}
      <Setup2FAModal
        show={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={() => {
          toast.success(t('admin.account.twoFactorEnableSuccess', { defaultValue: '2FA enabled successfully!' }));
          fetch2FAStatus();
        }}
        token={token} />
      
      <Disable2FAModal
        show={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onSuccess={() => {
          toast.success(t('admin.account.twoFactorDisableSuccess', { defaultValue: '2FA disabled successfully.' }));
          fetch2FAStatus();
        }}
        token={token} />
      
    </div>);

}