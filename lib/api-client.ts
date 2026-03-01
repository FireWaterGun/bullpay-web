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
    const msg = typeof details === 'string' ? details : code || `API Error ${status}`
    super(msg)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.data = data
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  token?: string | null
  body?: unknown
  /** Skip auto-redirect on 401 (for auth endpoints) */
  skipAuthRedirect?: boolean
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { token, body, skipAuthRedirect, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  // Handle 401 — on client, redirect to login
  if (res.status === 401 && !skipAuthRedirect) {
    if (typeof window !== 'undefined') {
      // Client-side: clear auth and redirect
      document.cookie = 'bullpay_token=; Max-Age=0; path=/'
      document.cookie = 'bullpay_user=; Max-Age=0; path=/'
      window.location.href = '/login'
    }
    throw new ApiError(401, 'UNAUTHORIZED', 'Session expired')
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
export function getTokenFromCookies(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): string | null {
  return cookieStore.get('bullpay_token')?.value || null
}
