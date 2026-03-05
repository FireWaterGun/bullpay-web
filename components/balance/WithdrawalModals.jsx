'use client';

import { useState } from 'react';
import { Button, Input, Label, Spinner } from '../ui'

export function ApproveWithdrawalModal({ show, withdrawal, loading, onConfirm, onClose, t }) {
  if (!show || !withdrawal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center block bg-black/50" onClick={() => !loading && onClose()}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              {t?.('withdrawals.approveTitle', { defaultValue: 'Approve Withdrawal' }) || 'Approve Withdrawal'}
            </h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="p-5">
            <p>{t?.('withdrawals.approveDesc', { defaultValue: 'Are you sure you want to approve this withdrawal?' }) || 'Are you sure you want to approve this withdrawal?'}</p>
            <div className="text-sm text-muted">
              <div>ID: #{withdrawal.id}</div>
              <div>Amount: {withdrawal.amountDecimal || withdrawal.amount} {withdrawal.coinSymbol || ''}</div>
              <div>Address: <span className="font-monospace">{withdrawal.address || withdrawal.withdrawalAddress?.address}</span></div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button onClick={onClose} disabled={loading} variant="outline-secondary">
              {t?.('actions.cancel', { defaultValue: 'Cancel' }) || 'Cancel'}
            </Button>
            <Button onClick={onConfirm} disabled={loading} variant="success">
              {loading ? <Spinner className="w-4 h-4" /> : t?.('common.approve', { defaultValue: 'Approve' }) || 'Approve'}
            </Button>
          </div>
        </div>
      </div>
    </div>);

}

export function RejectWithdrawalModal({ show, withdrawal, loading, onConfirm, onClose, t }) {
  const [reason, setReason] = useState('');

  if (!show || !withdrawal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center block bg-black/50" onClick={() => !loading && onClose()}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              {t?.('withdrawals.rejectTitle', { defaultValue: 'Reject Withdrawal' }) || 'Reject Withdrawal'}
            </h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="p-5">
            <div className="text-sm text-muted mb-3">
              <div>ID: #{withdrawal.id}</div>
              <div>Amount: {withdrawal.amountDecimal || withdrawal.amount} {withdrawal.coinSymbol || ''}</div>
            </div>
            <div className="mb-3">
              <Label>{t?.('withdrawals.reason', { defaultValue: 'Reason' }) || 'Reason'}</Label>
              <Input

                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t?.('withdrawals.reasonPlaceholder', { defaultValue: 'Enter rejection reason...' }) || 'Enter rejection reason...'} />
              
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button onClick={onClose} disabled={loading} variant="outline-secondary">
              {t?.('actions.cancel', { defaultValue: 'Cancel' }) || 'Cancel'}
            </Button>
            <Button onClick={() => onConfirm(reason)} disabled={loading} variant="danger">
              {loading ? <Spinner className="w-4 h-4" /> : t?.('common.reject', { defaultValue: 'Reject' }) || 'Reject'}
            </Button>
          </div>
        </div>
      </div>
    </div>);

}