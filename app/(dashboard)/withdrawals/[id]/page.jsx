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
import RefreshButton from '@/components/RefreshButton'

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

  const coinSymbol = withdrawal.symbol || withdrawal.coinNetwork?.coin?.symbol || ''
  const networkSymbol = withdrawal.coinNetwork?.network?.symbol || ''
  const explorerUrl = withdrawal.coinNetwork?.network?.explorerUrl || ''
  const toAddress = withdrawal.toAddress || withdrawal.address || withdrawal.withdrawalAddress?.address || ''
  const fromAddress = withdrawal.fromAddress || ''
  const totalFee = withdrawal.totalFee || withdrawal.fee || ''
  const totalAmount = withdrawal.totalAmount || ''

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <button
        onClick={() => router.back()}
        className="btn btn-outline-secondary mb-3"
      >
        <i className="bx bx-arrow-back me-2"></i>
        {t('actions.back', { defaultValue: 'Back' })}
      </button>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={48} />
              <div>
                <h4 className="mb-1 d-flex align-items-center gap-2">
                  {t('withdrawals.detail', { defaultValue: 'Withdrawal' })} #{withdrawal.id}
                  <RefreshButton onClick={loadWithdrawal} loading={loading} />
                </h4>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className={statusBadgeClass(withdrawal.status)}>
                    {formatStatusLabel(withdrawal.status)}
                  </span>
                  {coinSymbol && (
                    <span className="badge bg-label-secondary">{coinSymbol}</span>
                  )}
                  {networkSymbol && networkSymbol !== coinSymbol && (
                    <span className="badge bg-label-info">{networkSymbol}</span>
                  )}
                </div>
              </div>
            </div>
            {totalAmount && (
              <div className="text-end">
                <h4 className="mb-0">{formatCoinAmount(totalAmount)}</h4>
                {withdrawal.amountUsd && <small className="text-muted">${Number(withdrawal.amountUsd).toFixed(2)}</small>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0"><i className="bx bx-detail me-2"></i>{t('withdrawals.details', { defaultValue: 'Details' })}</h6>
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
                          {networkSymbol && networkSymbol !== coinSymbol && <small className="text-muted">({networkSymbol})</small>}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">{t('withdrawals.totalAmount', { defaultValue: 'Total Amount' })}</td>
                      <td>{formatCoinAmount(totalAmount || withdrawal.amount || 0)} {coinSymbol}</td>
                    </tr>
                    {totalFee && (
                      <tr>
                        <td className="text-muted">{t('withdrawals.fee', { defaultValue: 'Fee' })}</td>
                        <td>{formatCoinAmount(totalFee)} {coinSymbol}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="text-muted">{t('withdrawals.netAmount', { defaultValue: 'Net Amount' })}</td>
                      <td className="text-success fw-semibold">{formatCoinAmount(withdrawal.amount || 0)} {coinSymbol}</td>
                    </tr>
                    {fromAddress && (
                      <tr>
                        <td className="text-muted">{t('withdrawals.fromAddress', { defaultValue: 'From Address' })}</td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <span className="font-monospace small text-break">{fromAddress}</span>
                            <button className="btn btn-sm btn-icon btn-text-secondary flex-shrink-0" onClick={() => handleCopy(fromAddress)}>
                              <i className="bx bx-copy"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="text-muted">{t('withdrawals.address', { defaultValue: 'To Address' })}</td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <span className="font-monospace small text-break">
                            {toAddress || '-'}
                          </span>
                          {toAddress && (
                            <button className="btn btn-sm btn-icon btn-text-secondary flex-shrink-0" onClick={() => handleCopy(toAddress)}>
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
                            {explorerUrl && (
                              <a href={`${explorerUrl}/tx/${withdrawal.txHash}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-icon btn-text-primary flex-shrink-0">
                                <i className="bx bx-link-external"></i>
                              </a>
                            )}
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
                    {withdrawal.failureReason && (
                      <tr>
                        <td className="text-muted">{t('withdrawals.reason', { defaultValue: 'Failure Reason' })}</td>
                        <td className="text-danger">{withdrawal.failureReason}</td>
                      </tr>
                    )}
                    {withdrawal.rejectReason && (
                      <tr>
                        <td className="text-muted">{t('withdrawals.rejectReason', { defaultValue: 'Reject Reason' })}</td>
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
              <h6 className="mb-3"><i className="bx bx-time-five me-2"></i>{t('withdrawals.timeline', { defaultValue: 'Timeline' })}</h6>
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
