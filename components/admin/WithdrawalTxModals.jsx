'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

export default function WithdrawalTxModals({
  showApproveModal,
  setShowApproveModal,
  showRejectModal,
  setShowRejectModal,
  selectedWithdrawal,
  approving,
  rejecting,
  rejectReason,
  setRejectReason,
  formatAmount,
  onApprove,
  onReject,
}) {
  const { t } = useAdminTranslation()

  return (
    <>
      {showApproveModal && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !approving && setShowApproveModal(false)}>
          <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-xl">
              <div className="flex items-center justify-between p-5 border-b border-surface-200">
                <h5 className="text-lg font-semibold text-surface-800">
                  {t('withdrawal.approveConfirm', { defaultValue: 'Approve Withdrawal' })}
                </h5>
                <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={() => setShowApproveModal(false)} disabled={approving}></button>
              </div>
              <div className="p-5">
                <p className="mb-3">{t('withdrawal.approveMessage', { defaultValue: 'Are you sure you want to approve this withdrawal?' })}</p>
                <div className="card" style={{ backgroundColor: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}>
                  <div className="p-5">
                    <div className="grid grid-cols-12 gap-x-6 gap-2">
                      <div className="col-span-6">
                        <small className="text-muted block">{t('common.id', { defaultValue: 'ID' })}</small>
                        <strong>{selectedWithdrawal.id}</strong>
                      </div>
                      <div className="col-span-6">
                        <small className="text-muted block">{t('admin.user', { defaultValue: 'User' })}</small>
                        <strong>{selectedWithdrawal.user?.email || 'N/A'}</strong>
                      </div>
                      <div className="col-span-6">
                        <small className="text-muted block">{t('withdrawal.amount', { defaultValue: 'Amount' })}</small>
                        <strong className="whitespace-nowrap">{formatAmount(selectedWithdrawal.amountRaw || selectedWithdrawal.amount, selectedWithdrawal.decimals || 18)} {selectedWithdrawal.coin?.symbol || selectedWithdrawal.coinNetwork?.coin?.symbol || selectedWithdrawal.symbol}</strong>
                      </div>
                      <div className="col-span-6">
                        <small className="text-muted block">{t('withdrawal.fee', { defaultValue: 'Fee' })}</small>
                        <strong>{formatAmount(selectedWithdrawal.totalFeeRaw || selectedWithdrawal.totalFee || selectedWithdrawal.feeRaw || selectedWithdrawal.fee, selectedWithdrawal.decimals || 18, 8, true)} {selectedWithdrawal.coin?.symbol || selectedWithdrawal.coinNetwork?.coin?.symbol || selectedWithdrawal.symbol}</strong>
                      </div>
                      <div className="col-span-12">
                        <small className="text-muted block">{t('withdrawal.toAddress', { defaultValue: 'To Address' })}</small>
                        <code className="text-sm">{selectedWithdrawal.toAddress}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
                <button type="button" className="btn btn bg-surface-200 text-surface-700 hover:bg-surface-300" onClick={() => setShowApproveModal(false)} disabled={approving}>
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button type="button" className="btn btn-primary" onClick={onApprove} disabled={approving}>
                  {approving ? (
                    <>
                      <span className="spinner w-4 h-4 mr-1"></span>
                      {t('withdrawal.approving', { defaultValue: 'Approving...' })}
                    </>
                  ) : (
                    t('withdrawal.approve', { defaultValue: 'Approve' })
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !rejecting && setShowRejectModal(false)}>
          <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-xl">
              <div className="flex items-center justify-between p-5 border-b border-surface-200">
                <h5 className="text-lg font-semibold text-surface-800">
                  {t('withdrawal.rejectConfirm', { defaultValue: 'Reject Withdrawal' })}
                </h5>
                <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={() => setShowRejectModal(false)} disabled={rejecting}></button>
              </div>
              <div className="p-5">
                <p className="mb-3">{t('withdrawal.rejectMessage', { defaultValue: 'Are you sure you want to reject this withdrawal?' })}</p>
                <div className="card mb-3" style={{ backgroundColor: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}>
                  <div className="p-5">
                    <div className="grid grid-cols-12 gap-x-6 gap-2">
                      <div className="col-span-6">
                        <small className="text-muted block">{t('common.id', { defaultValue: 'ID' })}</small>
                        <strong>{selectedWithdrawal.id}</strong>
                      </div>
                      <div className="col-span-6">
                        <small className="text-muted block">{t('admin.user', { defaultValue: 'User' })}</small>
                        <strong>{selectedWithdrawal.user?.email || 'N/A'}</strong>
                      </div>
                      <div className="col-span-6">
                        <small className="text-muted block">{t('withdrawal.amount', { defaultValue: 'Amount' })}</small>
                        <strong className="whitespace-nowrap">{formatAmount(selectedWithdrawal.amountRaw || selectedWithdrawal.amount, selectedWithdrawal.decimals || 18)} {selectedWithdrawal.coin?.symbol || selectedWithdrawal.coinNetwork?.coin?.symbol || selectedWithdrawal.symbol}</strong>
                      </div>
                      <div className="col-span-6">
                        <small className="text-muted block">{t('withdrawal.fee', { defaultValue: 'Fee' })}</small>
                        <strong>{formatAmount(selectedWithdrawal.totalFeeRaw || selectedWithdrawal.totalFee || selectedWithdrawal.feeRaw || selectedWithdrawal.fee, selectedWithdrawal.decimals || 18, 8, true)} {selectedWithdrawal.coin?.symbol || selectedWithdrawal.coinNetwork?.coin?.symbol || selectedWithdrawal.symbol}</strong>
                      </div>
                      <div className="col-span-12">
                        <small className="text-muted block">{t('withdrawal.toAddress', { defaultValue: 'To Address' })}</small>
                        <code className="text-sm">{selectedWithdrawal.toAddress}</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="rejectReason" className="form-label">
                    {t('withdrawal.rejectReason', { defaultValue: 'Reason for rejection' })} <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="rejectReason"
                    className={`form-input ${rejectReason.trim().length > 0 && rejectReason.trim().length < 10 ?'is-invalid' : ''}`}
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t('withdrawal.rejectReasonPlaceholder', { defaultValue: 'e.g., Suspicious activity detected' })}
                    disabled={rejecting}
                  />
                  <div className="flex justify-between mt-1">
                    <small className={`${rejectReason.trim().length > 0 && rejectReason.trim().length < 10 ?'text-danger' : 'text-muted'}`}>
                      {rejectReason.trim().length < 10
                        ? t('withdrawal.rejectReasonMinLength', { defaultValue: 'Minimum 10 characters required' })
                        : t('common.optional', { defaultValue: '' })
                      }
                    </small>
                    <small className="text-muted">
                      {rejectReason.trim().length}/10
                    </small>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
                <button type="button" className="btn btn bg-surface-200 text-surface-700 hover:bg-surface-300" onClick={() => setShowRejectModal(false)} disabled={rejecting}>
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button type="button" className="btn btn-danger" onClick={onReject} disabled={rejecting || rejectReason.trim().length < 10}>
                  {rejecting ? (
                    <>
                      <span className="spinner w-4 h-4 mr-1"></span>
                      {t('withdrawal.rejecting', { defaultValue: 'Rejecting...' })}
                    </>
                  ) : (
                    t('withdrawal.reject', { defaultValue: 'Reject' })
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
