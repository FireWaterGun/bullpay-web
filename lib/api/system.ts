import { API_BASE_URL } from '../constants'

/** Client-side uses relative URL (through Next.js rewrite proxy), server uses absolute */
function resolveUrl(path: string): string {
  return typeof window !== 'undefined' ? path : `${API_BASE_URL}${path}`
}

/**
 * Fetch system maintenance status (public endpoint, no auth required).
 * Uses raw fetch instead of apiFetch to avoid maintenance redirect loops.
 */
export async function getSystemStatus() {
  const res = await fetch(resolveUrl('/api/v1/system/status'), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  if (!res.ok) {
    return { maintenance: false, level: 'none', message: null, estimatedEnd: null }
  }

  const json = await res.json()
  return json?.data || { maintenance: false, level: 'none', message: null, estimatedEnd: null }
}

/**
 * Check if the current caller is blocked by maintenance mode.
 *
 * Calls a lightweight endpoint BEHIND the maintenance middleware.
 * - Returns `true` if the user IS blocked (got 503).
 * - Returns `false` if the user is bypassed (allowed IP or admin).
 *
 * Uses raw fetch to avoid the apiFetch 503 → redirect loop.
 */
export async function checkMaintenanceBlocked(token?: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(resolveUrl('/api/v1/system/maintenance-check'), {
      headers,
      cache: 'no-store',
    })
    // 503 = blocked by maintenance, 200 = allowed through
    return res.status === 503
  } catch {
    // Network error — assume blocked to be safe
    return true
  }
}
