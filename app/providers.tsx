'use client'

import '@/lib/i18n'

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { apiFetch } from '@/lib/api-client'
import { ADMIN_ROLES, AUTH_COOKIE_NAME } from '@/lib/constants'
import { ToastContainer } from '@/components/Toast'
import NavigationProgress from '@/components/NavigationProgress'
import useIdleLogout from '@/hooks/useIdleLogout'

// ═══════════════════════════════════════════
// Auth Context
// ═══════════════════════════════════════════

interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  fullName?: string
  avatarUrl?: string
  timezone?: string
  [key: string]: unknown
}

export interface NavigationItem {
  key: string
  label: string
  path: string
  icon?: string
  external?: boolean
  children?: NavigationItem[]
}

export interface NavigationSection {
  section: string
  items: NavigationItem[]
}

interface Navigation {
  role: string
  menus: NavigationSection[]
  permissions: string[]
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  navigation: Navigation | null
  isAdmin: boolean
  isReady: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
  updateUser: (updates: Partial<AuthUser>) => void
  hasPermission: (perm: string) => boolean
  hasMenu: (key: string) => boolean
  setNavigation: (nav: Navigation) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function setCookie(name: string, value: string, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [navigation, setNavigation] = useState<Navigation | null>(null)
  const [isReady, setIsReady] = useState(false)
  const navFetchedRef = useRef(false)

  // Rehydrate from cookies on mount
  useEffect(() => {
    const savedToken = getCookie(AUTH_COOKIE_NAME)
    const savedUser = getCookie('bullpay_user')
    if (savedToken) queueMicrotask(() => setToken(savedToken))
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        queueMicrotask(() => setUser(parsedUser))
      } catch {
        /* ignore */
      }
    }
    const savedNav = getCookie('bullpay_nav')
    if (savedNav) {
      try {
        const parsedNav = JSON.parse(savedNav)
        queueMicrotask(() => setNavigation(parsedNav))
      } catch {
        /* ignore */
      }
    }
    queueMicrotask(() => setIsReady(true))
  }, [])

  // Fetch navigation when token is available
  useEffect(() => {
    if (!token || !isReady || navFetchedRef.current) return
    navFetchedRef.current = true

    apiFetch<Navigation>('/api/v1/me/navigation', { token })
      .then((nav) => {
        setNavigation(nav)
        setCookie('bullpay_nav', JSON.stringify(nav))
      })
      .catch(() => {
        /* navigation fetch failed */
      })
  }, [token, isReady])

  const isAdmin = !!navigation && ADMIN_ROLES.includes(navigation.role as (typeof ADMIN_ROLES)[number])

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken)
    setUser(newUser)
    setCookie(AUTH_COOKIE_NAME, newToken)
    setCookie('bullpay_user', JSON.stringify(newUser))
    navFetchedRef.current = false
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setNavigation(null)
    deleteCookie(AUTH_COOKIE_NAME)
    deleteCookie('bullpay_user')
    deleteCookie('bullpay_nav')
  }, [])

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      setCookie('bullpay_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  // Idle auto-logout (30 min inactivity)
  useIdleLogout(logout, !!token)

  const hasPermission = useCallback(
    (perm: string) => {
      if (!navigation) return false
      if (navigation.role === 'super_admin') return true
      return navigation.permissions?.includes(perm) ?? false
    },
    [navigation]
  )

  const hasMenu = useCallback(
    (key: string) => {
      if (!navigation) return false
      if (navigation.role === 'super_admin') return true
      return (
        navigation.menus?.some((section) =>
          section.items?.some((m) => m.key === key || m.children?.some((c) => c.key === key))
        ) ?? false
      )
    },
    [navigation]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        navigation,
        isAdmin,
        isReady,
        login,
        logout,
        updateUser,
        hasPermission,
        hasMenu,
        setNavigation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ═══════════════════════════════════════════
// Toast Context
// ═══════════════════════════════════════════

type ToastType = 'success' | 'error' | 'warning' | 'info'
type ToastMessage = string | { title?: string; body?: string }

interface ToastItem {
  id: number
  type: ToastType
  message: ToastMessage
}

interface ToastContextValue {
  toasts: ToastItem[]
  toast: (type: ToastType, message: ToastMessage) => void
  removeToast: (id: number) => void
  success: (message: ToastMessage) => void
  error: (message: ToastMessage) => void
  warning: (message: ToastMessage) => void
  info: (message: ToastMessage) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const toast = useCallback((type: ToastType, message: ToastMessage) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((message: ToastMessage) => toast('success', message), [toast])
  const error = useCallback((message: ToastMessage) => toast('error', message), [toast])
  const warning = useCallback((message: ToastMessage) => toast('warning', message), [toast])
  const info = useCallback((message: ToastMessage) => toast('info', message), [toast])

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// ═══════════════════════════════════════════
// Pusher Context (client-only)
// ═══════════════════════════════════════════

interface PusherContextValue {
  subscribe: (channel: string) => unknown
  unsubscribe: (channel: string) => void
  isConnected: boolean
}

const PusherContext = createContext<PusherContextValue | null>(null)

export function usePusher() {
  return useContext(PusherContext)
}

export function PusherProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const pusherRef = useRef<unknown>(null)
  const { token } = useAuth()

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY
    if (!appKey) return

    let pusher: InstanceType<typeof import('pusher-js').default>

    import('pusher-js').then(({ default: Pusher }) => {
      // Disconnect previous instance
      if (pusherRef.current) {
        ;(pusherRef.current as any).disconnect()
      }

      const wsHost = process.env.NEXT_PUBLIC_PUSHER_WS_HOST
      const wsPort = process.env.NEXT_PUBLIC_PUSHER_WS_PORT

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3339'
      const authEndpoint = `${apiBaseUrl}/api/v1/pusher/auth`
      const forceTLS = process.env.NEXT_PUBLIC_PUSHER_FORCE_TLS !== 'false'

      pusher = new Pusher(appKey, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
        forceTLS,
        enabledTransports: forceTLS ? ['ws'] : ['ws', 'wss'],
        ...(wsHost
          ? {
              wsHost,
              wsPort: wsPort ? Number(wsPort) : 6001,
              httpHost: wsHost,
              httpPort: wsPort ? Number(wsPort) : 6001,
              disableStats: true,
            }
          : {}),
        // Auth only needed for private/presence channels — public channels skip this.
        // When token is unavailable, private channel subscriptions will fail gracefully.
        channelAuthorization: {
          endpoint: authEndpoint,
          transport: 'ajax' as const,
          customHandler: ({ socketId, channelName }, callback) => {
            if (!token) {
              callback(new Error('No auth token — cannot subscribe to private channel'), null)
              return
            }
            fetch(authEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channelName,
              }),
            })
              .then(async (response) => {
                if (!response.ok) {
                  throw new Error(`Auth failed: ${response.status}`)
                }
                return response.json()
              })
              .then((data) => {
                const authData = data.data || data
                if (!authData.auth) {
                  throw new Error('Invalid auth response: missing "auth" field')
                }
                callback(null, authData)
              })
              .catch((error) => {
                callback(error, null)
              })
          },
        },
      })

      pusher.connection.bind('connected', () => setIsConnected(true))
      pusher.connection.bind('disconnected', () => setIsConnected(false))
      pusherRef.current = pusher
    })

    return () => {
      if (pusherRef.current) {
        ;(pusherRef.current as any).disconnect()
        pusherRef.current = null
        setIsConnected(false)
      }
    }
  }, [token])

  const subscribe = useCallback((channel: string) => {
    if (!pusherRef.current) return null
    return (pusherRef.current as any).subscribe(channel)
  }, [])

  const unsubscribe = useCallback((channel: string) => {
    if (!pusherRef.current) return
    ;(pusherRef.current as any).unsubscribe(channel)
  }, [])

  return <PusherContext.Provider value={{ subscribe, unsubscribe, isConnected }}>{children}</PusherContext.Provider>
}

// ═══════════════════════════════════════════
// Combined Providers
// ═══════════════════════════════════════════

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <PusherProvider>
          <NavigationProgress />
          {children}
        </PusherProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
