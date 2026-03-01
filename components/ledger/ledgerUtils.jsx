'use client'

/**
 * Shared constants and helpers for ledger detail views.
 */

export const entryCodeLabels = {
  'SP': 'Settlement Payment',
  'SC': 'Sweep Cost',
  'SG': 'Sweep Gas',
  'WD': 'Withdrawal',
  'DP': 'Deposit',
  'FE': 'Fee',
  'AJ': 'Adjustment',
}

export const purposeMap = {
  'payment_received': 'Payment Received',
  'merchant_credit': 'Merchant Credit',
  'native_coin_sweep_cost': 'Sweep Cost',
  'gas_topup_for_token_sweep': 'Gas Top-up',
  'token_sweep_cost': 'Token Sweep Cost',
}

export function formatAmount(val) {
  if (!val && val !== 0) return '0'
  let str = String(val)
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '')
  }
  return str || '0'
}

export function stateBadge(state) {
  if (state === 'settled') return <span className="badge bg-label-success">Settled</span>
  if (state === 'committed') return <span className="badge bg-label-info">Committed</span>
  if (state === 'pending') return <span className="badge bg-label-warning">Pending</span>
  if (state === 'reversed') return <span className="badge bg-label-secondary">Reversed</span>
  return <span className="text-muted">{state || 'N/A'}</span>
}

export function getPurposeLabel(metadata) {
  return purposeMap[metadata.purpose] || purposeMap[metadata.type] || metadata.purpose || metadata.type || null
}

/**
 * Parse metadata from a ledger entry — handles both string and object forms.
 */
export function parseMetadata(entry) {
  try {
    return typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata || {}
  } catch {
    return {}
  }
}

// Additional helpers
export function entryTypeBadgeClass(type) {
  const v = String(type || '').toLowerCase()
  if (v === 'credit' || v === 'deposit' || v === 'payment_received') return 'badge bg-label-success'
  if (v === 'debit' || v === 'withdrawal' || v === 'fee') return 'badge bg-label-danger'
  if (v === 'adjustment') return 'badge bg-label-warning'
  if (v === 'conversion_in') return 'badge bg-label-info'
  if (v === 'conversion_out') return 'badge bg-label-primary'
  return 'badge bg-label-secondary'
}

export function stateBadgeClass(state) {
  const v = String(state || '').toLowerCase()
  if (v === 'confirmed' || v === 'completed') return 'badge bg-label-success'
  if (v === 'pending') return 'badge bg-label-warning'
  if (v === 'failed' || v === 'reversed') return 'badge bg-label-danger'
  return 'badge bg-label-secondary'
}

export function formatEntryType(type) {
  if (!type) return 'N/A'
  return String(type).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export const ENTRY_TYPES = [
  'credit', 'debit', 'deposit', 'withdrawal', 'fee',
  'adjustment', 'conversion_in', 'conversion_out', 'payment_received',
]

export const ENTRY_STATES = [
  'pending', 'confirmed', 'completed', 'failed', 'reversed',
]
