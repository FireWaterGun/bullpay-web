'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { useAuth, useToast } from '@/app/providers';
import { get2FAStatus } from '@/lib/api/twoFactor';
import { changePasswordApi, updateProfileApi } from '@/lib/api/auth';
import { changePasswordSchema } from '@/lib/validations/change-password';
const Setup2FAModal = dynamic(() => import('@/components/TwoFactorModals').then((m) => m.Setup2FAModal), { ssr: false });
const Disable2FAModal = dynamic(() => import('@/components/TwoFactorModals').then((m) => m.Disable2FAModal), { ssr: false });
import RefreshButton from '@/components/RefreshButton';
import { useDateFormat } from '@/hooks/useDateFormat';
import { logger } from '@/lib/utils/logger';
import { COMMON_TIMEZONES } from '@/lib/constants';
import { Button, Card, Input, InputGroup, InputIcon, Label, Select, Spinner } from '@/components/ui';

const iconBoxColors = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
  success: 'bg-green-100 text-green-600 dark:bg-success-500/15 dark:text-[#86efac]',
  warning: 'bg-amber-100 text-amber-600 dark:bg-warning-500/15 dark:text-[#fcd34d]',
  info: 'bg-blue-100 text-blue-600 dark:bg-info-500/15 dark:text-[#67e8f9]',
  danger: 'bg-red-100 text-red-600 dark:bg-danger-500/15 dark:text-[#fca5a5]'
};

function IconBox({ icon, color = 'primary', size = 40 }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg shrink-0 ${iconBoxColors[color] || iconBoxColors.primary}`}
      style={{ width: size, height: size }}>
      
      <i className={`bx ${icon} text-xl`}></i>
    </span>);

}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { fmtDate } = useDateFormat();
  const { token, user, logout, updateUser } = useAuth();
  const toast = useToast();
  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [savingTimezone, setSavingTimezone] = useState(false);

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

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await get2FAStatus(token);
      setTwoFAStatus(res);
    } catch (err) {
      logger.error('Failed to fetch 2FA status:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const is2FAEnabled = twoFAStatus?.enabled && twoFAStatus?.verified;

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
        t('settings.password.changeSuccess', {
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
          message: t('settings.password.totpRequired', { defaultValue: 'Please enter your 2FA code' })
        });
      } else if (errorMsg.toLowerCase().includes('invalid code') || errorMsg.toLowerCase().includes('too many attempts')) {
        setFormError('totpCode', { message: errorMsg });
      } else if (errorMsg.toLowerCase().includes('current password')) {
        setFormError('currentPassword', { message: t('settings.password.incorrectCurrent', { defaultValue: 'Current password is incorrect' }) });
      } else {
        logger.error('Failed to change password:', err);
        toast.error(t('settings.password.changeFailed', { defaultValue: 'Failed to change password. Please try again.' }));
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const timezoneChanged = selectedTimezone !== (user?.timezone || 'UTC');

  return (
    <>
      {/* ══ §1 PROFILE HERO CARD ══ */}
      <Card className="mb-6 overflow-hidden">
        <div className="p-5 pb-4">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Avatar */}
            <div className="flex items-center justify-center w-20 h-20 rounded-xl bg-primary-50 dark:bg-primary-500/15 shrink-0">
              <i className="bx bx-user-circle text-[2.5rem] text-primary-600 dark:text-primary-400"></i>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="text-xl font-semibold text-surface-900 truncate mb-0">
                  {user?.fullName || user?.email || '-'}
                </h4>
                <div className="ml-auto">
                  <RefreshButton onClick={fetchStatus} loading={loading} />
                </div>
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
        <div className="border-t border-surface-200 py-3 px-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Active */}
            <div className="flex items-center gap-3">
              <IconBox icon="bx-check-shield" color="success" />
              <div className="min-w-0">
                <div className="font-semibold text-surface-900 text-[0.9rem] truncate">
                  {t('settings.stats.active', { defaultValue: 'Active' })}
                </div>
                <small className="text-surface-500">{t('common.status', { defaultValue: 'Status' })}</small>
              </div>
            </div>
            {/* 2FA */}
            <div className="flex items-center gap-3">
              <IconBox
                icon={is2FAEnabled ? 'bx-lock-alt' : 'bx-lock-open-alt'}
                color={is2FAEnabled ? 'success' : 'warning'} />
              
              <div className="min-w-0">
                <div className="font-semibold text-surface-900 text-[0.9rem] truncate">
                  {loading ? '...' : is2FAEnabled ?
                  t('settings.2fa.enabled', { defaultValue: 'Enabled' }) :
                  t('settings.2fa.disabled', { defaultValue: 'Disabled' })}
                </div>
                <small className="text-surface-500">{t('settings.stats.twoFA', { defaultValue: '2FA' })}</small>
              </div>
            </div>
            {/* Time */}
            <div className="flex items-center gap-3">
              <IconBox icon="bx-time-five" color="info" />
              <div className="min-w-0">
                <div className="font-semibold text-surface-900 text-[0.9rem] truncate">
                  {new Date().toLocaleString(undefined, { timeZone: selectedTimezone, hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
                <small className="text-surface-500">{t('settings.stats.localTime', { defaultValue: 'Local Time' })}</small>
              </div>
            </div>
            {/* Date */}
            <div className="flex items-center gap-3">
              <IconBox icon="bx-calendar" color="primary" />
              <div className="min-w-0">
                <div className="font-semibold text-surface-900 text-[0.9rem] truncate">
                  {new Date().toLocaleDateString(undefined, { timeZone: selectedTimezone, month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <small className="text-surface-500">{t('settings.stats.date', { defaultValue: 'Date' })}</small>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ══ §2 MAIN CONTENT ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left Column ── */}
        <div className="lg:col-span-8">
          {/* Change Password */}
          <Card className="mb-6">
            <div className="px-6 py-4 border-b border-surface-200 flex items-center gap-3">
              <IconBox icon="bx-key" color="primary" size={36} />
              <div>
                <h6 className="font-semibold text-surface-900 mb-0">
                  {t('settings.password.title', { defaultValue: 'Change Password' })}
                </h6>
                <small className="text-surface-500">
                  {t('settings.password.description', {
                    defaultValue: "For security, you'll be logged out of all devices after changing your password."
                  })}
                </small>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit(onChangePassword)} noValidate>
                <div className="max-w-lg">
                  {/* Current Password */}
                  <div className="mb-4">
                    <Label htmlFor="currentPassword">
                      {t('settings.password.currentPassword', { defaultValue: 'Current Password' })}
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
                        tabIndex={-1}
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                        
                        <i className={`bx text-lg ${showCurrentPassword ? 'bx-show' : 'bx-hide'}`}></i>
                      </InputIcon>
                    </InputGroup>
                    {errors.currentPassword &&
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.currentPassword.message}</p>
                    }
                  </div>

                  {/* New Password */}
                  <div className="mb-4">
                    <Label htmlFor="newPassword">
                      {t('settings.password.newPassword', { defaultValue: 'New Password' })}
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
                        tabIndex={-1}
                        onClick={() => setShowNewPassword(!showNewPassword)}>
                        
                        <i className={`bx text-lg ${showNewPassword ? 'bx-show' : 'bx-hide'}`}></i>
                      </InputIcon>
                    </InputGroup>
                    {errors.newPassword &&
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.newPassword.message}</p>
                    }
                    <p className="text-surface-400 text-xs mt-1">
                      {t('settings.password.requirements', {
                        defaultValue: 'Min 8 characters with uppercase, lowercase, number, and special character.'
                      })}
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-4">
                    <Label htmlFor="newPasswordConfirmation">
                      {t('settings.password.confirmPassword', { defaultValue: 'Confirm New Password' })}
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
                        tabIndex={-1}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        
                        <i className={`bx text-lg ${showConfirmPassword ? 'bx-show' : 'bx-hide'}`}></i>
                      </InputIcon>
                    </InputGroup>
                    {errors.newPasswordConfirmation &&
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.newPasswordConfirmation.message}</p>
                    }
                  </div>

                  {/* 2FA Code */}
                  {is2FAEnabled &&
                  <div className="mb-4">
                      <Label htmlFor="totpCode">
                        <i className="bx bx-shield-quarter mr-1 text-amber-500 dark:text-[#fcd34d]"></i>
                        {t('settings.password.totpLabel', { defaultValue: '2FA Verification Code' })}
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
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.totpCode.message}</p>
                    }
                      <p className="text-surface-400 text-xs mt-1">
                        {t('settings.password.totpHint', {
                        defaultValue: 'Enter the code from your authenticator app or a backup code.'
                      })}
                      </p>
                    </div>
                  }

                  {/* Submit */}
                  <Button
                    type="submit"

                    disabled={changingPassword || !isValid} className="mt-2">
                    
                    {changingPassword ?
                    <>
                        <Spinner className="w-4 h-4 mr-2" />
                        {t('settings.password.changing', { defaultValue: 'Changing...' })}
                      </> :

                    <>
                        <i className="bx bx-check mr-1"></i>
                        {t('settings.password.changeButton', { defaultValue: 'Change Password' })}
                      </>
                    }
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>

        {/* ── Right Column ── */}
        <div className="lg:col-span-4">
          {/* Timezone */}
          <Card className="mb-6">
            <div className="px-6 py-4 border-b border-surface-200 flex items-center gap-3">
              <IconBox icon="bx-time-five" color="info" size={36} />
              <div>
                <h6 className="font-semibold text-surface-900 mb-0">
                  {t('settings.timezone.title', { defaultValue: 'Timezone' })}
                </h6>
                <small className="text-surface-500">
                  {t('settings.timezone.description', { defaultValue: 'Set your preferred timezone for displaying dates and times.' })}
                </small>
              </div>
            </div>
            <div className="p-6">
              {/* Clock preview */}
              <div className="text-center mb-4 py-3 rounded-xl bg-primary-50 dark:bg-primary-500/10">
                <div className="font-bold text-3xl text-primary-600 dark:text-primary-400 tabular-nums tracking-wider">
                  {new Date().toLocaleString(undefined, { timeZone: selectedTimezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </div>
                <small className="text-surface-500">{selectedTimezone.replace(/_/g, ' ')}</small>
              </div>

              <div className="mb-4">
                <Label htmlFor="timezone">
                  {t('settings.timezone.label', { defaultValue: 'Timezone' })}
                </Label>
                <Select
                  id="timezone"

                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)} className="w-full">
                  
                  {COMMON_TIMEZONES.map((tz) =>
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
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
          <Card className="mb-6">
            <div className="px-6 py-4 border-b border-surface-200 flex items-center gap-3">
              <IconBox icon="bx-shield-quarter" color="warning" size={36} />
              <div>
                <h6 className="font-semibold text-surface-900 mb-0">
                  {t('settings.security.title', { defaultValue: 'Security' })}
                </h6>
                <small className="text-surface-500">
                  {t('settings.security.subtitle', { defaultValue: 'Two-factor authentication & security options' })}
                </small>
              </div>
            </div>
            <div className="p-6">
              {/* 2FA Status */}
              <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl ${is2FAEnabled ? 'bg-green-50 dark:bg-success-500/10' : 'bg-amber-50 dark:bg-warning-500/10'}`
              }>
                <div className={`flex items-center justify-center w-11 h-11 rounded-full shrink-0 ${is2FAEnabled ? 'bg-green-100 text-green-600 dark:bg-success-500/15 dark:text-[#86efac]' : 'bg-amber-100 text-amber-600 dark:bg-warning-500/15 dark:text-[#fcd34d]'}`
                }>
                  <i className={`bx ${is2FAEnabled ? 'bx-check-shield' : 'bx-error'} text-xl`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h6 className="text-sm font-semibold text-surface-900 mb-0">
                    {t('settings.2fa.title', { defaultValue: 'Two-Factor Authentication' })}
                  </h6>
                  {loading ?
                  <div className="h-3 w-24 bg-surface-100 dark:bg-dark-elevated rounded animate-pulse mt-1"></div> :
                  is2FAEnabled ?
                  <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[0.7rem] font-semibold text-white bg-green-500 rounded">
                        <i className="bx bx-check-circle mr-1"></i>
                        {t('settings.2fa.enabled', { defaultValue: 'Enabled' })}
                      </span>
                      {twoFAStatus?.verifiedAt &&
                    <small className="text-surface-500">
                          {t('settings.2fa.enabledSince', { defaultValue: 'Since' })}{' '}
                          {fmtDate(twoFAStatus.verifiedAt)}
                        </small>
                    }
                    </div> :

                  <small className="text-surface-500">
                      {t('settings.2fa.disabledHint', { defaultValue: 'Not enabled — your account is less secure' })}
                    </small>
                  }
                </div>
              </div>

              <p className="text-surface-500 text-sm mb-4">
                {t('settings.2fa.description', {
                  defaultValue: "Add an extra layer of security. We'll ask for a code from your authenticator app when you sign in."
                })}
              </p>

              {loading ?
              <Button disabled variant="outline-primary" className="bg-transparent hover:bg-primary-600 hover:text-white w-full">
                  <Spinner className="w-4 h-4 mr-2" />
                  {t('common.loading', { defaultValue: 'Loading...' })}
                </Button> :
              is2FAEnabled ?
              <Button

                onClick={() => setShowDisableModal(true)} className="w-full border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer rounded-[10px] py-2">
                
                  <i className="bx bx-power-off mr-1"></i>
                  {t('settings.2fa.disable', { defaultValue: 'Disable 2FA' })}
                </Button> :

              <Button

                onClick={() => setShowSetupModal(true)} className="w-full">
                
                  <i className="bx bx-lock mr-1"></i>
                  {t('settings.2fa.enable', { defaultValue: 'Enable 2FA' })}
                </Button>
              }
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <Setup2FAModal
        show={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={() => {
          fetchStatus();
          toast.success(t('settings.2fa.enableSuccess', { defaultValue: 'Two-factor authentication enabled successfully' }));
        }}
        token={token} />
      
      <Disable2FAModal
        show={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onSuccess={() => {
          fetchStatus();
          toast.success(t('settings.2fa.disableSuccess', { defaultValue: 'Two-factor authentication has been disabled' }));
        }}
        token={token} />
      
    </>);

}