import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export const STATUS_OPTIONS = ['active', 'inactive', 'suspended', 'pending']
export const ROLE_OPTIONS = ['regular_user', 'business_user', 'support_agent', 'admin', 'super_admin']

export function statusBadgeClass(s) {
  return getStatusBadgeClass(s, 'user')
}

export function roleBadgeClass(role) {
  const r = String(role || '').toLowerCase()
  if (r === 'super_admin') return 'badge bg-label-danger'
  if (r === 'admin') return 'badge bg-label-primary'
  if (r === 'support_agent') return 'badge bg-label-info'
  if (r === 'business_user') return 'badge bg-label-warning'
  return 'badge bg-label-secondary'
}
