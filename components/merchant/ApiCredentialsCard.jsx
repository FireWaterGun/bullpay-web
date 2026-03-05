'use client'

import { useState, useEffect, useRef } from 'react'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'

export default function ApiCredentialsCard({ apiKey, apiSecretMasked, onRotate, onRegenerate, toast, t }) {
  const [showApiKey, setShowApiKey] = useState(false)
  const apiKeyTimerRef = useRef(null)

  useEffect(() => {
    if (showApiKey) {
      apiKeyTimerRef.current = setTimeout(() => setShowApiKey(false), 30_000)
      return () => clearTimeout(apiKeyTimerRef.current)
    }
  }, [showApiKey])

  const displayKey = apiKey
    ? showApiKey
      ? apiKey
      : `${apiKey.slice(0, 8)}${'••••••••••••••••'}${apiKey.slice(-6)}`
    : '-'

  return (
    <div className="card mb-4">
      <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
        <h6 className="mb-0 font-semibold">
          <i className="bx bx-key mr-2 text-primary-600" style={{ fontSize: '1.1rem' }}></i>
          {t('merchant.apiCredentials', { defaultValue: 'API Credentials' })}
        </h6>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
          <i className="bx bx-lock-alt mr-1"></i>
          {t('merchant.encrypted', { defaultValue: 'Encrypted' })}
        </span>
      </div>
      <div className="p-6">
        {/* API Key */}
        <div className="mb-3">
          <label className="form-label font-semibold text-sm mb-1">
            <i className="bx bx-fingerprint mr-1 text-surface-500"></i>
            {t('merchant.apiKey', { defaultValue: 'API Key' })}
          </label>
          <div className="bp-input-group">
            <span className="bp-input-suffix" style={{ background: 'var(--color-surface-100, #f3f4f6)' }}>
              <i className="bx bx-key text-surface-500" style={{ fontSize: '0.9rem' }}></i>
            </span>
            <input
              type="text"
              className="form-input font-mono"
              value={displayKey}
              readOnly
              style={{ fontSize: '0.85rem', letterSpacing: '0.02em' }}
            />
            {apiKey && (
              <>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowApiKey(v => !v)}
                  title={showApiKey ? t('merchant.hide', { defaultValue: 'Hide' }) : t('merchant.reveal', { defaultValue: 'Reveal' })}
                >
                  <i className={`bx ${showApiKey ? 'bx-hide' : 'bx-show'}`}></i>
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={async () => {
                    const ok = await copyText(apiKey)
                    if (ok) toast.success(t('merchant.copied', { defaultValue: 'Copied!' }))
                  }}
                  title={t('actions.copy', { defaultValue: 'Copy' })}
                >
                  <i className="bx bx-copy"></i>
                </button>
              </>
            )}
          </div>
          {showApiKey && (
            <small className="text-amber-500 block mt-1">
              <i className="bx bx-info-circle mr-1"></i>
              {t('merchant.autoHide', { defaultValue: 'Auto-hides after 30 seconds' })}
            </small>
          )}
        </div>

        {/* API Secret */}
        <div className="mb-4">
          <label className="form-label font-semibold text-sm mb-1">
            <i className="bx bx-lock-alt mr-1 text-surface-500"></i>
            {t('merchant.apiSecret', { defaultValue: 'API Secret' })}
          </label>
          <div className="bp-input-group">
            <span className="bp-input-suffix" style={{ background: 'var(--color-surface-100, #f3f4f6)' }}>
              <i className="bx bx-shield text-surface-500" style={{ fontSize: '0.9rem' }}></i>
            </span>
            <input
              type="text"
              className="form-input font-mono"
              value={apiSecretMasked || '••••••••••••••••••••••••'}
              readOnly
              style={{ fontSize: '0.85rem', letterSpacing: '0.02em' }}
            />
            <span className="bp-input-suffix text-surface-500 text-sm" style={{ background: 'var(--color-surface-100, #f3f4f6)' }}>
              <i className="bx bx-lock-alt mr-1" style={{ fontSize: '0.75rem' }}></i>
              {t('merchant.secretMasked', { defaultValue: 'masked' })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-200">
          <button className="btn btn-outline-primary btn-sm" onClick={onRotate}>
            <i className="bx bx-refresh mr-1"></i>
            {t('merchant.rotateSecret', { defaultValue: 'Rotate Secret' })}
          </button>
          <button className="btn btn-outline-danger btn-sm" onClick={onRegenerate}>
            <i className="bx bx-reset mr-1"></i>
            {t('merchant.regenerateKey', { defaultValue: 'Regenerate Key & Secret' })}
          </button>
        </div>
      </div>
    </div>
  )
}
