'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { inputClass } from './ui'

/**
 * A locale-aware date + time picker that combines calendar and time in one dropdown.
 * Renders a styled input trigger with a calendar + time selectors.
 *
 * Props:
 *  - value: string (ISO 8601 or YYYY-MM-DDTHH:mm) — empty string = no selection
 *  - onChange: (isoStr: string) => void  — '' when cleared
 *  - locale: string (e.g. 'th-TH', 'en-US', 'zh-CN')
 *  - placeholder: string
 *  - className: string (applied to the wrapper)
 *  - t: i18next translate function (optional, for Clear/Now labels)
 *  - minDate / maxDate: string (YYYY-MM-DD) — date-level constraints
 */
export default function LocaleDateTimePicker({
  value,
  onChange,
  locale = 'en-US',
  placeholder = '',
  className = '',
  t,
  minDate,
  maxDate,
}) {
  // Parse value into date and time parts
  const parsedDate = value ? value.slice(0, 10) : ''
  const parsedTime = value ? value.slice(11, 16) || '00:00' : '00:00'

  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(parsedDate)
  const [hour, setHour] = useState(() => (parsedTime ? parseInt(parsedTime.split(':')[0], 10) : 0))
  const [minute, setMinute] = useState(() => (parsedTime ? parseInt(parsedTime.split(':')[1], 10) : 0))
  const [viewYear, setViewYear] = useState(() => {
    if (parsedDate) return new Date(`${parsedDate}T00:00:00`).getFullYear()
    return new Date().getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (parsedDate) return new Date(`${parsedDate}T00:00:00`).getMonth()
    return new Date().getMonth()
  })
  const wrapperRef = useRef(null)
  const hourRef = useRef(null)
  const minuteRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Sync internal state when value prop changes externally
  useEffect(() => {
    const d = value ? value.slice(0, 10) : ''
    const tm = value ? value.slice(11, 16) || '00:00' : '00:00'
    queueMicrotask(() => {
      setSelectedDate(d)
      setHour(parseInt(tm.split(':')[0], 10))
      setMinute(parseInt(tm.split(':')[1], 10))
      if (d) {
        const dt = new Date(`${d}T00:00:00`)
        setViewYear(dt.getFullYear())
        setViewMonth(dt.getMonth())
      }
    })
  }, [value])

  // Scroll hour/minute lists to selection when dropdown opens
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      hourRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center' })
      minuteRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center' })
    })
  }, [open])

  // Emit combined ISO string
  const emit = useCallback(
    (date, h, m) => {
      if (!date) {
        onChange('')
        return
      }
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      onChange(new Date(`${date}T${hh}:${mm}`).toISOString())
    },
    [onChange]
  )

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
    if (!selectedDate) return ''
    const d = new Date(`${selectedDate}T00:00:00`)
    const datePart = d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
    const hh = String(hour).padStart(2, '0')
    const mm = String(minute).padStart(2, '0')
    return `${datePart}  ${hh}:${mm}`
  }, [selectedDate, hour, minute, locale])

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

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

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
    setSelectedDate(dateStr)
    emit(dateStr, hour, minute)
  }
  function selectHour(h) {
    setHour(h)
    if (selectedDate) emit(selectedDate, h, minute)
  }
  function selectMinute(m) {
    setMinute(m)
    if (selectedDate) emit(selectedDate, hour, m)
  }
  function handleClear() {
    setSelectedDate('')
    setHour(0)
    setMinute(0)
    onChange('')
    setOpen(false)
  }
  function handleNow() {
    const now = new Date()
    const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const h = now.getHours()
    const m = now.getMinutes()
    setSelectedDate(d)
    setHour(h)
    setMinute(m)
    setViewYear(now.getFullYear())
    setViewMonth(now.getMonth())
    emit(d, h, m)
    setOpen(false)
  }
  function handleConfirm() {
    if (selectedDate) emit(selectedDate, hour, minute)
    setOpen(false)
  }

  const clearLabel = t ? t('datePicker.clear', { defaultValue: 'Clear' }) : 'Clear'
  const nowLabel = t ? t('datePicker.now', { defaultValue: 'Now' }) : 'Now'
  const confirmLabel = t ? t('datePicker.confirm', { defaultValue: 'OK' }) : 'OK'

  // Generate hour/minute arrays
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div
        className={`${inputClass()} flex items-center gap-1 cursor-pointer min-w-[130px] select-none`}
        onClick={() => setOpen(!open)}
      >
        <span className={`flex-1 ${displayValue ? '' : 'text-surface-400'}`}>{displayValue || placeholder}</span>
        <i className="bx bx-calendar text-base opacity-50"></i>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[min(360px,calc(100vw-2rem))] rounded-lg border border-surface-200 bg-card p-3 shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:bg-dark-elevated dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          {/* Calendar Section */}
          <div>
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
              {weekDayHeaders.map((h, i) => (
                <div key={i} className="text-xs font-semibold text-surface-500 py-0.5">
                  {h}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 text-center">
              {calendarDays.map((item, i) => {
                const isSelected = item.date === selectedDate
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
          </div>

          {/* Time Section */}
          <div className="mt-2 pt-2 border-t border-surface-200">
            <div className="flex items-center gap-2">
              <i className="bx bx-time text-surface-500 text-base"></i>
              <span className="text-xs font-semibold text-surface-600">
                {t ? t('datePicker.time', { defaultValue: 'Time' }) : 'Time'}
              </span>
              <div className="flex-1 flex items-center gap-1 justify-end">
                {/* Hour scroller */}
                <div
                  ref={hourRef}
                  className="h-[96px] w-[48px] overflow-y-auto rounded border border-surface-200 dark:border-surface-600 scrollbar-thin"
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      data-selected={h === hour}
                      onClick={() => selectHour(h)}
                      className={`text-center text-sm py-1 cursor-pointer transition-colors ${
                        h === hour
                          ? 'bg-primary-600 text-white font-semibold'
                          : 'text-surface-700 hover:bg-surface-100 dark:hover:bg-white/8'
                      }`}
                    >
                      {String(h).padStart(2, '0')}
                    </div>
                  ))}
                </div>
                <span className="text-surface-500 font-bold text-lg">:</span>
                {/* Minute scroller */}
                <div
                  ref={minuteRef}
                  className="h-[96px] w-[48px] overflow-y-auto rounded border border-surface-200 dark:border-surface-600 scrollbar-thin"
                >
                  {minutes.map((m) => (
                    <div
                      key={m}
                      data-selected={m === minute}
                      onClick={() => selectMinute(m)}
                      className={`text-center text-sm py-1 cursor-pointer transition-colors ${
                        m === minute
                          ? 'bg-primary-600 text-white font-semibold'
                          : 'text-surface-700 hover:bg-surface-100 dark:hover:bg-white/8'
                      }`}
                    >
                      {String(m).padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer: Clear / Now / OK */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-200">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-surface-500 hover:text-surface-700 transition-colors cursor-pointer"
            >
              {clearLabel}
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleNow}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors cursor-pointer"
              >
                {nowLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="text-xs px-3 py-1 rounded bg-primary-600 text-white hover:bg-primary-700 transition-colors cursor-pointer font-medium"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
