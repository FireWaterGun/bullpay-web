'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getSystemStatus } from '@/lib/api/system'
import { usePusher } from '@/app/providers'
import { formatDateTime } from '@/lib/utils/format'

const CHANNEL = 'system-maintenance'
const EVENT = 'maintenance-status-changed'
const POLL_INTERVAL = 30 // seconds
let maintenanceKeyframesInjected = false

/**
 * Maintenance Mode Page
 *
 * Displayed when the API returns 503 SERVICE_MAINTENANCE.
 * Primary: Pusher real-time via `system-maintenance` channel (instant recovery).
 * Fallback: polls /api/v1/system/status every 30s.
 * Redirects back to the dashboard when system is back online.
 */

/* ── Inline styles (hoisted to avoid recreating on every render) ── */
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
    background: '#0e1028',
    position: 'relative',
    overflow: 'hidden',
  },
  /* radial glow orbs — matches landing-dark hero */
  glow1: {
    position: 'absolute',
    width: 700,
    height: 700,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255, 77, 141, 0.18) 0%, transparent 70%)',
    filter: 'blur(80px)',
    top: '-200px',
    right: '-100px',
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(108, 99, 255, 0.15) 0%, transparent 70%)',
    filter: 'blur(80px)',
    bottom: '-100px',
    left: '-60px',
    pointerEvents: 'none',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize: '64px 64px',
    maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black, transparent)',
    WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black, transparent)',
    pointerEvents: 'none',
  },
  card: {
    maxWidth: 480,
    width: '100%',
    borderRadius: 20,
    border: 'none',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
    backdropFilter: 'blur(12px)',
    background: 'rgba(255,255,255,0.97)',
    position: 'relative',
    zIndex: 1,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    background: '#4361ee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 8px 32px rgba(67,97,238,0.35)',
  },
  iconSvg: {
    width: 44,
    height: 44,
    color: '#fff',
  },
  title: {
    fontSize: '1.65rem',
    fontWeight: 700,
    color: '#2d3748',
    marginBottom: 8,
    letterSpacing: '-0.02em',
  },
  message: {
    fontSize: '1rem',
    color: '#718096',
    lineHeight: 1.6,
    marginBottom: 24,
    maxWidth: 380,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  estimatedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'linear-gradient(135deg, #eef1ff 0%, #e4e9fd 100%)',
    border: '1px solid rgba(67,97,238,0.15)',
    borderRadius: 12,
    padding: '10px 18px',
    marginBottom: 28,
    fontSize: '0.875rem',
    color: '#4a5568',
    textAlign: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  autoCheck: {
    marginTop: 24,
    fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.45)',
    zIndex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footer: {
    marginTop: 12,
    fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.35)',
    zIndex: 1,
    position: 'relative',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  brandIcon: {
    fontSize: '1.75rem',
    marginRight: 8,
    color: '#4361ee',
  },
  brandText: {
    fontSize: '1.5rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
}

/* Keyframes injected once via <style> tag */
const KEYFRAMES = `
@keyframes maintenance-pulse {
  0%, 100% { box-shadow: 0 8px 32px rgba(67,97,238,0.35); }
  50% { box-shadow: 0 8px 48px rgba(67,97,238,0.55); }
}
@keyframes maintenance-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@keyframes maintenance-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
`

export default function MaintenancePage() {
  const { t, i18n } = useTranslation('common')
  const { subscribe, unsubscribe, isConnected } = usePusher() || {}
  const channelRef = useRef(null)
  const [info, setInfo] = useState({
    message: null,
    estimatedEnd: null,
  })
  const [countdown, setCountdown] = useState(POLL_INTERVAL)

  // Inject keyframes once
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!maintenanceKeyframesInjected) {
      const style = document.createElement('style')
      style.id = 'maintenance-keyframes'
      style.textContent = KEYFRAMES
      document.head.appendChild(style)
      maintenanceKeyframesInjected = true
    }
  }, [])

  // Load maintenance info from sessionStorage on mount, then fetch fresh data from API
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('maintenance_info')
      if (stored) {
        setInfo(JSON.parse(stored))
      }
    } catch {
      // sessionStorage may not be available
    }
    // Immediately fetch fresh status (including estimatedEnd) from API
    getSystemStatus()
      .then((status) => {
        if (!status.maintenance) {
          sessionStorage.removeItem('maintenance_info')
          window.location.href = '/'
          return
        }
        setInfo({
          message: status.message,
          estimatedEnd: status.estimatedEnd,
        })
      })
      .catch(() => {
        // API still down, keep sessionStorage data
      })
  }, [])

  // Check if maintenance has ended
  const checkStatus = useCallback(async () => {
    try {
      const status = await getSystemStatus()
      if (!status.maintenance) {
        // Maintenance ended — redirect back
        sessionStorage.removeItem('maintenance_info')
        window.location.href = '/'
        return
      }
      // Update info from fresh data
      setInfo({
        message: status.message,
        estimatedEnd: status.estimatedEnd,
      })
    } catch {
      // API still down, stay on maintenance page
    } finally {
      setCountdown(POLL_INTERVAL)
    }
  }, [])

  // Auto-poll every 30 seconds (primary for unauthenticated, fallback for Pusher)
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus()
    }, POLL_INTERVAL * 1000)

    return () => clearInterval(interval)
  }, [checkStatus])

  // Pusher real-time subscription (instant recovery when token available)
  useEffect(() => {
    if (!subscribe || !isConnected) return

    const channel = subscribe(CHANNEL)
    channelRef.current = channel

    if (channel) {
      channel.bind(EVENT, (data) => {
        if (!data.maintenance) {
          // Maintenance ended — redirect back immediately
          sessionStorage.removeItem('maintenance_info')
          window.location.href = '/'
          return
        }
        // Pusher payload matches HTTP /system/status shape
        setInfo({
          message: data.message,
          estimatedEnd: data.estimatedEnd,
        })
      })
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all()
        unsubscribe(CHANNEL)
        channelRef.current = null
      }
    }
  }, [subscribe, unsubscribe, isConnected])

  // Countdown timer (visual only)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const displayMessage = info.message

  // Format estimated end in browser timezone with tz label (e.g. "Mar 8, 2026, 11:07 PM (ICT)")
  const formattedEstimatedEnd = (() => {
    if (!info.estimatedEnd) return null
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const localeMap = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    const locale = localeMap[i18n.language] || i18n.language || undefined
    const dateStr = formatDateTime(info.estimatedEnd, { locale, timeZone: browserTz })
    // Get short tz label e.g. "ICT", "EST"
    const tzLabel = new Intl.DateTimeFormat(locale, { timeZone: browserTz, timeZoneName: 'short' })
      .formatToParts(new Date(info.estimatedEnd))
      .find((p) => p.type === 'timeZoneName')?.value
    return tzLabel ? `${dateStr} (${tzLabel})` : dateStr
  })()

  return (
    <div style={styles.page}>
      {/* Decorative background — landing-dark style */}
      <div style={{ ...styles.glow1, animation: 'glow-pulse 6s ease-in-out infinite' }} />
      <div style={{ ...styles.glow2, animation: 'glow-pulse 8s ease-in-out infinite 2s' }} />
      <div style={styles.grid} />

      <div style={styles.card}>
        <div className="text-center" style={{ padding: '48px 36px 40px' }}>
          {/* BullPay Brand */}
          <div style={styles.brand}>
            <i className="bx bxs-wallet-alt" style={styles.brandIcon}></i>
            <span style={styles.brandText}>
              <span className="text-surface-700">BULL</span>
              <span style={{ color: '#4361ee' }}>PAY</span>
            </span>
          </div>

          {/* Animated Icon */}
          <div
            style={{
              ...styles.iconWrap,
              animation: 'maintenance-pulse 2.5s ease-in-out infinite, maintenance-float 3s ease-in-out infinite',
            }}
          >
            {/* Gear SVG icon */}
            <svg
              style={styles.iconSvg}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </div>

          {/* Title */}
          <h2 style={styles.title}>{t('maintenance.title', { defaultValue: 'System Maintenance' })}</h2>

          {/* Decorative divider */}
          <div className="w-12 h-[3px] rounded-sm" style={{ background: '#4361ee', margin: '12px auto 20px' }} />

          {/* Message */}
          <p style={styles.message}>
            {displayMessage ||
              t('maintenance.defaultMessage', {
                defaultValue: 'We are performing scheduled maintenance. Please check back shortly.',
              })}
          </p>

          {/* Estimated End */}
          {formattedEstimatedEnd && (
            <div style={styles.estimatedBadge}>
              <i className="bx bx-time-five text-[#4361ee] text-[18px]"></i>
              <span style={{ lineHeight: 1.5 }}>
                {t('maintenance.estimatedEnd', { defaultValue: 'Estimated recovery' })}:{' '}
                <strong className="text-surface-700" style={{ whiteSpace: 'nowrap' }}>
                  {formattedEstimatedEnd}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p style={styles.autoCheck}>
        <i className="bx bx-loader-alt" style={{ animation: 'maintenance-spin 1.5s linear infinite' }} />{' '}
        {t('maintenance.autoCheck', { defaultValue: 'Auto-checking in {seconds}s' }).replace(
          '{seconds}',
          String(countdown)
        )}
      </p>
      <p style={styles.footer}>&copy; {new Date().getFullYear()} BullPay</p>
    </div>
  )
}
