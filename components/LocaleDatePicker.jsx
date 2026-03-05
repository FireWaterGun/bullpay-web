'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button, inputClass } from './ui';

const EMPTY_STYLE = {};

/**
 * A locale-aware date picker that replaces native <input type="date">.
 * Renders a styled input with a calendar dropdown.
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
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value) return new Date(value + 'T00:00:00').getFullYear();
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return new Date(value + 'T00:00:00').getMonth();
    return new Date().getMonth();
  });
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  // Sync view to value when it changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Locale-aware formatting
  const monthYearLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth, locale]);

  const weekDayHeaders = useMemo(() => {
    const headers = [];
    // Start from Monday (1) to Sunday (7)
    for (let i = 1; i <= 7; i++) {
      // Jan 6, 2025 is a Monday
      const d = new Date(2025, 0, 5 + i);
      headers.push(d.toLocaleDateString(locale, { weekday: 'narrow' }));
    }
    return headers;
  }, [locale]);

  const displayValue = useMemo(() => {
    if (!value) return '';
    const d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  }, [value, locale]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // getDay() returns 0=Sun, we want 0=Mon
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days = [];
    // Previous month padding
    const prevMonthLast = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({ day: prevMonthLast - i, current: false, date: null });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const yyyy = viewYear;
      const mm = String(viewMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      days.push({ day: d, current: true, date: `${yyyy}-${mm}-${dd}` });
    }
    // Next month padding
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
  function selectDate(dateStr) {
    onChange(dateStr);
    setOpen(false);
  }
  function handleClear() {
    onChange('');
    setOpen(false);
  }
  function handleToday() {
    onChange(todayStr);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setOpen(false);
  }

  const clearLabel = t ? t('datePicker.clear', { defaultValue: 'Clear' }) : 'Clear';
  const todayLabel = t ? t('datePicker.today', { defaultValue: 'Today' }) : 'Today';

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block', ...style }} className={className}>
      {/* Input */}
      <div
        className={`${inputClass()} flex items-center gap-1 cursor-pointer min-w-[130px] select-none`}

        onClick={() => setOpen(!open)}>
        
        <span className={`${displayValue ? '' : 'text-surface-500'} flex-1`}>
          {displayValue || placeholder}
        </span>
        <i className="bx bx-calendar text-[1rem] opacity-50"></i>
      </div>

      {/* Dropdown */}
      {open &&
      <div className="absolute left-[0px] z-[1050] mt-1 bg-surface-0 rounded-lg"
      style={{ top: '100%', width: 'min(280px, calc(100vw - 2rem))', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: 12, border: '1px solid var(--color-surface-200)' }}>
        
          {/* Header: prev / month-year / next */}
          <div className="flex justify-between items-center mb-2">
            <Button
            type="button"

            onClick={prevMonth} size="sm" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none p-1 border-none bg-transparent cursor-pointer">

            
              <i className="bx bx-chevron-left text-[1.2rem]"></i>
            </Button>
            <span className="font-semibold text-[0.9rem]">{monthYearLabel}</span>
            <Button
            type="button"

            onClick={nextMonth} size="sm" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none p-1 border-none bg-transparent cursor-pointer">

            
              <i className="bx bx-chevron-right text-[1.2rem]"></i>
            </Button>
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
            const isSelected = item.date === value;
            const isToday = item.date === todayStr;
            const isDisabled = item.current && item.date && (minDate && item.date < minDate || maxDate && item.date > maxDate);
            const isClickable = item.current && item.date && !isDisabled;
            return (
              <div className="py-[6px] px-[2px] rounded-full text-[0.85rem]"
              key={item.date || `empty-${i}`}
              onClick={() => isClickable && selectDate(item.date)}
              style={{ cursor: isClickable ? 'pointer' : 'default', fontWeight: isSelected ? 600 : 400, color: !item.current || isDisabled ? 'var(--color-surface-300)' : isSelected ? '#fff' : isToday ? 'var(--color-primary-600)' : 'var(--color-surface-900)', backgroundColor: isSelected ? 'var(--color-primary-600)' : 'transparent', transition: 'background-color 0.15s' }}
              onMouseEnter={(e) => {if (isClickable && !isSelected) e.currentTarget.style.backgroundColor = 'var(--color-surface-100)';}}
              onMouseLeave={(e) => {if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';}}>
                
                  {item.day}
                </div>);

          })}
          </div>

          {/* Footer: Clear / Today */}
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