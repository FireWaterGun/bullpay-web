import { useEffect, useRef } from 'react'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const THROTTLE_MS = 30_000 // throttle activity events to every 30s

/**
 * Auto-logout after 30 minutes of inactivity.
 * Tracks mousemove, keydown, click, scroll, touchstart.
 */
export default function useIdleLogout(logout, isAuthenticated) {
  const timerRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  useEffect(() => {
    if (!isAuthenticated) return

    function resetTimer() {
      const now = Date.now()
      // Throttle: only reset if enough time has passed since last activity
      if (now - lastActivityRef.current < THROTTLE_MS) return
      lastActivityRef.current = now

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        logout()
      }, IDLE_TIMEOUT_MS)
    }

    // Initial timer
    timerRef.current = setTimeout(() => {
      logout()
    }, IDLE_TIMEOUT_MS)

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [logout, isAuthenticated])
}
