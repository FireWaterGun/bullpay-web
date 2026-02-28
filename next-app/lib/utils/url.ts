/**
 * Validate that a URL is safe for redirect (blocks javascript:, data:, vbscript: schemes).
 * Only allows http: and https: URLs that parse successfully.
 */
export function isSafeRedirectUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
