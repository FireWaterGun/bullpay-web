export const statusColors = {
  active: {
    bg: 'bg-success-50 dark:bg-success-950/30',
    text: 'text-success-700 dark:text-success-400',
    icon: 'bx-check-shield',
  },
  suspended: {
    bg: 'bg-danger-50 dark:bg-danger-950/30',
    text: 'text-danger-700 dark:text-danger-400',
    icon: 'bx-block',
  },
  pending: {
    bg: 'bg-warning-50 dark:bg-warning-950/30',
    text: 'text-warning-700 dark:text-warning-400',
    icon: 'bx-time-five',
  },
}

export const tileColors = {
  primary: { bg: 'bg-primary-50 dark:bg-primary-950/30', icon: 'text-primary-600 dark:text-primary-400' },
  success: { bg: 'bg-success-50 dark:bg-success-950/30', icon: 'text-success-600 dark:text-success-400' },
  info: { bg: 'bg-info-50 dark:bg-info-950/30', icon: 'text-info-600 dark:text-info-400' },
  secondary: { bg: 'bg-surface-100 dark:bg-dark-elevated', icon: 'text-surface-500 dark:text-surface-400' },
  danger: { bg: 'bg-danger-50 dark:bg-danger-950/30', icon: 'text-danger-600 dark:text-danger-400' },
  warning: { bg: 'bg-warning-50 dark:bg-warning-950/30', icon: 'text-warning-600 dark:text-warning-400' },
}

export function statusMeta(status, t) {
  const s = String(status || '').toLowerCase()
  if (s === 'active') return { ...statusColors.active, label: t('merchant.status.active', { defaultValue: 'Active' }) }
  if (s === 'suspended') {
    return { ...statusColors.suspended, label: t('merchant.status.suspended', { defaultValue: 'Suspended' }) }
  }
  if (s === 'pending') {
    return { ...statusColors.pending, label: t('merchant.status.pending', { defaultValue: 'Pending' }) }
  }
  return {
    bg: 'bg-surface-100 dark:bg-dark-elevated',
    text: 'text-surface-600 dark:text-surface-400',
    icon: 'bx-help-circle',
    label: t('merchant.status.unknown', { defaultValue: status || 'Unknown' }),
  }
}

export function resolveSensitiveActionError(t, error, fallbackTranslation) {
  const code = error?.code || error?.data?.error?.code || error?.data?.code
  const apiMsg = error?.data?.error?.message || error?.message
  const details = error?.data?.error?.details || error?.details || {}

  if (code === 'TWO_FACTOR_REQUIRED') {
    return {
      requires2FA: true,
      message: t('merchant.twoFactorRequired', { defaultValue: 'Please enter your password and 2FA code' }),
    }
  }

  if (code === 'PASSWORD_REQUIRED') {
    return {
      requires2FA: false,
      message: t('merchant.passwordRequired', { defaultValue: 'Please enter your password' }),
    }
  }

  if (code === 'INVALID_PASSWORD') {
    return {
      requires2FA: false,
      message: t('merchant.invalidPassword', { defaultValue: 'Invalid password' }),
    }
  }

  if (code === 'INVALID_2FA_CODE') {
    const retryAfter = details?.retryAfterSeconds
    const remaining = details?.remainingAttempts
    if (retryAfter) {
      return {
        requires2FA: false,
        message: t('merchant.tooManyAttempts', {
          defaultValue: 'Too many attempts. Try again in {{seconds}} seconds',
          seconds: retryAfter,
        }),
      }
    }
    if (remaining !== undefined) {
      return {
        requires2FA: false,
        message: t('merchant.invalidCodeRemaining', {
          defaultValue: 'Invalid code. {{count}} attempts remaining',
          count: remaining,
        }),
      }
    }
    return {
      requires2FA: false,
      message: t('merchant.invalid2FACode', { defaultValue: 'Invalid 2FA code' }),
    }
  }

  if (code === 'VALIDATION_ERROR') {
    const msgs = Array.isArray(details)
      ? details.map((d) => d.message || d.reason).filter(Boolean)
      : []
    return {
      requires2FA: false,
      message: msgs.length > 0 ? msgs.join('. ') : apiMsg || t(fallbackTranslation.key, { defaultValue: fallbackTranslation.defaultValue }),
    }
  }

  return {
    requires2FA: false,
    message: apiMsg || t(fallbackTranslation.key, { defaultValue: fallbackTranslation.defaultValue }),
  }
}
