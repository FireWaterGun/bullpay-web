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

  return (
    <div className="card mb-4">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0">{t('merchant.apiCredentials', { defaultValue: 'API Credentials' })}</h6>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-borderless mb-0">
            <tbody>
              <tr>
                <td className="ps-0" style={{ width: 110 }}><span className="fw-medium">API Key</span></td>
                <td>
                  <div className="d-flex align-items-center">
                    <span className="font-monospace" style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
                      {apiKey
                        ? showApiKey
                          ? apiKey
                          : `${apiKey.slice(0, 4)}${'••••••••'}${apiKey.slice(-4)}`
                        : '-'}
                    </span>
                    {apiKey && (
                      <>
                        <button
                          className="btn btn-sm btn-icon btn-text-secondary ms-1 flex-shrink-0"
                          onClick={() => setShowApiKey(v => !v)}
                          title={showApiKey ? 'Hide' : 'Reveal'}
                        >
                          <i className={`bx ${showApiKey ? 'bx-hide' : 'bx-show'}`}></i>
                        </button>
                        <button
                          className="btn btn-sm btn-icon btn-text-secondary flex-shrink-0"
                          onClick={async () => {
                            const ok = await copyText(apiKey)
                            if (ok) toast.success(t('merchant.copied', { defaultValue: 'Copied!' }))
                          }}
                        >
                          <i className="bx bx-copy"></i>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="ps-0"><span className="fw-medium">API Secret</span></td>
                <td>
                  <span className="font-monospace" style={{ fontSize: '0.85rem' }}>{apiSecretMasked || '••••••••'}</span>
                  <small className="text-muted ms-2">
                    <i className="bx bx-lock-alt" style={{ fontSize: '0.75rem' }}></i> {t('merchant.secretMasked', { defaultValue: 'masked' })}
                  </small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="d-flex gap-2 mt-3">
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
