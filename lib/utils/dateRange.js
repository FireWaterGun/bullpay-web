/**
 * Calculate { from, to } date strings (YYYY-MM-DD) for common preset ranges.
 * Shared between user dashboard and admin revenue dashboard.
 */
export function getDateRange(preset) {
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  let from = to

  switch (preset) {
    case 'today':
      from = to
      break
    case 'yesterday': {
      const d = new Date(now)
      d.setDate(d.getDate() - 1)
      from = d.toISOString().split('T')[0]
      break
    }
    case 'last7':
    case 'last7days': {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      from = d.toISOString().split('T')[0]
      break
    }
    case 'last30':
    case 'last30days': {
      const d = new Date(now)
      d.setDate(d.getDate() - 29)
      from = d.toISOString().split('T')[0]
      break
    }
    case 'thisMonth': {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      break
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      from = start.toISOString().split('T')[0]
      return { from, to: end.toISOString().split('T')[0] }
    }
    default:
      from = to
  }
  return { from, to }
}
