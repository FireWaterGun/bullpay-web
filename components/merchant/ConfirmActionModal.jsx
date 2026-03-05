'use client'

import { useState, useEffect, useRef } from 'react'

export default function ConfirmActionModal({ action, loading, is2FAEnabled, onConfirm, onClose, error, t }) {
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const passwordRef = useRef(null)
  const totpRef = useRef(null)

  // Password is always required for Level 2 actions (rotate-secret, regenerate-key)
  // 2FA is only required when 2FA is enabled
  const needsPassword = true
  const needs2FA = is2FAEnabled

  // Focus first input on mount
  useEffect(() => {
    if (passwordRef.current) {
      passwordRef.current.focus()
    }
  }, [])

  const canSubmit = !loading && (!needsPassword || password.trim()) && (!needs2FA || totpCode.trim())

  function handleSubmit(e) {
    e?.preventDefault()
    if (!canSubmit) return
    onConfirm({
      ...(needsPassword && { password }),
      ...(needs2FA && { totpCode: totpCode.trim() }),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !loading && onClose()}>
      <div className="bg-white rounded-xl shadow-xl mx-4 w-full" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
            <h5 className="font-semibold">
              {action === 'rotate-secret'
                ? t('merchant.rotateSecretTitle', { defaultValue: 'Rotate API Secret' })
                : t('merchant.regenerateKeyTitle', { defaultValue: 'Regenerate API Key & Secret' })
              }
            </h5>
            <button type="button" className="text-surface-500 hover:text-surface-700 text-xl leading-none" onClick={onClose} disabled={loading}>&times;</button>
          </div>
          <div className="p-6">
            {/* Action warning */}
            {action === 'rotate-secret' ? (
              <div className="rounded-lg bg-blue-50 text-blue-700 py-2 px-3 mb-3" role="alert">
                <i className="bx bx-info-circle mr-1"></i>
                {t('merchant.rotateConfirm', { defaultValue: 'This will generate a new API secret. Your API key will remain the same. The old secret will stop working immediately.' })}
              </div>
            ) : (
              <div className="rounded-lg bg-red-50 text-red-700 py-2 px-3 mb-3" role="alert">
                <i className="bx bx-error mr-1"></i>
                {t('merchant.regenerateConfirm', { defaultValue: 'This will generate a new API key AND secret. All existing credentials will be invalidated immediately.' })}
              </div>
            )}

            {/* Password field — always required for Level 2 actions */}
            <div className="mb-3">
              <label className="form-label font-semibold text-sm" htmlFor="merchant-action-password">
                <i className="bx bx-lock-alt mr-1"></i>
                {t('merchant.enterPassword', { defaultValue: 'Password' })}
              </label>
              <div className="bp-input-group">
                <input
                  ref={passwordRef}
                  id="merchant-action-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('merchant.passwordPlaceholder', { defaultValue: 'Enter your current password' })}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'}`}></i>
                </button>
              </div>
            </div>

            {/* TOTP field — only when 2FA is enabled */}
            {is2FAEnabled && (
              <div className="mb-2">
                <label className="form-label font-semibold text-sm" htmlFor="merchant-action-totp">
                  <i className="bx bx-shield mr-1"></i>
                  {t('merchant.enter2FACode', { defaultValue: '2FA Code' })}
                </label>
                <input
                  ref={totpRef}
                  id="merchant-action-totp"
                  type="text"
                  className="form-input"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 9))}
                  placeholder={t('merchant.totpPlaceholder', { defaultValue: '6-digit code or backup code' })}
                  disabled={loading}
                  maxLength={9}
                  autoComplete="one-time-code"
                />
                <div className="text-surface-500 text-xs mt-1">
                  {t('merchant.totpHint', { defaultValue: 'Enter the code from your authenticator app or a backup code.' })}
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 py-2 px-3 text-sm mt-3" role="alert">
                <i className="bx bx-error-circle mr-1"></i>
                {error}
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="submit"
              className={`btn ${action === 'rotate-secret' ? 'btn-primary' : 'btn-danger'}`}
              disabled={!canSubmit}
            >
              {loading ? (
                <><span className="spinner w-4 h-4 border-2 mr-1 inline-block align-middle"></span>{t('merchant.processing', { defaultValue: 'Processing...' })}</>
              ) : (
                action === 'rotate-secret'
                  ? t('merchant.rotateSecret', { defaultValue: 'Rotate Secret' })
                  : t('merchant.regenerateKey', { defaultValue: 'Regenerate Key & Secret' })
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
