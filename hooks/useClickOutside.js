'use client'

import { useEffect, useRef } from 'react'

/**
 * Closes a component when a click occurs outside the referenced element.
 * Uses a ref for the callback to avoid re-subscribing on every render.
 *
 * @param {React.RefObject} ref - Ref attached to the container element
 * @param {() => void} callback - Called on outside click
 * @param {boolean} [enabled=true] - Set to false to disable the listener
 */
export function useClickOutside(ref, callback, enabled = true) {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    if (!enabled) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) callbackRef.current()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, enabled])
}
