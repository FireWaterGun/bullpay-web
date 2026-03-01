'use client'

import { useState, useEffect, useCallback } from "react";
import { useAuth } from '@/app/providers';
import { get2FAStatus } from '@/lib/api/twoFactor';
import { logger } from '@/lib/utils/logger'

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
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await get2FAStatus(token);
      setStatus(res.data || res);
    } catch (err) {
      logger.error("Failed to fetch 2FA status:", err);
      setError(err?.message || "Failed to fetch 2FA status");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    // Status data
    status,

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
    refetch: fetchStatus,
  };
}
