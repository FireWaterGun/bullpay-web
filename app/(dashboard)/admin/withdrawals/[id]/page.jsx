'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getWithdrawalById as getAdminWithdrawalById, approveWithdrawal, rejectWithdrawal } from '@/lib/api/admin'
import { formatCoinAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import CoinImg from '@/components/CoinImg'
import { statusBadgeClass, formatStatusLabel, formatAmount as formatAmountHelper } from '@/components/balance/withdrawalHelpers'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Button from '@/components/ui/Button'
import WithdrawalTxModals from '@/components/admin/WithdrawalTxModals'

function CopyBtn({ text, onCopy, copyId, copiedId }) {
  return (
    <button
      type="button"
      onClick={() => onCopy(text, copyId)}
      className="inline-flex items-center justify-center w-7 h-7 rounded text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-white/6 transition-colors shrink-0 cursor-pointer"
    >
      <i className={`bx ${copiedId === copyId ? 'bx-check text-success' : 'bx-copy'} text-sm`}></i>
    </button>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0 py-2.5 border-b border-surface-200 last:border-0">
      <span className="text-sm text-surface-500 sm:w-[160px] shrink-0">{label}</span>
      <div className="text-sm text-surface-800 min-w-0 flex-1">{children}</div>
    </div>
  )
}

export default function AdminWithdrawalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useAdminTranslation()
  const toast = useToast()
  const { fmtDate } = useDateFormat()

  const withdrawalId = params?.id

  const { data: withdrawal, isLoading, isValidating, mutate, token } = useApi(
    withdrawalId ? `admin-withdrawal-${withdrawalId}` : null,
    (token) => getAdminWithdrawalById(token, withdrawalId),
    { onError: (err) => toast.error(err?.message || t('withdrawal.detailLoadError', { defaultValue: 'Failed to load withdrawal' })) }
  )

  // Modal state
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  function formatAmount(amountRaw, decimals = 18) {
    return formatAmountHelper(amountRaw, decimals)
  }

  const { copiedId, handleCopy } = useCopyFeedback()

  async function handleApprove() {
    if (!withdrawal) return
    setApproving(true)
    try {
      await approveWithdrawal(token, Number(withdrawal.id), 'Withdrawal approved after verification')
      toast.success(t('withdrawal.approveSuccess', { defaultValue: 'Withdrawal approved' }))
      setShowApproveModal(false)
      mutate()
    } catch (err) {
      toast.error(err?.message || t('withdrawal.approveError', { defaultValue: 'Failed to approve' }))
    } finally {
      setApproving(false)
    }
  }

  async function handleReject() {
    if (!withdrawal || !rejectReason.trim()) return
    setRejecting(true)
    try {
      await rejectWithdrawal(token, Number(withdrawal.id), rejectReason.trim())
      toast.success(t('withdrawal.rejectSuccess', { defaultValue: 'Withdrawal rejected' }))
      setShowRejectModal(false)
      setRejectReason('')
      mutate()
    } catch (err) {
      toast.error(err?.message || t('withdrawal.rejectError', { defaultValue: 'Failed to reject' }))
    } finally {
      setRejecting(false)
    }
  }

  if (isLoading) return <PageSpinner />

  if (!withdrawal) {
    return (
      <div className="bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 rounded-lg p-4 text-sm">
        {t('withdrawal.notFound', { defaultValue: 'Withdrawal not found' })}
      </div>
    )
  }

  const coinSymbol = withdrawal.coin?.symbol || withdrawal.symbol || ''
  const networkSymbol = withdrawal.network?.symbol || ''
  const explorerUrl = withdrawal.network?.explorerUrl || ''
  const toAddress = withdrawal.toAddress || ''
  const fromAddress = withdrawal.fromAddress || ''
  const totalFee = withdrawal.totalFee || ''
  const totalAmount = withdrawal.totalAmount || ''
  const isPending = String(withdrawal.status || '').toLowerCase() === 'pending'

  return (
    <>
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push('/admin/withdrawals')}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50 dark:hover:bg-white/6 transition-colors mb-4 cursor-pointer"
      >
        <i className="bx bx-arrow-back"></i>
        {t('withdrawal.backToList', { defaultValue: 'Back to Withdrawals' })}
      </button>

      {/* Hero card */}
      <div className="bg-card rounded-xl shadow-sm border border-surface-200 p-5 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={48} />
            <div>
              <h4 className="text-lg font-semibold text-surface-900 flex items-center gap-2 mb-1">
                {t('withdrawal.detail', { defaultValue: 'Withdrawal' })} #{withdrawal.id}
                <RefreshButton onClick={() => mutate()} loading={isValidating} />
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={statusBadgeClass(withdrawal.status)}>{formatStatusLabel(withdrawal.status)}</span>
                {coinSymbol && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-surface-100 dark:bg-dark-elevated text-surface-600 rounded-md">
                    {coinSymbol}
                  </span>
                )}
                {networkSymbol && networkSymbol !== coinSymbol && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-info-50 dark:bg-info-900/30 text-info-600 dark:text-info-400 rounded-md">
                    {networkSymbol}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isPending && (
              <div className="flex gap-2">
                <Button onClick={() => setShowApproveModal(true)} disabled={approving || rejecting}>
                  <i className="bx bx-check mr-1"></i>
                  {t('withdrawal.approve', { defaultValue: 'Approve' })}
                </Button>
                <Button onClick={() => setShowRejectModal(true)} disabled={approving || rejecting} variant="danger">
                  <i className="bx bx-x mr-1"></i>
                  {t('withdrawal.reject', { defaultValue: 'Reject' })}
                </Button>
              </div>
            )}
            {totalAmount && (
              <div className="text-right">
                <p className="text-xl font-semibold text-surface-900 mb-0">{formatCoinAmount(totalAmount)}</p>
                {withdrawal.amountUsd && (
                  <p className="text-sm text-surface-400 mb-0">${Number(withdrawal.amountUsd).toFixed(2)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-card rounded-xl shadow-sm border border-surface-200">
            <div className="px-5 py-4 border-b border-surface-200">
              <h6 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-0">
                <i className="bx bx-detail text-primary-600"></i>
                {t('withdrawal.details', { defaultValue: 'Details' })}
              </h6>
            </div>
            <div className="p-5">
              {/* User info (admin only) */}
              {withdrawal.user && (
                <DetailRow label={t('admin.detail.user', { defaultValue: 'User' })}>
                  <div>
                    <span className="font-medium">{withdrawal.user.fullName || '-'}</span>
                    {withdrawal.user.email && (
                      <span className="text-surface-400 ml-2 text-xs">({withdrawal.user.email})</span>
                    )}
                  </div>
                </DetailRow>
              )}
              {withdrawal.userId && (
                <DetailRow label={t('admin.detail.userId', { defaultValue: 'User ID' })}>
                  {withdrawal.userId}
                </DetailRow>
              )}

              <DetailRow label={t('withdrawal.coin')}>
                <div className="flex items-center gap-2">
                  <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} />
                  <span>{coinSymbol}</span>
                  {networkSymbol && networkSymbol !== coinSymbol && (
                    <span className="text-surface-400 text-xs">({networkSymbol})</span>
                  )}
                </div>
              </DetailRow>
              <DetailRow label={t('withdrawal.totalAmount', { defaultValue: 'Total Amount' })}>
                {formatCoinAmount(totalAmount || 0)} {coinSymbol}
              </DetailRow>
              <DetailRow label={t('withdrawal.netAmount', { defaultValue: 'Net Amount' })}>
                <span className="text-success-600 dark:text-success-400 font-medium">
                  {formatCoinAmount(withdrawal.amount || 0)} {coinSymbol}
                </span>
              </DetailRow>
              {fromAddress && (
                <DetailRow label={t('withdrawal.fromAddress')}>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs break-all">{fromAddress}</span>
                    <CopyBtn text={fromAddress} onCopy={handleCopy} copyId="from-wd" copiedId={copiedId} />
                  </div>
                </DetailRow>
              )}
              <DetailRow label={t('withdrawal.toAddress')}>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs break-all">{toAddress || '-'}</span>
                  {toAddress ? <CopyBtn text={toAddress} onCopy={handleCopy} copyId="to-wd" copiedId={copiedId} /> : null}
                </div>
              </DetailRow>
              {withdrawal.txHash && (
                <DetailRow label={t('withdrawal.txHash')}>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs break-all">{withdrawal.txHash}</span>
                    <CopyBtn text={withdrawal.txHash} onCopy={handleCopy} copyId="tx-wd" copiedId={copiedId} />
                    {explorerUrl && (
                      <a
                        href={`${explorerUrl}/tx/${withdrawal.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-7 h-7 rounded text-primary-500 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-colors shrink-0"
                      >
                        <i className="bx bx-link-external text-sm"></i>
                      </a>
                    )}
                  </div>
                </DetailRow>
              )}
              {withdrawal.memo && (
                <DetailRow label={t('withdrawal.memo', { defaultValue: 'Memo' })}>{withdrawal.memo}</DetailRow>
              )}
              {withdrawal.failureReason && (
                <DetailRow label={t('withdrawal.failureReason', { defaultValue: 'Failure Reason' })}>
                  <span className="text-danger-600 dark:text-danger-400">{withdrawal.failureReason}</span>
                </DetailRow>
              )}
            </div>
          </div>

          {/* Fee Breakdown */}
          {totalFee && (
            <div className="bg-card rounded-xl shadow-sm border border-surface-200">
              <div className="px-5 py-4 border-b border-surface-200">
                <h6 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-0">
                  <i className="bx bx-receipt text-primary-600"></i>
                  {t('balance.feeBreakdown', { defaultValue: 'Fee Breakdown' })}
                </h6>
              </div>
              <div className="p-5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">{t('balance.withdrawAmount', { defaultValue: 'Withdraw amount' })}</span>
                  <span className="text-sm font-medium text-surface-800">{formatCoinAmount(totalAmount || 0)} {coinSymbol}</span>
                </div>
                {withdrawal.baseFee && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-surface-500">{t('balance.networkFee', { defaultValue: 'Network fee' })}</span>
                    <span className="text-sm text-surface-800">{formatCoinAmount(withdrawal.baseFee)} {coinSymbol}</span>
                  </div>
                )}
                {withdrawal.platformFee && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-surface-500">
                      {t('balance.platformFee', { defaultValue: 'Platform fee' })}
                      {withdrawal.platformFeePercentage != null && ` (${Number(withdrawal.platformFeePercentage).toFixed(2)}%)`}
                    </span>
                    <span className="text-sm text-surface-800">{formatCoinAmount(withdrawal.platformFee)} {coinSymbol}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2.5 border-t border-surface-200">
                  <span className="text-sm text-surface-500">{t('balance.totalFee', { defaultValue: 'Total fee' })}</span>
                  <span className="text-sm font-medium text-surface-800">{formatCoinAmount(totalFee)} {coinSymbol}</span>
                </div>
                {withdrawal.totalFeeUsd && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-surface-500">{t('balance.totalFeeUsd', { defaultValue: 'Total fee (USD)' })}</span>
                    <span className="text-sm text-surface-800">${Number(withdrawal.totalFeeUsd).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2.5 border-t border-surface-200">
                  <span className="text-sm text-surface-500 flex items-center">
                    {t('balance.total', { defaultValue: 'Total' })}
                    <i className="bx bx-info-circle ml-1 text-surface-400" title={t('balance.totalTooltip', { defaultValue: 'Amount user will receive after fees' })}></i>
                  </span>
                  <span className="text-sm font-semibold text-surface-900">{formatCoinAmount(withdrawal.amount || 0)} {coinSymbol}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div>
          <div className="bg-card rounded-xl shadow-sm border border-surface-200 p-5">
            <h6 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-4">
              <i className="bx bx-time-five text-primary-600"></i>
              {t('withdrawal.timeline', { defaultValue: 'Timeline' })}
            </h6>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-500">
                  {t('withdrawal.created', { defaultValue: 'Created' })}
                </span>
                <span className="text-xs text-surface-700">{fmtDate(withdrawal.createdAt)}</span>
              </div>
              {withdrawal.processedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">
                    {t('withdrawal.processed', { defaultValue: 'Processed' })}
                  </span>
                  <span className="text-xs text-surface-700">{fmtDate(withdrawal.processedAt)}</span>
                </div>
              )}
              {withdrawal.completedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">
                    {t('withdrawal.completed', { defaultValue: 'Completed' })}
                  </span>
                  <span className="text-xs text-surface-700">{fmtDate(withdrawal.completedAt)}</span>
                </div>
              )}
              {withdrawal.failedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">
                    {t('withdrawal.failed', { defaultValue: 'Failed' })}
                  </span>
                  <span className="text-xs text-surface-700">{fmtDate(withdrawal.failedAt)}</span>
                </div>
              )}
              {withdrawal.updatedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">
                    {t('withdrawal.updated', { defaultValue: 'Updated' })}
                  </span>
                  <span className="text-xs text-surface-700">{fmtDate(withdrawal.updatedAt)}</span>
                </div>
              )}
              {withdrawal.approvedBy && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">
                    {t('withdrawal.approvedBy', { defaultValue: 'Approved by' })}
                  </span>
                  <span className="text-xs text-surface-700">Admin #{withdrawal.approvedBy}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approve/Reject Modals */}
      <WithdrawalTxModals
        showApproveModal={showApproveModal}
        setShowApproveModal={setShowApproveModal}
        showRejectModal={showRejectModal}
        setShowRejectModal={setShowRejectModal}
        selectedWithdrawal={withdrawal}
        approving={approving}
        rejecting={rejecting}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        formatAmount={formatAmount}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  )
}
