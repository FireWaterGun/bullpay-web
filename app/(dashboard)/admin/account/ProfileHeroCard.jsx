'use client'

import { useState, useEffect } from 'react'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

/**
 * Profile sidebar card — vertical layout with avatar, info, and quick stats.
 */
export default function ProfileCard({ user, selectedTimezone, is2FAEnabled, twoFALoading, fmtDate, t }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const localTime = now.toLocaleString(undefined, {
    timeZone: selectedTimezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const localDate = now.toLocaleDateString(undefined, {
    timeZone: selectedTimezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card className="overflow-hidden">
      {/* Profile info — centered */}
      <div className="px-5 pt-6 pb-5 text-center">
        <div
          className="mx-auto mb-4 w-[5.5rem] h-[5.5rem] rounded-2xl flex items-center justify-center"
          style={{
            background:
              'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(59, 130, 246, 0.04) 100%)',
          }}
        >
          <i className="bx bx-user-circle text-[3rem] text-primary-500" />
        </div>
        <h5 className="mb-1 truncate">{user?.fullName || user?.email || '-'}</h5>
        {user?.email && (
          <p className="text-surface-500 text-sm mb-3 truncate">
            <i className="bx bx-envelope mr-1 align-middle" />
            {user.email}
          </p>
        )}
        <Badge color="primary" label>
          {t('admin.account.adminBadge', { defaultValue: 'Admin' })}
        </Badge>
      </div>

      {/* Divider */}
      <div className="border-t border-surface-200" />

      {/* Quick info rows */}
      <div className="px-5 py-4 space-y-3">
        <InfoRow
          icon="bx-check-shield"
          iconClass="bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-300"
          label={t('common.status', { defaultValue: 'Status' })}
          value={t('admin.account.statusActive', { defaultValue: 'Active' })}
        />
        <InfoRow
          icon="bx-crown"
          iconClass="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300"
          label={t('common.role', { defaultValue: 'Role' })}
          value={user?.role ? user.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-'}
        />
        <InfoRow
          icon={is2FAEnabled ? 'bx-lock-alt' : 'bx-lock-open-alt'}
          iconClass={
            is2FAEnabled
              ? 'bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-300'
              : 'bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-300'
          }
          label={t('admin.account.stats2FA', { defaultValue: '2FA' })}
          value={
            twoFALoading
              ? '...'
              : is2FAEnabled
                ? t('admin.account.twoFactorEnabled', { defaultValue: 'Enabled' })
                : t('admin.account.twoFactorDisabled', { defaultValue: 'Disabled' })
          }
        />
        <InfoRow
          icon="bx-globe"
          iconClass="bg-info-50 dark:bg-info-500/10 text-info-700 dark:text-info-300"
          label={t('settings.timezone.label', { defaultValue: 'Timezone' })}
          value={selectedTimezone.replace(/_/g, ' ')}
        />
        <InfoRow
          icon="bx-calendar"
          iconClass="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-300"
          label={t('admin.account.registeredDate', { defaultValue: 'Registered' })}
          value={user?.createdAt ? fmtDate(user.createdAt) : '-'}
        />
      </div>
    </Card>
  )
}

function InfoRow({ icon, iconClass, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center justify-center rounded shrink-0 w-9 h-9 ${iconClass}`}
      >
        <i className={`bx ${icon} text-lg`} />
      </span>
      <div className="min-w-0">
        <small className="text-surface-500 block leading-tight">{label}</small>
        <span className="font-medium text-sm truncate block">{value}</span>
      </div>
    </div>
  )
}
