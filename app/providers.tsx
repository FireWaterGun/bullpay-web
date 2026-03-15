'use client'

import '@/lib/i18n'

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react'
import { apiFetch, setTokenRefreshCallback } from '@/lib/api-client'
import { ADMIN_ROLES_SET, AUTH_COOKIE_NAME, AUTH_COOKIE_TTL_DAYS } from '@/lib/constants'
import { ToastContainer } from '@/components/Toast'
import NavigationProgress from '@/components/NavigationProgress'
import { SWRConfig } from 'swr'
import { swrDefaults } from '@/lib/swr-config'
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

function setCookie(name: string, value: string, days = AUTH_COOKIE_TTL_DAYS) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`
}

function getCookie(name: string): string | null {
  const prefix = `; ${name}=`
  const cookie = `; ${document.cookie}`
  const parts = cookie.split(prefix)
  if (parts.length < 2) return null
  const value = parts.pop()?.split(';')[0]
  return value ? decodeURIComponent(value) : null
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

  // Register token refresh callback so api-client can update auth state
  useEffect(() => {
    setTokenRefreshCallback((newToken: string) => {
      setToken(newToken)
      setCookie(AUTH_COOKIE_NAME, newToken)
    })
    return () => setTokenRefreshCallback(null)
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

  const isAdmin = !!navigation && ADMIN_ROLES_SET.has(navigation.role)

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken)
    setUser(newUser)
    setNavigation(null)
    setCookie(AUTH_COOKIE_NAME, newToken)
    setCookie('bullpay_user', JSON.stringify(newUser))
    deleteCookie('bullpay_nav')
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

  // Idle auto-logout (8 hours inactivity — matches server-side refresh token idle timeout)
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

  const authValue = useMemo(
    () => ({ user, token, navigation, isAdmin, isReady, login, logout, updateUser, hasPermission, hasMenu, setNavigation }),
    [user, token, navigation, isAdmin, isReady, login, logout, updateUser, hasPermission, hasMenu, setNavigation]
  )

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  )
}

// ═══════════════════════════════════════════
// Toast Context
// ═══════════════════════════════════════════
//
// Split into two contexts so that calling toast.error() etc.
// does NOT re-render every consumer. Only ToastContainer
// subscribes to the toasts[] state context.

type ToastType = 'success' | 'error' | 'warning' | 'info'
type ToastMessage = string | { title?: string; body?: string }

interface ToastItem {
  id: number
  type: ToastType
  message: ToastMessage
}

interface ToastActions {
  toast: (type: ToastType, message: ToastMessage) => void
  removeToast: (id: number) => void
  success: (message: ToastMessage) => void
  error: (message: ToastMessage) => void
  warning: (message: ToastMessage) => void
  info: (message: ToastMessage) => void
}

/** Stable action functions — reference never changes */
const ToastActionsContext = createContext<ToastActions | null>(null)

/** Toast list state — changes when toasts are added/removed (only ToastContainer subscribes) */
const ToastStateContext = createContext<{ toasts: ToastItem[]; removeToast: (id: number) => void }>({
  toasts: [],
  removeToast: () => {},
})

export function useToast(): ToastActions {
  const ctx = useContext(ToastActionsContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastContainerBridge() {
  const { toasts, removeToast } = useContext(ToastStateContext)
  return <ToastContainer toasts={toasts} onRemove={removeToast} />
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

  // Actions value is stable — all functions are useCallback with [] or [toast] deps
  const actions = useMemo<ToastActions>(
    () => ({ toast, removeToast, success, error, warning, info }),
    [toast, removeToast, success, error, warning, info]
  )

  // State value changes when toasts change — only ToastContainerBridge subscribes
  const stateValue = useMemo(() => ({ toasts, removeToast }), [toasts, removeToast])

  return (
    <ToastActionsContext.Provider value={actions}>
      <ToastStateContext.Provider value={stateValue}>
        {children}
        <ToastContainerBridge />
      </ToastStateContext.Provider>
    </ToastActionsContext.Provider>
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

  const pusherValue = useMemo(
    () => ({ subscribe, unsubscribe, isConnected }),
    [subscribe, unsubscribe, isConnected]
  )

  return <PusherContext.Provider value={pusherValue}>{children}</PusherContext.Provider>
}

// ═══════════════════════════════════════════
// Combined Providers
// ═══════════════════════════════════════════

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={swrDefaults}>
      <AuthProvider>
        <ToastProvider>
          <PusherProvider>
            <NavigationProgress />
            {children}
          </PusherProvider>
        </ToastProvider>
      </AuthProvider>
    </SWRConfig>
  )
}
