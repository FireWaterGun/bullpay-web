'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getWithdrawalById } from '@/lib/api/withdrawals'
import { formatCoinAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { copyToClipboard } from '@/lib/utils/clipboard'
import CoinImg from '@/components/CoinImg'
import { statusBadgeClass, formatStatusLabel } from '@/components/balance/withdrawalHelpers'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

function CopyBtn({ text, onCopy }) {
  return (
    <button
      type="button"
      onClick={() => onCopy(text)}
      className="inline-flex items-center justify-center w-7 h-7 rounded text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-white/6 transition-colors shrink-0 cursor-pointer"
    >
      <i className="bx bx-copy text-sm"></i>
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

export default function WithdrawalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const { fmtDate } = useDateFormat()

  const withdrawalId = params?.id
  const [withdrawal, setWithdrawal] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadWithdrawal = useCallback(async () => {
    if (!token || !withdrawalId) return
    try {
      setLoading(true)
      const data = await getWithdrawalById(withdrawalId, token)
      setWithdrawal(data)
    } catch (err) {
      toast.error(err?.message || t('withdrawals.loadError', { defaultValue: 'Failed to load withdrawal' }))
    } finally {
      setLoading(false)
    }
  }, [token, withdrawalId, toast, t])

  useEffect(() => {
    loadWithdrawal()
  }, [loadWithdrawal])

  async function handleCopy(text) {
    const ok = await copyToClipboard(text)
    if (ok) toast.success(t('common.copied', { defaultValue: 'Copied!' }))
  }

  if (loading && !withdrawal) return <PageSpinner />

  if (!withdrawal) {
    return (
      <div className="bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 rounded-lg p-4 text-sm">
        {t('withdrawals.notFound', { defaultValue: 'Withdrawal not found' })}
      </div>
    )
  }

  const coinSymbol = withdrawal.symbol || withdrawal.coinNetwork?.coin?.symbol || ''
  const networkSymbol = withdrawal.coinNetwork?.network?.symbol || ''
  const explorerUrl = withdrawal.coinNetwork?.network?.explorerUrl || ''
  const toAddress = withdrawal.toAddress || withdrawal.address || withdrawal.withdrawalAddress?.address || ''
  const fromAddress = withdrawal.fromAddress || ''
  const totalFee = withdrawal.totalFee || withdrawal.fee || ''
  const totalAmount = withdrawal.totalAmount || ''

  return (
    <>
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50 dark:hover:bg-white/6 transition-colors mb-4 cursor-pointer"
      >
        <i className="bx bx-arrow-back"></i>
        {t('actions.back', { defaultValue: 'Back' })}
      </button>

      {/* Hero card */}
      <div className="bg-card rounded-xl shadow-sm border border-surface-200 p-5 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={48} />
            <div>
              <h4 className="text-lg font-semibold text-surface-900 flex items-center gap-2 mb-1">
                {t('withdrawals.detail', { defaultValue: 'Withdrawal' })} #{withdrawal.id}
                <RefreshButton onClick={loadWithdrawal} loading={loading} />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Details */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl shadow-sm border border-surface-200">
            <div className="px-5 py-4 border-b border-surface-200">
              <h6 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-0">
                <i className="bx bx-detail text-primary-600"></i>
                {t('withdrawals.details', { defaultValue: 'Details' })}
              </h6>
            </div>
            <div className="p-5">
              <DetailRow label={t('withdrawals.coin', { defaultValue: 'Coin' })}>
                <div className="flex items-center gap-2">
                  <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} />
                  <span>{coinSymbol}</span>
                  {networkSymbol && networkSymbol !== coinSymbol && (
                    <span className="text-surface-400 text-xs">({networkSymbol})</span>
                  )}
                </div>
              </DetailRow>
              <DetailRow label={t('withdrawals.totalAmount', { defaultValue: 'Total Amount' })}>
                {formatCoinAmount(totalAmount || withdrawal.amount || 0)} {coinSymbol}
              </DetailRow>
              {totalFee && (
                <DetailRow label={t('withdrawals.fee', { defaultValue: 'Fee' })}>
                  {formatCoinAmount(totalFee)} {coinSymbol}
                </DetailRow>
              )}
              <DetailRow label={t('withdrawals.netAmount', { defaultValue: 'Net Amount' })}>
                <span className="text-success-600 dark:text-success-400 font-medium">
                  {formatCoinAmount(withdrawal.amount || 0)} {coinSymbol}
                </span>
              </DetailRow>
              {fromAddress && (
                <DetailRow label={t('withdrawals.fromAddress', { defaultValue: 'From Address' })}>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs break-all">{fromAddress}</span>
                    <CopyBtn text={fromAddress} onCopy={handleCopy} />
                  </div>
                </DetailRow>
              )}
              <DetailRow label={t('withdrawals.address', { defaultValue: 'To Address' })}>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs break-all">{toAddress || '-'}</span>
                  {toAddress && <CopyBtn text={toAddress} onCopy={handleCopy} />}
                </div>
              </DetailRow>
              {withdrawal.txHash && (
                <DetailRow label={t('withdrawals.txHash', { defaultValue: 'Transaction Hash' })}>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs break-all">{withdrawal.txHash}</span>
                    <CopyBtn text={withdrawal.txHash} onCopy={handleCopy} />
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
                <DetailRow label={t('withdrawals.memo', { defaultValue: 'Memo' })}>{withdrawal.memo}</DetailRow>
              )}
              {withdrawal.failureReason && (
                <DetailRow label={t('withdrawals.reason', { defaultValue: 'Failure Reason' })}>
                  <span className="text-danger-600 dark:text-danger-400">{withdrawal.failureReason}</span>
                </DetailRow>
              )}
              {withdrawal.rejectReason && (
                <DetailRow label={t('withdrawals.rejectReason', { defaultValue: 'Reject Reason' })}>
                  <span className="text-danger-600 dark:text-danger-400">{withdrawal.rejectReason}</span>
                </DetailRow>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="bg-card rounded-xl shadow-sm border border-surface-200 p-5">
            <h6 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-4">
              <i className="bx bx-time-five text-primary-600"></i>
              {t('withdrawals.timeline', { defaultValue: 'Timeline' })}
            </h6>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-500">
                  {t('withdrawals.created', { defaultValue: 'Created' })}
                </span>
                <span className="text-xs text-surface-700">{fmtDate(withdrawal.createdAt)}</span>
              </div>
              {withdrawal.processedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">
                    {t('withdrawals.processed', { defaultValue: 'Processed' })}
                  </span>
                  <span className="text-xs text-surface-700">{fmtDate(withdrawal.processedAt)}</span>
                </div>
              )}
              {withdrawal.completedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">
                    {t('withdrawals.completed', { defaultValue: 'Completed' })}
                  </span>
                  <span className="text-xs text-surface-700">{fmtDate(withdrawal.completedAt)}</span>
                </div>
              )}
              {withdrawal.updatedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-500">
                    {t('withdrawals.updated', { defaultValue: 'Updated' })}
                  </span>
                  <span className="text-xs text-surface-700">{fmtDate(withdrawal.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
