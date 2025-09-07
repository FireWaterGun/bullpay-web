export function requestId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return `req-${Math.random().toString(36).slice(2)}-${Date.now()}`
}
