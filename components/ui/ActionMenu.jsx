'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';

/**
 * A React-state-managed action menu dropdown (three-dot / kebab menu).
 * Replaces the old Bootstrap-dependent dropdown pattern.
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
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={ref} onClick={(e) => e.stopPropagation()}>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={`bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full cursor-pointer ${triggerClassName}`}
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <i className={`bx ${icon}`} />
      </Button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-1 min-w-[160px] bg-card border border-surface-200 rounded-lg shadow-lg py-1 ${align === 'right' ? 'right-0' : 'left-0'} ${menuClassName}`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function Item({ children, onClick, className = '', danger = false, icon, disabled = false }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={`block w-full text-left px-4 py-2 text-sm hover:bg-surface-50 dark:hover:bg-white/6 cursor-pointer ${danger ? 'text-red-600' : 'text-surface-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
    >
      {icon && <i className={`bx ${icon} mr-2`} />}
      {children}
    </button>
  );
}

function Divider() {
  return <hr className="border-surface-200 my-1" />;
}

ActionMenu.Item = Item;
ActionMenu.Divider = Divider;
