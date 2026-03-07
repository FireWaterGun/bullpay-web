'use client'

import Link from 'next/link'

/* ── Variant → CSS class mapping ── */
const variantCls = {
  primary: 'btn-primary',
  danger: 'btn-danger',
  success: 'btn-success',
  warning: 'btn-warning',
  secondary: 'btn-secondary',
  info: 'btn-info',
  'outline-primary': 'btn-outline-primary',
  'outline-secondary': 'btn-outline-secondary',
  'outline-danger': 'btn-outline-danger',
  'outline-warning': 'btn-outline-warning',
  'outline-success': 'btn-outline-success',
  'outline-info': 'btn-outline-info',
  'text-primary': 'btn-text-primary',
  'text-secondary': 'btn-text-secondary',
  'label-secondary': 'btn-label-secondary',
}

/* ── Size → CSS class mapping ── */
const sizeCls = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  icon: 'btn-icon',
  'icon-sm': 'btn-icon-sm',
}

/**
 * Build the className string for a button variant + size.
 * Useful when you need button styling on a non-Button element.
 */
export function buttonClass(variant = 'primary', size = 'md', extra = '') {
  return ['btn-base', variantCls[variant] ?? 'btn-primary', sizeCls[size] ?? 'btn-md', extra].filter(Boolean).join(' ')
}

/**
 * Button component — renders as <button> by default, or <Link> when href is provided.
 */
export default function Button(props) {
  const { href, variant = 'primary', size = 'md', className = '', children, ...rest } = props
  const cls = ['btn-base', variantCls[variant] ?? 'btn-primary', sizeCls[size] ?? 'btn-md', className]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  )
}
