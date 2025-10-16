const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api/v1'

function extractMessage(data, fallback) {
  if (!data) return fallback
  // If server sent a JSON-looking string, try to parse and recurse
  if (typeof data === 'string') {
    const s = data.trim()
    if (s.startsWith('{') || s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s)
        return extractMessage(parsed, fallback)
      } catch {
        // fall through, return original string
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
    const v = k ? data.details[k] : null
    if (Array.isArray(v) && v.length) return `${k}: ${v[0]}`
  }
  try { return JSON.stringify(data) } catch { return fallback }
}

export async function apiFetch(path, { method = 'GET', headers = {}, body } = {}) {
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

  // Robust body parsing: try text then JSON
  let raw = ''
  try { raw = await res.text() } catch {}

  let data = null
  try { data = raw ? JSON.parse(raw) : null } catch {}

  // Normalize API contracts that return 200 with { success:false, error:{...} }
  if (res.ok && data && data.success === false) {
    const errPayload = data.error || data
    const msg = extractMessage(errPayload, res.statusText || 'Request failed')
    const error = new Error(msg)
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
      const error = new Error('Unauthorized')
      error.status = 401
      throw error
    }

    const fallback = res.statusText || 'Request failed'
    // Also handle error payloads like { error: { message, details } }
    const errPayload = (data && (data.error || data)) || null
    const msg = extractMessage(errPayload || data, fallback)
    const error = new Error(msg)
    error.status = res.status
    error.data = data
    error.raw = raw
    error.code = (errPayload && errPayload.code) || data?.code
    error.details = (errPayload && errPayload.details) || data?.details
    throw error
  }

  return data ?? raw
}