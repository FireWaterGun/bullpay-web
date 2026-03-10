'use client'

import { useTranslation } from 'react-i18next'
import { Input, Label, Select } from '@/components/ui/Input'

const MAX_FIAT = 1000000

const FIAT_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
]

export { FIAT_CURRENCIES, MAX_FIAT }

export default function FiatAmountInput({
  fiatAmount,
  setFiatAmount,
  fiatCurrency,
  setFiatCurrency,
  fiatError,
  setFiatError,
}) {
  const { t } = useTranslation()

  function onInput(e) {
    const value = e.target.value

    // Limit: max 10 integer digits + 2 decimal places
    if (value.includes('.')) {
      const parts = value.split('.')
      if (parts[0] && parts[0].replace('-', '').length > 10) {
        parts[0] = parts[0].substring(0, parts[0].startsWith('-') ? 11 : 10)
      }
      if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].substring(0, 2)
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
      if (parts.length === 2 && parts[1].length > 2) {
        value = `${parts[0]}.${parts[1].substring(0, 2)}`
      }

      const num = parseFloat(value)
      if (!isNaN(num) && num > MAX_FIAT) {
        return
      }
    }

    setFiatAmount(value)

    if (value === '') {
      setFiatError('')
      return
    }

    const num = parseFloat(value)
    if (isNaN(num)) {
      setFiatError(t('validation.invalidAmount') || 'Invalid amount')
    } else if (num <= 0) {
      setFiatError(t('validation.amountMustBePositive') || 'Amount must be greater than 0')
    } else if (num > MAX_FIAT) {
      setFiatError(
        t('validation.amountTooLarge', { max: MAX_FIAT.toLocaleString() }) ||
          `Amount must not exceed ${MAX_FIAT.toLocaleString()}`
      )
    } else {
      setFiatError('')
    }
  }

  function onBlur(e) {
    let value = e.target.value
    if (value !== '') {
      const parts = value.split('.')
      if (parts.length === 2 && parts[1].length > 2) {
        value = `${parts[0]}.${parts[1].substring(0, 2)}`
        setFiatAmount(value)
      }
    }
  }

  return (
    <div>
      <Label>{t('invoices.fiatAmount')} *</Label>
      <div className="flex gap-2">
        <Select
          value={fiatCurrency}
          onChange={(e) => setFiatCurrency(e.target.value)}
          className="shrink-0 w-32"
        >
          {FIAT_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code}
            </option>
          ))}
        </Select>
        <div className="flex-1">
          <Input
            type="number"
            step="0.01"
            min={0.01}
            max={MAX_FIAT}
            placeholder="50.00"
            value={fiatAmount}
            onInput={onInput}
            onChange={onChange}
            onBlur={onBlur}
            required
            error={fiatError}
          />
        </div>
      </div>

      {fiatError && <div className="text-danger-500 text-xs mt-1">{fiatError}</div>}
      {!fiatError && (
        <small className="text-surface-500">
          {t('invoices.fiatMaxInfo', {
            max: MAX_FIAT.toLocaleString(),
            defaultValue: `Max: ${MAX_FIAT.toLocaleString()} (2 decimal places)`,
          })}
        </small>
      )}
    </div>
  )
}
