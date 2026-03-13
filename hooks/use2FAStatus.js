'use client'

import useApi from '@/hooks/useApi'
import { get2FAStatus } from '@/lib/api/twoFactor'

/**
 * Custom hook to get and manage 2FA status
 *
 * Usage:
 * ```js
 * const { isEnabled, isLoading, refetch } = use2FAStatus();
 *
 * // Check if 2FA is enabled before sensitive action
 * if (isEnabled) {
 *   setShow2FAModal(true);
 * } else {
 *   proceedWithAction();
 * }
 * ```
 */
export default function use2FAStatus() {
  const { data: status, isLoading, error, mutate } = useApi(
    '2fa-status',
    async (token) => {
      const res = await get2FAStatus(token)
      return res.data || res
    }
  )

  return {
    // Status data
    status: status ?? null,

    // Computed properties
    isEnabled: Boolean(status?.enabled && status?.verified),
    isSetupPending: Boolean(status?.setupAt && !status?.verified),
    setupAt: status?.setupAt,
    verifiedAt: status?.verifiedAt,

    // Loading state
    isLoading,

    // Error state
    error,

    // Actions
    refetch: mutate,
  }
}
