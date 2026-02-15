import { useState, useRef, useEffect, useMemo } from 'react'

/**
 * A locale-aware date RANGE picker (single input, pick from–to in one calendar).
 *
 * Props:
 *  - startDate: string (YYYY-MM-DD) or ''
 *  - endDate:   string (YYYY-MM-DD) or ''
 *  - onChangeStart: (dateStr: string) => void
 *  - onChangeEnd:   (dateStr: string) => void
 *  - locale: string (e.g. 'th-TH', 'en-US', 'zh-CN')
 *  - placeholder: string
 *  - className: string
 *  - style: object
 *  - t: i18next translate function (optional)
 *  - minDate: string (YYYY-MM-DD)
 *  - maxDate: string (YYYY-MM-DD)
 */
export default function LocaleDateRangePicker({
  startDate = '',
  endDate = '',
  onChangeStart,
  onChangeEnd,
  locale = 'en-US',
  placeholder = '',
  className = '',
  style = {},
  t,
  minDate,
  maxDate,
}) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => {
    if (startDate) return new Date(startDate + 'T00:00:00').getFullYear()
    return new Date().getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    if (startDate) return new Date(startDate + 'T00:00:00').getMonth()
    return new Date().getMonth()
  })

  // Selection state: null = picking start, 'start' = start picked, picking end
  const [pickPhase, setPickPhase] = useState(null) // null | 'start'
  const [tempStart, setTempStart] = useState(startDate)
  const [hoverDate, setHoverDate] = useState(null)

  const wrapperRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
        setPickPhase(null)
        setHoverDate(null)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  // Sync view when props change externally
  useEffect(() => {
    if (startDate) {
      const d = new Date(startDate + 'T00:00:00')
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
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const displayValue = useMemo(() => {
    if (startDate && endDate) return `${fmtShort(startDate)}  —  ${fmtShort(endDate)}`
    if (startDate) return fmtShort(startDate)
    return ''
  }, [startDate, endDate, locale])

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    const daysInMonth = lastDay.getDate()

    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6

    const days = []
    const prevMonthLast = new Date(viewYear, viewMonth, 0).getDate()
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({ day: prevMonthLast - i, current: false, date: null })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const yyyy = viewYear
      const mm = String(viewMonth + 1).padStart(2, '0')
      const dd = String(d).padStart(2, '0')
      days.push({ day: d, current: true, date: `${yyyy}-${mm}-${dd}` })
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
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function handleDayClick(dateStr) {
    if (!dateStr) return
    if (pickPhase === null || pickPhase === undefined) {
      // First click — set start
      setTempStart(dateStr)
      setPickPhase('start')
      setHoverDate(null)
    } else {
      // Second click — set end (ensure order)
      let s = tempStart
      let e = dateStr
      if (s > e) { [s, e] = [e, s] }
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

  // Determine which dates are in-range for highlighting
  function isInRange(dateStr) {
    if (!dateStr) return false
    if (pickPhase === 'start' && tempStart) {
      // Hovering — show preview range
      const rangeEnd = hoverDate || tempStart
      const lo = tempStart < rangeEnd ? tempStart : rangeEnd
      const hi = tempStart < rangeEnd ? rangeEnd : tempStart
      return dateStr >= lo && dateStr <= hi
    }
    // Applied range
    if (startDate && endDate) {
      return dateStr >= startDate && dateStr <= endDate
    }
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
  const pickHint = pickPhase === 'start'
    ? (t ? t('datePicker.pickEndDate', { defaultValue: 'Select end date' }) : 'Select end date')
    : (t ? t('datePicker.pickStartDate', { defaultValue: 'Select start date' }) : 'Select start date')

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block', ...style }} className={className}>
      {/* Input */}
      <div
        className="form-control d-flex align-items-center gap-1"
        style={{ cursor: 'pointer', minWidth: 220, userSelect: 'none' }}
        onClick={() => setOpen(!open)}
      >
        <span className={displayValue ? '' : 'text-muted'} style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
            width: 300,
            backgroundColor: '#fff',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            padding: 12,
            border: '1px solid #e5e5e5',
          }}
        >
          {/* Hint */}
          <div className="text-center mb-2" style={{ fontSize: '0.75rem', color: '#888' }}>
            {pickHint}
          </div>

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-2">
            <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={prevMonth}>
              <i className="bx bx-chevron-left" style={{ fontSize: '1.2rem' }}></i>
            </button>
            <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{monthYearLabel}</span>
            <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={nextMonth}>
              <i className="bx bx-chevron-right" style={{ fontSize: '1.2rem' }}></i>
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 4 }}>
            {weekDayHeaders.map((h, i) => (
              <div key={i} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', padding: '2px 0' }}>
                {h}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
            {calendarDays.map((item, i) => {
              const isDisabled = item.current && item.date && ((minDate && item.date < minDate) || (maxDate && item.date > maxDate))
              const isClickable = item.current && item.date && !isDisabled
              const inRange = isInRange(item.date)
              const rangeStart = isRangeStart(item.date)
              const rangeEnd = isRangeEnd(item.date)
              const isTodayCell = item.date === todayStr

              let bgColor = 'transparent'
              let textColor = !item.current || isDisabled ? '#ccc' : '#333'
              let fontWeight = 400
              let borderRadius = '6px'

              if (rangeStart || rangeEnd) {
                bgColor = '#696cff'
                textColor = '#fff'
                fontWeight = 600
                borderRadius = rangeStart && rangeEnd ? '6px' : rangeStart ? '6px 0 0 6px' : '0 6px 6px 0'
              } else if (inRange) {
                bgColor = 'rgba(105, 108, 255, 0.12)'
                textColor = '#696cff'
                borderRadius = '0'
              }

              if (!inRange && !rangeStart && !rangeEnd && isTodayCell && item.current) {
                textColor = '#696cff'
                fontWeight = 600
              }

              return (
                <div
                  key={i}
                  onClick={() => isClickable && handleDayClick(item.date)}
                  onMouseEnter={() => { if (isClickable && pickPhase === 'start') setHoverDate(item.date) }}
                  onMouseLeave={() => { if (pickPhase === 'start') setHoverDate(null) }}
                  style={{
                    padding: '6px 2px',
                    cursor: isClickable ? 'pointer' : 'default',
                    fontSize: '0.85rem',
                    fontWeight,
                    color: textColor,
                    backgroundColor: bgColor,
                    borderRadius,
                    transition: 'background-color 0.1s',
                  }}
                >
                  {item.day}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="d-flex justify-content-between mt-2 pt-2" style={{ borderTop: '1px solid #eee' }}>
            <button
              type="button"
              className="btn btn-sm text-muted p-0"
              onClick={handleClear}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              {clearLabel}
            </button>
            <button
              type="button"
              className="btn btn-sm text-primary p-0"
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
