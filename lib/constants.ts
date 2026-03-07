// ── Auth ──
export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'bullpay_token'
export const AUTH_USER_COOKIE = 'bullpay_user'
export const AUTH_NAV_COOKIE = 'bullpay_nav'

export const ADMIN_ROLES = ['super_admin', 'admin', 'support_agent'] as const
export const USER_ROLES = ['regular_user', 'business_user'] as const

// ── API ──
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3339'

// ── Pusher ──
export const PUSHER_APP_KEY = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || ''
export const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1'

// ── Theme ──
export const THEME_STORAGE_KEY = 'ui_theme'
export const LANG_STORAGE_KEY = 'ui_lang'
export const SIDEBAR_COLLAPSED_KEY = 'ui_sidebar_collapsed'

// ── Timezones ──
export const COMMON_TIMEZONES = [
  { value: 'Pacific/Midway', label: '(UTC-11:00) Midway Island' },
  { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii' },
  { value: 'America/Anchorage', label: '(UTC-09:00) Alaska' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US)' },
  { value: 'America/Denver', label: '(UTC-07:00) Mountain Time (US)' },
  { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US)' },
  { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US)' },
  { value: 'America/Sao_Paulo', label: '(UTC-03:00) São Paulo' },
  { value: 'Atlantic/South_Georgia', label: '(UTC-02:00) Mid-Atlantic' },
  { value: 'Atlantic/Azores', label: '(UTC-01:00) Azores' },
  { value: 'UTC', label: '(UTC+00:00) UTC' },
  { value: 'Europe/London', label: '(UTC+00:00) London' },
  { value: 'Europe/Paris', label: '(UTC+01:00) Paris, Berlin, Rome' },
  { value: 'Europe/Helsinki', label: '(UTC+02:00) Helsinki, Kyiv' },
  { value: 'Europe/Istanbul', label: '(UTC+03:00) Istanbul' },
  { value: 'Europe/Moscow', label: '(UTC+03:00) Moscow' },
  { value: 'Asia/Dubai', label: '(UTC+04:00) Dubai' },
  { value: 'Asia/Karachi', label: '(UTC+05:00) Karachi' },
  { value: 'Asia/Kolkata', label: '(UTC+05:30) Mumbai, Kolkata' },
  { value: 'Asia/Dhaka', label: '(UTC+06:00) Dhaka' },
  { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok, Hanoi, Jakarta' },
  { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore, Kuala Lumpur' },
  { value: 'Asia/Shanghai', label: '(UTC+08:00) Beijing, Shanghai' },
  { value: 'Asia/Hong_Kong', label: '(UTC+08:00) Hong Kong' },
  { value: 'Asia/Taipei', label: '(UTC+08:00) Taipei' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo, Osaka' },
  { value: 'Asia/Seoul', label: '(UTC+09:00) Seoul' },
  { value: 'Australia/Sydney', label: '(UTC+10:00) Sydney, Melbourne' },
  { value: 'Pacific/Noumea', label: '(UTC+11:00) New Caledonia' },
  { value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland, Wellington' },
] as const
