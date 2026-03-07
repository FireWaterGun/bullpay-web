import { apiFetch } from '@/lib/api-client'

// ── User Merchant Self-Service ──────────────────────────────

export async function registerMerchant(
  token: string | null,
  data: {
    name: string
    email?: string
    websiteUrl?: string
    description?: string
    callbackUrl?: string
  }
) {
  return apiFetch('/api/v1/user/merchant/register', {
    method: 'POST',
    token,
    body: data,
  })
}

export async function getMerchantProfile(token: string | null) {
  return apiFetch('/api/v1/user/merchant', { token })
}

export async function rotateSecret(token: string | null, data?: { password?: string; totpCode?: string }) {
  return apiFetch('/api/v1/user/merchant/rotate-secret', {
    method: 'POST',
    token,
    body: data || {},
  })
}

export async function regenerateKey(token: string | null, data?: { password?: string; totpCode?: string }) {
  return apiFetch('/api/v1/user/merchant/regenerate-key', {
    method: 'POST',
    token,
    body: data || {},
  })
}

export async function updateWebhook(
  token: string | null,
  callbackUrl: string,
  options?: { password?: string; totpCode?: string }
) {
  return apiFetch('/api/v1/user/merchant/webhook', {
    method: 'PUT',
    token,
    body: { callbackUrl, ...options },
  })
}
