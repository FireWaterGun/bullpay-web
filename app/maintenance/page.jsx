'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getSystemStatus } from '@/lib/api/system'
import { usePusher } from '@/app/providers'

const CHANNEL = 'system-maintenance'
const EVENT = 'maintenance-status-changed'

/**
 * Maintenance Mode Page
 *
 * Displayed when the API returns 503 SERVICE_MAINTENANCE.
 * Primary: Pusher real-time via `system-maintenance` channel (instant recovery).
 * Fallback: polls /api/v1/system/status every 30s.
 * Redirects back to the dashboard when system is back online.
 */
export default function MaintenancePage() {
  const { t, i18n } = useTranslation('common')
  const locale = i18n.language || 'en'
  const { subscribe, unsubscribe, isConnected } = usePusher() || {}
  const channelRef = useRef(null)
  const [info, setInfo] = useState({
    message: null,
    messageTh: null,
    estimatedEnd: null,
  })
  const [checking, setChecking] = useState(false)
  const [countdown, setCountdown] = useState(30)

  // Load maintenance info from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('maintenance_info')
      if (stored) {
        setInfo(JSON.parse(stored))
      }
    } catch {
      // sessionStorage may not be available
    }
  }, [])

  // Check if maintenance has ended
  const checkStatus = useCallback(async () => {
    setChecking(true)
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
        messageTh: status.messageTh,
        estimatedEnd: status.estimatedEnd,
      })
    } catch {
      // API still down, stay on maintenance page
    } finally {
      setChecking(false)
      setCountdown(30) // reset countdown
    }
  }, [])

  // Auto-poll every 30 seconds (primary for unauthenticated, fallback for Pusher)
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus()
    }, 30_000)

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
          messageTh: data.messageTh,
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

  const displayMessage = locale === 'th' && info.messageTh ? info.messageTh : info.message

  const formattedEstimatedEnd = info.estimatedEnd
    ? new Date(info.estimatedEnd).toLocaleString(locale === 'th' ? 'th-TH' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null

  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f5f5f9' }}>
      <div className="card shadow-sm" style={{ maxWidth: 520, width: '100%' }}>
        <div className="card-body text-center p-5">
          {/* Maintenance Icon */}
          <div className="mb-4">
            <i className="bx bx-wrench text-warning" style={{ fontSize: '72px' }}></i>
          </div>

          {/* Title */}
          <h2 className="mb-3">{t('maintenance.title', { defaultValue: 'System Maintenance' })}</h2>

          {/* Message */}
          <p className="text-muted mb-4" style={{ fontSize: '1.05rem' }}>
            {displayMessage || t('maintenance.defaultMessage', { defaultValue: 'We are performing scheduled maintenance. Please check back shortly.' })}
          </p>

          {/* Estimated End */}
          {formattedEstimatedEnd && (
            <div className="alert alert-light border d-inline-flex align-items-center gap-2 mb-4">
              <i className="bx bx-time-five text-primary"></i>
              <span>
                {t('maintenance.estimatedEnd', { defaultValue: 'Estimated recovery' })}:{' '}
                <strong>{formattedEstimatedEnd}</strong>
              </span>
            </div>
          )}

          {/* Auto-check status */}
          <div className="mt-3">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={checkStatus}
              disabled={checking}
            >
              {checking ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  {t('maintenance.checking', { defaultValue: 'Checking...' })}
                </>
              ) : (
                <>
                  <i className="bx bx-refresh me-1"></i>
                  {t('maintenance.checkNow', { defaultValue: 'Check Now' })}
                </>
              )}
            </button>

            <p className="text-muted small mt-2 mb-0">
              {t('maintenance.autoCheck', { defaultValue: 'Auto-checking in {seconds}s' }).replace('{seconds}', String(countdown))}
            </p>
          </div>
        </div>
      </div>

      {/* BullPay branding */}
      <p className="text-muted small mt-4">
        &copy; {new Date().getFullYear()} BullPay
      </p>
    </div>
  )
}
