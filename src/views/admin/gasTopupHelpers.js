import { AmountNormalizer } from '../../utils/amount_normalizer'
import { formatCoinAmount } from '../../utils/format'

export function formatGasAmount(amountRaw, decimals = 18) {
  if (!amountRaw) return '0'
  try {
    const value = AmountNormalizer.fromRawSimple(amountRaw.toString(), decimals)
    return formatCoinAmount(value)
  } catch (e) {
    return amountRaw.toString()
  }
}

export function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'pending') return 'badge bg-label-warning'
  if (v === 'processing') return 'badge bg-label-info'
  if (v === 'completed') return 'badge bg-label-success'
  if (v === 'failed') return 'badge bg-label-danger'
  if (v === 'skipped') return 'badge bg-label-secondary'
  return 'badge bg-label-secondary'
}

export function truncateAddress(addr) {
  if (!addr || addr.length <= 16) return addr || 'N/A'
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`
}
