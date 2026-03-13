'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

/**
 * A React-state-managed action menu dropdown (three-dot / kebab menu).
 * Uses a React Portal so the menu is never clipped by overflow containers.
 *
 * Usage:
 *   <ActionMenu>
 *     <ActionMenu.Item onClick={...}>Edit</ActionMenu.Item>
 *     <ActionMenu.Divider />
 *     <ActionMenu.Item danger onClick={...}>Delete</ActionMenu.Item>
 *   </ActionMenu>
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Menu items (ActionMenu.Item / ActionMenu.Divider)
 * @param {string} [props.icon='bx-dots-vertical-rounded'] - Boxicon class for the trigger
 * @param {string} [props.variant] - Button variant for the trigger
 * @param {string} [props.size='icon'] - Button size for the trigger
 * @param {string} [props.triggerClassName] - Extra classes for the trigger button
 * @param {string} [props.className] - Extra classes for the wrapper
 * @param {string} [props.menuClassName] - Extra classes for the menu panel
 * @param {string} [props.align='right'] - Menu alignment: 'right' or 'left'
 */
export default function ActionMenu({
  children,
  icon = 'bx-dots-vertical-rounded',
  variant,
  size = 'icon',
  triggerClassName = '',
  className = '',
  menuClassName = '',
  align = 'right',
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 160 // min-w-[160px]
    let left = align === 'right' ? rect.right : rect.left
    // Clamp to viewport boundaries
    if (align === 'right') {
      const rightEdge = window.innerWidth - left
      if (rightEdge + menuWidth > window.innerWidth) {
        left = menuWidth
      }
    } else if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8
    }
    setPos({
      top: rect.bottom + 4,
      left,
    })
  }, [align])

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, { passive: true, capture: true })
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, { capture: true })
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  return (
    <div className={`relative inline-block ${className}`} ref={triggerRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-transparent text-surface-600 hover:bg-surface-100 dark:hover:bg-white/6 hover:text-surface-700 transition-colors cursor-pointer ${triggerClassName}`}
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <i className={`bx ${icon} text-lg`} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className={`fixed z-[9999] min-w-[160px] bg-card border border-surface-200 rounded-lg shadow-lg py-1 ${menuClassName}`}
            style={{
              top: pos.top,
              ...(align === 'right' ? { right: window.innerWidth - pos.left } : { left: pos.left }),
            }}
            onClick={() => setOpen(false)}
          >
            {children}
          </div>,
          document.body
        )}
    </div>
  )
}

function Item({ children, onClick, className = '', danger = false, icon, disabled = false }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={`block w-full text-left px-4 py-2 text-sm hover:bg-surface-50 dark:hover:bg-white/6 cursor-pointer ${danger ? 'text-danger-600' : 'text-surface-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
    >
      {icon && <i className={`bx ${icon} mr-2`} />}
      {children}
    </button>
  )
}

function Divider() {
  return <hr className="border-surface-200 my-1" />
}

ActionMenu.Item = Item
ActionMenu.Divider = Divider
