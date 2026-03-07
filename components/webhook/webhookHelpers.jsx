/* ── Webhook log shared helpers & badge renderers ── */

export const EVENT_OPTIONS = [
  { value: 'payment.completed', label: 'Completed', color: 'success' },
  { value: 'payment.expired', label: 'Expired', color: 'warning' },
  { value: 'payment.cancelled', label: 'Cancelled', color: 'secondary' },
  { value: 'payment.failed', label: 'Failed', color: 'danger' },
]

/* Badge base classes */
const badgeBase = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

/* Color maps — aligned with Badge component dark tokens */
const BADGE_COLORS = {
  success: 'bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-300',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-500/15 dark:text-warning-300',
  danger: 'bg-danger-100 text-danger-800 dark:bg-danger-500/15 dark:text-danger-300',
  secondary: 'bg-surface-100 text-surface-600 dark:bg-white/8 dark:text-surface-400',
  info: 'bg-info-100 text-info-800 dark:bg-info-500/15 dark:text-info-300',
}

/** Success / Failed badge */
export function successBadge(val, t) {
  if (val === true || val === 1) {
    return (
      <span className={`${badgeBase} ${BADGE_COLORS.success}`}>
        {t('webhookLog.success', { defaultValue: 'Success' })}
      </span>
    )
  }
  if (val === false || val === 0) {
    return (
      <span className={`${badgeBase} ${BADGE_COLORS.danger}`}>
        {t('webhookLog.failed', { defaultValue: 'Failed' })}
      </span>
    )
  }
  return '-'
}

/** Event type badge */
export function eventBadge(event) {
  if (!event) return '-'
  const opt = EVENT_OPTIONS.find((o) => o.value === event)
  const label = opt?.label || event
  const cls = BADGE_COLORS[opt?.color] || BADGE_COLORS.info
  return <span className={`${badgeBase} ${cls}`}>{label}</span>
}

/** HTTP status code badge */
export function httpStatusBadge(status) {
  if (!status && status !== 0) return '-'
  const code = Number(status)
  let cls = BADGE_COLORS.secondary
  if (code >= 200 && code < 300) cls = BADGE_COLORS.success
  else if (code >= 400 && code < 500) cls = BADGE_COLORS.warning
  else if (code >= 500) cls = BADGE_COLORS.danger
  return <span className={`${badgeBase} ${cls}`}>{code}</span>
}
