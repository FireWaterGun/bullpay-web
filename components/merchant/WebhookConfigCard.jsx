'use client'

import { useState, useCallback } from 'react'
import { useAuth, useToast } from '@/app/providers'
import { updateWebhook } from '@/lib/api/merchant'
import { get2FAStatus } from '@/lib/api/twoFactor'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { resolveSensitiveActionError } from '@/components/merchant/merchantHelpers'
import { Input, InputGroup, InputIcon, Label } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

export default function WebhookConfigCard({ merchant, onSaved, t }) {
  const { token } = useAuth()
  const toast = useToast()

  const [editing, setEditing] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const [totpCode, setTotpCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)

  const resetSecurityInputs = useCallback(() => {
    setTotpCode('')
    setPassword('')
    setError('')
  }, [])

  const load2FAStatus = useCallback(async () => {
    if (!token) return
    try {
      const res = await get2FAStatus(token)
      setIs2FAEnabled(!!res?.enabled)
    } catch {
      setIs2FAEnabled(false)
    }
  }, [token])

  async function handleSave() {
    if (!webhookUrl) {
      toast.error(t('merchant.webhookRequired', { defaultValue: 'Webhook URL is required' }))
      return
    }
    if (!password.trim()) {
      setError(t('merchant.passwordRequired', { defaultValue: 'Please enter your password' }))
      return
    }
    if (is2FAEnabled && !totpCode.trim()) {
      setError(t('merchant.totpRequiredForWebhook', { defaultValue: 'Please enter your 2FA code' }))
      return
    }
    try {
      setLoading(true)
      setError('')
      await updateWebhook(token, webhookUrl, {
        password: password.trim(),
        ...(is2FAEnabled && totpCode.trim() && { totpCode: totpCode.trim() }),
      })
      toast.success(t('merchant.webhookSuccess', { defaultValue: 'Webhook URL updated successfully' }))
      setEditing(false)
      resetSecurityInputs()
      onSaved?.()
    } catch (err) {
      const resolved = resolveSensitiveActionError(t, err, {
        key: 'merchant.webhookError',
        defaultValue: 'Failed to update webhook URL',
      })
      if (resolved.requires2FA) {
        setIs2FAEnabled(true)
      }
      setError(resolved.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-xl shadow-sm dark:shadow-card-dark border border-surface-200">
      <div className="flex justify-between items-center px-5 py-4 border-b border-surface-200">
        <h6 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-0">
          <i className="bx bx-broadcast text-primary-600 dark:text-primary-400"></i>
          {t('merchant.webhookTitle', { defaultValue: 'Webhook Configuration' })}
        </h6>
        {merchant?.hasWebhook ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-success-50 dark:bg-success-950/30 text-success-700 dark:text-success-400 rounded-md">
            <i className="bx bx-check-circle"></i>
            {t('merchant.configured', { defaultValue: 'Configured' })}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-surface-100 dark:bg-dark-elevated text-surface-500 dark:text-surface-400 rounded-md">
            <i className="bx bx-minus-circle"></i>
            {t('merchant.notConfigured', { defaultValue: 'Not Configured' })}
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-3 flex items-center gap-1">
          <i className="bx bx-info-circle"></i>
          {t('merchant.webhookDesc', {
            defaultValue: 'Set a callback URL to receive real-time payment notifications via webhook.',
          })}
        </p>

        {editing ? (
          <>
            <div className="mb-3">
              <Label className="font-semibold text-sm">
                {t('merchant.callbackUrl', { defaultValue: 'Callback URL' })}
              </Label>
              <InputGroup>
                <InputIcon>
                  <i className="bx bx-link"></i>
                </InputIcon>
                <Input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://example.com/webhooks/payment"
                  maxLength={500}
                  autoFocus
                />
              </InputGroup>
            </div>
            {/* Password */}
            <div className="mb-3">
              <Label htmlFor="webhook-password" className="font-semibold text-sm">
                <i className="bx bx-lock-alt mr-1"></i>
                {t('merchant.enterPassword', { defaultValue: 'Password' })}
              </Label>
              <InputGroup>
                <Input
                  id="webhook-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('merchant.passwordPlaceholder', { defaultValue: 'Enter your current password' })}
                  maxLength={128}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="text-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'}`}></i>
                </Button>
              </InputGroup>
            </div>
            {is2FAEnabled && (
              <div className="mb-3">
                <Label htmlFor="webhook-totp" className="font-semibold text-sm">
                  <i className="bx bx-shield mr-1"></i>
                  {t('merchant.enter2FACode', { defaultValue: '2FA Code' })}
                </Label>
                <Input
                  id="webhook-totp"
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 9))}
                  placeholder={t('merchant.totpPlaceholder', { defaultValue: '6-digit code or backup code' })}
                  disabled={loading}
                  maxLength={9}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                  {t('merchant.totpHint', {
                    defaultValue: 'Enter the code from your authenticator app or a backup code.',
                  })}
                </p>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800 rounded-lg text-sm text-danger-700 dark:text-danger-400 mb-3">
                <i className="bx bx-error-circle"></i>
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner className="w-3.5 h-3.5 mr-1.5 inline-block" />
                    {t('merchant.saving', { defaultValue: 'Saving...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-check mr-1"></i>
                    {t('merchant.save', { defaultValue: 'Save' })}
                  </>
                )}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setEditing(false)
                  resetSecurityInputs()
                }}
                disabled={loading}
              >
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </div>
          </>
        ) : (
          <>
            {merchant?.webhookUrl && (
              <div className="mb-3">
                <Label className="font-semibold text-sm">
                  {t('merchant.callbackUrl', { defaultValue: 'Callback URL' })}
                </Label>
                <div className="flex items-center gap-2 p-2.5 bg-surface-50 rounded-lg dark:bg-dark-elevated">
                  <span className="font-mono text-sm text-surface-700 dark:text-surface-300 break-all flex-1">
                    {merchant.webhookUrl}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center w-7 h-7 rounded text-surface-400 dark:text-surface-500 hover:bg-surface-200 dark:hover:bg-white/6 hover:text-surface-600 dark:hover:text-surface-200 transition-colors shrink-0 cursor-pointer"
                    onClick={async () => {
                      const ok = await copyToClipboard(merchant.webhookUrl)
                      if (ok) toast.success(t('merchant.copied', { defaultValue: 'Copied!' }))
                    }}
                    title={t('actions.copy', { defaultValue: 'Copy' })}
                  >
                    <i className="bx bx-copy text-sm"></i>
                  </button>
                </div>
              </div>
            )}
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                setWebhookUrl(merchant?.webhookUrl || '')
                setEditing(true)
                load2FAStatus()
              }}
            >
              <i className="bx bx-edit mr-1"></i>
              {merchant?.hasWebhook
                ? t('merchant.updateWebhook', { defaultValue: 'Update Webhook' })
                : t('merchant.setWebhook', { defaultValue: 'Set Webhook URL' })}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
