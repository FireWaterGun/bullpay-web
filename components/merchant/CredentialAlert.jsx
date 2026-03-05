'use client'

import { useState } from 'react'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'

export default function CredentialAlert({ credentials, warning, onDismiss, t }) {
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  async function handleCopy(text, setter) {
    const ok = await copyText(text)
    if (ok) { setter(true); setTimeout(() => setter(false), 2000) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-xl shadow-xl mx-4 w-full" style={{ maxWidth: '500px' }}>
        <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
          <h5 className="font-semibold">
            {t('merchant.apiCredentials', { defaultValue: 'API Credentials' })}
          </h5>
          {onDismiss && <button type="button" className="text-surface-500 hover:text-surface-700 text-xl leading-none" onClick={onDismiss}>&times;</button>}
        </div>
        <div className="p-6">
          <div className="rounded-lg bg-amber-50 text-amber-700 py-2 px-3 mb-4" role="alert">
            <i className="bx bx-info-circle mr-1"></i>
            {warning || t('merchant.credentialWarning')}
          </div>

          {credentials.apiKey && (
            <div className="mb-3">
              <label className="form-label font-semibold mb-1">{t('merchant.apiKey', { defaultValue: 'API Key' })}</label>
              <div className="bp-input-group">
                <input type="text" className="form-input font-mono" value={credentials.apiKey} readOnly style={{ fontSize: '0.85rem' }} />
                <button className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100" onClick={() => handleCopy(credentials.apiKey, setCopiedKey)}>
                  <i className={`bx ${copiedKey ?'bx-check' : 'bx-copy'} mr-1`}></i>
                  {copiedKey ? t('merchant.copied', { defaultValue: 'Copied!' }) : t('actions.copy', { defaultValue: 'Copy' })}
                </button>
              </div>
            </div>
          )}
          {credentials.apiSecret && (
            <div className="mb-0">
              <label className="form-label font-semibold mb-1">{t('merchant.apiSecret', { defaultValue: 'API Secret' })}</label>
              <div className="bp-input-group">
                <input type="text" className="form-input font-mono" value={credentials.apiSecret} readOnly style={{ fontSize: '0.85rem' }} />
                <button className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100" onClick={() => handleCopy(credentials.apiSecret, setCopiedSecret)}>
                  <i className={`bx ${copiedSecret ?'bx-check' : 'bx-copy'} mr-1`}></i>
                  {copiedSecret ? t('merchant.copied', { defaultValue: 'Copied!' }) : t('actions.copy', { defaultValue: 'Copy' })}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-surface-200">
          <button type="button" className="btn btn-primary" onClick={onDismiss}>
            <i className="bx bx-check mr-1"></i>
            {t('merchant.credentialSaved', { defaultValue: 'I have saved my credentials' })}
          </button>
        </div>
      </div>
    </div>
  )
}
