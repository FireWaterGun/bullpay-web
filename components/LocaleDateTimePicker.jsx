'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { inputClass } from './ui'

/* ── Timezone helpers ── */

/** Decompose a Date (or ISO string) into { year, month, day, hour, minute } in the given IANA timezone. */
function decompose(date, tz) {
  const d = typeof date === 'string' ? new Date(date) : date
  if (!d || isNaN(d.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .formatToParts(d)
    .reduce((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value
      return acc
    }, {})
  return {
    year: Number(parts.year),
    month: Number(parts.month), // 1-12
    day: Number(parts.day),
    hour: Number(parts.hour === '24' ? 0 : parts.hour),
    minute: Number(parts.minute),
    dateStr: `${parts.year}-${parts.month}-${parts.day}`, // YYYY-MM-DD
  }
}

/** Build an ISO string from a YYYY-MM-DD date + hour + minute in the given timezone. */
function composeISO(dateStr, h, m, tz) {
  const y = Number(dateStr.slice(0, 4))
  const mo = Number(dateStr.slice(5, 7)) - 1
  const d = Number(dateStr.slice(8, 10))

  // 1. Treat the desired date+time as if it were UTC
  const guessUtc = Date.UTC(y, mo, d, h, m, 0)

  // 2. Format that UTC instant in the target timezone to see what it "looks like" there
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(new Date(guessUtc))
    .reduce((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value
      return acc
    }, {})

  const shownH = parts.hour === '24' ? 0 : Number(parts.hour)
  const shownUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    shownH,
    Number(parts.minute),
    0
  )

  // 3. The difference = timezone offset at this moment
  const offsetMs = shownUtc - guessUtc

  // 4. Real UTC = desired-as-utc minus offset
  return new Date(guessUtc - offsetMs).toISOString()
}

/**
 * A locale-aware, timezone-aware date + time picker.
 *
 * Props:
 *  - value: string (ISO 8601) — empty string = no selection
 *  - onChange: (isoStr: string) => void  — '' when cleared
 *  - locale: string (e.g. 'th-TH', 'en-US', 'zh-CN')
 *  - timezone: string (IANA e.g. 'Asia/Bangkok', 'UTC') — defaults to browser tz
 *  - placeholder: string
 *  - className: string (applied to the wrapper)
 *  - t: i18next translate function (optional, for Clear/Now labels)
 *  - minDate / maxDate: string (YYYY-MM-DD) — date-level constraints
 */
export default function LocaleDateTimePicker({
  value,
  onChange,
  locale = 'en-US',
  timezone,
  placeholder = '',
  className = '',
  t,
  minDate,
  maxDate,
}) {
  // Resolve timezone — fallback to browser default
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  // Parse value into date and time parts IN the user's timezone
  const parsed = useMemo(() => (value ? decompose(value, tz) : null), [value, tz])
  const parsedDateStr = parsed?.dateStr || ''
  const parsedHour = parsed?.hour ?? 0
  const parsedMinute = parsed?.minute ?? 0

  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(parsedDateStr)
  const [hour, setHour] = useState(() => parsedHour)
  const [minute, setMinute] = useState(() => parsedMinute)
  const [viewYear, setViewYear] = useState(() => parsed?.year ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => (parsed ? parsed.month - 1 : new Date().getMonth()))
  const wrapperRef = useRef(null)
  const hourRef = useRef(null)
  const minuteRef = useRef(null)

  useClickOutside(wrapperRef, () => setOpen(false), open)

  // Sync internal state when value prop changes externally
  useEffect(() => {
    const p = value ? decompose(value, tz) : null
    queueMicrotask(() => {
      setSelectedDate(p?.dateStr || '')
      setHour(p?.hour ?? 0)
      setMinute(p?.minute ?? 0)
      if (p) {
        setViewYear(p.year)
        setViewMonth(p.month - 1)
      }
    })
  }, [value, tz])

  // Scroll hour/minute lists to selection when dropdown opens
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      hourRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center' })
      minuteRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center' })
    })
  }, [open])

  // Emit combined ISO string (timezone-aware)
  const emit = useCallback(
    (date, h, m) => {
      if (!date) {
        onChange('')
        return
      }
      onChange(composeISO(date, h, m, tz))
    },
    [onChange, tz]
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
    // Short timezone label e.g. "ICT", "UTC"
    const tzLabel = new Intl.DateTimeFormat(locale, { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value
    return `${datePart}  ${hh}:${mm}${tzLabel ? ` (${tzLabel})` : ''}`
  }, [selectedDate, hour, minute, locale, tz])

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

  const nowInTz = useMemo(() => decompose(new Date(), tz), [tz])
  const todayStr = nowInTz ? nowInTz.dateStr : ''

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
    const now = decompose(new Date(), tz)
    if (!now) return
    setSelectedDate(now.dateStr)
    setHour(now.hour)
    setMinute(now.minute)
    setViewYear(now.year)
    setViewMonth(now.month - 1)
    emit(now.dateStr, now.hour, now.minute)
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
              {weekDayHeaders.map((h) => (
                <div key={h} className="text-xs font-semibold text-surface-500 py-0.5">
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
