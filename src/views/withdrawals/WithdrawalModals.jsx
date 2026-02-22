import { useTranslation } from 'react-i18next'

export default function WithdrawalModals({
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
  const { t } = useTranslation()

  return (
    <>
      {showApproveModal && selectedWithdrawal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !approving && setShowApproveModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {t('withdrawal.approveConfirm', { defaultValue: 'Approve Withdrawal' })}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowApproveModal(false)} disabled={approving}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">{t('withdrawal.approveMessage', { defaultValue: 'Are you sure you want to approve this withdrawal?' })}</p>
                <div className="card" style={{ backgroundColor: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-6">
                        <small className="text-muted d-block">{t('common.id', { defaultValue: 'ID' })}</small>
                        <strong>{selectedWithdrawal.id}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">{t('admin.user', { defaultValue: 'User' })}</small>
                        <strong>{selectedWithdrawal.user?.email || 'N/A'}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">{t('withdrawal.amount', { defaultValue: 'Amount' })}</small>
                        <strong className="text-nowrap">{formatAmount(selectedWithdrawal.amountRaw || selectedWithdrawal.amount, selectedWithdrawal.decimals || 18)} {selectedWithdrawal.coin?.symbol || selectedWithdrawal.coinNetwork?.coin?.symbol || selectedWithdrawal.symbol}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">{t('withdrawal.fee', { defaultValue: 'Fee' })}</small>
                        <strong>{formatAmount(selectedWithdrawal.totalFeeRaw || selectedWithdrawal.totalFee || selectedWithdrawal.feeRaw || selectedWithdrawal.fee, selectedWithdrawal.decimals || 18, 8, true)} {selectedWithdrawal.coin?.symbol || selectedWithdrawal.coinNetwork?.coin?.symbol || selectedWithdrawal.symbol}</strong>
                      </div>
                      <div className="col-12">
                        <small className="text-muted d-block">{t('withdrawal.toAddress', { defaultValue: 'To Address' })}</small>
                        <code className="small">{selectedWithdrawal.toAddress}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApproveModal(false)} disabled={approving}>
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button type="button" className="btn btn-primary" onClick={onApprove} disabled={approving}>
                  {approving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
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
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !rejecting && setShowRejectModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {t('withdrawal.rejectConfirm', { defaultValue: 'Reject Withdrawal' })}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)} disabled={rejecting}></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">{t('withdrawal.rejectMessage', { defaultValue: 'Are you sure you want to reject this withdrawal?' })}</p>
                <div className="card mb-3" style={{ backgroundColor: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}>
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-6">
                        <small className="text-muted d-block">{t('common.id', { defaultValue: 'ID' })}</small>
                        <strong>{selectedWithdrawal.id}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">{t('admin.user', { defaultValue: 'User' })}</small>
                        <strong>{selectedWithdrawal.user?.email || 'N/A'}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">{t('withdrawal.amount', { defaultValue: 'Amount' })}</small>
                        <strong className="text-nowrap">{formatAmount(selectedWithdrawal.amountRaw || selectedWithdrawal.amount, selectedWithdrawal.decimals || 18)} {selectedWithdrawal.coin?.symbol || selectedWithdrawal.coinNetwork?.coin?.symbol || selectedWithdrawal.symbol}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">{t('withdrawal.fee', { defaultValue: 'Fee' })}</small>
                        <strong>{formatAmount(selectedWithdrawal.totalFeeRaw || selectedWithdrawal.totalFee || selectedWithdrawal.feeRaw || selectedWithdrawal.fee, selectedWithdrawal.decimals || 18, 8, true)} {selectedWithdrawal.coin?.symbol || selectedWithdrawal.coinNetwork?.coin?.symbol || selectedWithdrawal.symbol}</strong>
                      </div>
                      <div className="col-12">
                        <small className="text-muted d-block">{t('withdrawal.toAddress', { defaultValue: 'To Address' })}</small>
                        <code className="small">{selectedWithdrawal.toAddress}</code>
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
                    className={`form-control ${rejectReason.trim().length > 0 && rejectReason.trim().length < 10 ? 'is-invalid' : ''}`}
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t('withdrawal.rejectReasonPlaceholder', { defaultValue: 'e.g., Suspicious activity detected' })}
                    disabled={rejecting}
                  />
                  <div className="d-flex justify-content-between mt-1">
                    <small className={`${rejectReason.trim().length > 0 && rejectReason.trim().length < 10 ? 'text-danger' : 'text-muted'}`}>
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
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)} disabled={rejecting}>
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button type="button" className="btn btn-danger" onClick={onReject} disabled={rejecting || rejectReason.trim().length < 10}>
                  {rejecting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
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
