'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function CountdownTimer({ expiryAt, expiresAt, onExpired }) {
  const { t } = useTranslation()
  const expiry = expiryAt || expiresAt
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    if (!expiry) return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiryTime = new Date(expiry).getTime()
      const diff = expiryTime - now

      if (diff <= 0) {
        return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      return { expired: false, days, hours, minutes, seconds }
    }

    const interval = setInterval(() => {
      const tl = calculateTimeLeft()
      setTimeLeft(tl)
      if (tl.expired) {
        clearInterval(interval)
        onExpired?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiry, onExpired])

  if (!timeLeft) return null

  if (timeLeft.expired) {
    return (
      <div className="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950/30 p-4">
        <div className="flex items-center mb-2">
          <i className="bx bx-time-five text-xl mr-2 text-danger-600 dark:text-danger-400"></i>
          <div className="font-medium text-danger-700 dark:text-danger-400">{t('payment.expired') || 'Expired'}</div>
        </div>
        <small className="text-danger-600 dark:text-danger-400">
          {t('payment.expiredMessage') || 'This invoice has expired'}
        </small>
      </div>
    )
  }

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="rounded-lg border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-950/30 p-4">
      <div className="flex items-center mb-2">
        <i className="bx bx-time-five text-xl mr-2 text-warning-600 dark:text-warning-400"></i>
        <div className="font-medium text-warning-700 dark:text-warning-400">
          {t('payment.timeRemaining') || 'Time Remaining'}
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold text-warning-800 dark:text-warning-300">{pad(timeLeft.days)}</div>
            <small className="text-surface-500">{t('time.days') || 'Days'}</small>
          </div>
        )}
        <div className="text-center">
          <div className="text-2xl font-bold text-warning-800 dark:text-warning-300">{pad(timeLeft.hours)}</div>
          <small className="text-surface-500">{t('time.hours') || 'Hours'}</small>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning-800 dark:text-warning-300">{pad(timeLeft.minutes)}</div>
          <small className="text-surface-500">{t('time.minutes') || 'Minutes'}</small>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning-800 dark:text-warning-300">{pad(timeLeft.seconds)}</div>
          <small className="text-surface-500">{t('time.seconds') || 'Seconds'}</small>
        </div>
      </div>
    </div>
  )
}
