import { apiFetch } from './client'

// ── User Merchant Self-Service ──────────────────────────────

/**
 * Register as a merchant
 */
export async function registerMerchant(
  token: string,
  data: {
    name: string
    email?: string
    websiteUrl?: string
    description?: string
    callbackUrl?: string
  }
) {
  const response = await apiFetch('/api/v1/user/merchant/register', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: data,
  })
  return response?.data || response
}

/**
 * Get current user's merchant profile
 */
export async function getMerchantProfile(token: string) {
  const response = await apiFetch('/api/v1/user/merchant', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  return response?.data || response
}

/**
 * Rotate API secret only (key stays the same)
 */
export async function rotateSecret(token: string) {
  const response = await apiFetch('/api/v1/user/merchant/rotate-secret', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return response?.data || response
}

/**
 * Regenerate both API key and secret
 */
export async function regenerateKey(token: string) {
  const response = await apiFetch('/api/v1/user/merchant/regenerate-key', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return response?.data || response
}

/**
 * Update webhook callback URL
 */
export async function updateWebhook(token: string, callbackUrl: string) {
  const response = await apiFetch('/api/v1/user/merchant/webhook', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: { callbackUrl },
  })
  return response?.data || response
}
