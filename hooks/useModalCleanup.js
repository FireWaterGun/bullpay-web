import { useEffect } from 'react'

/**
 * Clean up leftover Bootstrap modal artifacts (backdrop, body styles).
 * Useful when modals are removed from the DOM without proper Bootstrap disposal.
 */
export function cleanupModalArtifacts() {
  document.body.classList.remove('modal-open')
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  const backdrops = document.querySelectorAll('.modal-backdrop')
  backdrops.forEach(backdrop => backdrop.remove())
}

/**
 * Hook that cleans up modal artifacts on component unmount.
 */
export function useModalCleanup() {
  useEffect(() => {
    return () => cleanupModalArtifacts()
  }, [])
}
