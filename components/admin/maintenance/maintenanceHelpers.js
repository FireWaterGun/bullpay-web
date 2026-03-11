/* ── Constants & Helpers for Maintenance Page ── */

export const MAINTENANCE_KEYS = [
  'maintenance.level',
  'maintenance.message_en',
  'maintenance.estimated_end',
  'maintenance.allowed_ips',
]

export const LEVEL_MATRIX = [
  { label: 'User API', none: true, partial: false, full: false },
  { label: 'Merchant (GET)', none: true, partial: true, full: false },
  { label: 'Merchant (POST)', none: true, partial: false, full: false },
  { label: 'Admin API', none: true, partial: true, full: true },
  { label: 'Background Jobs', none: true, partial: true, full: true },
  { label: 'Webhooks', none: true, partial: true, full: true },
]

export const LEVEL_CARD_STYLES = {
  success: {
    selected: 'border-success-500 ring-1 ring-success-500/20 shadow-md',
    icon: 'text-success-500',
    heading: '!text-success-600 dark:!text-success-400',
  },
  warning: {
    selected: 'border-warning-500 ring-1 ring-warning-500/20 shadow-md',
    icon: 'text-warning-500',
    heading: '!text-warning-600 dark:!text-warning-400',
  },
  danger: {
    selected: 'border-danger-500 ring-1 ring-danger-500/20 shadow-md',
    icon: 'text-danger-500',
    heading: '!text-danger-600 dark:!text-danger-400',
  },
}

export function getLevelOptions(t) {
  return [
    {
      value: 'none',
      label: t('admin.maintenance.levelNone', { defaultValue: 'None' }),
      description: t('admin.maintenance.levelNoneDesc', { defaultValue: 'System operating normally' }),
      color: 'success',
      icon: 'bx-check-circle',
    },
    {
      value: 'partial',
      label: t('admin.maintenance.levelPartial', { defaultValue: 'Partial' }),
      description: t('admin.maintenance.levelPartialDesc', {
        defaultValue: 'Block user API + merchant write, allow merchant read + background jobs',
      }),
      color: 'warning',
      icon: 'bx-error',
    },
    {
      value: 'full',
      label: t('admin.maintenance.levelFull', { defaultValue: 'Full' }),
      description: t('admin.maintenance.levelFullDesc', { defaultValue: 'Block all APIs except admin + health check' }),
      color: 'danger',
      icon: 'bx-x-circle',
    },
  ]
}

export function isValidIp(ip) {
  if (!ip || typeof ip !== 'string') return false
  const trimmed = ip.trim()
  if (!trimmed) return false
  const ipv4Re = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Re.test(trimmed)) {
    return trimmed.split('.').every((o) => {
      const n = Number(o)
      return n >= 0 && n <= 255
    })
  }
  if (trimmed === '::1') return true
  return /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(trimmed)
}
