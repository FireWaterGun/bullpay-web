import { NavLink, useLocation, useResolvedPath, useMatch } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'

export function MenuItem({ to, icon, label, end }) {
  const location = useLocation()
  const resolved = useResolvedPath(to)
  const exactMatch = useMatch({ path: resolved.pathname, end: !!end })
  const isDetailMatch = location.pathname.startsWith(resolved.pathname + '/')
  const isActive = !!exactMatch || isDetailMatch
  return (
    <li className={`menu-item ${isActive ? 'active' : ''}`}>
      <NavLink to={to} end={end} className="menu-link">
        <i className={`menu-icon bx ${icon}`}></i>
        <div>{label}</div>
      </NavLink>
    </li>
  )
}

export function SubItem({ to, label, end, badge }) {
  const location = useLocation()
  const resolved = useResolvedPath(to)
  const exactMatch = useMatch({ path: resolved.pathname, end: !!end })
  const isDetailMatch = location.pathname.startsWith(resolved.pathname + '/')
  const isActive = !!exactMatch || isDetailMatch
  return (
    <li className={`menu-item ${isActive ? 'active' : ''}`}>
      <NavLink to={to} end={end} className="menu-link" style={{ position: 'relative' }}>
        <div>{label}</div>
        {badge > 0 && (
          <span className="badge rounded-pill bg-danger" style={subBadgeStyle}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </NavLink>
    </li>
  )
}

export function SubMenuGroup({ base, label, children }) {
  const resolved = useResolvedPath(base)
  const match = useMatch({ path: `${resolved.pathname}/*`, end: false })
  const [open, setOpen] = useState(!!match)
  const isActive = !!match
  const toggle = (e) => { e.preventDefault(); setOpen((v) => !v) }
  const subRef = useRef(null)

  useEffect(() => {
    setOpen(!!match)
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

const badgeStyle = {
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

const subBadgeStyle = {
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

export function MenuGroup({ base, icon, label, children, matchPaths, badge }) {
  const location = useLocation()
  const resolved = useResolvedPath(base)

  const isMatched = matchPaths
    ? matchPaths.some(path => location.pathname.startsWith(path))
    : location.pathname.startsWith(resolved.pathname) && location.pathname !== resolved.pathname

  const [open, setOpen] = useState(isMatched)
  const isActive = isMatched
  const toggle = (e) => { e.preventDefault(); setOpen((v) => !v) }
  const isCollapsed = typeof document !== 'undefined' && document.documentElement.classList.contains('layout-menu-collapsed')
  const handleEnter = () => { if (isCollapsed) setOpen(true) }
  const handleLeave = () => { if (isCollapsed) setOpen(false) }

  useEffect(() => { if (!isCollapsed) setOpen(isMatched) }, [isMatched, isCollapsed])

  const subRef = useRef(null)
  const liRef = useRef(null)
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
    const onEnd = (e) => { if (e.propertyName === 'max-height') li.classList.remove('menu-item-closing') }
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
        {badge > 0 && (
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
