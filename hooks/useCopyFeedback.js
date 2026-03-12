import { useState, useCallback } from 'react'
import { copyToClipboard } from '@/lib/utils/clipboard'

/**
 * Hook for copy-to-clipboard with visual check feedback.
 * Returns { copiedId, handleCopy } — use copiedId to toggle bx-copy/bx-check icon.
 *
 * @example
 * const { copiedId, handleCopy } = useCopyFeedback()
 * <button onClick={() => handleCopy(text, uniqueId)}>
 *   <i className={`bx ${copiedId === uniqueId ? 'bx-check text-success' : 'bx-copy'}`} />
 * </button>
 */
export function useCopyFeedback(duration = 1500) {
  const [copiedId, setCopiedId] = useState(null)

  const handleCopy = useCallback(
    async (text, id) => {
      try {
        await copyToClipboard(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), duration)
      } catch {}
    },
    [duration]
  )

  return { copiedId, handleCopy }
}
