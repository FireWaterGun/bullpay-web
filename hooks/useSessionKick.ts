'use client'

import { useEffect, useRef } from 'react'
import { useAuth, usePusher } from '@/app/providers'

interface PusherChannel {
  bind: (event: string, callback: (data: Record<string, unknown>) => void) => void
  unbind_all: () => void
}

/**
 * Listens for `session:replaced` on the user's private notification channel.
 * When another device logs in as the same user, the API triggers this event
 * to all existing Pusher connections. The old device receives it, logs out,
 * and redirects to the login page with a warning banner.
 */
export default function useSessionKick() {
  const { user, logout } = useAuth()
  const pusher = usePusher()
  const channelRef = useRef<PusherChannel | null>(null)

  useEffect(() => {
    if (!pusher?.subscribe || !pusher.isConnected || !user?.id) return

    const channelName = `private-user.${user.id}.notifications`
    const channel = pusher.subscribe(channelName) as PusherChannel | null
    channelRef.current = channel

    if (channel) {
      channel.bind('session:replaced', () => {
        // Store flag for login page to show warning
        try {
          sessionStorage.setItem('session_replaced', '1')
        } catch {
          // sessionStorage may not be available
        }
        logout()
        window.location.href = '/login'
      })
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all()
        pusher.unsubscribe(channelName)
        channelRef.current = null
      }
    }
  }, [pusher, user?.id, logout])
}
