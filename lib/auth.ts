/**
 * Server-side auth utilities.
 *
 * Reads auth state from cookies (not localStorage) so it works
 * in middleware, server components, and route handlers.
 */

import { cookies } from 'next/headers'
import { ADMIN_ROLES, AUTH_COOKIE_NAME } from './constants'
import { apiFetch } from './api-client'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  [key: string]: unknown
}

export interface Navigation {
  role: string
  menus: Array<{
    key: string
    label: string
    icon?: string
    children?: Array<{ key: string; label: string }>
  }>
  permissions: string[]
}

/**
 * Get current auth token from cookies (server-side).
 */
export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE_NAME)?.value || null
}

/**
 * Get current user from cookie.
 */
export async function getUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('bullpay_user')?.value
  if (!raw) return null
  try {
    return JSON.parse(decodeURIComponent(raw))
  } catch {
    return null
  }
}

/**
 * Check if current user is admin (server-side).
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser()
  if (!user) return false
  return ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])
}

/**
 * Fetch navigation/permissions from API (server-side).
 * Used in dashboard layout to build sidebar menu.
 */
export async function getNavigation(token: string): Promise<Navigation | null> {
  try {
    return await apiFetch<Navigation>('/api/v1/me/navigation', { token })
  } catch {
    return null
  }
}

/**
 * Check if user has a specific permission (server-side).
 */
export function hasPermission(navigation: Navigation | null, permission: string): boolean {
  if (!navigation) return false
  if (navigation.role === 'super_admin') return true
  return navigation.permissions?.includes(permission) ?? false
}
