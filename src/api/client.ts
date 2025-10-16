const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api/v1'

export interface ApiErrorDetails {
  [key: string]: string[] | undefined
}

export interface ApiError extends Error {
  status?: number
  data?: any
  raw?: string
  code?: string
  details?: ApiErrorDetails
}

function extractMessage(data: any, fallback: string) {
  if (!data) return fallback
  if (typeof data === 'string') {
    const s = data.trim()
    if (s.startsWith('{') || s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s)
        return extractMessage(parsed, fallback)
      } catch {
        // ignore
      }
    }
    return data
  }
  if (typeof data.message === 'string') return data.message
  if (data.error) {
    if (typeof data.error === 'string') return data.error
    if (typeof data.error.message === 'string') return data.error.message
  }
  if (typeof data.title === 'string') return data.title
  if (data.details && typeof data.details === 'object') {
    const [k] = Object.keys(data.details)
    const v = k ? (data.details as Record<string, unknown>)[k] : null
    if (Array.isArray(v) && v.length) return `${k}: ${v[0]}`
  }
  try { return JSON.stringify(data) } catch { return fallback }
}

export interface ApiFetchOptions {
  method?: string
  headers?: Record<string, string>
  body?: any
}

export async function apiFetch<T = any>(path: string, { method = 'GET', headers = {}, body }: ApiFetchOptions = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
      ...headers,
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  let raw = ''
  try { raw = await res.text() } catch {}

  let data: any = null
  try { data = raw ? JSON.parse(raw) : null } catch {}

  if (res.ok && data && data.success === false) {
    const errPayload = data.error || data
    const msg = extractMessage(errPayload, res.statusText || 'Request failed')
    const error: ApiError = new Error(msg)
    error.status = 200
    error.data = data
    error.raw = raw
    error.code = errPayload?.code
    error.details = errPayload?.details
    throw error
  }

  if (!res.ok) {
    // Handle 401 Unauthorized - redirect to login
    if (res.status === 401) {
      // Clear auth data
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_token')
      // Redirect to login page
      window.location.href = '/login'
      // Throw error to stop execution
      const error: ApiError = new Error('Unauthorized')
      error.status = 401
      throw error
    }

    const fallback = res.statusText || 'Request failed'
    const errPayload = (data && (data.error || data)) || null
    const msg = extractMessage(errPayload || data, fallback)
    const error: ApiError = new Error(msg)
    error.status = res.status
    error.data = data
    error.raw = raw
    error.code = (errPayload && errPayload.code) || data?.code
    error.details = (errPayload && errPayload.details) || data?.details
    throw error
  }

  return (data ?? raw) as T
}
