'use client'

/* ── Color maps ── */
const colorMap = {
  primary: [
    'text-primary-700 bg-primary-50 border-primary-600/15',
    'dark:text-primary-300 dark:bg-primary-600/10 dark:border-primary-600/20',
  ].join(' '),
  secondary: [
    'text-surface-700 bg-surface-100 border-surface-200',
    'dark:text-surface-300 dark:bg-white/6 dark:border-surface-200',
  ].join(' '),
  success: [
    'text-success-800 bg-success-50 border-success-500/20',
    'dark:text-success-300 dark:bg-success-500/10 dark:border-success-500/20',
  ].join(' '),
  danger: [
    'text-danger-800 bg-danger-50 border-danger-500/20',
    'dark:text-danger-300 dark:bg-danger-500/10 dark:border-danger-500/20',
  ].join(' '),
  warning: [
    'text-warning-800 bg-warning-50 border-warning-500/20',
    'dark:text-warning-300 dark:bg-warning-500/10 dark:border-warning-500/20',
  ].join(' '),
  info: [
    'text-info-800 bg-info-50 border-info-500/20',
    'dark:text-info-300 dark:bg-info-500/10 dark:border-info-500/20',
  ].join(' '),
}

const base = [
  'relative flex items-start gap-2',
  'px-4 py-3 mb-4 text-sm leading-[1.375]',
  'border rounded-input',
].join(' ')

export default function Alert({
  variant = 'danger',
  dismissible = false,
  onDismiss = undefined,
  className = '',
  children,
  ...rest
}) {
  const cls = [base, colorMap[variant] ?? colorMap.danger, dismissible ? 'pr-12' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} role="alert" {...rest}>
      {children}
      {dismissible && (
        <button
          type="button"
          className="absolute top-0 right-0 p-[0.9375rem_1rem] bg-transparent border-none cursor-pointer opacity-50 hover:opacity-100 transition-opacity text-xl leading-none text-inherit"
          onClick={onDismiss}
          aria-label="Close"
        >
          <i className="bx bx-x"></i>
        </button>
      )}
    </div>
  )
}
