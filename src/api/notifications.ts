import { apiFetch } from './client'
import { requestId } from '../utils/requestId'
import { extractToken } from '../utils/authToken'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  metadata?: Record<string, any>
  isRead: boolean
  createdAt: number
  expiresAt?: number
}

export interface NotificationsListResponse {
  notifications: Notification[]
  unreadCount: number
  hasMore: boolean
}

export interface UnreadCountResponse {
  unreadCount: number
}

export async function getNotifications(
  params: {
    limit?: number
    offset?: number
    includeRead?: boolean
  } = {},
  token?: unknown
): Promise<NotificationsListResponse> {
  const { limit = 20, offset = 0, includeRead = false } = params
  const authToken = extractToken(token)
  const authHeader = authToken ? `Bearer ${authToken}` : undefined
  
  const queryParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    includeRead: String(includeRead)
  })

  const res = await apiFetch<any>(`/api/v1/user/notifications?${queryParams}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })

  const data = res?.data || res
  return {
    notifications: data.notifications || [],
    unreadCount: data.unreadCount || 0,
    hasMore: data.hasMore || false,
  }
}

export async function getUnreadCount(token?: unknown): Promise<number> {
  const authToken = extractToken(token)
  const authHeader = authToken ? `Bearer ${authToken}` : undefined

  const res = await apiFetch<any>('/api/v1/user/notifications/unread-count', {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })

  const data = res?.data || res
  return data.unreadCount || 0
}

export async function markAsRead(
  notificationIds: string[],
  token?: unknown
): Promise<void> {
  const authToken = extractToken(token)
  const authHeader = authToken ? `Bearer ${authToken}` : undefined

  await apiFetch<any>('/api/v1/user/notifications/mark-as-read', {
    method: 'PATCH',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: { notificationIds },
  })
}

export async function markAllAsRead(token?: unknown): Promise<void> {
  const authToken = extractToken(token)
  const authHeader = authToken ? `Bearer ${authToken}` : undefined

  await apiFetch<any>('/api/v1/user/notifications/mark-all-as-read', {
    method: 'PATCH',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
}

export async function deleteNotifications(
  notificationIds: string[],
  token?: unknown
): Promise<void> {
  const authToken = extractToken(token)
  const authHeader = authToken ? `Bearer ${authToken}` : undefined

  await apiFetch<any>('/api/v1/user/notifications', {
    method: 'DELETE',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: { notificationIds },
  })
}

export function getNotificationIcon(type: string): string {
  const iconMap: Record<string, string> = {
    deposit_received: 'bx-download',
    deposit_confirmed: 'bx-check-circle',
    withdrawal_completed: 'bx-upload',
    withdrawal_failed: 'bx-error-circle',
    payment_received: 'bx-wallet',
    sweep_completed: 'bx-transfer',
    system_alert: 'bx-info-circle',
  }
  return iconMap[type] || 'bx-bell'
}

export function getNotificationColor(type: string): string {
  const colorMap: Record<string, string> = {
    deposit_received: 'success',
    deposit_confirmed: 'success',
    withdrawal_completed: 'info',
    withdrawal_failed: 'danger',
    payment_received: 'success',
    sweep_completed: 'primary',
    system_alert: 'warning',
  }
  return colorMap[type] || 'secondary'
}

export function formatNotificationTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  
  if (diff < minute) {
    return 'Just now'
  } else if (diff < hour) {
    const mins = Math.floor(diff / minute)
    return `${mins} min${mins > 1 ? 's' : ''} ago`
  } else if (diff < day) {
    const hours = Math.floor(diff / hour)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diff / day)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}
