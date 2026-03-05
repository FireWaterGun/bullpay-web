'use client';

import { useState } from 'react';
import { copyToClipboard as copyText } from '@/lib/utils/clipboard';
import { Button, Input, InputGroup, Label } from '../ui'

export default function CredentialAlert({ credentials, warning, onDismiss, t }) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  async function handleCopy(text, setter) {
    const ok = await copyText(text);
    if (ok) {setter(true);setTimeout(() => setter(false), 2000);}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl mx-4 w-full max-w-[500px]">
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

          {credentials.apiKey &&
          <div className="mb-3">
              <Label className="font-semibold mb-1">{t('merchant.apiKey', { defaultValue: 'API Key' })}</Label>
              <InputGroup>
                <Input type="text" value={credentials.apiKey} readOnly className="font-mono text-[0.85rem]" />
                <Button onClick={() => handleCopy(credentials.apiKey, setCopiedKey)} variant="outline-secondary">
                  <i className={`bx ${copiedKey ? 'bx-check' : 'bx-copy'} mr-1`}></i>
                  {copiedKey ? t('merchant.copied', { defaultValue: 'Copied!' }) : t('actions.copy', { defaultValue: 'Copy' })}
                </Button>
              </InputGroup>
            </div>
          }
          {credentials.apiSecret &&
          <div className="mb-0">
              <Label className="font-semibold mb-1">{t('merchant.apiSecret', { defaultValue: 'API Secret' })}</Label>
              <InputGroup>
                <Input type="text" value={credentials.apiSecret} readOnly className="font-mono text-[0.85rem]" />
                <Button onClick={() => handleCopy(credentials.apiSecret, setCopiedSecret)} variant="outline-secondary">
                  <i className={`bx ${copiedSecret ? 'bx-check' : 'bx-copy'} mr-1`}></i>
                  {copiedSecret ? t('merchant.copied', { defaultValue: 'Copied!' }) : t('actions.copy', { defaultValue: 'Copy' })}
                </Button>
              </InputGroup>
            </div>
          }
        </div>
        <div className="px-6 py-4 border-t border-surface-200">
          <Button type="button" onClick={onDismiss}>
            <i className="bx bx-check mr-1"></i>
            {t('merchant.credentialSaved', { defaultValue: 'I have saved my credentials' })}
          </Button>
        </div>
      </div>
    </div>);

}