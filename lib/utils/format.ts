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

// ---------------------------------------------------------------------------
// Currency / number formatters
// ---------------------------------------------------------------------------

/** Strip trailing zeros from a formatted number string: "1,234.50" → "1,234.5", "100.00" → "100" */
function trimNum(s: string): string {
  if (!s.includes('.')) return s
  return s.replace(/(\.[0-9]*?[1-9])0+$/, '$1').replace(/\.0+$/, '')
}

/**
 * Format a value as USD — plain (no sign prefix). Strips trailing zeros.
 *   formatUsd(1234.5)   → "$1,234.5"
 *   formatUsd(100)      → "$100"
 *   formatUsd(0.00123)  → "$0.00123"
 *   formatUsd(0)        → "$0"
 */
export function formatUsd(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '$0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(num) || num === 0) return '$0'

  const abs = Math.abs(num)
  if (abs < 0.01) {
    return '$' + trimNum(abs.toFixed(8))
  }
  return '$' + trimNum(abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
}

/**
 * Format a value as USD with +/- sign prefix. Strips trailing zeros.
 *   formatUsdSigned(100)  → "+$100"
 *   formatUsdSigned(-50.5) → "-$50.5"
 *   formatUsdSigned(0)    → "$0"
 */
export function formatUsdSigned(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '$0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(num) || num === 0) return '$0'

  const prefix = num < 0 ? '-$' : '+$'
  const abs = Math.abs(num)
  return prefix + trimNum(abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
}

/**
 * Format a value as USD with auto-detect decimals for very small / large values.
 * Used in Revenue Dashboard & Income Statement where precision matters.
 *   formatUsdAuto(0.00045) → "$0.00045"
 *   formatUsdAuto(0.5)     → "$0.5"
 *   formatUsdAuto(-1234)   → "-$1,234"
 */
export function formatUsdAuto(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '$0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(num) || num === 0) return '$0'

  const abs = Math.abs(num)
  let decimals: number
  if (abs < 0.01) decimals = 8
  else if (abs < 1) decimals = 4
  else decimals = 2

  const prefix = num < 0 ? '-$' : '$'
  const minD = Math.min(2, decimals)
  return prefix + trimNum(abs.toLocaleString('en-US', {
    minimumFractionDigits: minD,
    maximumFractionDigits: Math.max(minD, decimals),
  }))
}

/**
 * Format a percentage value. Strips trailing zeros.
 *   formatPercent(12.50)  → "12.5%"
 *   formatPercent(0)      → "0%"
 *   formatPercent(null)   → "0%"
 */
export function formatPercent(value: string | number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '0%'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(num) || num === 0) return '0%'
  return parseFloat(num.toFixed(decimals)) + '%'
}

/**
 * Format a commission rate (0-1 range) as percentage. Strips trailing zeros.
 *   formatCommission(0.015) → "1.5%"
 *   formatCommission(0.01)  → "1%"
 *   formatCommission(0)     → "0%"
 */
export function formatCommission(rate: string | number | null | undefined): string {
  if (rate === null || rate === undefined) return '-'
  const num = typeof rate === 'string' ? parseFloat(rate) : rate
  if (!Number.isFinite(num) || num === 0) return '0%'
  const pct = num * 100
  return parseFloat(pct.toFixed(2)) + '%'
}

/**
 * Format a coin/crypto amount for display. Strips trailing zeros. Zero shows as "0".
 *   formatCoinAmount(1234.5)  → "1,234.5"
 *   formatCoinAmount(100)     → "100"
 *   formatCoinAmount(0)       → "0"
 */
export function formatCoinAmount(value: string | number | null | undefined, maxDecimals: number = 8): string {
  if (value === null || value === undefined) return '0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(num) || num === 0) return '0'
  return trimNum(num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: maxDecimals }))
}

/**
 * Format a change percentage for KPI cards. Strips trailing zeros.
 *   formatChange(12.3)  → "+12.3%"
 *   formatChange(-5)    → "-5%"
 *   formatChange(0)     → "+0%"
 */
export function formatChange(value: string | number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) return '+0%'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(num)) return '+0%'
  const prefix = num >= 0 ? '+' : ''
  if (num === 0) return '+0%'
  return prefix + parseFloat(num.toFixed(decimals)) + '%'
}

// ---------------------------------------------------------------------------
// Date formatters
// ---------------------------------------------------------------------------

/**
 * Options for date formatting with timezone and locale support.
 */
interface DateFormatOptions {
  /** IANA timezone (e.g. 'Asia/Bangkok', 'UTC'). Defaults to browser timezone. */
  timeZone?: string
  /** BCP 47 locale string (e.g. 'en-US', 'th-TH'). Defaults to browser locale. */
  locale?: string
}

/**
 * Format a date as locale-aware short date/time.
 *   formatDate('2024-01-15T10:30:00Z', { locale: 'en-US', timeZone: 'Asia/Bangkok' })
 *     → "Jan 15, 2024, 05:30 PM"
 *   formatDate('2024-01-15T10:30:00Z', { locale: 'th-TH', timeZone: 'Asia/Bangkok' })
 *     → "15 ม.ค. 2567, 17:30"
 *   formatDate(null) → "N/A"
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  options?: DateFormatOptions
): string {
  if (!value) return 'N/A'
  const d = value instanceof Date ? value : new Date(String(value))
  if (isNaN(d.getTime())) return 'N/A'
  try {
    return new Intl.DateTimeFormat(options?.locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: options?.timeZone,
    }).format(d)
  } catch {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
}

// ---------------------------------------------------------------------------
// Legacy / general formatters
// ---------------------------------------------------------------------------

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

export function formatDateTime(
  value: string | number | Date | null | undefined,
  options?: DateFormatOptions
): string {
  if (!value) return '-'
  const d = value instanceof Date ? value : new Date(String(value))
  if (isNaN(d.getTime())) return String(value)
  try {
    return new Intl.DateTimeFormat(options?.locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: options?.timeZone,
    }).format(d)
  } catch {
    return d.toLocaleString()
  }
}
