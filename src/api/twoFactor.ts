import { apiFetch } from './client'

// ===== Types =====

export interface TwoFactorStatus {
  enabled: boolean
  verified: boolean
  setupAt: string | null
  verifiedAt: string | null
}

export interface TwoFactorStatusResponse {
  data: TwoFactorStatus
}

export interface TwoFactorSetupData {
  secret: string
  qrCodeDataUrl: string
  backupCodes: string[]
}

export interface TwoFactorSetupResponse {
  message: string
  data: TwoFactorSetupData
}

export interface TwoFactorEnableResponse {
  message: string
}

export interface TwoFactorVerifyResponse {
  message: string
  isBackupCode?: boolean
  remainingBackupCodes?: number
}

export interface TwoFactorDisableResponse {
  message: string
}

// ===== API Functions =====

/**
 * Get current 2FA status
 * @param token - Auth token
 */
export async function get2FAStatus(token: string): Promise<TwoFactorStatusResponse> {
  return apiFetch<TwoFactorStatusResponse>('/api/v1/user/2fa/status', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

/**
 * Start 2FA setup - generates QR code and backup codes
 * @param token - Auth token
 */
export async function setup2FA(token: string): Promise<TwoFactorSetupResponse> {
  return apiFetch<TwoFactorSetupResponse>('/api/v1/user/2fa/setup', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

/**
 * Enable 2FA after scanning QR code
 * @param token - Auth token
 * @param totpCode - 6-digit TOTP code from authenticator app
 */
export async function enable2FA(token: string, totpCode: string): Promise<TwoFactorEnableResponse> {
  return apiFetch<TwoFactorEnableResponse>('/api/v1/user/2fa/enable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: { token: totpCode },
  })
}

/**
 * Verify 2FA code for sensitive actions
 * @param token - Auth token
 * @param code - 6-digit TOTP code or backup code (ABCD-EFGH format)
 */
export async function verify2FA(token: string, code: string): Promise<TwoFactorVerifyResponse> {
  return apiFetch<TwoFactorVerifyResponse>('/api/v1/user/2fa/verify', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: { code },
  })
}

/**
 * Disable 2FA
 * @param token - Auth token
 * @param password - User's current password for verification
 */
export async function disable2FA(token: string, password: string): Promise<TwoFactorDisableResponse> {
  return apiFetch<TwoFactorDisableResponse>('/api/v1/user/2fa/disable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: { password },
  })
}
