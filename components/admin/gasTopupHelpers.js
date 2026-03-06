import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import { formatCoinAmount } from '@/lib/utils/format'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

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
  return getStatusBadgeClass(s, 'gasTopup')
}

export function truncateAddress(addr) {
  if (!addr || addr.length <= 16) return addr || 'N/A'
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`
}
