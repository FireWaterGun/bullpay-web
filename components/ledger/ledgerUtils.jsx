'use client';
import { Badge, badgeBase } from '../ui'

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
  'AJ': 'Adjustment'
};

export const purposeMap = {
  'payment_received': 'Payment Received',
  'merchant_credit': 'Merchant Credit',
  'native_coin_sweep_cost': 'Sweep Cost',
  'gas_topup_for_token_sweep': 'Gas Top-up',
  'token_sweep_cost': 'Token Sweep Cost'
};

export function formatAmount(val) {
  if (!val && val !== 0) return '0';
  let str = String(val);
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '');
  }
  return str || '0';
}

export function stateBadge(state) {
  if (state === 'settled') return <Badge className="bg-green-50 text-green-700">Settled</Badge>;
  if (state === 'committed') return <Badge className="bg-cyan-50 text-cyan-700">Committed</Badge>;
  if (state === 'pending') return <Badge className="bg-amber-50 text-amber-700">Pending</Badge>;
  if (state === 'reversed') return <Badge className="bg-surface-100 text-surface-600">Reversed</Badge>;
  return <span className="text-muted">{state || 'N/A'}</span>;
}

export function getPurposeLabel(metadata) {
  return purposeMap[metadata.purpose] || purposeMap[metadata.type] || metadata.purpose || metadata.type || null;
}

/**
 * Parse metadata from a ledger entry — handles both string and object forms.
 */
export function parseMetadata(entry) {
  try {
    return typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata || {};
  } catch {
    return {};
  }
}

// Additional helpers
export function entryTypeBadgeClass(type) {
  const v = String(type || '').toLowerCase();
  if (v === 'credit' || v === 'deposit' || v === 'payment_received') return `${badgeBase} bg-green-50 text-green-700`;
  if (v === 'debit' || v === 'withdrawal' || v === 'fee') return `${badgeBase} bg-red-50 text-red-700`;
  if (v === 'adjustment') return `${badgeBase} bg-amber-50 text-amber-700`;
  if (v === 'conversion_in') return `${badgeBase} bg-cyan-50 text-cyan-700`;
  if (v === 'conversion_out') return `${badgeBase} bg-primary-50 text-primary-600`;
  return `${badgeBase} bg-surface-100 text-surface-600`;
}

export function stateBadgeClass(state) {
  const v = String(state || '').toLowerCase();
  if (v === 'confirmed' || v === 'completed') return `${badgeBase} bg-green-50 text-green-700`;
  if (v === 'pending') return `${badgeBase} bg-amber-50 text-amber-700`;
  if (v === 'failed' || v === 'reversed') return `${badgeBase} bg-red-50 text-red-700`;
  return `${badgeBase} bg-surface-100 text-surface-600`;
}

export function formatEntryType(type) {
  if (!type) return 'N/A';
  return String(type).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const ENTRY_TYPES = [
'credit', 'debit', 'deposit', 'withdrawal', 'fee',
'adjustment', 'conversion_in', 'conversion_out', 'payment_received'];


export const ENTRY_STATES = [
'pending', 'confirmed', 'completed', 'failed', 'reversed'];