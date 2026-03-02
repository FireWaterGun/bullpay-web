import { apiFetch } from '@/lib/api-client'

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

export async function get2FAStatus(token: string | null): Promise<TwoFactorStatusResponse> {
  return apiFetch<TwoFactorStatusResponse>('/api/v1/user/2fa/status', { token })
}

export async function setup2FA(token: string | null): Promise<TwoFactorSetupResponse> {
  return apiFetch<TwoFactorSetupResponse>('/api/v1/user/2fa/setup', {
    method: 'POST',
    token,
  })
}

export async function enable2FA(token: string | null, totpCode: string): Promise<TwoFactorEnableResponse> {
  return apiFetch<TwoFactorEnableResponse>('/api/v1/user/2fa/enable', {
    method: 'POST',
    token,
    body: { token: totpCode },
  })
}

export async function verify2FA(token: string | null, code: string): Promise<TwoFactorVerifyResponse> {
  return apiFetch<TwoFactorVerifyResponse>('/api/v1/user/2fa/verify', {
    method: 'POST',
    token,
    body: { code },
  })
}

export async function disable2FA(token: string | null, password: string, totpCode: string): Promise<TwoFactorDisableResponse> {
  return apiFetch<TwoFactorDisableResponse>('/api/v1/user/2fa/disable', {
    method: 'POST',
    token,
    body: { password, totpCode },
  })
}
