// ── Auth ──
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'bullpay_token'
export const AUTH_USER_COOKIE = 'bullpay_user'
export const AUTH_NAV_COOKIE = 'bullpay_nav'

export const ADMIN_ROLES = ['super_admin', 'admin', 'support_agent'] as const
export const USER_ROLES = ['regular_user', 'business_user'] as const

// ── API ──
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3339'

// ── Pusher ──
export const PUSHER_APP_KEY = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || ''
export const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1'

// ── Theme ──
export const THEME_STORAGE_KEY = 'ui_theme'
export const LANG_STORAGE_KEY = 'ui_lang'
