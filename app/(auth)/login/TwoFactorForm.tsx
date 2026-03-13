'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'

const CODE_INPUT_STYLE = { fontSize: '24px', letterSpacing: '8px', fontWeight: 600 } as const
const EMPTY_STYLE = {} as const

interface TwoFactorFormProps {
  loading: boolean
  onSubmit: (code: string) => Promise<void>
  onBack: () => void
}

export default function TwoFactorForm({ loading, onSubmit, onBack }: TwoFactorFormProps) {
  const [twoFACode, setTwoFACode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(twoFACode.trim())
  }

  return (
    <>
      <div className="text-center mb-6">
        <div className="mb-3">
          <i className="bx bx-shield-quarter text-primary-600 text-5xl"></i>
        </div>
        <h5 className="text-lg font-semibold mb-1">Two-Factor Authentication</h5>
        <p className="text-sm text-surface-500">
          {useBackupCode
            ? 'Enter one of your backup codes'
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="twoFACode">{useBackupCode ? 'Backup Code' : 'Authentication Code'}</Label>
          <Input
            type="text"
            id="twoFACode"
            placeholder={useBackupCode ? 'ABCD-EFGH' : '000000'}
            maxLength={useBackupCode ? 20 : 6}
            autoComplete="one-time-code"
            inputMode={useBackupCode ? 'text' : 'numeric'}
            pattern={useBackupCode ? undefined : '[0-9]*'}
            value={twoFACode}
            onChange={(e) => {
              if (useBackupCode) {
                setTwoFACode(e.target.value)
              } else {
                setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
            }}
            autoFocus
            style={useBackupCode ? EMPTY_STYLE : CODE_INPUT_STYLE}
            className="text-center"
          />
        </div>

        <Button type="submit" disabled={loading || !twoFACode.trim()} className="w-full">
          {loading ? 'Verifying...' : 'Verify'}
        </Button>
      </form>

      <div className="text-center mt-6 space-y-2">
        <button
          type="button"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors cursor-pointer"
          onClick={() => {
            setUseBackupCode(!useBackupCode)
            setTwoFACode('')
          }}
        >
          {useBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
        </button>
        <br />
        <button
          type="button"
          className="text-sm text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
          onClick={onBack}
        >
          <i className="bx bx-arrow-back mr-1"></i>
          Back to login
        </button>
      </div>
    </>
  )
}
