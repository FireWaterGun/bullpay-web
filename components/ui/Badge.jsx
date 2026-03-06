'use client'

/* ── Color maps ── */
const colorMap = {
  primary:   'bg-primary-100 text-primary-800 dark:bg-primary-500/15 dark:text-primary-300',
  success:   'bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-300',
  warning:   'bg-warning-100 text-warning-800 dark:bg-warning-500/15 dark:text-warning-300',
  danger:    'bg-danger-100 text-danger-800 dark:bg-danger-500/15 dark:text-danger-300',
  secondary: 'bg-surface-100 text-surface-600 dark:bg-white/8 dark:text-surface-400',
  info:      'bg-info-100 text-info-800 dark:bg-info-500/15 dark:text-info-300',
}

/* ── Label (bg-label-*) color map — identical visual to badge but used in dynamic contexts ── */
const labelMap = {
  primary:   'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
  secondary: 'bg-surface-100 text-surface-600 dark:bg-white/8 dark:text-surface-400',
  success:   'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300',
  danger:    'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300',
  warning:   'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300',
  info:      'bg-info-50 text-info-700 dark:bg-info-500/15 dark:text-info-300',
}

const base = 'inline-flex items-center font-medium px-[0.65em] py-[0.25em] text-2xs rounded-badge leading-none'

/**
 * Base badge Tailwind classes — use in helper functions that return className strings.
 * Example: `${badgeBase} bg-success-50 text-success-700`
 */
export const badgeBase = base

export default function Badge({ color = 'primary', label = false, className = '', children, ...rest }) {
  const map = label ? labelMap : colorMap
  const cls = [base, map[color] ?? map.primary, className].filter(Boolean).join(' ')

  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  )
}

/**
 * Helper to get the label className string for dynamic `bg-label-${color}` replacement.
 * Usage: <span className={labelClass(color)}>…</span>
 */
export function labelClass(color, extra = '') {
  const cls = [base, labelMap[color] ?? labelMap.primary, extra].filter(Boolean).join(' ')
  return cls
}

/**
 * Return just the bg-label color classes (no badge base styles).
 * For use on avatars, containers, etc. that need label-style background + text colors.
 * Replaces dynamic `bg-label-${color}` CSS class.
 */
export function bgLabelClass(color) {
  return labelMap[color] ?? labelMap.primary
}
