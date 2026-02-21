import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
} from '../../api/notifications.ts'

export default function NotificationDropdown({ refreshRef }) {
  const { t } = useTranslation()
  const { token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

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
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) loadNotifications()
  }, [token, loadNotifications])

  // Expose refresh to parent via mutable ref
  useEffect(() => {
    if (refreshRef) refreshRef.current = loadNotifications
  }, [refreshRef, loadNotifications])

  async function handleMarkAsRead(notificationId) {
    try {
      await markAsRead([notificationId], token)
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead(token)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  return (
    <li className="nav-item dropdown-notifications navbar-dropdown dropdown me-3 me-xl-0">
      <a className="nav-link dropdown-toggle hide-arrow" href="#" onClick={(e) => e.preventDefault()} data-bs-toggle="dropdown">
        <span className="position-relative d-inline-block">
          <i className="icon-base bx bx-bell icon-md"></i>
          {unreadCount > 0 && <span className="badge-dot-notifications"></span>}
        </span>
      </a>
      <ul className="dropdown-menu dropdown-menu-end p-0">
        <li className="dropdown-menu-header border-bottom">
          <div className="dropdown-header d-flex align-items-center py-3">
            <h6 className="mb-0 me-auto">
              {t('notifications.title', { defaultValue: 'Notifications' })}
              {unreadCount > 0 && <span className="badge bg-primary ms-2">{unreadCount}</span>}
            </h6>
            <div className="dropdown-notifications-actions">
              <a
                href="#"
                className="dropdown-notifications-read"
                onClick={(e) => { e.preventDefault(); handleMarkAllAsRead() }}
                title={t('notifications.markAllRead', { defaultValue: 'Mark all as read' })}
              >
                <i className="bx bx-check-double"></i>
              </a>
            </div>
          </div>
        </li>
        <li className="dropdown-notifications-list scrollable-container">
          {loading ? (
            <div className="d-flex align-items-center justify-content-center py-4" style={{ minHeight: '150px' }}>
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-4 text-muted w-100" style={{ minHeight: '150px' }}>
              <i className="bx bx-bell-off mb-2" style={{ fontSize: '2rem' }}></i>
              <small>{t('notifications.noNotifications', { defaultValue: 'No notifications' })}</small>
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`list-group-item list-group-item-action dropdown-notifications-item ${notif.isRead ? '' : 'unread'}`}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                  style={{ cursor: notif.isRead ? 'default' : 'pointer' }}
                >
                  <div className="d-flex position-relative">
                    <div className="flex-shrink-0 me-3">
                      <div className="avatar">
                        <span className={`avatar-initial rounded-circle bg-label-${getNotificationColor(notif.type)}`}>
                          <i className={`bx ${getNotificationIcon(notif.type)}`}></i>
                        </span>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="small mb-0">{notif.title}</h6>
                      <small className="mb-1 d-block text-body">{notif.message}</small>
                      <small className="text-muted" style={{ opacity: 0.5, fontSize: '0.75rem' }}>{formatNotificationTime(notif.createdAt)}</small>
                    </div>
                    {!notif.isRead && (
                      <div className="position-absolute" style={{ top: '50%', right: '16px', transform: 'translateY(-50%)' }}>
                        <span style={unreadDotStyle}></span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </li>
        <li className="dropdown-menu-footer border-top">
          <a href="#" className="dropdown-item d-flex justify-content-center text-primary p-2 h-px-40 mb-1 align-items-center" onClick={(e) => { e.preventDefault(); loadNotifications() }}>
            <i className="bx bx-refresh me-2"></i>
            {t('notifications.refresh', { defaultValue: 'Refresh' })}
          </a>
        </li>
      </ul>
    </li>
  )
}

const unreadDotStyle = {
  display: 'inline-block',
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: '#5f61e6',
}
