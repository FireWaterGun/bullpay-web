'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

export function MenuItem({ to, icon, label, end }: { to: string; icon: string; label: string; end?: boolean }) {
  const pathname = usePathname()
  const exactMatch = end ? pathname === to : pathname === to
  const isDetailMatch = pathname.startsWith(to + '/')
  const isActive = exactMatch || isDetailMatch
  return (
    <li className={`menu-item ${isActive ? 'active' : ''}`}>
      <Link href={to} className="menu-link">
        <i className={`menu-icon bx ${icon}`}></i>
        <div>{label}</div>
      </Link>
    </li>
  )
}

export function SubItem({ to, label, end, badge }: { to: string; label: string; end?: boolean; badge?: number }) {
  const pathname = usePathname()
  const exactMatch = end ? pathname === to : pathname === to
  const isDetailMatch = pathname.startsWith(to + '/')
  const isActive = exactMatch || isDetailMatch
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
  const toggle = (e: React.MouseEvent) => { e.preventDefault(); setOpen((v) => !v) }
  const subRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    setOpen(match)
  }, [match])

  useEffect(() => {
    const sub = subRef.current
    if (!sub) return
    sub.style.maxHeight = open ? '2000px' : '0px'
  }, [open])

  return (
    <li className={`menu-item ${open ? 'open' : ''} ${isActive ? 'active' : ''}`}>
      <a href="#" onClick={toggle} className="menu-link menu-toggle">
        <div>{label}</div>
      </a>
      <ul className="menu-sub" ref={subRef} style={{
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

  const isMatched = matchPaths
    ? matchPaths.some(path => pathname.startsWith(path))
    : pathname.startsWith(base) && pathname !== base

  const [open, setOpen] = useState(isMatched)
  const isActive = isMatched
  const toggle = (e: React.MouseEvent) => { e.preventDefault(); setOpen((v) => !v) }
  const isCollapsed = typeof document !== 'undefined' && document.documentElement.classList.contains('layout-menu-collapsed')
  const handleEnter = () => { if (isCollapsed) setOpen(true) }
  const handleLeave = () => { if (isCollapsed) setOpen(false) }

  useEffect(() => { if (!isCollapsed) setOpen(isMatched) }, [isMatched, isCollapsed])

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
      <a href="#" className="menu-link menu-toggle" onClick={(e) => { e.preventDefault(); toggle(e) }} aria-expanded={open} aria-controls={`${label}-submenu`}>
        <i className={`menu-icon bx ${icon}`}></i>
        <div data-i18n={label}>{label}</div>
        {!!badge && badge > 0 && (
          <span className="badge rounded-pill bg-danger" style={badgeStyle}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </a>
      <ul id={`${label}-submenu`} className="menu-sub" ref={subRef} style={{ maxHeight: open ? '3000px' : 0, overflow: 'hidden' }}>
        {children}
      </ul>
    </li>
  )
}
