'use client'

import { formatCoinAmount } from '@/lib/utils/format'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import Card from '../ui/Card'

const COLOR_MAP = {
  primary: { rgb: '59, 130, 246', var: 'var(--color-primary-600)' },
  success: { rgb: '34, 197, 94', var: 'var(--color-green-500)' },
  info: { rgb: '6, 182, 212', var: 'var(--color-cyan-500)' },
  warning: { rgb: '245, 158, 11', var: 'var(--color-amber-500)' },
  danger: { rgb: '239, 68, 68', var: 'var(--color-red-500)' },
}

const cardStyle = {
  borderRadius: '0.75rem',
  border: 'none',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
}

const TREND_STYLES = {
  today: {
    borderRadius: '0.75rem',
    backgroundColor: 'var(--color-primary-600)',
    color: 'white',
  },
  normal: {
    borderRadius: '0.75rem',
    backgroundColor: 'var(--color-surface-200)',
    color: 'inherit',
  },
  dateToday: { color: 'rgba(255,255,255,0.9)' },
  dateNormal: { color: 'var(--color-surface-900)' },
  badgeToday: { borderRadius: '1rem', backgroundColor: 'rgba(255,255,255,0.2)' },
  badgeNormal: { borderRadius: '1rem', backgroundColor: 'var(--color-surface-300)' },
  currencyToday: { color: 'rgba(255,255,255,0.95)' },
  currencyNormal: { color: 'var(--color-surface-900)' },
  countToday: { color: 'rgba(255,255,255,0.8)' },
  countNormal: { color: 'var(--color-surface-500)' },
}

export function StatCard({ icon, color, value, label }) {
  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-3">
      <Card style={cardStyle} className="h-full transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.12)]">
        <div className="p-5">
          <div className="flex items-center mb-3">
            <div
              className="w-12 h-12 flex items-center justify-center"
              style={{
                borderRadius: '0.75rem',
                backgroundColor: `rgba(${(COLOR_MAP[color] || COLOR_MAP.primary).rgb}, 0.08)`,
              }}
            >
              <i className={`bx ${icon} text-2xl`} style={{ color: (COLOR_MAP[color] || COLOR_MAP.primary).var }}></i>
            </div>
          </div>
          <h4 className="mb-1 font-bold text-3xl">{value}</h4>
          <p className="text-surface-500 mb-0 text-[0.875rem] font-medium">{label}</p>
        </div>
      </Card>
    </div>
  )
}

export function DailyTrendCard({ date, currencies, isToday }) {
  const { t } = useAdminTranslation()
  const totalTxn = Object.values(currencies).reduce((sum, d) => sum + d.count, 0)
  return (
    <div
      className="min-w-[280px] p-[1.25rem] shrink-0"
      style={isToday ? TREND_STYLES.today : TREND_STYLES.normal}
    >
      <div className="flex justify-between items-center mb-2">
        <span
          className="text-sm font-medium"
          style={isToday ? TREND_STYLES.dateToday : TREND_STYLES.dateNormal}
        >
          {date}
        </span>
        <span
          className="text-2xs py-[0.125rem] px-[0.5rem]"
          style={isToday ? TREND_STYLES.badgeToday : TREND_STYLES.badgeNormal}
        >
          {totalTxn}
        </span>
      </div>
      <div className="mt-2">
        <div className="flex justify-between mb-1 text-2xs opacity-70 uppercase tracking-[0.5px]">
          <span className="w-2/5">{t('admin.detail.coin', { defaultValue: 'Coin' })}</span>
          <span className="w-1/4 text-center">{t('admin.dashboard.txn', { defaultValue: 'Txn' })}</span>
          <span className="w-[35%] text-right">{t('admin.dashboard.volume', { defaultValue: 'Volume' })}</span>
        </div>
        {Object.entries(currencies).map(([currency, data]) => (
          <div key={currency} className="flex justify-between items-center py-[0.25rem] px-[0] text-sm">
            <span className="w-2/5" style={isToday ? TREND_STYLES.currencyToday : TREND_STYLES.currencyNormal}>
              {currency}
            </span>
            <span
              className="w-1/4 text-center"
              style={isToday ? TREND_STYLES.countToday : TREND_STYLES.countNormal}
            >
              {data.count}
            </span>
            <span className="w-[35%] text-right font-medium">{formatCoinAmount(data.volume, 4)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
