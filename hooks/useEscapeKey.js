'use client'

import { useEffect, useRef } from 'react'

/**
 * Registers a single `keydown` listener for the Escape key.
 * Uses a ref for the callback to avoid re-subscribing on every render.
 *
 * @param {() => void} callback - Called when Escape is pressed
 * @param {boolean} [enabled=true] - Set to false to disable the listener
 */
export function useEscapeKey(callback, enabled = true) {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    if (!enabled) return
    const handler = (e) => {
      if (e.key === 'Escape') callbackRef.current()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [enabled])
}
