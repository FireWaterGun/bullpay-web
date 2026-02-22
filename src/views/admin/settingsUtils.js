export const CATEGORY_OPTIONS = ['general', 'withdrawal', 'sweep', 'gas_topup', 'gas_price', 'gas_limit', 'rbf', 'invoice', 'notification', 'security']
export const SCOPE_OPTIONS = ['global', 'merchant', 'user']

export function formatLabel(str) {
  return String(str || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const KNOWN_COLORS = { ETH: '#627eea', BSC: '#f3ba2f', POL: '#8247e5' }
const COLOR_PALETTE = ['#697a8d', '#20c997', '#e83e8c', '#fd7e14', '#0dcaf0', '#6610f2', '#d63384', '#198754', '#0d6efd', '#dc3545']
export function getColor(name) {
  const upper = (name || '').toUpperCase()
  if (KNOWN_COLORS[upper]) return KNOWN_COLORS[upper]
  let hash = 0
  for (let i = 0; i < upper.length; i++) hash = upper.charCodeAt(i) + ((hash << 5) - hash)
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length]
}
