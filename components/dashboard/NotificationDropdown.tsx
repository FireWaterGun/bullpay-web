'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
} from '@/lib/api/notifications'
import { logger } from '@/lib/utils/logger'
import Spinner from '@/components/ui/Spinner'

interface NotificationDropdownProps {
  refreshRef: React.MutableRefObject<(() => void) | null>
}

const colorMap: Record<string, string> = {
  primary: 'bg-primary-100 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400',
  success: 'bg-success-100 dark:bg-success-950/30 text-success-600 dark:text-success-400',
  danger: 'bg-danger-100 dark:bg-danger-950/30 text-danger-600 dark:text-danger-400',
  warning: 'bg-warning-100 dark:bg-warning-950/30 text-warning-600 dark:text-warning-400',
  info: 'bg-info-100 dark:bg-info-950/30 text-info-600 dark:text-info-400',
  secondary: 'bg-surface-100 dark:bg-dark-elevated text-surface-600',
}

export default function NotificationDropdown({ refreshRef }: NotificationDropdownProps) {
  const { t } = useTranslation()
  const { token } = useAuth()

  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Click outside to close
  useClickOutside(ref, () => setOpen(false), open)

  const loadNotifications = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const [notifData, count] = await Promise.all([
        getNotifications({ limit: 10, includeRead: false }, token),
        getUnreadCount(token),
      ])
      setNotifications(notifData.items || [])
      setUnreadCount(count)
    } catch (error) {
      logger.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) loadNotifications()
  }, [token, loadNotifications])

  useEffect(() => {
    if (refreshRef) refreshRef.current = loadNotifications
  }, [refreshRef, loadNotifications])

  async function handleMarkAsRead(notificationId: number) {
    try {
      await markAsRead([String(notificationId)], token!)
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      logger.error('Failed to mark notification as read:', error)
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead(token!)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      logger.error('Failed to mark all as read:', error)
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
        title="Notifications"
      >
        <i className="bx bx-bell text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-danger-500 rounded-full border-2 border-card"></span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="fixed inset-x-3 top-[72px] z-50 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-1 sm:w-[360px] bg-raised border border-surface-200 rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
            <h6 className="text-sm font-semibold text-surface-900">
              {t('notifications.title', { defaultValue: 'Notifications' })}
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-primary-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h6>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
              title={t('notifications.markAllRead', { defaultValue: 'Mark all as read' })}
            >
              <i className="bx bx-check-double text-lg"></i>
            </button>
          </div>

          {/* List */}
          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="text-primary-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-surface-400">
                <i className="bx bx-bell-off text-3xl mb-2"></i>
                <span className="text-sm">
                  {t('notifications.noNotifications', { defaultValue: 'No notifications' })}
                </span>
              </div>
            ) : (
              <ul>
                {notifications.map((notif) => {
                  const color = colorMap[getNotificationColor(notif.type)] || colorMap.secondary
                  return (
                    <li
                      key={notif.id}
                      className={`px-4 py-3 cursor-pointer transition-colors border-l-[3px] ${
                        notif.isRead
                          ? 'border-l-transparent hover:bg-surface-50 dark:hover:bg-white/6'
                          : 'border-l-primary-500 bg-primary-50/30 dark:bg-primary-500/10 hover:bg-primary-50/50 dark:hover:bg-primary-500/15 font-medium'
                      }`}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0">
                          <span className={`flex items-center justify-center w-9 h-9 rounded-full text-sm ${color}`}>
                            <i className={`bx ${getNotificationIcon(notif.type)}`}></i>
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-surface-900 truncate">{notif.title}</p>
                          <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-surface-400 mt-1">{formatNotificationTime(notif.createdAt)}</p>
                        </div>
                        {!notif.isRead && (
                          <span className="shrink-0 mt-2 w-2.5 h-2.5 bg-primary-500 rounded-full"></span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-surface-200">
            <button
              type="button"
              onClick={loadNotifications}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-surface-50 dark:hover:bg-white/6 transition-colors cursor-pointer rounded-b-lg"
            >
              <i className="bx bx-refresh"></i>
              {t('notifications.refresh', { defaultValue: 'Refresh' })}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
