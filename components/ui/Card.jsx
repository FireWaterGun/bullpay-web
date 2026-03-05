'use client'

/**
 * Card — replaces `.card` CSS class
 * Card inner layout uses Tailwind directly: no card-body/card-header classes needed.
 */
export default function Card({ className = '', children, ...rest }) {
  const cls = [
    'bg-white border border-surface-200 rounded-card shadow-card',
    'dark:bg-dark-paper dark:border-dark-border dark:shadow-card-dark',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}

/**
 * CardHeader — optional convenience wrapper
 */
export function CardHeader({ className = '', children, ...rest }) {
  const cls = [
    'px-6 py-4 border-b border-surface-200',
    'dark:border-dark-border',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}

/**
 * CardBody — optional convenience wrapper
 */
export function CardBody({ className = '', children, ...rest }) {
  return (
    <div className={`p-6 ${className}`} {...rest}>
      {children}
    </div>
  )
}
