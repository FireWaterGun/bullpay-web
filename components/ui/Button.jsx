'use client'

import Link from 'next/link'

/* ── Variant style maps ── */
const solid = {
  primary:
    'bg-primary-600 text-white border-primary-600 hover:bg-primary-700 hover:border-primary-700 hover:shadow-btn-hover hover:-translate-y-px active:translate-y-0 disabled:bg-[#93b4f5] disabled:border-[#93b4f5] disabled:opacity-100',
  danger:
    'bg-danger-500 text-white border-danger-500 hover:bg-danger-600 hover:border-danger-600',
  success:
    'bg-success-500 text-white border-success-500 hover:bg-success-600 hover:border-success-600',
  warning:
    'bg-warning-500 text-white border-warning-500 hover:bg-warning-600 hover:border-warning-600',
  secondary:
    'bg-surface-200 text-surface-700 border-surface-200 hover:bg-surface-300 dark:bg-white/8 dark:text-surface-900-text dark:border-transparent dark:hover:bg-white/12',
  info:
    'bg-info-500 text-white border-info-500 hover:bg-info-600 hover:border-info-600',
}

const outline = {
  primary:
    'bg-transparent text-primary-600 border-primary-600 hover:bg-primary-600 hover:text-white dark:text-primary-400 dark:border-primary-500/40 dark:hover:bg-primary-600 dark:hover:text-white dark:hover:border-primary-600',
  secondary:
    'bg-transparent text-surface-500 border-surface-300 hover:text-surface-700 hover:bg-surface-100 hover:border-surface-400 dark:text-surface-900-text dark:border-dark-border dark:hover:text-[#e2e4e9] dark:hover:bg-white/6 dark:hover:border-dark-border-hover',
  danger:
    'bg-transparent text-danger-500 border-danger-500 hover:bg-danger-500 hover:text-white dark:text-[#fca5a5] dark:border-danger-500/40 dark:hover:bg-danger-600 dark:hover:text-white dark:hover:border-danger-600',
  warning:
    'bg-transparent text-warning-500 border-warning-500 hover:bg-warning-500 hover:text-white dark:text-[#fcd34d] dark:border-warning-500/40 dark:hover:bg-warning-600 dark:hover:text-white dark:hover:border-warning-600',
  success:
    'bg-transparent text-success-500 border-success-500 hover:bg-success-500 hover:text-white dark:text-[#86efac] dark:border-success-500/40 dark:hover:bg-success-600 dark:hover:text-white dark:hover:border-success-600',
  info:
    'bg-transparent text-info-500 border-info-500 hover:bg-info-500 hover:text-white dark:text-[#67e8f9] dark:border-info-500/40 dark:hover:bg-[#0891b2] dark:hover:text-white dark:hover:border-[#0891b2]',
}

const text = {
  primary:
    'bg-transparent text-primary-600 border-transparent shadow-none hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10',
  secondary:
    'bg-transparent text-surface-600 border-transparent shadow-none hover:bg-surface-100 dark:text-surface-900-text dark:hover:bg-white/6',
}

const label = {
  secondary:
    'bg-surface-100 text-surface-700 border-transparent shadow-none hover:bg-surface-200 dark:bg-white/8 dark:text-surface-900-text dark:hover:bg-white/12',
}

/* Merge maps for lookup:  "primary" | "outline-secondary" | "text-primary" | "label-secondary" */
const variantMap = {
  ...Object.fromEntries(Object.entries(solid).map(([k, v]) => [k, v])),
  ...Object.fromEntries(Object.entries(outline).map(([k, v]) => [`outline-${k}`, v])),
  ...Object.fromEntries(Object.entries(text).map(([k, v]) => [`text-${k}`, v])),
  ...Object.fromEntries(Object.entries(label).map(([k, v]) => [`label-${k}`, v])),
}

/* ── Sizes ── */
const sizeMap = {
  sm: 'px-[0.8rem] py-[0.4rem] text-sm',
  md: 'px-5 py-[0.4812rem] text-base',
  lg: 'px-6 py-[0.8rem] text-lg',
  icon: 'p-2 w-[38px] h-[38px]',
}

/* ── Base classes (shared by all) ── */
const base =
  'inline-flex items-center justify-center font-medium transition-all cursor-pointer rounded-btn border leading-[1.375] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none'

/**
 * Build the className string for a button variant + size.
 * Useful when you need button styling on a non-Button element.
 */
export function buttonClass(variant = 'primary', size = 'md', extra = '') {
  return [base, variantMap[variant] ?? variantMap.primary, sizeMap[size] ?? sizeMap.md, extra]
    .filter(Boolean)
    .join(' ')
}

/**
 * Button component — renders as <button> by default, or <Link> when href is provided.
 */
export default function Button(props) {
  const { href, variant = 'primary', size = 'md', className = '', children, ...rest } = props
  const cls = [base, variantMap[variant] ?? variantMap.primary, sizeMap[size] ?? sizeMap.md, className]
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
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
