/**
 * Status badge CSS class helpers for admin invoice views.
 */

export function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'paid' || v === 'completed' || v === 'confirmed') return 'badge bg-label-success'
  if (v === 'pending' || v === 'detecting') return 'badge bg-label-warning'
  if (v === 'confirming' || v === 'processing') return 'badge bg-label-info'
  if (v === 'expired' || v === 'cancelled' || v === 'canceled') return 'badge bg-label-secondary'
  if (v === 'failed' || v === 'unconfirmed') return 'badge bg-label-danger'
  return 'badge bg-label-secondary'
}

export function paymentStatusBadge(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'confirmed' || v === 'completed') return 'badge bg-label-success'
  if (v === 'detecting' || v === 'pending') return 'badge bg-label-warning'
  if (v === 'confirming') return 'badge bg-label-info'
  if (v === 'failed' || v === 'unconfirmed') return 'badge bg-label-danger'
  return 'badge bg-label-secondary'
}
