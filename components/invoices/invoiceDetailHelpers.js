export function statusClass(s) {
  const status = String(s || '').toLowerCase()
  switch (status) {
    case 'paid':
    case 'completed':
    case 'confirmed':
      return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
    case 'pending':
    case 'detecting':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
    case 'confirming':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
    case 'expired':
    case 'cancelled':
      return 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
    case 'failed':
    case 'unconfirmed':
      return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
    case 'refunded':
      return 'bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400'
    default:
      return 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
  }
}

export function formatTxHash(hash, startChars = 10, endChars = 8) {
  if (!hash || hash.length <= startChars + endChars) return hash
  return `${hash.substring(0, startChars)}...${hash.substring(hash.length - endChars)}`
}

export function statusBadgeClass(status) {
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass(status)}`
}

export function formatStatusLabel(status) {
  if (!status) return 'N/A'
  return String(status)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
