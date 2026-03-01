/**
 * Validate that a URL is safe for redirect.
 * Blocks dangerous schemes (javascript:, data:, vbscript:) and
 * rejects URLs with embedded credentials (user:pass@host).
 * Only allows http: and https: URLs that parse successfully.
 */
export function isSafeRedirectUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    // Block URLs with embedded credentials (e.g. https://user:pass@evil.com)
    if (parsed.username || parsed.password) return false
    return true
  } catch {
    return false
  }
}
