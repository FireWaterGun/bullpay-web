import { AmountNormalizer } from '../../utils/amount_normalizer'
import { formatCoinAmount } from '../../utils/format'

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
  const sym = String(coin?.symbol || coin || '').toUpperCase()
  if (sym === 'BTC') return id === 2 ? 'Lightning' : 'Bitcoin'
  if (sym === 'ETH' && n?.contractAddress) return 'ERC-20'
  return `Network #${n?.networkId ?? id ?? '-'}`
}

export function formatAddressStatus(s, t) {
  const v = String(s || '').toLowerCase()
  if (v === 'pending_verification') return t('wallet.status.pendingVerification', { defaultValue: 'Pending Verification' })
  if (v === 'active') return t('wallet.status.active', { defaultValue: 'Active' })
  if (v === 'suspended') return t('wallet.status.suspended', { defaultValue: 'Suspended' })
  if (v === 'deleted') return t('wallet.status.deleted', { defaultValue: 'Deleted' })
  return v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export function addressStatusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'pending_verification') return 'badge bg-label-warning'
  if (v === 'active') return 'badge bg-label-success'
  if (v === 'suspended') return 'badge bg-label-danger'
  if (v === 'deleted') return 'badge bg-label-secondary'
  return 'badge bg-label-secondary'
}

export function statusBadgeClass(s) {
  const v = String(s || '').toUpperCase()
  if (v === 'PENDING') return 'badge bg-label-warning'
  if (v === 'WAITING_FOR_GAS') return 'badge bg-label-warning'
  if (v === 'PROCESSING' || v === 'APPROVED') return 'badge bg-label-info'
  if (v === 'COMPLETED' || v === 'SUCCESS') return 'badge bg-label-success'
  if (v === 'FAILED' || v === 'REJECTED' || v === 'ERROR') return 'badge bg-label-danger'
  if (v === 'CANCELLED' || v === 'CANCELED') return 'badge bg-label-secondary'
  return 'badge bg-label-secondary'
}

export function formatStatusLabel(s) {
  return s.split('_').map((word, idx) =>
    idx === 0 ? word.charAt(0) + word.slice(1).toLowerCase() : word.toLowerCase()
  ).join(' ')
}

export const WITHDRAWAL_STATUSES = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']
