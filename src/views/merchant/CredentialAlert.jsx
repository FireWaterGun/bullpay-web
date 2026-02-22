import { useState } from 'react'
import { copyToClipboard as copyText } from '../../utils/clipboard'

export default function CredentialAlert({ credentials, warning, onDismiss, t }) {
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  async function handleCopy(text, setter) {
    const ok = await copyText(text)
    if (ok) { setter(true); setTimeout(() => setter(false), 2000) }
  }

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {t('merchant.apiCredentials', { defaultValue: 'API Credentials' })}
            </h5>
            {onDismiss && <button type="button" className="btn-close" onClick={onDismiss}></button>}
          </div>
          <div className="modal-body">
            <div className="alert alert-warning py-2 mb-4" role="alert">
              <i className="bx bx-info-circle me-1"></i>
              {warning || t('merchant.credentialWarning')}
            </div>

            {credentials.apiKey && (
              <div className="mb-3">
                <label className="form-label fw-semibold mb-1">API Key</label>
                <div className="input-group">
                  <input type="text" className="form-control font-monospace" value={credentials.apiKey} readOnly style={{ fontSize: '0.85rem' }} />
                  <button className="btn btn-outline-secondary" onClick={() => handleCopy(credentials.apiKey, setCopiedKey)}>
                    <i className={`bx ${copiedKey ? 'bx-check' : 'bx-copy'} me-1`}></i>
                    {copiedKey ? t('merchant.copied', { defaultValue: 'Copied!' }) : 'Copy'}
                  </button>
                </div>
              </div>
            )}
            {credentials.apiSecret && (
              <div className="mb-0">
                <label className="form-label fw-semibold mb-1">API Secret</label>
                <div className="input-group">
                  <input type="text" className="form-control font-monospace" value={credentials.apiSecret} readOnly style={{ fontSize: '0.85rem' }} />
                  <button className="btn btn-outline-secondary" onClick={() => handleCopy(credentials.apiSecret, setCopiedSecret)}>
                    <i className={`bx ${copiedSecret ? 'bx-check' : 'bx-copy'} me-1`}></i>
                    {copiedSecret ? t('merchant.copied', { defaultValue: 'Copied!' }) : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={onDismiss}>
              <i className="bx bx-check me-1"></i>
              {t('merchant.credentialSaved', { defaultValue: 'I have saved my credentials' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
