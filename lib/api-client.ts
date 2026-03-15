/**
 * Universal API client — works on both server and client.
 *
 * Server components / Route Handlers:
 *   import { apiFetch } from '@/lib/api-client'
 *   const data = await apiFetch('/invoices', { token })
 *
 * Client components:
 *   Uses the token from AuthContext (passed via options).
 */

import { API_BASE_URL } from './constants'

export class ApiError extends Error {
  status: number
  code: string
  details: unknown
  data: unknown

  constructor(status: number, code: string, details: unknown, data?: unknown) {
    const dataMessage =
      typeof data === 'object' && data !== null
        ? (data as Record<string, unknown> & { error?: { message?: string }; message?: string })?.error?.message ||
          (data as Record<string, unknown> & { message?: string })?.message
        : undefined
    const msg = typeof details === 'string' ? details : dataMessage || code || `API Error ${status}`
    super(msg)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.data = data
  }
}

/**
 * Token refresh state — prevents multiple concurrent refresh attempts.
 */
let refreshPromise: Promise<string | null> | null = null

/**
 * Callback to update the access token in AuthContext.
 * Set by AuthProvider on mount.
 */
let onTokenRefreshed: ((newToken: string) => void) | null = null

export function setTokenRefreshCallback(callback: ((newToken: string) => void) | null) {
  onTokenRefreshed = callback
}

/**
 * Attempt to refresh the access token using the httpOnly refresh token cookie.
 * Returns the new access token on success, or null on failure.
 * Deduplicates concurrent calls.
 */
async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const isClient = typeof window !== 'undefined'
      const url = isClient ? '/api/v1/auth/refresh' : `${API_BASE_URL}/api/v1/auth/refresh`

      console.warn('[AUTH] tryRefreshToken: calling', url)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
      })

      console.warn('[AUTH] tryRefreshToken: response status', res.status)
      if (!res.ok) {
        const errorBody = await res.text().catch(() => 'N/A')
        console.warn('[AUTH] tryRefreshToken: FAILED', res.status, errorBody)
        return null
      }

      const json = await res.json().catch(() => null)
      const newToken = json?.data?.token?.value
      if (newToken && typeof newToken === 'string') {
        console.warn('[AUTH] tryRefreshToken: SUCCESS, got new token')
        onTokenRefreshed?.(newToken)
        return newToken
      }
      console.warn('[AUTH] tryRefreshToken: no token in response', json)
      return null
    } catch (err) {
      console.warn('[AUTH] tryRefreshToken: EXCEPTION', err)
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  token?: string | null
  body?: unknown
  /** Skip auto-redirect on 401 (for auth endpoints) */
  skipAuthRedirect?: boolean
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, body, skipAuthRedirect, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Client-side: use relative URL so requests go through Next.js rewrite proxy
  // Server-side: use absolute API_BASE_URL directly
  const isClient = typeof window !== 'undefined'
  const url = path.startsWith('http') ? path : isClient ? path : `${API_BASE_URL}${path}`

  let res: Response
  try {
    res = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (networkError) {
    // Network failure (API down, DNS error, CORS, etc.)
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot connect to server. Please check your connection.')
  }

  // Handle 401 — try refresh token first, then redirect to login
  if (res.status === 401 && !skipAuthRedirect) {
    if (typeof window !== 'undefined') {
      console.warn('[AUTH] 401 on', url, '— attempting refresh')
      const newToken = await tryRefreshToken()
      if (newToken) {
        console.warn('[AUTH] Refresh succeeded, retrying', url)
        // Retry the original request with new token
        headers['Authorization'] = `Bearer ${newToken}`
        const retryRes = await fetch(url, {
          ...fetchOptions,
          headers,
          credentials: 'include',
          body: body ? JSON.stringify(body) : undefined,
        })

        if (retryRes.ok) {
          const retryJson = await retryRes.json().catch(() => null)
          if (retryRes.status === 204) return undefined as T
          if (retryJson && retryJson.success === false) {
            const errPayload = retryJson.error || retryJson
            throw new ApiError(200, errPayload?.code || 'ERROR', errPayload?.details || errPayload?.message, retryJson)
          }
          return retryJson?.data !== undefined ? retryJson.data : retryJson
        }
        // Retry also failed — fall through to logout
      }

      // Refresh failed — clear cookies and redirect
      console.warn('[AUTH] Refresh FAILED — redirecting to /login')
      document.cookie = 'bullpay_token=; Max-Age=0; path=/'
      document.cookie = 'bullpay_user=; Max-Age=0; path=/'
      window.location.href = '/login'
    }
    throw new ApiError(401, 'UNAUTHORIZED', 'Session expired')
  }

  // Handle 503 — maintenance mode, redirect to maintenance page
  if (res.status === 503) {
    const json503 = await res.json().catch(() => null)
    const errPayload = json503?.error || json503
    if (errPayload?.code === 'SERVICE_MAINTENANCE' && typeof window !== 'undefined') {
      // Store maintenance info for the maintenance page
      try {
        sessionStorage.setItem(
          'maintenance_info',
          JSON.stringify({
            message: errPayload.message,
            estimatedEnd: errPayload.estimatedEnd,
            retryAfterSeconds: errPayload.retryAfterSeconds,
          })
        )
      } catch {
        // sessionStorage may not be available
      }
      window.location.href = '/maintenance'
    }
    throw new ApiError(
      503,
      errPayload?.code || 'SERVICE_UNAVAILABLE',
      errPayload?.message || 'Service temporarily unavailable',
      json503
    )
  }

  // Handle no-content responses
  if (res.status === 204) return undefined as T

  const json = await res.json().catch(() => null)

  // Handle success: false with 200 OK
  if (res.ok && json && json.success === false) {
    const errPayload = json.error || json
    const msg = errPayload?.message || res.statusText || 'Request failed'
    throw new ApiError(200, errPayload?.code || 'ERROR', errPayload?.details || msg, json)
  }

  if (!res.ok) {
    const errPayload = json?.error || json
    const code = errPayload?.code || json?.code || 'ERROR'
    const msg = errPayload?.message || json?.message || res.statusText
    const details = errPayload?.details || json?.details || msg
    throw new ApiError(res.status, code, details, json)
  }

  // API returns { data: T } wrapper — unwrap if present
  return json?.data !== undefined ? json.data : json
}

/**
 * Server-side helper: extract token from cookies in Route Handlers / Server Actions.
 *
 * Usage:
 *   import { cookies } from 'next/headers'
 *   const token = getTokenFromCookies(await cookies())
 */
export function getTokenFromCookies(cookieStore: {
  get: (name: string) => { value: string } | undefined
}): string | null {
  return cookieStore.get('bullpay_token')?.value || null
}
