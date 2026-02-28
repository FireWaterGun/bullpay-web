export const CATEGORY_OPTIONS = ['general', 'withdrawal', 'sweep', 'gas_topup', 'gas_price', 'gas_limit', 'rbf', 'invoice', 'notification', 'security']
export const SCOPE_OPTIONS = ['global', 'merchant', 'user']

export function formatLabel(str) {
  return String(str || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const THEME_COLORS = [
  'var(--bs-primary)',
  'var(--bs-success)',
  'var(--bs-info)',
  'var(--bs-warning)',
  'var(--bs-danger)',
  'var(--bs-dark)',
  'var(--bs-secondary)',
]
const THEME_COLORS_RGB = [
  'var(--bs-primary-rgb)',
  'var(--bs-success-rgb)',
  'var(--bs-info-rgb)',
  'var(--bs-warning-rgb)',
  'var(--bs-danger-rgb)',
  'var(--bs-dark-rgb)',
  'var(--bs-secondary-rgb)',
]

export function getColor(name, idx = 0) {
  return THEME_COLORS[idx % THEME_COLORS.length]
}

export function getColorRgb(name, idx = 0) {
  return THEME_COLORS_RGB[idx % THEME_COLORS_RGB.length]
}
