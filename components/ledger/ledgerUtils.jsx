'use client';
import { Badge, badgeBase } from '@/components/ui'

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

/** User-facing entry code labels (user ledger) */
export const USER_ENTRY_CODE_LABELS = {
  'DP': 'Deposit',
  'WA': 'Withdrawal Amount',
  'WF': 'Withdrawal Fee',
  'WR': 'Withdrawal Reversal',
  'FR': 'Fee Revenue',
  'XI': 'Internal Transfer In',
  'XO': 'Internal Transfer Out'
};

/** Look up user entry code label with i18n fallback */
export function getEntryCodeLabel(code, t) {
  return t
    ? t(`userLedger.code.${code}`, { defaultValue: USER_ENTRY_CODE_LABELS[code] || code })
    : USER_ENTRY_CODE_LABELS[code] || code;
}

/** Inline badge for user ledger entry state */
export function userStateBadge(state, t) {
  const colorMap = {
    settled: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    committed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    reversed: 'bg-surface-100 text-surface-600 dark:bg-dark-elevated'
  };
  const cls = colorMap[state];
  const label = t
    ? t(`userLedger.${state}`, { defaultValue: state ? state.charAt(0).toUpperCase() + state.slice(1) : 'N/A' })
    : state ? state.charAt(0).toUpperCase() + state.slice(1) : 'N/A';
  if (cls) return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
  return <span className="text-surface-500">{state || 'N/A'}</span>;
}

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
  if (state === 'settled') return <Badge className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">Settled</Badge>;
  if (state === 'committed') return <Badge className="bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">Committed</Badge>;
  if (state === 'pending') return <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>;
  if (state === 'reversed') return <Badge className="bg-surface-100 text-surface-600 dark:bg-dark-elevated">Reversed</Badge>;
  return <span className="text-surface-500">{state || 'N/A'}</span>;
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
  if (v === 'credit' || v === 'deposit' || v === 'payment_received') return `${badgeBase} bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
  if (v === 'debit' || v === 'withdrawal' || v === 'fee') return `${badgeBase} bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400`;
  if (v === 'adjustment') return `${badgeBase} bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`;
  if (v === 'conversion_in') return `${badgeBase} bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400`;
  if (v === 'conversion_out') return `${badgeBase} bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400`;
  return `${badgeBase} bg-surface-100 text-surface-600 dark:bg-dark-elevated`;
}

export function stateBadgeClass(state) {
  const v = String(state || '').toLowerCase();
  if (v === 'confirmed' || v === 'completed') return `${badgeBase} bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
  if (v === 'pending') return `${badgeBase} bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`;
  if (v === 'failed' || v === 'reversed') return `${badgeBase} bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400`;
  return `${badgeBase} bg-surface-100 text-surface-600 dark:bg-dark-elevated`;
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