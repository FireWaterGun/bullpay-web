'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { getSystemStatus } from '@/lib/api/system'
import { usePusher } from '@/app/providers'

const CHANNEL = 'system-maintenance'
const EVENT = 'maintenance-status-changed'
const FALLBACK_POLL_MS = 120_000 // 2 min fallback if Pusher is down

/**
 * Global system status indicator for Admin navbar.
 *
 * Primary: Pusher real-time via `system-maintenance` channel.
 * Fallback: polls /api/v1/system/status every 120s.
 * Also listens for `maintenance-status-changed` window event from admin page.
 */
export default function MaintenanceBanner() {
  const { t } = useTranslation('admin')
  const [status, setStatus] = useState(null)
  const { subscribe, unsubscribe, isConnected } = usePusher() || {}
  const channelRef = useRef(null)

  const poll = useCallback(async () => {
    try {
      const data = await getSystemStatus()
      setStatus(data)
    } catch {
      setStatus(null)
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    queueMicrotask(() => {
      void poll()
    })
  }, [poll])

  // Pusher real-time subscription
  useEffect(() => {
    if (!subscribe || !isConnected) return

    const channel = subscribe(CHANNEL)
    channelRef.current = channel

    if (channel) {
      channel.bind(EVENT, (data) => {
        // Pusher payload matches HTTP /system/status shape
        setStatus(data)
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

  // Fallback polling (slower, only when Pusher may be unreachable)
  useEffect(() => {
    const id = setInterval(poll, FALLBACK_POLL_MS)
    return () => clearInterval(id)
  }, [poll])

  // Listen for immediate updates from admin maintenance page (same tab)
  useEffect(() => {
    const onChanged = () => poll()
    window.addEventListener('maintenance-status-changed', onChanged)
    return () => window.removeEventListener('maintenance-status-changed', onChanged)
  }, [poll])

  // Still loading
  if (status === null) return null

  const isMaintenance = status?.maintenance
  const levelLabel = status?.level === 'full'
    ? t('maintenance.levelFull', { defaultValue: 'Full' })
    : t('maintenance.levelPartial', { defaultValue: 'Partial' })

  const config = isMaintenance
    ? {
        cls: status.level === 'full'
          ? 'bg-danger-500/12 text-danger-500'
          : 'bg-warning-500/12 text-warning-500',
        label: `${t('maintenance.title', { defaultValue: 'Maintenance' })} (${levelLabel})`,
        pulse: true,
      }
    : {
        cls: 'bg-success-500/12 text-success-500',
        label: t('maintenance.systemUp', { defaultValue: 'System Normal' }),
        pulse: false,
      }

  return (
    <Link
      href="/admin/maintenance"
      className={`flex items-center gap-2 no-underline mr-auto text-sm whitespace-nowrap py-[0.3rem] px-3 rounded-md transition-colors ${config.cls}`}
    >
      <span
        className={`w-2 h-2 rounded-full bg-current shrink-0 ${config.pulse ? 'animate-pulse' : ''}`}
      />
      <span className="font-semibold">{config.label}</span>
    </Link>
  )
}
