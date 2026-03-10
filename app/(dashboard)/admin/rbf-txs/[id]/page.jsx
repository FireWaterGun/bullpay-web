'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getRbfTxById } from '@/lib/api/admin'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { useDateFormat } from '@/hooks/useDateFormat'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function RbfTxDetail() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const { id } = useParams()
  const { fmtDate } = useDateFormat()

  const [loading, setLoading] = useState(true)
  const [tx, setTx] = useState(null)

  const loadTransaction = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getRbfTxById(token, parseInt(id))
      setTx(data)
    } catch (error) {
      logger.error('Failed to load RBF transaction:', error)
      toast.error(t('admin.rbfDetail.loadError', { defaultValue: 'Failed to load RBF transaction' }))
    } finally {
      setLoading(false)
    }
  }, [token, id, toast, t])

  useEffect(() => {
    loadTransaction()
  }, [loadTransaction])

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
  }

  function formatReplacementReason(reason) {
    if (!reason) return '-'
    return reason.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!tx) {
    return (
      <div className="grow pb-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[3rem] text-surface-500"></i>
          <p className="text-surface-500 mt-2">{t('admin.rbfDetail.notFound', { defaultValue: 'RBF transaction not found' })}</p>
          <Button href="/admin/rbf-txs">{t('actions.back', { defaultValue: 'Back' })}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back button */}
          <div className="mb-4">
            <Button variant="outline-secondary" className="gap-1" href="/admin/rbf-txs">
              <i className="bx bx-arrow-back"></i>
              {t('admin.rbfDetail.backToList', { defaultValue: 'Back to RBF Transactions' })}
            </Button>
          </div>

          {/* Header */}
          <Card className="mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-revision mr-2"></i>
                    {t('admin.rbfDetail.detailTitle', { defaultValue: 'RBF Transaction #{{id}}', id: tx.id })}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={getStatusBadgeClass(tx.status, 'rbf')}>
                      {String(tx.status || '').toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        tx.entityType === 'sweep'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                      }`}
                    >
                      {(tx.entityType || '').toUpperCase()} #{tx.entityId}
                    </span>
                    <span className="text-surface-500 uppercase text-xs font-medium">
                      {tx.chainType}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-4">
            {/* Transaction Details */}
            <Card>
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="mb-0">{t('admin.rbfDetail.transactionDetails', { defaultValue: 'Transaction Details' })}</h5>
              </div>
              <div className="p-5 space-y-3">
                <DetailRow label={t('admin.rbfDetail.amount', { defaultValue: 'Amount' })} value={tx.amount != null ? `${tx.amount}` : '-'} />
                <DetailRow label={t('admin.rbfDetail.amountRaw', { defaultValue: 'Amount (Raw)' })} value={tx.amountRaw || '-'} mono />
                <DetailRow label={t('admin.rbfDetail.decimals', { defaultValue: 'Decimals' })} value={tx.decimals ?? '-'} />
                <DetailRow label={t('admin.rbfDetail.nonce', { defaultValue: 'Nonce' })} value={tx.nonce ?? '-'} />
                <DetailRow label={t('admin.rbfDetail.blockNumber', { defaultValue: 'Block Number' })} value={tx.blockNumber || '-'} />
                <DetailRow label={t('admin.rbfDetail.confirmations', { defaultValue: 'Confirmations' })} value={tx.confirmations ?? '-'} />
                {tx.txHash && (
                  <div className="flex items-start gap-2">
                    <span className="text-surface-500 whitespace-nowrap min-w-[120px]">{t('admin.rbfDetail.txHash', { defaultValue: 'Tx Hash' })}</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-mono text-xs break-all">{tx.txHash}</span>
                      <Button
                        onClick={() => handleCopy(tx.txHash)}
                        size="icon-sm"
                        variant="text-secondary"
                        title="Copy"
                      >
                        <i className="bx bx-copy"></i>
                      </Button>
                    </div>
                  </div>
                )}
                {tx.fromAddress && (
                  <div className="flex items-start gap-2">
                    <span className="text-surface-500 whitespace-nowrap min-w-[120px]">{t('admin.rbfDetail.from', { defaultValue: 'From' })}</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-mono text-xs break-all">{tx.fromAddress}</span>
                      <Button
                        onClick={() => handleCopy(tx.fromAddress)}
                        size="icon-sm"
                        variant="text-secondary"
                        title="Copy"
                      >
                        <i className="bx bx-copy"></i>
                      </Button>
                    </div>
                  </div>
                )}
                {tx.toAddress && (
                  <div className="flex items-start gap-2">
                    <span className="text-surface-500 whitespace-nowrap min-w-[120px]">{t('admin.rbfDetail.to', { defaultValue: 'To' })}</span>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-mono text-xs break-all">{tx.toAddress}</span>
                      <Button
                        onClick={() => handleCopy(tx.toAddress)}
                        size="icon-sm"
                        variant="text-secondary"
                        title="Copy"
                      >
                        <i className="bx bx-copy"></i>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* RBF Info */}
            <Card>
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="mb-0">{t('admin.rbfDetail.replacementInfo', { defaultValue: 'Replacement Info' })}</h5>
              </div>
              <div className="p-5 space-y-3">
                <DetailRow label={t('admin.rbfDetail.reason', { defaultValue: 'Reason' })} value={formatReplacementReason(tx.replacementReason)} />
                <DetailRow label={t('admin.rbfDetail.replacementCount', { defaultValue: 'Replacement Count' })} value={tx.replacementCount ?? 0} />
                <DetailRow label={t('admin.rbfDetail.gasBumpPercent', { defaultValue: 'Gas Bump %' })} value={tx.gasBumpPercent != null ? `${tx.gasBumpPercent}%` : '-'} />
                <DetailRow label={t('admin.rbfDetail.feeBumpPercent', { defaultValue: 'Fee Bump %' })} value={tx.feeBumpPercent != null ? `${tx.feeBumpPercent}%` : '-'} />
                <DetailRow label={t('admin.rbfDetail.originalTxId', { defaultValue: 'Original Tx ID' })} value={tx.originalTxId ?? '-'} />
                <DetailRow label={t('admin.rbfDetail.replacesTxId', { defaultValue: 'Replaces Tx ID' })} value={tx.replacesTxId ?? '-'} />
                <DetailRow label={t('admin.rbfDetail.replacedByTxId', { defaultValue: 'Replaced By Tx ID' })} value={tx.replacedByTxId ?? '-'} />
                {tx.errorMessage && (
                  <div>
                    <span className="text-surface-500">{t('admin.rbfDetail.error', { defaultValue: 'Error' })}</span>
                    <div className="mt-1 p-2 bg-red-50 dark:bg-red-950/30 rounded text-red-700 dark:text-red-400 text-xs break-all">
                      {tx.errorCode && <span className="font-semibold mr-1">[{tx.errorCode}]</span>}
                      {tx.errorMessage}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Gas Info (EVM) */}
            {tx.chainType === 'evm' && (
              <Card>
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">{t('admin.rbfDetail.gasInfoEvm', { defaultValue: 'Gas Info (EVM)' })}</h5>
                </div>
                <div className="p-5 space-y-3">
                  <DetailRow label={t('admin.rbfDetail.gasPriceRaw', { defaultValue: 'Gas Price (Raw)' })} value={tx.gasPriceRaw || '-'} mono />
                  <DetailRow label={t('admin.rbfDetail.gasUsedRaw', { defaultValue: 'Gas Used (Raw)' })} value={tx.gasUsedRaw || '-'} mono />
                  <DetailRow label={t('admin.rbfDetail.gasLimit', { defaultValue: 'Gas Limit' })} value={tx.gasLimit ?? '-'} />
                  <DetailRow label={t('admin.rbfDetail.maxFeePerGas', { defaultValue: 'Max Fee/Gas (Raw)' })} value={tx.maxFeePerGasRaw || '-'} mono />
                  <DetailRow label={t('admin.rbfDetail.maxPriorityFee', { defaultValue: 'Max Priority Fee (Raw)' })} value={tx.maxPriorityFeePerGasRaw || '-'} mono />
                  <DetailRow label={t('admin.rbfDetail.effectiveGasPrice', { defaultValue: 'Effective Gas Price (Raw)' })} value={tx.effectiveGasPriceRaw || '-'} mono />
                </div>
              </Card>
            )}

            {/* Bitcoin Info */}
            {tx.chainType === 'bitcoin' && (
              <Card>
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">{t('admin.rbfDetail.bitcoinInfo', { defaultValue: 'Bitcoin Info' })}</h5>
                </div>
                <div className="p-5 space-y-3">
                  <DetailRow label={t('admin.rbfDetail.feeSatoshis', { defaultValue: 'Fee (satoshis)' })} value={tx.feeSatoshis ?? '-'} />
                  <DetailRow label={t('admin.rbfDetail.feeRateSatVbyte', { defaultValue: 'Fee Rate (sat/vB)' })} value={tx.feeRateSatVbyte ?? '-'} />
                  <DetailRow label={t('admin.rbfDetail.vsizeBytes', { defaultValue: 'vSize (bytes)' })} value={tx.vsizeBytes ?? '-'} />
                </div>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="mb-0">{t('admin.rbfDetail.timestamps', { defaultValue: 'Timestamps' })}</h5>
              </div>
              <div className="p-5 space-y-3">
                <DetailRow label={t('admin.rbfDetail.created', { defaultValue: 'Created' })} value={fmtDate(tx.createdAt) || '-'} />
                <DetailRow label={t('admin.rbfDetail.broadcasted', { defaultValue: 'Broadcasted' })} value={tx.broadcastedAt ? fmtDate(tx.broadcastedAt) : '-'} />
                <DetailRow label={t('admin.rbfDetail.confirmed', { defaultValue: 'Confirmed' })} value={tx.confirmedAt ? fmtDate(tx.confirmedAt) : '-'} />
                <DetailRow label={t('admin.rbfDetail.replaced', { defaultValue: 'Replaced' })} value={tx.replacedAt ? fmtDate(tx.replacedAt) : '-'} />
                <DetailRow label={t('admin.rbfDetail.updated', { defaultValue: 'Updated' })} value={fmtDate(tx.updatedAt) || '-'} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-surface-500 whitespace-nowrap min-w-[120px]">{label}</span>
      <span className={`${mono ? 'font-mono text-xs' : ''} break-all`}>{value}</span>
    </div>
  )
}
