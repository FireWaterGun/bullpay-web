'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'

export function SectionHeader({ label }: { label: string }) {
  return (
    <li className="menu-header small text-uppercase">
      <span className="menu-header-text">{label}</span>
    </li>
  )
}

export function MenuItem({ to, icon, label, end, badge }: { to: string; icon: string; label: string; end?: boolean; badge?: number }) {
  const pathname = usePathname()
  const isActive = end ? pathname === to : (pathname === to || pathname.startsWith(to + '/'))
  return (
    <li className={`menu-item ${isActive ? 'active' : ''}`}>
      <Link href={to} className="menu-link" style={{ position: 'relative' }}>
        <i className={`menu-icon bx ${icon}`}></i>
        <div>{label}</div>
        {!!badge && badge > 0 && (
          <span className="badge rounded-pill bg-danger" style={badgeStyle}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    </li>
  )
}

export function SubItem({ to, label, end, badge }: { to: string; label: string; end?: boolean; badge?: number }) {
  const pathname = usePathname()
  const isActive = end ? pathname === to : (pathname === to || pathname.startsWith(to + '/'))
  return (
    <li className={`menu-item ${isActive ? 'active' : ''}`}>
      <Link href={to} className="menu-link" style={{ position: 'relative' }}>
        <div>{label}</div>
        {!!badge && badge > 0 && (
          <span className="badge rounded-pill bg-danger" style={subBadgeStyle}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    </li>
  )
}

export function SubMenuGroup({ base, label, children }: { base: string; label: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const match = pathname.startsWith(base)
  const [open, setOpen] = useState(match)
  const isActive = match
  const userToggled = useRef(false)
  const subRef = useRef<HTMLUListElement>(null)
  const submenuId = `sub-${label.replace(/\s+/g, '-').toLowerCase()}`

  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    userToggled.current = true
    setOpen((v) => !v)
  }, [])

  useEffect(() => {
    if (match) {
      setOpen(true)
      userToggled.current = false
    } else if (!userToggled.current) {
      setOpen(false)
    }
  }, [match])

  useEffect(() => {
    const sub = subRef.current
    if (!sub) return
    sub.style.overflow = 'hidden'
    sub.style.transition = 'max-height 0.3s ease-in-out'
    sub.style.maxHeight = open ? '2000px' : '0px'
  }, [open])

  return (
    <li className={`menu-item ${open ? 'open' : ''} ${isActive ? 'active' : ''}`}>
      <a href="#" onClick={toggle} className="menu-link menu-toggle" aria-expanded={open} aria-controls={submenuId}>
        <div>{label}</div>
      </a>
      <ul id={submenuId} className="menu-sub" ref={subRef} style={{
        maxHeight: open ? '2000px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease-in-out'
      }}>
        {children}
      </ul>
    </li>
  )
}

const badgeStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  lineHeight: '1',
  padding: '0',
  width: '20px',
  height: '20px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  position: 'absolute',
  right: '38px',
}

const subBadgeStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  lineHeight: '1',
  padding: '0',
  width: '18px',
  height: '18px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  position: 'absolute',
  right: '15px',
  top: '50%',
  transform: 'translateY(-50%)',
}

export function MenuGroup({ base, icon, label, children, matchPaths, badge }: {
  base: string; icon: string; label: string; children: React.ReactNode; matchPaths?: string[]; badge?: number
}) {
  const pathname = usePathname()

  const isMatched = useMemo(() => {
    if (matchPaths) return matchPaths.some(path => pathname.startsWith(path))
    return pathname.startsWith(base) && pathname !== base
  }, [matchPaths, pathname, base])

  const [open, setOpen] = useState(isMatched)
  const isActive = isMatched
  const userToggled = useRef(false)
  const submenuId = `menu-${label.replace(/\s+/g, '-').toLowerCase()}`

  const getIsCollapsed = useCallback(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('layout-menu-collapsed')
  }, [])

  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    userToggled.current = true
    setOpen((v) => !v)
  }, [])
  const handleEnter = useCallback(() => { if (getIsCollapsed()) setOpen(true) }, [getIsCollapsed])
  const handleLeave = useCallback(() => { if (getIsCollapsed()) setOpen(false) }, [getIsCollapsed])

  // Auto-open when navigating into this group; only auto-close if user hasn't manually toggled
  useEffect(() => {
    if (isMatched) {
      setOpen(true)
      userToggled.current = false
    } else if (!userToggled.current && !getIsCollapsed()) {
      setOpen(false)
    }
  }, [isMatched, getIsCollapsed])

  const subRef = useRef<HTMLUListElement>(null)
  const liRef = useRef<HTMLLIElement>(null)
  const prevOpen = useRef(open)

  useEffect(() => {
    const sub = subRef.current
    const li = liRef.current
    if (!sub) return

    sub.style.overflow = 'hidden'
    sub.style.transition = 'max-height 0.3s ease-in-out'

    const wasOpen = prevOpen.current
    prevOpen.current = open

    if (open) {
      requestAnimationFrame(() => { sub.style.maxHeight = '3000px' })
    } else {
      if (wasOpen && li) li.classList.add('menu-item-closing')
      requestAnimationFrame(() => { sub.style.maxHeight = '0px' })
    }
  }, [open])

  useEffect(() => {
    const sub = subRef.current
    const li = liRef.current
    if (!sub || !li) return
    const onEnd = (e: TransitionEvent) => { if (e.propertyName === 'max-height') li.classList.remove('menu-item-closing') }
    sub.addEventListener('transitionend', onEnd)
    return () => sub.removeEventListener('transitionend', onEnd)
  }, [])

  useEffect(() => {
    const el = subRef.current
    if (!el) return
    const handle = () => { if (open) el.style.maxHeight = '3000px' }
    window.addEventListener('resize', handle)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handle) : null
    if (ro) ro.observe(el)
    return () => { window.removeEventListener('resize', handle); if (ro) ro.disconnect() }
  }, [open])

  return (
    <li ref={liRef} className={`menu-item ${open ? 'open' : ''} ${isActive ? 'active' : ''}`} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <a href="#" className="menu-link menu-toggle" onClick={toggle} aria-expanded={open} aria-controls={submenuId}>
        <i className={`menu-icon bx ${icon}`}></i>
        <div data-i18n={label}>{label}</div>
        {!!badge && badge > 0 && (
          <span className="badge rounded-pill bg-danger" style={badgeStyle}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </a>
      <ul id={submenuId} className="menu-sub" ref={subRef} style={{ maxHeight: open ? '3000px' : 0, overflow: 'hidden' }}>
        {children}
      </ul>
    </li>
  )
}
