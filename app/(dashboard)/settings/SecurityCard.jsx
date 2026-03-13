'use client'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'

/**
 * 2FA / Security card — status indicator + enable/disable toggle.
 */
export default function SecurityCard({ is2FAEnabled, twoFALoading, twoFAStatus, fmtDate, onSetup, onDisable, t }) {
  return (
    <Card className="h-full">
      <div className="px-5 py-4 border-b border-surface-200 flex items-center">
        <span className="inline-flex items-center justify-center rounded bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-300 mr-3 shrink-0 w-9 h-9">
          <i className="bx bx-shield-quarter text-[1.1rem]" />
        </span>
        <div>
          <h6 className="mb-0">{t('settings.security.title', { defaultValue: 'Security' })}</h6>
          <small className="text-surface-500">
            {t('settings.security.subtitle', { defaultValue: 'Two-factor authentication & security options' })}
          </small>
        </div>
      </div>

      <div className="p-5">
        {/* 2FA Status indicator */}
        <div
          className={`flex items-center mb-3 p-3 rounded-lg ${is2FAEnabled ? 'bg-green-500/8' : 'bg-amber-500/8'}`}
        >
          <div
            className={`rounded-full flex items-center justify-center mr-3 shrink-0 w-11 h-11 ${
              is2FAEnabled
                ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-300'
                : 'bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-300'
            }`}
          >
            <i className={`bx ${is2FAEnabled ? 'bx-check-shield' : 'bx-error'} text-xl`} />
          </div>
          <div className="grow min-w-0">
            <h6 className="mb-0 text-sm font-semibold">
              {t('settings.2fa.title', { defaultValue: 'Two-Factor Authentication' })}
            </h6>
            {twoFALoading ? (
              <div className="h-4 w-2/3 rounded bg-surface-200 animate-pulse" />
            ) : is2FAEnabled ? (
              <div className="flex items-center gap-2 mt-1">
                <Badge color="success" className="text-[0.7rem]">
                  <i className="bx bx-check-circle mr-1" />
                  {t('settings.2fa.enabled', { defaultValue: 'Enabled' })}
                </Badge>
                {twoFAStatus?.verifiedAt && (
                  <small className="text-surface-500">
                    {t('settings.2fa.enabledSince', { defaultValue: 'Since' })} {fmtDate(twoFAStatus.verifiedAt)}
                  </small>
                )}
              </div>
            ) : (
              <small className="text-surface-500">
                {t('settings.2fa.disabledHint', { defaultValue: 'Not enabled — your account is less secure' })}
              </small>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-surface-500 text-sm mb-3">
          {t('settings.2fa.description', {
            defaultValue:
              "Add an extra layer of security. We'll ask for a code from your authenticator app when you sign in.",
          })}
        </p>

        {/* Action button */}
        {twoFALoading ? (
          <Button
            disabled
            variant="outline-primary"
            className="bg-transparent hover:bg-primary-600 hover:text-white w-full"
          >
            <Spinner className="w-4 h-4 mr-2" />
            {t('common.loading', { defaultValue: 'Loading...' })}
          </Button>
        ) : is2FAEnabled ? (
          <Button
            onClick={onDisable}
            className="border border-danger-500 text-danger-500 bg-transparent hover:bg-danger-500 hover:text-white w-full"
          >
            <i className="bx bx-power-off mr-1" />
            {t('settings.2fa.disable', { defaultValue: 'Disable 2FA' })}
          </Button>
        ) : (
          <Button onClick={onSetup} className="w-full">
            <i className="bx bx-lock mr-1" />
            {t('settings.2fa.enable', { defaultValue: 'Enable 2FA' })}
          </Button>
        )}
      </div>
    </Card>
  )
}
