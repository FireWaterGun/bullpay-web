'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { inputClass } from './ui'

/**
 * A locale-aware date RANGE picker (single input, pick from-to in one calendar).
 *
 * Props:
 *  - startDate / endDate: string (YYYY-MM-DD) or ''
 *  - onChangeStart / onChangeEnd: (dateStr: string) => void
 *  - locale: string (e.g. 'th-TH', 'en-US', 'zh-CN')
 *  - placeholder: string
 *  - className: string
 *  - t: i18next translate function (optional)
 *  - minDate / maxDate: string (YYYY-MM-DD)
 */
export default function LocaleDateRangePicker({
  startDate = '',
  endDate = '',
  onChangeStart,
  onChangeEnd,
  locale = 'en-US',
  placeholder = '',
  className = '',
  t,
  minDate,
  maxDate,
}) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    if (startDate) return new Date(`${startDate}T00:00:00`).getFullYear()
    return new Date().getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (startDate) return new Date(`${startDate}T00:00:00`).getMonth()
    return new Date().getMonth()
  })

  // Selection state: null = picking start, 'start' = start picked → picking end
  const [pickPhase, setPickPhase] = useState(null)
  const [tempStart, setTempStart] = useState(startDate)
  const [hoverDate, setHoverDate] = useState(null)

  const wrapperRef = useRef(null)

  useClickOutside(wrapperRef, () => {
    setOpen(false)
    setPickPhase(null)
    setHoverDate(null)
  }, open)

  // Sync view when props change externally
  useEffect(() => {
    if (startDate) {
      const d = new Date(`${startDate}T00:00:00`)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [startDate])

  // Reset temp on open
  useEffect(() => {
    if (open) {
      setTempStart(startDate)
      setPickPhase(null)
      setHoverDate(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Locale formatting
  const monthYearLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1)
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  }, [viewYear, viewMonth, locale])

  const weekDayHeaders = useMemo(() => {
    const headers = []
    for (let i = 1; i <= 7; i++) {
      const d = new Date(2025, 0, 5 + i)
      headers.push(d.toLocaleDateString(locale, { weekday: 'narrow' }))
    }
    return headers
  }, [locale])

  function fmtShort(dateStr) {
    if (!dateStr) return ''
    const d = new Date(`${dateStr}T00:00:00`)
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const displayValue = useMemo(() => {
    if (startDate && endDate) return `${fmtShort(startDate)}  —  ${fmtShort(endDate)}`
    if (startDate) return fmtShort(startDate)
    return ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, locale])

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

  function handleDayClick(dateStr) {
    if (!dateStr) return
    if (pickPhase === null || pickPhase === undefined) {
      setTempStart(dateStr)
      setPickPhase('start')
      setHoverDate(null)
    } else {
      let s = tempStart,
        e = dateStr
      if (s > e) [s, e] = [e, s]
      onChangeStart(s)
      onChangeEnd(e)
      setPickPhase(null)
      setHoverDate(null)
      setOpen(false)
    }
  }

  function handleClear() {
    onChangeStart('')
    onChangeEnd('')
    setPickPhase(null)
    setHoverDate(null)
    setOpen(false)
  }

  function handleToday() {
    onChangeStart(todayStr)
    onChangeEnd(todayStr)
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setPickPhase(null)
    setHoverDate(null)
    setOpen(false)
  }

  // Range highlight helpers
  function isInRange(dateStr) {
    if (!dateStr) return false
    if (pickPhase === 'start' && tempStart) {
      const rangeEnd = hoverDate || tempStart
      const lo = tempStart < rangeEnd ? tempStart : rangeEnd
      const hi = tempStart < rangeEnd ? rangeEnd : tempStart
      return dateStr >= lo && dateStr <= hi
    }
    if (startDate && endDate) return dateStr >= startDate && dateStr <= endDate
    return false
  }

  function isRangeStart(dateStr) {
    if (!dateStr) return false
    if (pickPhase === 'start' && tempStart) return dateStr === tempStart
    return dateStr === startDate
  }

  function isRangeEnd(dateStr) {
    if (!dateStr) return false
    if (pickPhase === 'start') {
      const rangeEnd = hoverDate || tempStart
      const hi = tempStart < rangeEnd ? rangeEnd : tempStart
      return dateStr === hi
    }
    return dateStr === endDate
  }

  const clearLabel = t ? t('datePicker.clear', { defaultValue: 'Clear' }) : 'Clear'
  const todayLabel = t ? t('datePicker.today', { defaultValue: 'Today' }) : 'Today'
  const pickHint =
    pickPhase === 'start'
      ? t
        ? t('datePicker.pickEndDate', { defaultValue: 'Select end date' })
        : 'Select end date'
      : t
        ? t('datePicker.pickStartDate', { defaultValue: 'Select start date' })
        : 'Select start date'

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div
        className={`${inputClass()} flex items-center gap-1 cursor-pointer min-w-[220px] select-none`}
        onClick={() => setOpen(!open)}
      >
        <span className={`flex-1 truncate ${displayValue ? '' : 'text-surface-400'}`}>
          {displayValue || placeholder}
        </span>
        <i className="bx bx-calendar text-base opacity-50"></i>
      </div>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[min(300px,calc(100vw-2rem))] rounded-lg border border-surface-200 bg-card p-3 shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:bg-dark-elevated dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          {/* Hint */}
          <div className="text-center mb-2 text-xs text-surface-500">{pickHint}</div>

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
              const isDisabled =
                item.current && item.date && ((minDate && item.date < minDate) || (maxDate && item.date > maxDate))
              const isClickable = item.current && item.date && !isDisabled
              const inRange = isInRange(item.date)
              const rangeStart = isRangeStart(item.date)
              const rangeEnd = isRangeEnd(item.date)
              const isTodayCell = item.date === todayStr

              let cls = 'py-1.5 px-0.5 text-[0.85rem] transition-colors '

              if (rangeStart || rangeEnd) {
                cls += 'bg-primary-600 text-white font-semibold '
                cls += rangeStart && rangeEnd ? 'rounded-md ' : rangeStart ? 'rounded-l-md ' : 'rounded-r-md '
              } else if (inRange) {
                cls += 'bg-primary-100/50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 '
              } else if (!item.current || isDisabled) {
                cls += 'text-surface-300 rounded-md '
              } else if (isTodayCell) {
                cls +=
                  'text-primary-600 dark:text-primary-400 font-semibold rounded-md hover:bg-surface-100 dark:hover:bg-white/8 '
              } else {
                cls += 'text-surface-900 rounded-md hover:bg-surface-100 dark:hover:bg-white/8 '
              }
              if (isClickable) cls += 'cursor-pointer '

              return (
                <div
                  key={item.date || `empty-${i}`}
                  className={cls}
                  onClick={() => isClickable && handleDayClick(item.date)}
                  onMouseEnter={() => {
                    if (isClickable && pickPhase === 'start') setHoverDate(item.date)
                  }}
                  onMouseLeave={() => {
                    if (pickPhase === 'start') setHoverDate(null)
                  }}
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
