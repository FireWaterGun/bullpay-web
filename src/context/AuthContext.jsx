import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { extractToken } from '../utils/authToken'

const AuthContext = createContext(null)
const STORAGE_USER_KEY = 'auth_user'
const STORAGE_TOKEN_KEY = 'auth_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isReady, setIsReady] = useState(false)

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

  const login = useCallback((nextUser, nextToken) => {
    const strToken = extractToken(nextToken)
    setUser(nextUser || null)
    setToken(strToken || null)
    try { localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser || {})) } catch {}
    if (strToken) localStorage.setItem(STORAGE_TOKEN_KEY, strToken)
    else localStorage.removeItem(STORAGE_TOKEN_KEY)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(STORAGE_USER_KEY)
    localStorage.removeItem(STORAGE_TOKEN_KEY)
  }, [])

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!token || !!user,
    isReady,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user' || (!user?.role && !!user), // default to user if no role
    setUser,
    login,
    logout,
  }), [user, token, isReady, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
