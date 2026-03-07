'use client'

import { createContext, useContext } from 'react'

/* ── InputGroup context ── */
const InputGroupCtx = createContext(false)

/**
 * Return the base input className string.
 * Useful for non-Input elements that need input appearance (e.g. date picker triggers).
 */
export function inputClass(extra = '') {
  return ['input-base', extra].filter(Boolean).join(' ')
}

/**
 * Text / textarea input
 */
function Input(props) {
  const { error, className = '', ...rest } = props
  const inGroup = useContext(InputGroupCtx)
  const Tag = rest.rows || rest.as === 'textarea' ? 'textarea' : 'input'

  const cls = inGroup
    ? ['input-group-child', className].filter(Boolean).join(' ')
    : [
        'input-base',
        error ? 'input-error' : '',
        Tag === 'textarea' ? 'resize-y min-h-[calc(1.375em+1.086rem+2px)]' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')

  return <Tag className={cls} {...rest} />
}

/**
 * Native <select>
 */
function Select(props) {
  const { error, className = '', children, ...rest } = props
  const inGroup = useContext(InputGroupCtx)

  const cls = inGroup
    ? ['input-group-child select-base', className].filter(Boolean).join(' ')
    : ['input-base select-base', error ? 'input-error' : '', className].filter(Boolean).join(' ')

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
  const cls = ['form-label', className].filter(Boolean).join(' ')

  return (
    <label className={cls} {...rest}>
      {children}
    </label>
  )
}

/**
 * Input group wrapper — provides context so child Input/Select
 * components automatically use stripped-down styling (no border/shadow/outline).
 * Focus ring is handled by the wrapper via focus-within.
 */
function InputGroup(props) {
  const { error, className = '', children, ...rest } = props
  const cls = ['input-group', error ? 'input-error' : '', className].filter(Boolean).join(' ')

  return (
    <InputGroupCtx.Provider value={true}>
      <div className={cls} {...rest}>
        {children}
      </div>
    </InputGroupCtx.Provider>
  )
}

/**
 * Icon slot for InputGroup (replaces bp-input-suffix)
 * Set as="button" for clickable toggles (e.g. password visibility).
 */
function InputIcon(props) {
  const { as: Tag = 'span', className = '', children, ...rest } = props
  const cls = ['input-icon', className].filter(Boolean).join(' ')

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
  const cls = ['input-addon', className].filter(Boolean).join(' ')

  return (
    <span className={cls} {...rest}>
      {children}
    </span>
  )
}

export { Input, Select, Label, InputGroup, InputIcon, InputAddon }
export default Input
