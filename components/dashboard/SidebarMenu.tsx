'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'

/* ── Section Header ── */
export function SectionHeader({ label }: { label: string }) {
  return (
    <li className="bp-section-hdr px-[2rem]">
      <span className="text-[11px] font-bold uppercase tracking-[0.4px] text-surface-400">{label}</span>
    </li>
  )
}

/* ── Single Menu Item ── */
export function MenuItem({
  to,
  icon,
  label,
  end,
  badge,
}: {
  to: string
  icon: string
  label: string
  end?: boolean
  badge?: number
}) {
  const pathname = usePathname()
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)

  return (
    <li className={isActive ? 'bp-active-item' : ''}>
      <Link
        href={to}
        className={`bp-menu-link flex items-center gap-2 mx-4 px-[0.9375rem] py-[0.3125rem] text-[0.9375rem] relative ${
          isActive ? 'bp-active' : ''
        }`}
      >
        <i className={`bp-menu-icon bx ${icon} text-[1.375rem] shrink-0 w-[1.375rem] mr-2`}></i>
        <span className="bp-label truncate leading-[1.375rem]">{label}</span>
        {!!badge && badge > 0 && (
          <span className="bp-badge ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-danger-500 rounded-full">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    </li>
  )
}

/* ── Sub Item (inside a MenuGroup) ── */
export function SubItem({
  to,
  label,
  end,
  badge,
  external,
}: {
  to: string
  label: string
  end?: boolean
  badge?: number
  external?: boolean
}) {
  const pathname = usePathname()
  const isActive = !external && (end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`))

  if (external) {
    return (
      <li>
        <a
          href={to}
          className="bp-menu-link flex items-center pl-10 pr-[0.9375rem] py-[0.3125rem] mx-4 text-[0.9375rem] relative"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="bp-label truncate leading-[1.375rem]">
            {label}
            <i className="bx bx-link-external ml-1 text-[10px] opacity-40 align-super"></i>
          </span>
        </a>
      </li>
    )
  }

  return (
    <li>
      <Link
        href={to}
        className={`bp-menu-link flex items-center pl-10 pr-[0.9375rem] py-[0.3125rem] mx-4 text-[0.9375rem] relative ${
          isActive ? 'bp-active' : ''
        }`}
      >
        <span className="bp-label truncate leading-[1.375rem]">{label}</span>
        {!!badge && badge > 0 && (
          <span className="bp-badge ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold text-white bg-danger-500 rounded-full">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    </li>
  )
}

/* ── Sub Menu Group (nested inside MenuGroup) ── */
export function SubMenuGroup({ base, label, children }: { base: string; label: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const match = pathname.startsWith(base)
  const [open, setOpen] = useState(match)
  const userToggled = useRef(false)

  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    userToggled.current = true
    setOpen((v) => !v)
  }, [])

  useEffect(() => {
    if (match) {
      queueMicrotask(() => setOpen(true))
      userToggled.current = false
    } else if (!userToggled.current) {
      queueMicrotask(() => setOpen(false))
    }
  }, [match])

  return (
    <li>
      <a
        href="#"
        onClick={toggle}
        className={`bp-menu-link bp-menu-toggle flex items-center pl-10 pr-[calc(0.9375rem+1.76em)] py-[0.3125rem] mx-4 text-[0.9375rem] cursor-pointer relative ${open ? 'bp-open' : ''}`}
      >
        <span className="bp-label truncate flex-1 leading-[1.375rem]">{label}</span>
      </a>
      <ul className="bp-submenu" style={{ maxHeight: open ? '2000px' : '0px' }}>
        {children}
      </ul>
    </li>
  )
}

/* ── Menu Group (top-level collapsible with icon) ── */
export function MenuGroup({
  base,
  icon,
  label,
  children,
  matchPaths,
  badge,
}: {
  base: string
  icon: string
  label: string
  children: React.ReactNode
  matchPaths?: string[]
  badge?: number
}) {
  const pathname = usePathname()

  const isMatched = useMemo(() => {
    if (matchPaths) return matchPaths.some((path) => pathname.startsWith(path))
    return pathname.startsWith(base) && pathname !== base
  }, [matchPaths, pathname, base])

  const [open, setOpen] = useState(isMatched)
  const userToggled = useRef(false)
  const subRef = useRef<HTMLUListElement>(null)
  const liRef = useRef<HTMLLIElement>(null)

  const getIsCollapsed = useCallback(() => {
    const sidebar = liRef.current?.closest('.bp-sidebar')
    return sidebar?.classList.contains('bp-collapsed') ?? false
  }, [])

  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    userToggled.current = true
    setOpen((v) => !v)
  }, [])

  useEffect(() => {
    if (isMatched) {
      queueMicrotask(() => setOpen(true))
      userToggled.current = false
    } else if (!userToggled.current && !getIsCollapsed()) {
      queueMicrotask(() => setOpen(false))
    }
  }, [isMatched, getIsCollapsed])

  return (
    <li ref={liRef} className={isMatched && !open ? 'bp-active-item' : ''}>
      <a
        href="#"
        onClick={toggle}
        className={`bp-menu-link bp-menu-toggle flex items-center gap-2 mx-4 px-[0.9375rem] pr-[calc(0.9375rem+1.76em)] py-[0.3125rem] text-[0.9375rem] cursor-pointer relative ${open ? 'bp-open' : ''} ${
          isMatched && open ? 'bp-active-toggle' : isMatched && !open ? 'bp-active' : ''
        }`}
      >
        <i className={`bp-menu-icon bx ${icon} text-[1.375rem] shrink-0 w-[1.375rem] mr-2`}></i>
        <span className="bp-label truncate flex-1 leading-[1.375rem]">{label}</span>
        {!!badge && badge > 0 && (
          <span className="bp-badge ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-danger-500 rounded-full mr-1">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </a>
      <ul ref={subRef} className="bp-submenu" style={{ maxHeight: open ? '3000px' : '0px' }}>
        {children}
      </ul>
    </li>
  )
}
