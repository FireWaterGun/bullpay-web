/**
 * Copy text to the clipboard using the modern Clipboard API with a
 * legacy `document.execCommand` fallback for older browsers / insecure
 * contexts.
 *
 * Returns `true` on success, `false` on failure.
 */
export async function copyToClipboard(
  text: string,
  options?: { autoClearMs?: number },
): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      if (options?.autoClearMs) {
        setTimeout(() => { try { navigator.clipboard.writeText('') } catch {} }, options.autoClearMs)
      }
      return true
    }

    // Fallback for environments where Clipboard API is unavailable
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
