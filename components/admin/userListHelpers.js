export const STATUS_OPTIONS = ['active', 'inactive', 'suspended', 'pending']
export const ROLE_OPTIONS = ['regular_user', 'business_user', 'support_agent', 'admin', 'super_admin']

export function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'active') return 'badge bg-label-success'
  if (s === 'inactive') return 'badge bg-label-secondary'
  if (s === 'suspended') return 'badge bg-label-danger'
  if (s === 'pending') return 'badge bg-label-warning'
  return 'badge bg-label-secondary'
}

export function roleBadgeClass(role) {
  const r = String(role || '').toLowerCase()
  if (r === 'super_admin') return 'badge bg-label-danger'
  if (r === 'admin') return 'badge bg-label-primary'
  if (r === 'support_agent') return 'badge bg-label-info'
  if (r === 'business_user') return 'badge bg-label-warning'
  return 'badge bg-label-secondary'
}
