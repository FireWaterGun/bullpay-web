'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { getSystemStatus } from '@/lib/api/system'
import { usePusher } from '@/app/providers'

const CHANNEL = 'system-maintenance'
const EVENT = 'maintenance-status-changed'
const FALLBACK_POLL_MS = 120_000 // 2 min fallback if Pusher is down

// rendering-hoist-jsx: Static keyframe definition hoisted outside component
const PULSE_KEYFRAMES = (
  <style>{`
    @keyframes maintenance-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
  `}</style>
)

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
          ? 'bg-red-500/12 text-red-500'
          : 'bg-amber-500/12 text-amber-500',
        label: `${t('maintenance.title', { defaultValue: 'Maintenance' })} (${levelLabel})`,
        pulse: true,
      }
    : {
        cls: 'bg-green-500/12 text-green-500',
        label: t('maintenance.systemUp', { defaultValue: 'System Normal' }),
        pulse: false,
      }

  return (
    <Link
      href="/admin/maintenance"
      className={`flex items-center gap-2 no-underline mr-auto text-sm whitespace-nowrap py-[0.3rem] px-[0.75rem] rounded-md transition-colors ${config.cls}`}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          flexShrink: 0,
          ...(config.pulse ? { animation: 'maintenance-pulse 2s ease-in-out infinite' } : {}),
        }}
      />
      <span className="font-semibold">{config.label}</span>
      {config.pulse && PULSE_KEYFRAMES}
    </Link>
  )
}
