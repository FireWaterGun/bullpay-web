'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import LocaleDatePicker from '@/components/LocaleDatePicker'
import { getDateRange } from '@/lib/utils/dateRange'

/**
 * DateFilterBar — Unified date-range preset / custom picker used in dashboards.
 *
 * Renders a compact, themed filter strip with:
 *   • A date-range label badge
 *   • A dropdown preset selector
 *   • A "Custom" toggle that reveals two LocaleDatePickers
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
  timezone,
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
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const presets = useMemo(
    () => [
      { key: 'today', label: t('filter.today', { defaultValue: 'Today' }) },
      { key: 'yesterday', label: t('filter.yesterday', { defaultValue: 'Yesterday' }) },
      { key: 'last7days', label: t('filter.last7days', { defaultValue: 'Last 7 Days' }) },
      { key: 'last30days', label: t('filter.last30days', { defaultValue: 'Last 30 Days' }) },
      { key: 'thisMonth', label: t('filter.thisMonth', { defaultValue: 'This Month' }) },
      { key: 'lastMonth', label: t('filter.lastMonth', { defaultValue: 'Last Month' }) },
    ],
    [t]
  )

  const activePreset = presets.find((p) => p.key === datePreset)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

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
    setDropdownOpen(false)
  }

  const handleCustomToggle = () => {
    onShowCustomChange(true)
    setDropdownOpen(false)
  }

  const handleReset = () => {
    onShowCustomChange(false)
    onCustomFromChange('')
    onCustomToChange('')
  }

  const btnBase =
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg cursor-pointer transition-all duration-150 whitespace-nowrap select-none border'

  const btnStyle =
    'bg-card text-surface-600 border-surface-200 hover:bg-surface-50 hover:border-surface-300 ' +
    'dark:bg-dark-elevated dark:text-surface-700 dark:border-surface-200 dark:hover:bg-white/6 dark:hover:border-surface-300'

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* Date range badge */}
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-surface-500 bg-surface-50 dark:bg-dark-elevated border border-surface-200 px-3 py-1.5 rounded-lg select-none">
        <i className="bx bx-calendar-check text-sm text-surface-400"></i>
        {dateRangeLabel}
      </span>

      {!showCustom && (
        <>
          {/* Preset dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`${btnBase} ${btnStyle} min-w-[130px] justify-between`}
            >
              <span>{activePreset?.label || datePreset}</span>
              <i
                className={`bx bx-chevron-down text-base text-surface-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
              ></i>
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 min-w-[160px] bg-card dark:bg-dark-elevated border border-surface-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
                {presets.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePreset(p.key)}
                    className={`w-full text-left px-3 py-2 text-[13px] transition-colors ${
                      datePreset === p.key
                        ? 'bg-primary-50 text-primary-600 font-medium dark:bg-primary-500/10 dark:text-primary-400'
                        : 'text-surface-600 hover:bg-surface-50 dark:text-surface-700 dark:hover:bg-white/6'
                    }`}
                  >
                    {datePreset === p.key && <i className="bx bx-check mr-1.5"></i>}
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom button */}
          <button type="button" onClick={handleCustomToggle} className={`${btnBase} ${btnStyle}`}>
            <i className="bx bx-calendar text-sm"></i>
            {t('filter.custom', { defaultValue: 'Custom' })}
          </button>
        </>
      )}

      {showCustom && (
        <div className="flex items-center gap-1.5">
          <LocaleDatePicker
            value={customFrom}
            onChange={onCustomFromChange}
            locale={locale}
            timezone={timezone}
            compact
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
            timezone={timezone}
            compact
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
          <button type="button" onClick={handleReset} className={`${btnBase} ${btnStyle}`}>
            <i className="bx bx-reset text-sm"></i>
            {t('filter.reset', { defaultValue: 'Reset' })}
          </button>
        </div>
      )}
    </div>
  )
}
