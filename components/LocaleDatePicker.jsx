'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { inputClass } from './ui'

/** Get today's YYYY-MM-DD in a given IANA timezone */
function todayInTz(tz) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(new Date())
    .reduce((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value
      return acc
    }, {})
  return `${parts.year}-${parts.month}-${parts.day}`
}

/**
 * A locale-aware, timezone-aware date picker.
 *
 * Props:
 *  - value: string (YYYY-MM-DD)
 *  - onChange: (dateStr: string) => void
 *  - locale: string (e.g. 'th-TH', 'en-US', 'zh-CN')
 *  - timezone: string (IANA e.g. 'Asia/Bangkok') — used for "today" highlight
 *  - placeholder: string
 *  - className: string (applied to the wrapper)
 *  - t: i18next translate function (optional, for Clear/Today labels)
 *  - minDate / maxDate: string (YYYY-MM-DD)
 */
export default function LocaleDatePicker({
  value,
  onChange,
  locale = 'en-US',
  timezone,
  placeholder = '',
  className = '',
  compact = false,
  t,
  minDate,
  maxDate,
}) {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    if (value) return new Date(`${value}T00:00:00`).getFullYear()
    return new Date().getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return new Date(`${value}T00:00:00`).getMonth()
    return new Date().getMonth()
  })
  const wrapperRef = useRef(null)
  const [alignRight, setAlignRight] = useState(false)

  useClickOutside(wrapperRef, () => setOpen(false), open)

  // Check if dropdown would overflow viewport and flip alignment
  useEffect(() => {
    if (!open || !wrapperRef.current) return
    const rect = wrapperRef.current.getBoundingClientRect()
    const dropdownWidth = 280
    const willOverflow = rect.left + dropdownWidth > window.innerWidth - 16
    setAlignRight(willOverflow)
  }, [open])

  // Sync view to value when it changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(`${value}T00:00:00`)
      queueMicrotask(() => {
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
      })
    }
  }, [value])

  // Locale-aware formatting
  const monthYearLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1)
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  }, [viewYear, viewMonth, locale])

  const weekDayHeaders = useMemo(() => {
    const headers = []
    for (let i = 1; i <= 7; i++) {
      const d = new Date(2025, 0, 5 + i) // Jan 6 2025 = Monday
      headers.push(d.toLocaleDateString(locale, { weekday: 'narrow' }))
    }
    return headers
  }, [locale])

  const displayValue = useMemo(() => {
    if (!value) return ''
    const d = new Date(`${value}T00:00:00`)
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  }, [value, locale])

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6

    const days = []
    const prevMonthLast = new Date(viewYear, viewMonth, 0).getDate()
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({ day: prevMonthLast - i, current: false, date: null })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(viewMonth + 1).padStart(2, '0')
      const dd = String(d).padStart(2, '0')
      days.push({ day: d, current: true, date: `${viewYear}-${mm}-${dd}` })
    }
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ day: i, current: false, date: null })
      }
    }
    return days
  }, [viewYear, viewMonth])

  const todayStr = useMemo(() => todayInTz(tz), [tz])

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }
  function selectDate(dateStr) {
    onChange(dateStr)
    setOpen(false)
  }
  function handleClear() {
    onChange('')
    setOpen(false)
  }
  function handleToday() {
    onChange(todayStr)
    const [y, m] = todayStr.split('-').map(Number)
    setViewYear(y)
    setViewMonth(m - 1)
    setOpen(false)
  }

  const clearLabel = t ? t('datePicker.clear', { defaultValue: 'Clear' }) : 'Clear'
  const todayLabel = t ? t('datePicker.today', { defaultValue: 'Today' }) : 'Today'

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div
        className={`${compact ? 'px-2.5 py-1.5 text-[13px] rounded-lg border border-surface-300 bg-surface-50 dark:bg-white/[0.04] dark:border-surface-200 transition-[border-color,box-shadow] cursor-pointer' : inputClass()} flex items-center gap-1 cursor-pointer ${compact ? 'min-w-[110px]' : 'min-w-[130px]'} select-none`}
        onClick={() => setOpen(!open)}
      >
        <span className={`flex-1 ${displayValue ? '' : 'text-surface-400'}`}>{displayValue || placeholder}</span>
        <i className={`bx bx-calendar ${compact ? 'text-sm' : 'text-base'} opacity-50`}></i>
      </div>

      {/* Calendar dropdown */}
      {open && (
        <div
          className={`absolute top-full z-50 mt-1 w-[min(280px,calc(100vw-2rem))] rounded-lg border border-surface-200 bg-card p-3 shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:bg-dark-elevated dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] ${alignRight ? 'right-0' : 'left-0'}`}
        >
          {/* Header: prev / month-year / next */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="flex items-center justify-center w-7 h-7 rounded text-surface-600 hover:bg-surface-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
            >
              <i className="bx bx-chevron-left text-xl"></i>
            </button>
            <span className="font-semibold text-sm text-surface-900">{monthYearLabel}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex items-center justify-center w-7 h-7 rounded text-surface-600 hover:bg-surface-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
            >
              <i className="bx bx-chevron-right text-xl"></i>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center mb-1">
            {weekDayHeaders.map((h) => (
              <div key={h} className="text-xs font-semibold text-surface-500 py-0.5">
                {h}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 text-center">
            {calendarDays.map((item, i) => {
              const isSelected = item.date === value
              const isToday = item.date === todayStr
              const isDisabled =
                item.current && item.date && ((minDate && item.date < minDate) || (maxDate && item.date > maxDate))
              const isClickable = item.current && item.date && !isDisabled

              let cls = 'py-1.5 px-0.5 rounded-md text-[0.85rem] transition-colors '
              if (isSelected) {
                cls += 'bg-primary-600 text-white font-semibold '
              } else if (!item.current || isDisabled) {
                cls += 'text-surface-300 '
              } else if (isToday) {
                cls +=
                  'text-primary-600 dark:text-primary-400 font-semibold hover:bg-surface-100 dark:hover:bg-white/8 '
              } else {
                cls += 'text-surface-900 hover:bg-surface-100 dark:hover:bg-white/8 '
              }
              if (isClickable) cls += 'cursor-pointer '

              return (
                <div
                  key={item.date || `empty-${i}`}
                  className={cls}
                  onClick={() => isClickable && selectDate(item.date)}
                >
                  {item.day}
                </div>
              )
            })}
          </div>

          {/* Footer: Clear / Today */}
          <div className="flex justify-between mt-2 pt-2 border-t border-surface-200">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-surface-500 hover:text-surface-700 transition-colors cursor-pointer"
            >
              {clearLabel}
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors cursor-pointer"
            >
              {todayLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
