'use client'

export default function AvatarInitial({ className = '', children, ...rest }) {
  const cls = [
    'inline-flex items-center justify-center',
    'w-10 h-10 text-base font-semibold rounded-input',
    className,
  ].filter(Boolean).join(' ')

  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  )
}
