/**
 * Shared status badge classes for admin pages.
 *
 * Maps domain-specific statuses to semantic badge colors.
 * Eliminates 12+ duplicated statusBadgeClass() functions.
 *
 * Usage:
 *   import { getStatusBadgeClass } from '@/lib/utils/statusBadge'
 *   <span className={getStatusBadgeClass(status, 'invoice')}>{status}</span>
 */

import { badgeBase } from '@/components/ui/Badge'

/* ── Semantic color palettes (light + dark) ── */
const COLORS = {
  success: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  info: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  neutral: 'bg-surface-100 text-surface-600',
  primary: 'bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400',
}

/* ── Per-domain status → color maps (all lowercase keys) ── */
const STATUS_MAPS = {
  invoice: {
    paid: 'success',
    completed: 'success',
    confirmed: 'success',
    pending: 'warning',
    detecting: 'warning',
    confirming: 'info',
    processing: 'info',
    expired: 'neutral',
    cancelled: 'neutral',
    canceled: 'neutral',
    failed: 'danger',
    unconfirmed: 'danger',
  },
  payment: {
    confirmed: 'success',
    completed: 'success',
    detecting: 'warning',
    pending: 'warning',
    confirming: 'info',
    processing: 'info',
    failed: 'danger',
    unconfirmed: 'danger',
    expired: 'neutral',
    cancelled: 'neutral',
    canceled: 'neutral',
  },
  sweep: {
    completed: 'success',
    success: 'success',
    pending: 'warning',
    processing: 'info',
    approved: 'info',
    failed: 'danger',
    rejected: 'danger',
    error: 'danger',
    cancelled: 'neutral',
    canceled: 'neutral',
  },
  withdrawal: {
    completed: 'success',
    success: 'success',
    pending: 'warning',
    waiting_for_gas: 'warning',
    processing: 'info',
    approved: 'info',
    failed: 'danger',
    rejected: 'danger',
    error: 'danger',
    cancelled: 'neutral',
    canceled: 'neutral',
  },
  withdrawalAddress: {
    active: 'success',
    pending_verification: 'warning',
    suspended: 'danger',
    deleted: 'neutral',
  },
  tempWallet: {
    active: 'success',
    pooled: 'success',
    assigned: 'info',
    used: 'warning',
    sweeped: 'warning',
    expired: 'danger',
    disabled: 'danger',
  },
  tempWalletHistory: {
    assigned: 'info',
    deposited: 'primary',
    swept: 'warning',
    released: 'success',
    failed: 'danger',
  },
  user: {
    active: 'success',
    inactive: 'neutral',
    suspended: 'danger',
    pending: 'warning',
  },
  merchant: {
    active: 'success',
    suspended: 'danger',
    pending: 'warning',
  },
  gasTopup: {
    completed: 'success',
    pending: 'warning',
    processing: 'info',
    failed: 'danger',
    skipped: 'neutral',
  },
}

/**
 * Get full badge className string (base + color) for a status value.
 *
 * @param {string} status  - The status string (any case)
 * @param {string} domain  - Domain context key from STATUS_MAPS
 * @returns {string} Full className string including badgeBase
 */
export function getStatusBadgeClass(status, domain = 'invoice') {
  const normalized = (status || '').toLowerCase()
  const map = STATUS_MAPS[domain] || STATUS_MAPS.invoice
  const colorKey = map[normalized] || 'neutral'
  return `${badgeBase} ${COLORS[colorKey]}`
}

/**
 * Get just the color className (without badgeBase) for custom rendering.
 */
export function getStatusColor(status, domain = 'invoice') {
  const normalized = (status || '').toLowerCase()
  const map = STATUS_MAPS[domain] || STATUS_MAPS.invoice
  const colorKey = map[normalized] || 'neutral'
  return COLORS[colorKey]
}

/**
 * Get the semantic color key for a status (e.g., 'success', 'danger').
 * Useful when rendering with <Badge color={...}>.
 */
export function getStatusColorKey(status, domain = 'invoice') {
  const normalized = (status || '').toLowerCase()
  const map = STATUS_MAPS[domain] || STATUS_MAPS.invoice
  return map[normalized] || 'neutral'
}
