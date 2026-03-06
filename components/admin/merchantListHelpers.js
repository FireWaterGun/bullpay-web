import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export const STATUS_OPTIONS = ['active', 'suspended', 'pending']

export function statusBadgeClass(s) {
  return getStatusBadgeClass(s, 'merchant')
}
