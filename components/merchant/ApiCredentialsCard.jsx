'use client'

import { useState, useEffect, useRef } from 'react'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { Input, InputGroup, InputIcon, Label } from '../ui/Input'

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
    <Card className="mb-4">
      <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
        <h6 className="mb-0 font-semibold text-surface-900">
          <i className="bx bx-key mr-2 text-primary-600 dark:text-primary-400 text-[1.1rem]"></i>
          {t('merchant.apiCredentials', { defaultValue: 'API Credentials' })}
        </h6>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400">
          <i className="bx bx-lock-alt mr-1"></i>
          {t('merchant.encrypted', { defaultValue: 'Encrypted' })}
        </span>
      </div>
      <div className="p-6">
        {/* API Key */}
        <div className="mb-3">
          <Label className="font-semibold text-sm mb-1">
            <i className="bx bx-fingerprint mr-1 text-surface-500 dark:text-surface-400"></i>
            {t('merchant.apiKey', { defaultValue: 'API Key' })}
          </Label>
          <InputGroup>
            <InputIcon className="bg-surface-100 dark:bg-dark-elevated">
              <i className="bx bx-key text-[0.9rem]"></i>
            </InputIcon>
            <Input type="text" value={displayKey} readOnly className="font-mono text-[0.85rem] tracking-[0.02em]" />

            {apiKey && (
              <>
                <Button
                  onClick={() => setShowApiKey((v) => !v)}
                  title={
                    showApiKey
                      ? t('merchant.hide', { defaultValue: 'Hide' })
                      : t('merchant.reveal', { defaultValue: 'Reveal' })
                  }
                  aria-label={
                    showApiKey
                      ? t('merchant.hide', { defaultValue: 'Hide' })
                      : t('merchant.reveal', { defaultValue: 'Reveal' })
                  }
                  variant="outline-secondary"
                  size="icon"
                >
                  <i className={`bx ${showApiKey ? 'bx-hide' : 'bx-show'}`}></i>
                </Button>
                <Button
                  onClick={async () => {
                    const ok = await copyText(apiKey)
                    if (ok) toast.success(t('merchant.copied', { defaultValue: 'Copied!' }))
                  }}
                  title={t('actions.copy', { defaultValue: 'Copy' })}
                  aria-label={t('actions.copy', { defaultValue: 'Copy' })}
                  variant="outline-secondary"
                  size="icon"
                >
                  <i className="bx bx-copy"></i>
                </Button>
              </>
            )}
          </InputGroup>
          {showApiKey && (
            <small className="text-warning-600 dark:text-warning-400 block mt-1">
              <i className="bx bx-info-circle mr-1"></i>
              {t('merchant.autoHide', { defaultValue: 'Auto-hides after 30 seconds' })}
            </small>
          )}
        </div>

        {/* API Secret */}
        <div className="mb-4">
          <Label className="font-semibold text-sm mb-1">
            <i className="bx bx-lock-alt mr-1 text-surface-500 dark:text-surface-400"></i>
            {t('merchant.apiSecret', { defaultValue: 'API Secret' })}
          </Label>
          <InputGroup>
            <InputIcon className="bg-surface-100 dark:bg-dark-elevated">
              <i className="bx bx-shield text-[0.9rem]"></i>
            </InputIcon>
            <Input
              type="text"
              value={apiSecretMasked || '••••••••••••••••••••••••'}
              readOnly
              className="font-mono text-[0.85rem] tracking-[0.02em]"
            />

            <InputIcon className="text-sm bg-surface-100 dark:bg-dark-elevated">
              <i className="bx bx-lock-alt mr-1 text-xs"></i>
              {t('merchant.secretMasked', { defaultValue: 'masked' })}
            </InputIcon>
          </InputGroup>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-200">
          <Button onClick={onRotate} variant="outline-primary" size="sm">
            <i className="bx bx-refresh mr-1"></i>
            {t('merchant.rotateSecret', { defaultValue: 'Rotate Secret' })}
          </Button>
          <Button onClick={onRegenerate} variant="outline-danger" size="sm">
            <i className="bx bx-reset mr-1"></i>
            {t('merchant.regenerateKey', { defaultValue: 'Regenerate Key & Secret' })}
          </Button>
        </div>
      </div>
    </Card>
  )
}
