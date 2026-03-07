'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * YouTube-style top progress bar for Next.js App Router navigations.
 *
 * How it works:
 * 1. Intercepts clicks on internal `<a>` links (event delegation on document)
 * 2. Starts a progress bar that auto-advances 0→90%
 * 3. When pathname changes (navigation complete), snaps to 100% then fades out
 *
 * Place this component once in the root layout or providers.
 */
export default function NavigationProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPathnameRef = useRef(pathname)
  const navigatingRef = useRef(false)
  const startTimeRef = useRef(0)

  // Start the progress bar
  const start = () => {
    if (navigatingRef.current) return
    navigatingRef.current = true
    startTimeRef.current = Date.now()
    setProgress(0)
    setVisible(true)
    setFading(false)

    // Quick initial jump, then slow crawl toward 90%
    let current = 0
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      if (current < 30) {
        current += Math.random() * 12 + 5
      } else if (current < 70) {
        current += Math.random() * 5 + 1
      } else {
        current += Math.random() * 2 + 0.5
      }
      if (current >= 90) current = 90
      setProgress(current)
    }, 200)
  }

  // Complete the progress bar
  const done = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    navigatingRef.current = false
    setProgress(100)
    setTimeout(() => setFading(true), 200)
    setTimeout(() => {
      setVisible(false)
      setFading(false)
      setProgress(0)
    }, 600)
  }

  // Detect navigation completion via pathname change
  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname
      if (navigatingRef.current) {
        // Defer to avoid synchronous setState in effect body
        queueMicrotask(done)
      }
    }
  }, [pathname])

  // Intercept internal link clicks to start progress bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignore modified clicks (new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return

      const anchor = (e.target as HTMLElement)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Skip external links, hash-only links, download links, target="_blank"
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href === '#' ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return
      }

      // Skip if navigating to the same page
      if (href === pathname || href === `${pathname}/`) return

      start()

      // Safety timeout: if navigation doesn't complete in 8s, force-finish
      setTimeout(() => {
        if (navigatingRef.current) done()
      }, 8000)
    }

    document.addEventListener('click', handleClick, { capture: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [pathname])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  if (!visible || typeof document === 'undefined') return null

  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        backgroundColor: 'transparent',
        zIndex: 99999,
        pointerEvents: 'none',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: 'var(--color-primary-600, #2563eb)',
          position: 'relative',
          transition: progress === 100 ? 'width 0.2s ease-out' : 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Glowing tip */}
        {progress < 100 && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '-1px',
              width: '80px',
              height: '5px',
              borderRadius: '0 2px 2px 0',
              boxShadow: '0 0 12px var(--color-primary-600, #2563eb), 0 0 6px var(--color-primary-600, #2563eb)',
            }}
          />
        )}
      </div>
    </div>,
    document.body
  )
}
