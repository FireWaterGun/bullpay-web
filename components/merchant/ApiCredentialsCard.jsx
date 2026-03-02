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
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0">
          <i className="bx bx-key me-2 text-primary" style={{ fontSize: '1.1rem' }}></i>
          {t('merchant.apiCredentials', { defaultValue: 'API Credentials' })}
        </h6>
        <span className="badge bg-label-primary">
          <i className="bx bx-lock-alt me-1"></i>
          {t('merchant.encrypted', { defaultValue: 'Encrypted' })}
        </span>
      </div>
      <div className="card-body">
        {/* API Key */}
        <div className="mb-3">
          <label className="form-label fw-semibold small mb-1">
            <i className="bx bx-fingerprint me-1 text-muted"></i>
            API Key
          </label>
          <div className="input-group">
            <span className="input-group-text" style={{ background: 'var(--bs-gray-100)' }}>
              <i className="bx bx-key text-muted" style={{ fontSize: '0.9rem' }}></i>
            </span>
            <input
              type="text"
              className="form-control font-monospace bg-transparent"
              value={displayKey}
              readOnly
              style={{ fontSize: '0.85rem', letterSpacing: '0.02em' }}
            />
            {apiKey && (
              <>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowApiKey(v => !v)}
                  title={showApiKey ? 'Hide' : 'Reveal'}
                  style={{ borderColor: 'var(--bs-border-color)' }}
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
                  style={{ borderColor: 'var(--bs-border-color)' }}
                >
                  <i className="bx bx-copy"></i>
                </button>
              </>
            )}
          </div>
          {showApiKey && (
            <small className="text-warning d-block mt-1">
              <i className="bx bx-info-circle me-1"></i>
              {t('merchant.autoHide', { defaultValue: 'Auto-hides after 30 seconds' })}
            </small>
          )}
        </div>

        {/* API Secret */}
        <div className="mb-4">
          <label className="form-label fw-semibold small mb-1">
            <i className="bx bx-lock-alt me-1 text-muted"></i>
            API Secret
          </label>
          <div className="input-group">
            <span className="input-group-text" style={{ background: 'var(--bs-gray-100)' }}>
              <i className="bx bx-shield text-muted" style={{ fontSize: '0.9rem' }}></i>
            </span>
            <input
              type="text"
              className="form-control font-monospace bg-transparent"
              value={apiSecretMasked || '••••••••••••••••••••••••'}
              readOnly
              style={{ fontSize: '0.85rem', letterSpacing: '0.02em' }}
            />
            <span className="input-group-text text-muted small" style={{ background: 'var(--bs-gray-100)' }}>
              <i className="bx bx-lock-alt me-1" style={{ fontSize: '0.75rem' }}></i>
              {t('merchant.secretMasked', { defaultValue: 'masked' })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="d-flex flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
          <button className="btn btn-outline-primary btn-sm" onClick={onRotate}>
            <i className="bx bx-refresh me-1"></i>
            {t('merchant.rotateSecret', { defaultValue: 'Rotate Secret' })}
          </button>
          <button className="btn btn-outline-danger btn-sm" onClick={onRegenerate}>
            <i className="bx bx-reset me-1"></i>
            {t('merchant.regenerateKey', { defaultValue: 'Regenerate Key & Secret' })}
          </button>
        </div>
      </div>
    </div>
  )
}
