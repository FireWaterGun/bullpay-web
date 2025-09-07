export function trimTrailingZerosDecimal(input: string): string {
  let s = input
  if (!s.includes('.')) return s
  // Remove trailing zeros after the last non-zero decimal
  s = s.replace(/(\.\d*?[1-9])0+$/, '$1')
  // If it's like 123.000 -> 123
  s = s.replace(/\.0+$/, '')
  // Safety: remove trailing dot
  s = s.replace(/\.$/, '')
  return s
}

export function formatAmount(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  let s = typeof value === 'number' ? value.toString() : String(value).trim()
  if (!s) return '-'

  // Handle scientific notation heuristically
  if (/e/i.test(s)) {
    const n = Number(s)
    if (!Number.isNaN(n)) {
      // Use a high fixed precision, then trim
      s = n.toFixed(20)
    }
  }

  // Only process plain decimal numbers
  if (!/^\d+(?:\.\d+)?$/.test(s)) return s

  return trimTrailingZerosDecimal(s)
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return '-'
  const d = value instanceof Date ? value : new Date(String(value))
  if (isNaN(d.getTime())) return String(value)
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d)
  } catch {
    return d.toLocaleString()
  }
}
