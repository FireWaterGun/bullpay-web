'use client'

import { useTranslation } from 'react-i18next'
import { Input, Label } from '@/components/ui/Input'

export const MAX_DEPOSIT = 1000000

export default function AmountInput({ amount, setAmount, amountError, setAmountError, minDeposit, maxDecimals = 8 }) {
  const { t } = useTranslation()

  function onInput(e) {
    const value = e.target.value

    if (value.includes('.')) {
      const parts = value.split('.')

      if (parts[0] && parts[0].replace('-', '').length > 10) {
        parts[0] = parts[0].substring(0, parts[0].startsWith('-') ? 11 : 10)
      }

      if (parts[1] && parts[1].length > maxDecimals) {
        parts[1] = parts[1].substring(0, maxDecimals)
      }

      e.target.value = parts.join('.')
    } else if (value && value.replace('-', '').length > 10) {
      e.target.value = value.substring(0, value.startsWith('-') ? 11 : 10)
    }
  }

  function onChange(e) {
    let value = e.target.value

    if (value !== '') {
      const parts = value.split('.')
      if (parts.length === 2 && parts[1].length > maxDecimals) {
        value = `${parts[0]}.${parts[1].substring(0, maxDecimals)}`
      }

      const num = parseFloat(value)
      if (!isNaN(num) && num > MAX_DEPOSIT) {
        return
      }
    }

    setAmount(value)

    if (value === '') {
      setAmountError('')
      return
    }

    const num = parseFloat(value)
    if (isNaN(num)) {
      setAmountError(t('validation.invalidAmount') || 'Invalid amount')
    } else if (num <= 0) {
      setAmountError(t('validation.amountMustBePositive') || 'Amount must be greater than 0')
    } else if (minDeposit > 0 && num < minDeposit) {
      setAmountError(t('validation.amountTooSmall', { min: minDeposit }) || `Amount must be at least ${minDeposit}`)
    } else if (num > MAX_DEPOSIT) {
      setAmountError(
        t('validation.amountTooLarge', { max: MAX_DEPOSIT.toLocaleString() }) ||
          `Amount must not exceed ${MAX_DEPOSIT.toLocaleString()}`
      )
    } else {
      setAmountError('')
    }
  }

  function onBlur(e) {
    let value = e.target.value
    if (value !== '') {
      const parts = value.split('.')
      if (parts.length === 2 && parts[1].length > maxDecimals) {
        value = `${parts[0]}.${parts[1].substring(0, maxDecimals)}`
        setAmount(value)
      }
    }
  }

  const stepValue = maxDecimals > 0 ? `0.${'0'.repeat(maxDecimals - 1)}1` : '1'

  return (
    <div className="col-span-12 sm:col-span-6 md:col-span-4">
      <Label>{t('invoices.amount')} *</Label>
      <Input
        type="number"
        step={stepValue}
        min={minDeposit || 0}
        max={MAX_DEPOSIT}
        placeholder={minDeposit > 0 ? String(minDeposit) : '0.001'}
        value={amount}
        onInput={onInput}
        onChange={onChange}
        onBlur={onBlur}
        required
        error={amountError}
      />

      {amountError && <div className="text-danger-500 text-xs mt-1">{amountError}</div>}
      {!amountError && (
        <small className="text-surface-500">
          {t('invoices.maxAmountInfo', { max: MAX_DEPOSIT.toLocaleString() })}
          {' '}({t('validation.maxDecimals', { count: maxDecimals, defaultValue: `Max ${maxDecimals} decimals` })})
        </small>
      )}
    </div>
  )
}
