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
  transition: 'transform 0.2s, box-shadow 0.2s',
}

function handleMouseEnter(e) {
  e.currentTarget.style.transform = 'translateY(-4px)'
  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)'
}

function handleMouseLeave(e) {
  e.currentTarget.style.transform = 'translateY(0)'
  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
}

export function StatCard({ icon, color, value, label }) {
  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-3">
      <Card style={cardStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="h-full">
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
      style={{
        borderRadius: '0.75rem',
        backgroundColor: isToday ? 'var(--color-primary-600)' : 'var(--color-surface-200)',
        color: isToday ? 'white' : 'inherit',
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <span
          className="text-sm font-medium"
          style={{ color: isToday ? 'rgba(255,255,255,0.9)' : 'var(--color-surface-900)' }}
        >
          {date}
        </span>
        <span
          className="text-2xs py-[0.125rem] px-[0.5rem]"
          style={{
            borderRadius: '1rem',
            backgroundColor: isToday ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-300)',
          }}
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
            <span className="w-2/5" style={{ color: isToday ? 'rgba(255,255,255,0.95)' : 'var(--color-surface-900)' }}>
              {currency}
            </span>
            <span
              className="w-1/4 text-center"
              style={{ color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--color-surface-500)' }}
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
