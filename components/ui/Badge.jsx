'use client'

/* ── Color maps ── */
const colorMap = {
  primary:   'bg-primary-100 text-primary-800 dark:bg-primary-500/15 dark:text-primary-300',
  success:   'bg-[#dcfce7] text-[#166534] dark:bg-success-500/15 dark:text-[#86efac]',
  warning:   'bg-[#fef3c7] text-[#92400e] dark:bg-warning-500/15 dark:text-[#fcd34d]',
  danger:    'bg-[#fee2e2] text-[#991b1b] dark:bg-danger-500/15 dark:text-[#fca5a5]',
  secondary: 'bg-surface-100 text-surface-600 dark:bg-white/8 dark:text-surface-900-text',
  info:      'bg-[#cffafe] text-[#0e7490] dark:bg-info-500/15 dark:text-[#67e8f9]',
}

/* ── Label (bg-label-*) color map — identical visual to badge but used in dynamic contexts ── */
const labelMap = {
  primary:   'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
  secondary: 'bg-surface-100 text-surface-600 dark:bg-white/8 dark:text-surface-900-text',
  success:   'bg-[#dcfce7] text-[#15803d] dark:bg-success-500/15 dark:text-[#86efac]',
  danger:    'bg-[#fee2e2] text-[#b91c1c] dark:bg-danger-500/15 dark:text-[#fca5a5]',
  warning:   'bg-[#fef3c7] text-[#b45309] dark:bg-warning-500/15 dark:text-[#fcd34d]',
  info:      'bg-[#cffafe] text-[#0e7490] dark:bg-info-500/15 dark:text-[#67e8f9]',
}

const base = 'inline-flex items-center font-medium px-[0.65em] py-[0.25em] text-2xs rounded-badge leading-none'

/**
 * Base badge Tailwind classes — use in helper functions that return className strings.
 * Example: `${badgeBase} bg-green-50 text-green-700`
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
