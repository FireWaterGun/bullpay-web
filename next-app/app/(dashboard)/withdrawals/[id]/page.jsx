'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getWithdrawalById } from '@/lib/api/withdrawals'
import { formatDate, formatCoinAmount } from '@/lib/utils/format'
import { copyToClipboard } from '@/lib/utils/clipboard'
import CoinImg from '@/components/CoinImg'
import { statusBadgeClass, formatStatusLabel } from '@/components/balance/withdrawalHelpers'

export default function WithdrawalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const withdrawalId = params?.id
  const [withdrawal, setWithdrawal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token && withdrawalId) loadWithdrawal()
  }, [token, withdrawalId])

  async function loadWithdrawal() {
    try {
      setLoading(true)
      const data = await getWithdrawalById(withdrawalId, token)
      setWithdrawal(data)
    } catch (err) {
      toast.error( err?.message || t('withdrawals.loadError', { defaultValue: 'Failed to load withdrawal' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text) {
    const ok = await copyToClipboard(text)
    if (ok) toast.success( t('common.copied', { defaultValue: 'Copied!' }))
  }

  if (loading && !withdrawal) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!withdrawal) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-danger">
          {t('withdrawals.notFound', { defaultValue: 'Withdrawal not found' })}
        </div>
      </div>
    )
  }

  const coinSymbol = withdrawal.coinSymbol || withdrawal.coin?.symbol || ''
  const networkSymbol = withdrawal.networkSymbol || withdrawal.network?.symbol || ''

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="d-flex align-items-center mb-4">
        <button className="btn btn-text-secondary me-2" onClick={() => router.back()}>
          <i className="bx bx-arrow-back"></i>
        </button>
        <div>
          <h4 className="fw-bold mb-0">
            {t('withdrawals.detail', { defaultValue: 'Withdrawal' })} #{withdrawal.id}
          </h4>
          <span className={statusBadgeClass(withdrawal.status)}>
            {formatStatusLabel(withdrawal.status)}
          </span>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">{t('withdrawals.details', { defaultValue: 'Withdrawal Details' })}</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-borderless mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted" style={{ width: 160 }}>{t('withdrawals.coin', { defaultValue: 'Coin' })}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} />
                          <span>{coinSymbol}</span>
                          {networkSymbol && <small className="text-muted">({networkSymbol})</small>}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">{t('withdrawals.amount', { defaultValue: 'Amount' })}</td>
                      <td className="fw-semibold fs-5">{formatCoinAmount(withdrawal.amountDecimal || withdrawal.amount || 0)} {coinSymbol}</td>
                    </tr>
                    {withdrawal.fee && (
                      <tr>
                        <td className="text-muted">{t('withdrawals.fee', { defaultValue: 'Fee' })}</td>
                        <td>{formatCoinAmount(withdrawal.feeDecimal || withdrawal.fee || 0)} {coinSymbol}</td>
                      </tr>
                    )}
                    {withdrawal.netAmount && (
                      <tr>
                        <td className="text-muted">{t('withdrawals.netAmount', { defaultValue: 'Net Amount' })}</td>
                        <td className="text-success fw-semibold">{formatCoinAmount(withdrawal.netAmountDecimal || withdrawal.netAmount || 0)} {coinSymbol}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="text-muted">{t('withdrawals.address', { defaultValue: 'To Address' })}</td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <span className="font-monospace small text-break">
                            {withdrawal.address || withdrawal.withdrawalAddress?.address || '-'}
                          </span>
                          {(withdrawal.address || withdrawal.withdrawalAddress?.address) && (
                            <button className="btn btn-sm btn-icon btn-text-secondary flex-shrink-0" onClick={() => handleCopy(withdrawal.address || withdrawal.withdrawalAddress?.address)}>
                              <i className="bx bx-copy"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {withdrawal.txHash && (
                      <tr>
                        <td className="text-muted">{t('withdrawals.txHash', { defaultValue: 'Transaction Hash' })}</td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <span className="font-monospace small text-break">{withdrawal.txHash}</span>
                            <button className="btn btn-sm btn-icon btn-text-secondary flex-shrink-0" onClick={() => handleCopy(withdrawal.txHash)}>
                              <i className="bx bx-copy"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {withdrawal.memo && (
                      <tr>
                        <td className="text-muted">{t('withdrawals.memo', { defaultValue: 'Memo' })}</td>
                        <td>{withdrawal.memo}</td>
                      </tr>
                    )}
                    {withdrawal.rejectReason && (
                      <tr>
                        <td className="text-muted">{t('withdrawals.reason', { defaultValue: 'Reject Reason' })}</td>
                        <td className="text-danger">{withdrawal.rejectReason}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h6 className="mb-3">{t('withdrawals.timeline', { defaultValue: 'Timeline' })}</h6>
              <ul className="list-unstyled mb-0">
                <li className="d-flex justify-content-between mb-2">
                  <span className="text-muted">{t('withdrawals.created', { defaultValue: 'Created' })}</span>
                  <span className="small">{formatDate(withdrawal.createdAt)}</span>
                </li>
                {withdrawal.processedAt && (
                  <li className="d-flex justify-content-between mb-2">
                    <span className="text-muted">{t('withdrawals.processed', { defaultValue: 'Processed' })}</span>
                    <span className="small">{formatDate(withdrawal.processedAt)}</span>
                  </li>
                )}
                {withdrawal.completedAt && (
                  <li className="d-flex justify-content-between mb-2">
                    <span className="text-muted">{t('withdrawals.completed', { defaultValue: 'Completed' })}</span>
                    <span className="small">{formatDate(withdrawal.completedAt)}</span>
                  </li>
                )}
                {withdrawal.updatedAt && (
                  <li className="d-flex justify-content-between">
                    <span className="text-muted">{t('withdrawals.updated', { defaultValue: 'Updated' })}</span>
                    <span className="small">{formatDate(withdrawal.updatedAt)}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
