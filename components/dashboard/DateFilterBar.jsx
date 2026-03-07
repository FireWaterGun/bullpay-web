'use client'

import { useState, useMemo } from 'react'
import LocaleDatePicker from '@/components/LocaleDatePicker'
import { getDateRange } from '@/lib/utils/dateRange'

/**
 * DateFilterBar — Unified date-range preset / custom picker used in dashboards.
 *
 * Renders a compact, themed filter strip with:
 *   • Preset quick-select buttons (chips)
 *   • A "Custom" toggle that reveals two LocaleDatePickers
 *   • A date-range label badge
 *
 * @param {string}  locale        - e.g. 'en-US', 'th-TH'
 * @param {Function} t            - i18n translation function
 * @param {string}  datePreset    - current preset key
 * @param {Function} onPresetChange
 * @param {string}  customFrom
 * @param {Function} onCustomFromChange
 * @param {string}  customTo
 * @param {Function} onCustomToChange
 * @param {boolean} showCustom
 * @param {Function} onShowCustomChange
 */
export default function DateFilterBar({
  locale = 'en-US',
  t,
  datePreset,
  onPresetChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  showCustom,
  onShowCustomChange,
}) {
  const presets = useMemo(
    () => [
      { key: 'today', label: t('filter.today', { defaultValue: 'Today' }) },
      { key: 'yesterday', label: t('filter.yesterday', { defaultValue: 'Yesterday' }) },
      { key: 'last7days', label: t('filter.last7days', { defaultValue: '7D' }) },
      { key: 'thisMonth', label: t('filter.thisMonth', { defaultValue: 'This Month' }) },
      { key: 'lastMonth', label: t('filter.lastMonth', { defaultValue: 'Last Month' }) },
    ],
    [t]
  )

  const dateRange = useMemo(() => {
    if (showCustom && customFrom && customTo) {
      return { from: customFrom, to: customTo }
    }
    return getDateRange(datePreset)
  }, [datePreset, showCustom, customFrom, customTo])

  const dateRangeLabel = useMemo(() => {
    const { from, to } = dateRange
    if (from === to) return from
    const fromDate = new Date(`${from}T00:00:00`)
    const toDate = new Date(`${to}T00:00:00`)
    const fmt = (d) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    return `${fmt(fromDate)} – ${fmt(toDate)}`
  }, [dateRange, locale])

  const handlePreset = (key) => {
    if (showCustom) {
      onShowCustomChange(false)
      onCustomFromChange('')
      onCustomToChange('')
    }
    onPresetChange(key)
  }

  const handleCustomToggle = () => {
    onShowCustomChange(true)
  }

  const handleReset = () => {
    onShowCustomChange(false)
    onCustomFromChange('')
    onCustomToChange('')
  }

  const chipBase =
    'px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-all duration-150 whitespace-nowrap select-none border'

  const chipActive =
    'bg-primary-600 text-white border-primary-600 shadow-sm dark:bg-primary-500 dark:border-primary-500'

  const chipInactive =
    'bg-card text-surface-600 border-surface-200 hover:bg-surface-50 hover:border-surface-300 ' +
    'dark:bg-dark-elevated dark:border-surface-200 dark:hover:bg-white/6 dark:hover:border-surface-300'

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* Preset chips row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {!showCustom &&
          presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePreset(p.key)}
              className={`${chipBase} ${datePreset === p.key ? chipActive : chipInactive}`}
            >
              {p.label}
            </button>
          ))}

        {!showCustom && (
          <button
            type="button"
            onClick={handleCustomToggle}
            className={`${chipBase} ${chipInactive} inline-flex items-center gap-1`}
          >
            <i className="bx bx-calendar text-sm"></i>
            {t('filter.custom', { defaultValue: 'Custom' })}
          </button>
        )}

        {showCustom && (
          <div className="flex items-center gap-1.5">
            <LocaleDatePicker
              value={customFrom}
              onChange={onCustomFromChange}
              locale={locale}
              placeholder={t('filter.from', { defaultValue: 'From' })}
              t={t}
              maxDate={customTo || undefined}
              minDate={
                customTo
                  ? (() => {
                      const d = new Date(`${customTo}T00:00:00`)
                      d.setMonth(d.getMonth() - 2)
                      return d.toISOString().split('T')[0]
                    })()
                  : undefined
              }
            />
            <span className="text-surface-400 text-sm select-none">–</span>
            <LocaleDatePicker
              value={customTo}
              onChange={onCustomToChange}
              locale={locale}
              placeholder={t('filter.to', { defaultValue: 'To' })}
              t={t}
              minDate={customFrom || undefined}
              maxDate={
                customFrom
                  ? (() => {
                      const d = new Date(`${customFrom}T00:00:00`)
                      d.setMonth(d.getMonth() + 2)
                      return d.toISOString().split('T')[0]
                    })()
                  : undefined
              }
            />
            <button
              type="button"
              onClick={handleReset}
              className={`${chipBase} ${chipInactive} inline-flex items-center gap-1`}
            >
              <i className="bx bx-reset text-sm"></i>
              {t('filter.reset', { defaultValue: 'Reset' })}
            </button>
          </div>
        )}
      </div>

      {/* Date range badge */}
      <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-surface-500 bg-surface-50 dark:bg-dark-elevated border border-surface-200 px-2.5 py-1 rounded-md select-none">
        <i className="bx bx-calendar-check text-sm"></i>
        {dateRangeLabel}
      </span>
    </div>
  )
}
