'use client'

import { useState, useRef, useEffect, useMemo } from 'react'

const EMPTY_STYLE = {}

/**
 * A locale-aware date picker that replaces native <input type="date">.
 * Renders a Bootstrap-styled input with a calendar dropdown.
 *
 * Props:
 *  - value: string (YYYY-MM-DD)
 *  - onChange: (dateStr: string) => void
 *  - locale: string (e.g. 'th-TH', 'en-US', 'zh-CN')
 *  - placeholder: string
 *  - className: string (applied to the wrapper)
 *  - style: object
 *  - t: i18next translate function (optional, for Clear/Today labels)
 */
export default function LocaleDatePicker({ value, onChange, locale = 'en-US', placeholder = '', className = '', style = EMPTY_STYLE, t, minDate, maxDate }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    if (value) return new Date(value + 'T00:00:00').getFullYear()
    return new Date().getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return new Date(value + 'T00:00:00').getMonth()
    return new Date().getMonth()
  })
  const wrapperRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  // Sync view to value when it changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00')
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  // Locale-aware formatting
  const monthYearLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1)
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  }, [viewYear, viewMonth, locale])

  const weekDayHeaders = useMemo(() => {
    const headers = []
    // Start from Monday (1) to Sunday (7)
    for (let i = 1; i <= 7; i++) {
      // Jan 6, 2025 is a Monday
      const d = new Date(2025, 0, 5 + i)
      headers.push(d.toLocaleDateString(locale, { weekday: 'narrow' }))
    }
    return headers
  }, [locale])

  const displayValue = useMemo(() => {
    if (!value) return ''
    const d = new Date(value + 'T00:00:00')
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  }, [value, locale])

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    const daysInMonth = lastDay.getDate()

    // getDay() returns 0=Sun, we want 0=Mon
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6

    const days = []
    // Previous month padding
    const prevMonthLast = new Date(viewYear, viewMonth, 0).getDate()
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({ day: prevMonthLast - i, current: false, date: null })
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const yyyy = viewYear
      const mm = String(viewMonth + 1).padStart(2, '0')
      const dd = String(d).padStart(2, '0')
      days.push({ day: d, current: true, date: `${yyyy}-${mm}-${dd}` })
    }
    // Next month padding
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
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
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
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setOpen(false)
  }

  const clearLabel = t ? t('datePicker.clear', { defaultValue: 'Clear' }) : 'Clear'
  const todayLabel = t ? t('datePicker.today', { defaultValue: 'Today' }) : 'Today'

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block', ...style }} className={className}>
      {/* Input */}
      <div
        className="form-input flex items-center gap-1"
        style={{ cursor: 'pointer', minWidth: 130, userSelect: 'none' }}
        onClick={() => setOpen(!open)}
      >
        <span className={displayValue ? '' : 'text-surface-500'} style={{ flex: 1 }}>
          {displayValue || placeholder}
        </span>
        <i className="bx bx-calendar" style={{ fontSize: '1rem', opacity: 0.5 }}></i>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 1050,
            marginTop: 4,
            width: 'min(280px, calc(100vw - 2rem))',
            backgroundColor: 'var(--color-surface-0, #fff)',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            padding: 12,
            border: '1px solid var(--color-surface-200)',
          }}
        >
          {/* Header: prev / month-year / next */}
          <div className="flex justify-between items-center mb-2">
            <button
              type="button"
              className="btn btn-sm btn-ghost p-1"
              onClick={prevMonth}
              style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <i className="bx bx-chevron-left" style={{ fontSize: '1.2rem' }}></i>
            </button>
            <span className="font-semibold" style={{ fontSize: '0.9rem' }}>{monthYearLabel}</span>
            <button
              type="button"
              className="btn btn-sm btn-ghost p-1"
              onClick={nextMonth}
              style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <i className="bx bx-chevron-right" style={{ fontSize: '1.2rem' }}></i>
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 4 }}>
            {weekDayHeaders.map((h, i) => (
              <div key={i} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-surface-500)', padding: '2px 0' }}>
                {h}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
            {calendarDays.map((item, i) => {
              const isSelected = item.date === value
              const isToday = item.date === todayStr
              const isDisabled = item.current && item.date && ((minDate && item.date < minDate) || (maxDate && item.date > maxDate))
              const isClickable = item.current && item.date && !isDisabled
              return (
                <div
                  key={item.date || `empty-${i}`}
                  onClick={() => isClickable && selectDate(item.date)}
                  style={{
                    padding: '6px 2px',
                    cursor: isClickable ? 'pointer' : 'default',
                    borderRadius: '50%',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 600 : 400,
                    color: !item.current || isDisabled ? 'var(--color-surface-300)' : isSelected ? '#fff' : isToday ? 'var(--color-primary-600)' : 'var(--color-surface-900)',
                    backgroundColor: isSelected ? 'var(--color-primary-600)' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { if (isClickable && !isSelected) e.currentTarget.style.backgroundColor = 'var(--color-surface-100)' }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {item.day}
                </div>
              )
            })}
          </div>

          {/* Footer: Clear / Today */}
          <div className="flex justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--color-surface-200)' }}>
            <button
              type="button"
              className="btn btn-sm text-surface-500 p-0"
              onClick={handleClear}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              {clearLabel}
            </button>
            <button
              type="button"
              className="btn btn-sm text-primary-600 p-0"
              onClick={handleToday}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              {todayLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
