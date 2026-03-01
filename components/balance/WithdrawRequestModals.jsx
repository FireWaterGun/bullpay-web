'use client'

import { useState } from 'react'
import ConfirmModal from '@/components/ConfirmModal'
import { copyToClipboard } from '@/lib/utils/clipboard'

export function SuccessModalWrapper({ open, onClose, receiveAmount, sym, address, networkName, t }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!address) return
    const ok = await copyToClipboard(address)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="modal-backdrop fade show" style={{ opacity: 0.5 }}></div>
      <div className={`modal fade ${open ? 'show' : ''}`} style={{ display: open ? 'block' : 'none' }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '600px' }}>
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
            <div className="modal-body text-center px-4 py-5">
              <div className="my-4">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: '80px', height: '80px', backgroundColor: 'var(--bs-success)' }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M8 20L17 29L32 11" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-secondary" style={{ fontSize: '0.9rem' }}>
                  {t('balance.recipientAmount', { defaultValue: 'Recipient Amount' })}
                </div>
                <div className="fw-bold" style={{ fontSize: '1.75rem' }}>
                  {receiveAmount}
                </div>
              </div>

              <p className="text-secondary mb-1" style={{ fontSize: '0.9rem' }}>
                {t('balance.withdrawalNote', {
                  defaultValue: 'Please note that you will receive an email once it is completed.'
                })}
              </p>
              <p className="text-secondary mb-4" style={{ fontSize: '0.9rem' }}>
                {t('balance.withdrawalProcessTime', {
                  defaultValue: 'Withdrawals are typically processed within 24 hours.'
                })}
              </p>

              <div className="text-start mb-4" style={{ borderRadius: '12px', padding: '20px', border: '1px solid var(--bs-border-color)' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{t('balance.address', { defaultValue: 'Address' })}</span>
                  <div className="d-flex align-items-center gap-2">
                    <span className="font-monospace fw-medium" style={{ fontSize: '0.9rem' }}>{address || '-'}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0"
                      onClick={handleCopy}
                      title={copied ? t('common.copied', { defaultValue: 'Copied!' }) : t('common.copy', { defaultValue: 'Copy' })}
                    >
                      <i className={`bx ${copied ? 'bx-check text-success' : 'bx-copy'}`} style={{ fontSize: '1.1rem' }}></i>
                    </button>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{t('balance.network', { defaultValue: 'Network' })}</span>
                  <span className="fw-medium" style={{ fontSize: '0.9rem' }}>{networkName}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{t('balance.coin', { defaultValue: 'Coin' })}</span>
                  <span className="fw-medium" style={{ fontSize: '0.9rem' }}>{sym}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary w-100 py-2 fw-semibold"
                onClick={onClose}
                style={{ borderRadius: '8px' }}
              >
                {t('actions.ok', { defaultValue: 'OK' })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function ErrorModalWrapper({ open, onClose, message, t }) {
  return (
    <ConfirmModal
      show={open}
      title={t('balance.withdrawErrorTitle', { defaultValue: 'Withdrawal Failed' })}
      message={(
        <div>
          {message || t('balance.withdrawErrorMsg', { defaultValue: 'Failed to process withdrawal request.' })}
        </div>
      )}
      confirmText={t('actions.ok', { defaultValue: 'OK' })}
      cancelText={t('actions.cancel', { defaultValue: 'Cancel' })}
      onConfirm={onClose}
      onCancel={onClose}
      variant="basic"
      confirmVariant="danger"
    />
  )
}
