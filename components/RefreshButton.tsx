'use client'

import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'

// Inject styles once globally
const STYLE_ID = 'refresh-btn-styles'
function ensureStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = [
    '@keyframes refresh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
    '@keyframes topbar-glow { 0%,100% { box-shadow: 0 0 8px var(--bs-primary, #696cff), 0 0 4px var(--bs-primary, #696cff); } 50% { box-shadow: 0 0 16px var(--bs-primary, #696cff), 0 0 8px var(--bs-primary, #696cff); } }',
  ].join('\n')
  document.head.appendChild(style)
}

/* ── Global progress bar singleton ──────────────────────────── */
// Track how many RefreshButtons are loading concurrently.
// Only one progress bar renders — the first to start owns it.
let activeCount = 0
let progressListeners: Array<() => void> = []

function subscribe(fn: () => void) {
  progressListeners.push(fn)
  return () => { progressListeners = progressListeners.filter(l => l !== fn) }
}
function notifyAll() { progressListeners.forEach(fn => fn()) }

interface RefreshButtonProps {
  /** The async function to call when clicked */
  onClick: () => void | Promise<void>
  /** Whether data is currently loading */
  loading?: boolean
  /** Button className override (default: btn btn-text-secondary) */
  className?: string
  /** Extra title for accessibility */
  title?: string
}

/**
 * Refresh button with a YouTube-style top-of-page progress bar.
 *
 * Renders:
 *  - A spinning icon while loading
 *  - A fixed top bar (position:fixed, top:0) that auto-advances 0→90%,
 *    snaps to 100% when loading finishes, then fades out.
 */
export default function RefreshButton({
  onClick,
  loading = false,
  className = 'btn btn-text-secondary',
  title = 'Refresh',
}: RefreshButtonProps) {
  const [progress, setProgress] = useState(0)
  const [showBar, setShowBar] = useState(false)
  const [fading, setFading] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null)
  const wasLoading = useRef(false)

  useEffect(ensureStyles, [])

  // Track loading start/stop with global counter for singleton bar
  useEffect(() => {
    if (loading && !wasLoading.current) {
      wasLoading.current = true
      const wasZero = activeCount === 0
      activeCount++
      notifyAll()

      // Only the first loader owns the progress bar
      if (wasZero) {
        setIsOwner(true)
        setProgress(0)
        setShowBar(true)
        setFading(false)

        let current = 0
        intervalRef.current = setInterval(() => {
          current += Math.random() * 8 + 2
          if (current >= 90) current = 90
          setProgress(current)
        }, 200)
      }
    }

    if (!loading && wasLoading.current) {
      wasLoading.current = false
      activeCount = Math.max(0, activeCount - 1)
      notifyAll()

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // Owner finishes the bar only when ALL loaders are done
      if (isOwner && activeCount === 0) {
        setProgress(100)
        const fadeTimeout = setTimeout(() => setFading(true), 250)
        const hideTimeout = setTimeout(() => {
          setShowBar(false)
          setFading(false)
          setProgress(0)
          setIsOwner(false)
        }, 700)
        return () => { clearTimeout(fadeTimeout); clearTimeout(hideTimeout) }
      }

      if (isOwner && activeCount > 0) {
        // Other loaders still active — keep bar running
      }
    }
  }, [loading, isOwner])

  // If we're the owner and other loaders finish after us, listen for global changes
  useEffect(() => {
    if (!isOwner) return
    return subscribe(() => {
      if (activeCount === 0 && !wasLoading.current) {
        setProgress(100)
        setTimeout(() => setFading(true), 250)
        setTimeout(() => {
          setShowBar(false)
          setFading(false)
          setProgress(0)
          setIsOwner(false)
        }, 700)
      }
    })
  }, [isOwner])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (wasLoading.current) {
        wasLoading.current = false
        activeCount = Math.max(0, activeCount - 1)
        notifyAll()
      }
    }
  }, [])

  const handleClick = useCallback(() => {
    if (!loading) onClick()
  }, [loading, onClick])

  return (
    <>
      {/* YouTube-style top bar – only the owner instance renders it */}
      {isOwner && showBar && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            ...topBarContainerStyle,
            opacity: fading ? 0 : 1,
            transition: 'opacity 0.4s ease-out',
          }}
        >
          <div
            style={{
              ...topBarStyle,
              width: `${progress}%`,
              transition: progress === 100
                ? 'width 0.2s ease-out'
                : 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Glowing tip like YouTube */}
            {progress < 100 && (
              <div style={topBarTipStyle} />
            )}
          </div>
        </div>,
        document.body
      )}

      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={loading}
        title={title}
        aria-label={title}
      >
        <i
          className="bx bx-refresh"
          style={{
            display: 'inline-block',
            animation: loading ? 'refresh-spin 0.8s linear infinite' : 'none',
            fontSize: '1.25rem',
          }}
        />
      </button>
    </>
  )
}

/* ── Styles ─────────────────────────────────────────────────── */

const topBarContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '3px',
  backgroundColor: 'transparent',
  zIndex: 99999,
  pointerEvents: 'none',
}

const topBarStyle: React.CSSProperties = {
  height: '100%',
  backgroundColor: 'var(--bs-primary, #696cff)',
  position: 'relative',
}

const topBarTipStyle: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: '-1px',
  width: '80px',
  height: '5px',
  borderRadius: '0 2px 2px 0',
  animation: 'topbar-glow 1.5s ease-in-out infinite',
}
