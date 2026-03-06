'use client';

import { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { Button } from '@/components/ui'

export function SuccessModalWrapper({ open, onClose, receiveAmount, sym, address, networkName, t }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    const ok = await copyToClipboard(address);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl mx-4 max-w-[min(600px,calc(100vw-2rem))]" onClick={(e) => e.stopPropagation()}>
        <div className="text-center px-6 py-8">
          <div className="my-4">
            <div className="rounded-full inline-flex items-center justify-center w-[80px] bg-green-500"
            style={{ height: '80px' }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M8 20L17 29L32 11" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="mb-3">
            <div className="text-surface-500 text-[0.9rem]">
              {t('balance.recipientAmount', { defaultValue: 'Recipient Amount' })}
            </div>
            <div className="font-bold text-3xl text-surface-900">
              {receiveAmount}
            </div>
          </div>

          <p className="text-surface-500 mb-1 text-[0.9rem]">
            {t('balance.withdrawalNote', {
              defaultValue: 'Please note that you will receive an email once it is completed.'
            })}
          </p>
          <p className="text-surface-500 mb-4 text-[0.9rem]">
            {t('balance.withdrawalProcessTime', {
              defaultValue: 'Withdrawals are typically processed within 24 hours.'
            })}
          </p>

          <div className="text-left mb-4 rounded-xl p-5 border border-surface-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-surface-500 text-[0.9rem]">{t('balance.address', { defaultValue: 'Address' })}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-[0.9rem]">{address || '-'}</span>
                <button
                  type="button"
                  className="text-primary-600 hover:text-primary-700 p-0"
                  onClick={handleCopy}
                  title={copied ? t('common.copied', { defaultValue: 'Copied!' }) : t('common.copy', { defaultValue: 'Copy' })}>
                  
                  <i className={`bx ${copied ? 'bx-check text-green-600' : 'bx-copy'} text-[1.1rem]`}></i>
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-surface-500 text-[0.9rem]">{t('balance.network', { defaultValue: 'Network' })}</span>
              <span className="font-medium text-[0.9rem]">{networkName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-surface-500 text-[0.9rem]">{t('balance.coin', { defaultValue: 'Coin' })}</span>
              <span className="font-medium text-[0.9rem]">{sym}</span>
            </div>
          </div>

          <Button
            type="button"

            onClick={onClose} className="w-full py-2 font-semibold rounded-lg">
            
            {t('actions.ok', { defaultValue: 'OK' })}
          </Button>
        </div>
      </div>
    </div>);

}

export function ErrorModalWrapper({ open, onClose, message, t }) {
  return (
    <ConfirmModal
      show={open}
      title={t('balance.withdrawErrorTitle', { defaultValue: 'Withdrawal Failed' })}
      message={
      <div>
          {message || t('balance.withdrawErrorMsg', { defaultValue: 'Failed to process withdrawal request.' })}
        </div>
      }
      confirmText={t('actions.ok', { defaultValue: 'OK' })}
      cancelText={t('actions.cancel', { defaultValue: 'Cancel' })}
      onConfirm={onClose}
      onCancel={onClose}
      variant="basic"
      confirmVariant="danger" />);


}