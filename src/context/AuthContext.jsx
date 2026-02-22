import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { extractToken } from '../utils/authToken'
import { getNavigation } from '../api/navigation.ts'
import useIdleLogout from '../hooks/useIdleLogout'

const AuthContext = createContext(null)
const STORAGE_USER_KEY = 'auth_user'
const STORAGE_TOKEN_KEY = 'auth_token'
const STORAGE_NAV_KEY = 'auth_navigation'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isReady, setIsReady] = useState(false)

  // Navigation state
  const [navigation, setNavigation] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_NAV_KEY)
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [navLoading, setNavLoading] = useState(false)
  const navFetchedRef = useRef(false)

  // Rehydrate from storage on mount
  useEffect(() => {
    try {
      // Token: clean up legacy bad values
      const rawToken = localStorage.getItem(STORAGE_TOKEN_KEY)
      let cleanToken = rawToken || undefined
      if (cleanToken) {
        const t = cleanToken.trim()
        if (t === '[object Object]') {
          cleanToken = undefined
        } else if ((t.startsWith('{') || t.startsWith('['))) {
          try {
            const parsed = JSON.parse(t)
            const extracted = extractToken(parsed)
            cleanToken = extracted
          } catch {
            cleanToken = undefined
          }
        }
      }
      if (cleanToken) setToken(cleanToken)
      else localStorage.removeItem(STORAGE_TOKEN_KEY)

      const storedUser = localStorage.getItem(STORAGE_USER_KEY)
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)) } catch { setUser(null) }
      }
    } finally {
      setIsReady(true)
    }
  }, [])

  // Fetch navigation when token is available
  const fetchNavigation = useCallback(async (authToken) => {
    if (!authToken || navFetchedRef.current) return
    navFetchedRef.current = true
    setNavLoading(true)
    try {
      const nav = await getNavigation(authToken)
      setNavigation(nav)
      try { localStorage.setItem(STORAGE_NAV_KEY, JSON.stringify(nav)) } catch {}
    } catch (e) {
      console.warn('Failed to fetch navigation:', e)
      // Keep cached navigation if available
    } finally {
      setNavLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token && isReady) {
      fetchNavigation(token)
    }
  }, [token, isReady, fetchNavigation])

  const login = useCallback((nextUser, nextToken) => {
    const strToken = extractToken(nextToken)
    setUser(nextUser || null)
    setToken(strToken || null)
    try { localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser || {})) } catch {}
    if (strToken) localStorage.setItem(STORAGE_TOKEN_KEY, strToken)
    else localStorage.removeItem(STORAGE_TOKEN_KEY)
    // Reset nav fetch flag so it re-fetches for new user
    navFetchedRef.current = false
    setNavigation(null)
    localStorage.removeItem(STORAGE_NAV_KEY)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setNavigation(null)
    navFetchedRef.current = false
    localStorage.removeItem(STORAGE_USER_KEY)
    localStorage.removeItem(STORAGE_TOKEN_KEY)
    localStorage.removeItem(STORAGE_NAV_KEY)
  }, [])

  // Idle auto-logout (30 min inactivity)
  useIdleLogout(logout, !!token)

  // Permission helpers
  const hasPermission = useCallback((permission) => {
    if (!navigation?.permissions) return false
    // super_admin has all permissions
    if (navigation.role === 'super_admin') return true
    return navigation.permissions.includes(permission)
  }, [navigation])

  const hasMenu = useCallback((menuKey) => {
    if (!navigation?.menus) return false
    // super_admin sees everything
    if (navigation.role === 'super_admin') return true
    // Check top-level menus
    const found = navigation.menus.some(m => m.key === menuKey)
    if (found) return true
    // Check children (admin sub-menus)
    return navigation.menus.some(m => m.children?.some(c => c.key === menuKey))
  }, [navigation])

  // Derive isAdmin from navigation (source of truth) with user.role fallback
  // If navigation has admin-prefixed menus → admin sidebar
  // Roles: super_admin, admin, support_agent → admin sidebar; regular_user, business_user → user sidebar
  const isAdmin = useMemo(() => {
    const ADMIN_ROLES = ['super_admin', 'admin', 'support_agent']
    // Prefer navigation role (from API)
    if (navigation?.role) return ADMIN_ROLES.includes(navigation.role)
    // If navigation has admin menus
    if (navigation?.menus) return navigation.menus.some(m => m.key.startsWith('admin-') || m.children?.some(c => c.key.startsWith('admin-')))
    // Fallback to user.role from login
    return ADMIN_ROLES.includes(user?.role) || user?.role === 'admin'
  }, [navigation, user])

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!token || !!user,
    isReady,
    isAdmin,
    isUser: !isAdmin,
    setUser,
    login,
    logout,
    navigation,
    navLoading,
    hasPermission,
    hasMenu,
    refreshNavigation: () => { navFetchedRef.current = false; if (token) fetchNavigation(token) },
  }), [user, token, isReady, isAdmin, login, logout, navigation, navLoading, hasPermission, hasMenu, fetchNavigation])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
