// Format utilities
export {
  trimTrailingZerosDecimal,
  formatUsd,
  formatUsdSigned,
  formatUsdAuto,
  formatPercent,
  formatCommission,
  formatCoinAmount,
  formatChange,
  formatDate,
  formatAmount,
  formatDateTime,
} from './format'

// Crypto amount normalizer
export { AmountNormalizer, CHAIN_DECIMALS } from './amount_normalizer'
export type { SupportedChain } from './amount_normalizer'

// Clipboard
export { copyToClipboard } from './clipboard'

// Coin asset image resolution
export { getCoinAssetCandidates } from './coinAssets'

// Auth token extraction
export { extractToken } from './authToken'

// Request ID generation
export { requestId } from './requestId'

// URL validation
export { isSafeRedirectUrl } from './url'

// Roles
export { ROLE_ICON, ROLE_COLOR, ROLE_LEVEL, ROLE_DESCRIPTION, formatRoleLabel } from './roles'

// Notification sounds & browser notifications
export {
  initAudioContext,
  playNotificationSound,
  showBrowserNotification,
  notifyPaymentReceived,
  notifyInvoiceUpdated,
} from './notification'
