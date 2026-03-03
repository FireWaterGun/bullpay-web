import { API_BASE_URL } from '../constants'

/**
 * Fetch system maintenance status (public endpoint, no auth required).
 * Uses raw fetch instead of apiFetch to avoid maintenance redirect loops.
 */
export async function getSystemStatus() {
  const res = await fetch(`${API_BASE_URL}/api/v1/system/status`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  if (!res.ok) {
    return { maintenance: false, level: 'none', message: null, messageTh: null, estimatedEnd: null }
  }

  const json = await res.json()
  return json?.data || { maintenance: false, level: 'none', message: null, messageTh: null, estimatedEnd: null }
}
