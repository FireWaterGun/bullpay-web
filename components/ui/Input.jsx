'use client'

/* ── Shared base for input & select ── */
const inputBase = [
  'block w-full transition-all',
  'px-[0.9375rem] py-[0.543rem]',
  'text-base font-normal leading-[1.375]',
  'text-surface-800 bg-transparent',
  'border border-surface-300 rounded-input',
  'placeholder:text-surface-400 placeholder:opacity-100',
  'hover:not-focus:not-disabled:not-read-only:border-surface-500',
  'focus:border-primary-600 focus:outline-none focus:shadow-input-focus',
  'disabled:text-surface-500 disabled:bg-surface-500/6 disabled:border-surface-500/24 disabled:opacity-100',
  'read-only:text-surface-500 read-only:bg-surface-500/6 read-only:border-surface-500/24 read-only:opacity-100',
  // dark
  'dark:border-surface-200',
  'dark:placeholder:text-surface-400',
  'dark:hover:not-focus:not-disabled:not-read-only:border-surface-300',
  'dark:focus:border-primary-500 dark:focus:shadow-input-focus-dark',
  'dark:disabled:bg-white/6 dark:disabled:border-white/12 dark:disabled:text-surface-400',
  'dark:read-only:bg-white/6 dark:read-only:border-white/12 dark:read-only:text-surface-400',
].join(' ')

/* ── Select-specific additions ── */
const selectExtra = [
  'appearance-none cursor-pointer',
  'pr-[2.625rem]',
  "bg-[url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 22' fill='none'%3e%3cpath d='M10.9999 12.0743L15.5374 7.53676L16.8336 8.83292L10.9999 14.6666L5.16626 8.83292L6.46243 7.53676L10.9999 12.0743Z' fill='%2322303e' fill-opacity='0.9'/%3e%3c/svg%3e\")] bg-no-repeat bg-[right_0.9375rem_center] bg-[length:22px_24px]",
  "dark:bg-[url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 22' fill='none'%3e%3cpath d='M10.9999 12.0743L15.5374 7.53676L16.8336 8.83292L10.9999 14.6666L5.16626 8.83292L6.46243 7.53676L10.9999 12.0743Z' fill='%23fff' fill-opacity='0.9'/%3e%3c/svg%3e\")]",
].join(' ')

/* ── Error modifier ── */
const errorCls = '!border-danger-500 focus:!shadow-[0_0.125rem_0.25rem_0_rgba(239,68,68,0.4)]'

/**
 * Return the base input className string.
 * Useful for non-Input elements that need input appearance (e.g. date picker triggers).
 */
export function inputClass(extra = '') {
  return [inputBase, extra].filter(Boolean).join(' ')
}

/**
 * Text / textarea input
 */
function Input(props) {
  const { error, className = '', ...rest } = props
  const Tag = rest.rows || rest.as === 'textarea' ? 'textarea' : 'input'
  const cls = [inputBase, error ? errorCls : '', Tag === 'textarea' ? 'resize-y min-h-[calc(1.375em+1.086rem+2px)]' : '', className]
    .filter(Boolean)
    .join(' ')

  return <Tag className={cls} {...rest} />
}

/**
 * Native <select>
 */
function Select(props) {
  const { error, className = '', children, ...rest } = props
  const cls = [inputBase, selectExtra, error ? errorCls : '', className].filter(Boolean).join(' ')

  return (
    <select className={cls} {...rest}>
      {children}
    </select>
  )
}

/**
 * Form label
 */
function Label({ className = '', children, ...rest }) {
  const cls = [
    'block font-medium mb-1.5 text-sm text-surface-700',

    className,
  ].filter(Boolean).join(' ')

  return (
    <label className={cls} {...rest}>
      {children}
    </label>
  )
}

/**
 * Input group wrapper (bp-input-group replacement)
 */
function InputGroup(props) {
  const { error, className = '', children, ...rest } = props
  const cls = [
    'relative flex items-stretch w-full',
    'border rounded-input bg-transparent',
    'transition-[border-color,box-shadow]',
    'border-surface-300 hover:border-surface-500',
    'focus-within:border-primary-600 focus-within:shadow-input-focus focus-within:hover:border-primary-600',
    // dark
    
    'dark:focus-within:border-primary-500 dark:focus-within:shadow-input-focus-dark',
    // Strip child form-element chrome (InputGroup owns the outer border)
    '[&>input]:!border-none [&>input]:!shadow-none [&>input]:!rounded-none [&>input]:!outline-none [&>input]:flex-1 [&>input]:min-w-0',
    '[&>input:focus]:!shadow-none [&>input:focus]:!outline-none',
    '[&>select]:!border-none [&>select]:!shadow-none [&>select]:!rounded-none [&>select]:flex-1 [&>select]:min-w-0',
    '[&>select:focus]:!shadow-none [&>select:focus]:!outline-none',
    '[&>textarea]:!border-none [&>textarea]:!shadow-none [&>textarea]:!rounded-none [&>textarea]:flex-1 [&>textarea]:min-w-0',
    '[&>textarea:focus]:!shadow-none [&>textarea:focus]:!outline-none',
    '[&>button]:!rounded-none [&>button]:!border-none [&>button]:!shadow-none [&>button]:shrink-0',
    // error
    error ? '!border-danger-500 focus-within:!border-danger-500 focus-within:!shadow-[0_0.125rem_0.25rem_0_rgba(239,68,68,0.4)]' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}

/**
 * Icon slot for InputGroup (replaces bp-input-suffix)
 * Set as="button" for clickable toggles (e.g. password visibility).
 */
function InputIcon(props) {
  const { as: Tag = 'span', className = '', children, ...rest } = props
  const cls = [
    'flex items-center justify-center px-[0.9375rem] text-base',
    'text-surface-500 bg-transparent border-none cursor-pointer',
    'transition-colors duration-fast shrink-0',
    'hover:text-surface-700',
    
    className,
  ].filter(Boolean).join(' ')

  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * Text addon for InputGroup (replaces input-group-text)
 */
function InputAddon({ className = '', children, ...rest }) {
  const cls = [
    'flex items-center px-[0.9375rem] py-[0.543rem] text-sm font-normal leading-[1.375]',
    'text-surface-600 whitespace-nowrap bg-surface-100 border-none shrink-0',
    'dark:bg-dark-elevated',
    className,
  ].filter(Boolean).join(' ')

  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  )
}

/* Strip borders from children inside InputGroup */
const inputGroupChildCls = '!border-none !bg-transparent !shadow-none !rounded-none flex-1 min-w-0 focus:!shadow-none focus:!outline-none'

export { Input, Select, Label, InputGroup, InputIcon, InputAddon, inputGroupChildCls }
export default Input
