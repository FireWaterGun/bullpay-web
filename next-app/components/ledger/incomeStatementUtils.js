/**
 * Compute { from, to } date strings (YYYY-MM-DD) for a given preset name.
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
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      from = yesterday.toISOString().split('T')[0]
      break
    }
    case 'last7days': {
      const last7 = new Date(now)
      last7.setDate(last7.getDate() - 6)
      from = last7.toISOString().split('T')[0]
      break
    }
    case 'last30days': {
      const last30 = new Date(now)
      last30.setDate(last30.getDate() - 29)
      from = last30.toISOString().split('T')[0]
      break
    }
    case 'thisMonth': {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      break
    }
    case 'lastMonth': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      from = lastMonth.toISOString().split('T')[0]
      const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from, to: endLastMonth.toISOString().split('T')[0] }
    }
    default:
      from = to
  }
  return { from, to }
}
