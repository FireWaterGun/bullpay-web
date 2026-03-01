export function statusClass(s) {
  const status = String(s || '').toLowerCase()
  switch (status) {
    case 'paid':
    case 'completed':
    case 'confirmed':
      return 'bg-label-success'
    case 'pending':
    case 'detecting':
      return 'bg-label-warning'
    case 'confirming':
      return 'bg-label-info'
    case 'expired':
    case 'cancelled':
      return 'bg-label-secondary'
    case 'failed':
    case 'unconfirmed':
      return 'bg-label-danger'
    case 'refunded':
      return 'bg-label-primary'
    default:
      return 'bg-label-secondary'
  }
}

export function formatTxHash(hash, startChars = 10, endChars = 8) {
  if (!hash || hash.length <= startChars + endChars) return hash
  return `${hash.substring(0, startChars)}...${hash.substring(hash.length - endChars)}`
}

// Keep legacy exports for any other consumers
export function statusBadgeClass(status) {
  return `badge ${statusClass(status)}`
}

export function formatStatusLabel(status) {
  if (!status) return 'N/A'
  return String(status).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
