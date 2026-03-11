import { statusMeta } from '@/components/merchant/merchantHelpers'
import StatTile from '@/components/merchant/StatTile'
import RefreshButton from '@/components/RefreshButton'
import { formatCommission } from '@/lib/utils/format'

export default function MerchantProfileHero({ merchant, loading, onRefresh, fmtDate, t }) {
  const status = String(merchant?.status || '').toLowerCase()
  const sMeta = statusMeta(merchant?.status, t)

  return (
    <div className="bg-card rounded-xl shadow-sm dark:shadow-card-dark border border-surface-200 mb-5 overflow-hidden">
      <div className="p-5 pb-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Avatar */}
          <div className="flex items-center justify-center w-20 h-20 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-950/40 dark:to-primary-950/20 shrink-0">
            <i className="bx bx-store text-[2.5rem] text-primary-600 dark:text-primary-400"></i>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-lg font-semibold text-surface-900 truncate mb-0">{merchant?.name || '-'}</h4>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md ${sMeta.bg} ${sMeta.text}`}
              >
                <i className={`bx ${sMeta.icon}`}></i>
                {sMeta.label.toUpperCase()}
              </span>
              <div className="ml-auto">
                <RefreshButton
                  onClick={onRefresh}
                  loading={loading}
                  title={t('actions.refresh', { defaultValue: 'Refresh' })}
                />
              </div>
            </div>
            {merchant?.description && (
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-2 pr-4">{merchant.description}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-surface-400 dark:text-surface-500">
              {merchant?.email && (
                <span className="flex items-center gap-1">
                  <i className="bx bx-envelope"></i>
                  {merchant.email}
                </span>
              )}
              {merchant?.websiteUrl && (
                <a
                  href={merchant.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 no-underline transition-colors"
                >
                  <i className="bx bx-globe"></i>
                  {merchant.websiteUrl}
                </a>
              )}
              <span className="flex items-center gap-1">
                <i className="bx bx-calendar"></i>
                {t('merchant.createdAt', { defaultValue: 'Registered' })}: {fmtDate(merchant?.createdAt)}
              </span>
            </div>

            {status === 'pending' && (
              <div className="flex items-center gap-2 mt-3 p-2.5 bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 rounded-lg text-sm text-warning-700 dark:text-warning-400">
                <i className="bx bx-time-five"></i>
                {t('merchant.pendingNotice', { defaultValue: 'Your merchant account is pending approval.' })}
              </div>
            )}
            {status === 'suspended' && (
              <div className="flex items-center gap-2 mt-3 p-2.5 bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800 rounded-lg text-sm text-danger-700 dark:text-danger-400">
                <i className="bx bx-block"></i>
                {t('merchant.suspendedNotice', { defaultValue: 'Your merchant account is suspended.' })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Stats strip */}
      <div className="border-t border-surface-200 px-5 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile
            icon={sMeta.icon}
            label={t('common.status', { defaultValue: 'Status' })}
            value={sMeta.label}
            color={status === 'active' ? 'success' : status === 'suspended' ? 'danger' : 'warning'}
          />
          <StatTile
            icon="bx-trending-up"
            label={t('merchant.commissionRate', { defaultValue: 'Commission' })}
            value={merchant?.commissionRate != null ? formatCommission(merchant.commissionRate) : '-'}
            color="primary"
          />
          <StatTile
            icon="bx-calendar-check"
            label={t('merchant.since', { defaultValue: 'Since' })}
            value={fmtDate(merchant?.createdAt)}
            color="info"
          />
          <StatTile
            icon="bx-broadcast"
            label={t('merchant.webhookTitle', { defaultValue: 'Webhook' })}
            value={
              merchant?.hasWebhook
                ? t('merchant.configured', { defaultValue: 'Configured' })
                : t('merchant.notConfigured', { defaultValue: 'Not Configured' })
            }
            color={merchant?.hasWebhook ? 'success' : 'secondary'}
          />
        </div>
      </div>
    </div>
  )
}
