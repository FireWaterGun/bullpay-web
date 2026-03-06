import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export function statusBadgeClass(s) {
  return getStatusBadgeClass(s, 'invoice')
}

export function paymentStatusBadge(s) {
  return getStatusBadgeClass(s, 'payment')
}
