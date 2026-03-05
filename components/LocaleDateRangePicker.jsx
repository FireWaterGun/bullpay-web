'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button, inputClass } from './ui';

const EMPTY_STYLE = {};

/**
 * A locale-aware date RANGE picker (single input, pick from-to in one calendar).
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
  style = EMPTY_STYLE,
  t,
  minDate,
  maxDate
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (startDate) return new Date(startDate + 'T00:00:00').getFullYear();
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (startDate) return new Date(startDate + 'T00:00:00').getMonth();
    return new Date().getMonth();
  });

  // Selection state: null = picking start, 'start' = start picked, picking end
  const [pickPhase, setPickPhase] = useState(null); // null | 'start'
  const [tempStart, setTempStart] = useState(startDate);
  const [hoverDate, setHoverDate] = useState(null);

  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setPickPhase(null);
        setHoverDate(null);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  // Sync view when props change externally
  useEffect(() => {
    if (startDate) {
      const d = new Date(startDate + 'T00:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [startDate]);

  // Reset temp on open
  useEffect(() => {
    if (open) {
      setTempStart(startDate);
      setPickPhase(null);
      setHoverDate(null);
    }
  }, [open]);

  // Locale formatting
  const monthYearLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth, locale]);

  const weekDayHeaders = useMemo(() => {
    const headers = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(2025, 0, 5 + i);
      headers.push(d.toLocaleDateString(locale, { weekday: 'narrow' }));
    }
    return headers;
  }, [locale]);

  function fmtShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const displayValue = useMemo(() => {
    if (startDate && endDate) return `${fmtShort(startDate)}  —  ${fmtShort(endDate)}`;
    if (startDate) return fmtShort(startDate);
    return '';
  }, [startDate, endDate, locale]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days = [];
    const prevMonthLast = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({ day: prevMonthLast - i, current: false, date: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const yyyy = viewYear;
      const mm = String(viewMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      days.push({ day: d, current: true, date: `${yyyy}-${mm}-${dd}` });
    }
    const remaining = 7 - days.length % 7;
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ day: i, current: false, date: null });
      }
    }
    return days;
  }, [viewYear, viewMonth]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  function prevMonth() {
    if (viewMonth === 0) {setViewMonth(11);setViewYear((y) => y - 1);} else
    setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {setViewMonth(0);setViewYear((y) => y + 1);} else
    setViewMonth((m) => m + 1);
  }

  function handleDayClick(dateStr) {
    if (!dateStr) return;
    if (pickPhase === null || pickPhase === undefined) {
      // First click — set start
      setTempStart(dateStr);
      setPickPhase('start');
      setHoverDate(null);
    } else {
      // Second click — set end (ensure order)
      let s = tempStart;
      let e = dateStr;
      if (s > e) {[s, e] = [e, s];}
      onChangeStart(s);
      onChangeEnd(e);
      setPickPhase(null);
      setHoverDate(null);
      setOpen(false);
    }
  }

  function handleClear() {
    onChangeStart('');
    onChangeEnd('');
    setPickPhase(null);
    setHoverDate(null);
    setOpen(false);
  }

  function handleToday() {
    onChangeStart(todayStr);
    onChangeEnd(todayStr);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setPickPhase(null);
    setHoverDate(null);
    setOpen(false);
  }

  // Determine which dates are in-range for highlighting
  function isInRange(dateStr) {
    if (!dateStr) return false;
    if (pickPhase === 'start' && tempStart) {
      // Hovering — show preview range
      const rangeEnd = hoverDate || tempStart;
      const lo = tempStart < rangeEnd ? tempStart : rangeEnd;
      const hi = tempStart < rangeEnd ? rangeEnd : tempStart;
      return dateStr >= lo && dateStr <= hi;
    }
    // Applied range
    if (startDate && endDate) {
      return dateStr >= startDate && dateStr <= endDate;
    }
    return false;
  }

  function isRangeStart(dateStr) {
    if (!dateStr) return false;
    if (pickPhase === 'start' && tempStart) return dateStr === tempStart;
    return dateStr === startDate;
  }

  function isRangeEnd(dateStr) {
    if (!dateStr) return false;
    if (pickPhase === 'start') {
      const rangeEnd = hoverDate || tempStart;
      const hi = tempStart < rangeEnd ? rangeEnd : tempStart;
      return dateStr === hi;
    }
    return dateStr === endDate;
  }

  const clearLabel = t ? t('datePicker.clear', { defaultValue: 'Clear' }) : 'Clear';
  const todayLabel = t ? t('datePicker.today', { defaultValue: 'Today' }) : 'Today';
  const pickHint = pickPhase === 'start' ?
  t ? t('datePicker.pickEndDate', { defaultValue: 'Select end date' }) : 'Select end date' :
  t ? t('datePicker.pickStartDate', { defaultValue: 'Select start date' }) : 'Select start date';

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block', ...style }} className={className}>
      {/* Input */}
      <div
        className={`${inputClass()} flex items-center gap-1 cursor-pointer min-w-[220px] select-none`}

        onClick={() => setOpen(!open)}>
        
        <span className={`${displayValue ? '' : 'text-surface-500'} flex-1 whitespace-nowrap overflow-hidden`} style={{ textOverflow: 'ellipsis' }}>
          {displayValue || placeholder}
        </span>
        <i className="bx bx-calendar text-[1rem] opacity-50"></i>
      </div>

      {/* Dropdown */}
      {open &&
      <div className="absolute left-[0px] z-[1050] mt-1 bg-surface-0 rounded-lg"
      style={{ top: '100%', width: 'min(300px, calc(100vw - 2rem))', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: 12, border: '1px solid var(--color-surface-200)' }}>
        
          {/* Hint */}
          <div className="text-center mb-2 text-xs text-surface-500">
            {pickHint}
          </div>

          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <button className="border-none bg-transparent cursor-pointer" type="button" onClick={prevMonth}>
              <i className="bx bx-chevron-left text-[1.2rem]"></i>
            </button>
            <span className="font-semibold text-[0.9rem]">{monthYearLabel}</span>
            <button className="border-none bg-transparent cursor-pointer" type="button" onClick={nextMonth}>
              <i className="bx bx-chevron-right text-[1.2rem]"></i>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center mb-1">
            {weekDayHeaders.map((h, i) =>
          <div className="text-xs font-semibold text-surface-500 py-[2px] px-[0]" key={i}>
                {h}
              </div>
          )}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 text-center">
            {calendarDays.map((item, i) => {
            const isDisabled = item.current && item.date && (minDate && item.date < minDate || maxDate && item.date > maxDate);
            const isClickable = item.current && item.date && !isDisabled;
            const inRange = isInRange(item.date);
            const rangeStart = isRangeStart(item.date);
            const rangeEnd = isRangeEnd(item.date);
            const isTodayCell = item.date === todayStr;

            let bgColor = 'transparent';
            let textColor = !item.current || isDisabled ? 'var(--color-surface-300)' : 'var(--color-surface-900)';
            let fontWeight = 400;
            let borderRadius = '6px';

            if (rangeStart || rangeEnd) {
              bgColor = 'var(--color-primary-600)';
              textColor = '#fff';
              fontWeight = 600;
              borderRadius = rangeStart && rangeEnd ? '6px' : rangeStart ? '6px 0 0 6px' : '0 6px 6px 0';
            } else if (inRange) {
              bgColor = 'rgba(99, 102, 241, 0.12)';
              textColor = 'var(--color-primary-600)';
              borderRadius = '0';
            }

            if (!inRange && !rangeStart && !rangeEnd && isTodayCell && item.current) {
              textColor = 'var(--color-primary-600)';
              fontWeight = 600;
            }

            return (
              <div className="py-[6px] px-[2px] text-[0.85rem]"
              key={item.date || `empty-${i}`}
              onClick={() => isClickable && handleDayClick(item.date)}
              onMouseEnter={() => {if (isClickable && pickPhase === 'start') setHoverDate(item.date);}}
              onMouseLeave={() => {if (pickPhase === 'start') setHoverDate(null);}}
              style={{ cursor: isClickable ? 'pointer' : 'default', fontWeight, color: textColor, backgroundColor: bgColor, borderRadius, transition: 'background-color 0.1s' }}>
                
                  {item.day}
                </div>);

          })}
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--color-surface-200)' }}>
            <Button
            type="button"

            onClick={handleClear} size="sm" className="text-surface-500 p-0 border-none bg-transparent cursor-pointer text-[0.8rem]">

            
              {clearLabel}
            </Button>
            <Button
            type="button"

            onClick={handleToday} size="sm" className="text-primary-600 p-0 border-none bg-transparent cursor-pointer text-[0.8rem]">

            
              {todayLabel}
            </Button>
          </div>
        </div>
      }
    </div>);

}