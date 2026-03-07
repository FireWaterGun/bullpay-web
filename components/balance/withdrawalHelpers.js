import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import { formatCoinAmount } from '@/lib/utils/format'

export const NETWORK_LABELS = {
  1: 'Bitcoin',
  2: 'Lightning',
  10: 'Ethereum',
  11: 'ERC-20',
  20: 'BSC (BEP-20)',
  21: 'BEP-20',
  30: 'TRON (TRC-20)',
  31: 'TRC-20',
  40: 'Polygon',
  50: 'Solana',
  60: 'TON',
  61: 'TON (Jetton)',
  70: 'Base',
  80: 'Arbitrum',
  90: 'Optimism',
  100: 'Avalanche C-Chain',
}

export function formatAmount(amountRaw, decimals = 18) {
  if (!amountRaw) return '0'
  try {
    const value = AmountNormalizer.fromRawSimple(amountRaw.toString(), decimals)
    return formatCoinAmount(value)
  } catch (e) {
    return amountRaw.toString()
  }
}

export function getNetworkLabel(n, coin) {
  if (coin?.name) return coin.name
  if (n?.network && typeof n.network === 'object' && n.network.name) return n.network.name
  if (typeof n?.network === 'string') return n.network
  if (n?.networkName) return n.networkName
  const id = Number(n?.networkId ?? n)
  if (!Number.isFinite(id)) return '-'
  if (NETWORK_LABELS[id]) return NETWORK_LABELS[id]
  const sym = String(coin?.symbol || coin || '').toUpperCase()
  if (sym === 'BTC') return id === 2 ? 'Lightning' : 'Bitcoin'
  if (sym === 'ETH' && n?.contractAddress) return 'ERC-20'
  return `Network #${n?.networkId ?? id ?? '-'}`
}

export function formatAddressStatus(s, t) {
  const v = String(s || '').toLowerCase()
  if (t) {
    if (v === 'pending_verification') {
      return t('wallet.status.pendingVerification', { defaultValue: 'Pending Verification' })
    }
    if (v === 'active') return t('wallet.status.active', { defaultValue: 'Active' })
    if (v === 'suspended') return t('wallet.status.suspended', { defaultValue: 'Suspended' })
    if (v === 'deleted') return t('wallet.status.deleted', { defaultValue: 'Deleted' })
  }
  return v.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export function addressStatusBadgeClass(s) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const v = String(s || '').toLowerCase()
  if (v === 'pending_verification') {
    return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`
  }
  if (v === 'active') return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`
  if (v === 'suspended') return `${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`
  if (v === 'deleted') {
    return `${base} bg-surface-100 text-surface-600 dark:bg-dark-elevated dark:text-dark-text-secondary`
  }
  return `${base} bg-surface-100 text-surface-600 dark:bg-dark-elevated dark:text-dark-text-secondary`
}

export function statusBadgeClass(s) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  const v = String(s || '').toUpperCase()
  if (v === 'PENDING') return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`
  if (v === 'WAITING_FOR_GAS') return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`
  if (v === 'PROCESSING' || v === 'APPROVED') {
    return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`
  }
  if (v === 'COMPLETED' || v === 'SUCCESS') {
    return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`
  }
  if (v === 'FAILED' || v === 'REJECTED' || v === 'ERROR') {
    return `${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`
  }
  if (v === 'CANCELLED' || v === 'CANCELED') {
    return `${base} bg-surface-100 text-surface-600 dark:bg-dark-elevated dark:text-dark-text-secondary`
  }
  return `${base} bg-surface-100 text-surface-600 dark:bg-dark-elevated dark:text-dark-text-secondary`
}

export function formatStatusLabel(s) {
  return s
    .split('_')
    .map((word, idx) => (idx === 0 ? word.charAt(0) + word.slice(1).toLowerCase() : word.toLowerCase()))
    .join(' ')
}

export const WITHDRAWAL_STATUSES = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']
