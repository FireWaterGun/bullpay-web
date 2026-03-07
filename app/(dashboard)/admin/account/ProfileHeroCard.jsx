'use client'

import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

/**
 * Profile Hero — avatar, name, badges, stats strip.
 */
export default function ProfileHeroCard({ user, selectedTimezone, is2FAEnabled, twoFALoading, t }) {
  return (
    <Card className="mb-4 overflow-hidden">
      {/* Gradient accent bar */}

      <div className="p-4 pb-3">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Avatar */}
          <div
            className="flex items-center justify-center rounded-lg shrink-0 w-20 h-20"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(59, 130, 246, 0.04) 100%)',
            }}
          >
            <i className="bx bx-user-circle text-[2.5rem] text-primary-600" />
          </div>

          {/* Info */}
          <div className="grow min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="mb-0 truncate">{user?.fullName || user?.email || '-'}</h4>
              <Badge color="primary" label>
                {t('admin.account.adminBadge', { defaultValue: 'Admin' })}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-surface-500 text-sm mt-1">
              {user?.email && (
                <span>
                  <i className="bx bx-envelope mr-1" />
                  {user.email}
                </span>
              )}
              <span>
                <i className="bx bx-globe mr-1" />
                {selectedTimezone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="px-5 py-3 border-t border-surface-200 bg-transparent">
        <div className="grid grid-cols-12 gap-x-6 gap-3">
          <StatItem
            icon="bx-check-shield"
            bg="bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-300"
            label={t('common.status', { defaultValue: 'Status' })}
            value={t('admin.account.statusActive', { defaultValue: 'Active' })}
          />
          <StatItem
            icon={is2FAEnabled ? 'bx-lock-alt' : 'bx-lock-open-alt'}
            bg={
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
          <StatItem
            icon="bx-time-five"
            bg="bg-info-50 dark:bg-info-500/10 text-info-700 dark:text-info-300"
            label={t('admin.account.statsLocalTime', { defaultValue: 'Local Time' })}
            value={new Date().toLocaleString(undefined, {
              timeZone: selectedTimezone,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          />
          <StatItem
            icon="bx-calendar"
            bg="bg-primary-50 text-primary-600"
            label={t('admin.account.statsDate', { defaultValue: 'Date' })}
            value={new Date().toLocaleDateString(undefined, {
              timeZone: selectedTimezone,
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          />
        </div>
      </div>
    </Card>
  )
}

function StatItem({ icon, bg, label, value }) {
  return (
    <div className="col-span-6 sm:col-span-3">
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center justify-center rounded shrink-0 w-10 h-10 ${bg}`}>
          <i className={`bx ${icon} text-xl`} />
        </span>
        <div className="min-w-0">
          <div className="font-semibold truncate text-[0.9rem]">{value}</div>
          <small className="text-surface-500">{label}</small>
        </div>
      </div>
    </div>
  )
}
