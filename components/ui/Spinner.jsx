'use client'

const sizeMap = {
  sm: 'w-3.5 h-3.5 border-2',
  md: 'w-5 h-5 border-2',
  lg: 'w-8 h-8 border-3',
}

export default function Spinner({ size = 'md', className = '', ...rest }) {
  const cls = [
    'inline-block animate-spin rounded-full',
    'border-current border-r-transparent',
    sizeMap[size] ?? sizeMap.md,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={cls} role="status" {...rest}>
      <span className="sr-only">Loading...</span>
    </span>
  )
}

/**
 * Full-page centered spinner (replaces PageSpinner component)
 */
export function PageSpinner({ size = 'lg', className = '' }) {
  return (
    <div className={`flex-grow py-6 ${className}`}>
      <div className="flex justify-center items-center py-12">
        <Spinner size={size} className="text-primary-600" />
      </div>
    </div>
  )
}
