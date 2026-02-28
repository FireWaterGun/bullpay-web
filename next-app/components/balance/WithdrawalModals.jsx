'use client'

import { useState } from 'react'

export function ApproveWithdrawalModal({ show, withdrawal, loading, onConfirm, onClose, t }) {
  if (!show || !withdrawal) return null

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !loading && onClose()}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {t?.('withdrawals.approveTitle', { defaultValue: 'Approve Withdrawal' }) || 'Approve Withdrawal'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body">
            <p>{t?.('withdrawals.approveDesc', { defaultValue: 'Are you sure you want to approve this withdrawal?' }) || 'Are you sure you want to approve this withdrawal?'}</p>
            <div className="small text-muted">
              <div>ID: #{withdrawal.id}</div>
              <div>Amount: {withdrawal.amountDecimal || withdrawal.amount} {withdrawal.coinSymbol || ''}</div>
              <div>Address: <span className="font-monospace">{withdrawal.address || withdrawal.withdrawalAddress?.address}</span></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
              {t?.('actions.cancel', { defaultValue: 'Cancel' }) || 'Cancel'}
            </button>
            <button className="btn btn-success" onClick={onConfirm} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : t?.('common.approve', { defaultValue: 'Approve' }) || 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RejectWithdrawalModal({ show, withdrawal, loading, onConfirm, onClose, t }) {
  const [reason, setReason] = useState('')

  if (!show || !withdrawal) return null

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !loading && onClose()}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {t?.('withdrawals.rejectTitle', { defaultValue: 'Reject Withdrawal' }) || 'Reject Withdrawal'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body">
            <div className="small text-muted mb-3">
              <div>ID: #{withdrawal.id}</div>
              <div>Amount: {withdrawal.amountDecimal || withdrawal.amount} {withdrawal.coinSymbol || ''}</div>
            </div>
            <div className="mb-3">
              <label className="form-label">{t?.('withdrawals.reason', { defaultValue: 'Reason' }) || 'Reason'}</label>
              <textarea
                className="form-control"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t?.('withdrawals.reasonPlaceholder', { defaultValue: 'Enter rejection reason...' }) || 'Enter rejection reason...'}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
              {t?.('actions.cancel', { defaultValue: 'Cancel' }) || 'Cancel'}
            </button>
            <button className="btn btn-danger" onClick={() => onConfirm(reason)} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : t?.('common.reject', { defaultValue: 'Reject' }) || 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
