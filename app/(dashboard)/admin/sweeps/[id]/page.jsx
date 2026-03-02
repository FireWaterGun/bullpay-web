'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getSweepById } from '@/lib/api/admin'
import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import { formatUsd } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import SweepMetadataCard from '@/components/admin/SweepMetadataCard'
import SweepTransactionCard, { SweepTimestampsCard } from '@/components/admin/SweepTransactionCard'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'

export default function SweepDetail() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [sweep, setSweep] = useState(null)

  useEffect(() => {
    loadSweep()
  }, [id])

  async function loadSweep() {
    try {
      setLoading(true)
      const data = await getSweepById(token, parseInt(id))
      setSweep(data)
    } catch (error) {
      logger.error('Failed to load sweep transaction:', error)
      toast.error(t('admin.sweepDetail.loadError', { defaultValue: 'Failed to load sweep transaction' }))
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(amountRaw, decimals, coinSymbol, networkSymbol) {
    if (!amountRaw || !decimals) return '0'
    try {
      const chain = AmountNormalizer.detectChain(coinSymbol || '', networkSymbol || '')
      return AmountNormalizer.fromRaw(amountRaw.toString(), chain, decimals)
    } catch (error) {
      const amount = Number(amountRaw) / Math.pow(10, decimals)
      return amount.toString()
    }
  }

  function statusBadgeClass(s) {
    const v = String(s || '').toUpperCase()
    if (v === 'PENDING') return 'badge bg-label-warning'
    if (v === 'PROCESSING' || v === 'APPROVED') return 'badge bg-label-info'
    if (v === 'COMPLETED' || v === 'SUCCESS') return 'badge bg-label-success'
    if (v === 'FAILED' || v === 'REJECTED' || v === 'ERROR') return 'badge bg-label-danger'
    if (v === 'CANCELLED' || v === 'CANCELED') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!sweep) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: 'var(--bs-secondary-color)' }}></i>
          <p className="text-muted mt-2">Sweep transaction not found</p>
          <button className="btn btn-primary" onClick={() => router.back()}>
            {t('actions.back', { defaultValue: 'Back' })}
          </button>
        </div>
      </div>
    )
  }

  const coinSymbol = (sweep.coinNetwork?.coin?.symbol || sweep.coinSymbol || '').toUpperCase()
  const networkSymbol = (sweep.coinNetwork?.network?.symbol || sweep.networkSymbol || '').toUpperCase()
  const networkName = sweep.coinNetwork?.network?.name || sweep.networkName || ''
  const explorerUrl = sweep.coinNetwork?.network?.explorerUrl || sweep.explorerUrl || null

  let metadata = {}
  try {
    metadata = typeof sweep.metadata === 'string' ? JSON.parse(sweep.metadata) : sweep.metadata || {}
  } catch (e) { /* ignore */ }

  const failureReason = metadata.failureReason || null

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
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
                  {coinSymbol && (
                    <CoinImg
                      symbol={coinSymbol}
                      networkSymbol={networkSymbol}
                      size={48}
                    />
                  )}
                  <div>
                    <h4 className="mb-1">
                      Sweep Transaction #{sweep.id}
                    </h4>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className={statusBadgeClass(sweep.status)}>
                        {String(sweep.status || '').toUpperCase()}
                      </span>
                      {metadata.type && (
                        <span className="badge bg-label-info">
                          {metadata.type}
                        </span>
                      )}
                      {coinSymbol && (
                        <span className="badge bg-label-secondary">
                          {coinSymbol}
                        </span>
                      )}
                      {networkName && (
                        <span className="badge bg-label-secondary">
                          {networkName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className="fs-4 fw-bold">
                    {sweep.amount || formatAmount(sweep.amountRaw, sweep.decimals, coinSymbol, networkSymbol)}{' '}
                    <span style={{ fontSize: '0.75em', fontWeight: 'normal' }}>{coinSymbol}</span>
                  </div>
                  {sweep.amountUsd && (
                    <div className="text-muted">
                      {formatUsd(sweep.amountUsd)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bx bx-detail me-2"></i>
                    Details
                  </h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="fw-medium">{sweep.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
                        <td>{sweep.userId || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.coinNetworkId', { defaultValue: 'Coin Network ID' })}</td>
                        <td>{sweep.coinNetworkId || 'N/A'}</td>
                      </tr>
                      {coinSymbol && (
                        <tr>
                          <td className="text-muted">{t('admin.detail.coin', { defaultValue: 'Coin' })}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} className="me-3" />
                              <div>
                                <span className="fw-medium">{coinSymbol}</span>
                                {networkName && (
                                  <small className="text-muted ms-1">/ {networkName}</small>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">{t('admin.detail.status', { defaultValue: 'Status' })}</td>
                        <td><span className={statusBadgeClass(sweep.status)}>{String(sweep.status || '').toUpperCase()}</span></td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.amount', { defaultValue: 'Amount' })}</td>
                        <td>
                          <span className="fw-bold">
                            {sweep.amount || formatAmount(sweep.amountRaw, sweep.decimals, coinSymbol, networkSymbol)}
                          </span>
                        </td>
                      </tr>
                      {sweep.actualAmount && (
                        <tr>
                          <td className="text-muted">Actual Amount</td>
                          <td><span className="fw-medium">{sweep.actualAmount}</span></td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Amount (Raw)</td>
                        <td><code style={{ fontSize: '0.8rem' }}>{sweep.amountRaw || 'N/A'}</code></td>
                      </tr>
                      {sweep.amountUsd && (
                        <tr>
                          <td className="text-muted">USD Value</td>
                          <td>{formatUsd(sweep.amountUsd)}</td>
                        </tr>
                      )}
                      {sweep.usdRate && (
                        <tr>
                          <td className="text-muted">USD Rate</td>
                          <td>
                            {formatUsd(sweep.usdRate)}
                            {sweep.rateSource && <small className="text-muted ms-1">({sweep.rateSource})</small>}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">Decimals</td>
                        <td>{sweep.decimals ?? 'N/A'}</td>
                      </tr>
                      {sweep.reservationId && (
                        <tr>
                          <td className="text-muted">{t('admin.detail.reservationId', { defaultValue: 'Reservation ID' })}</td>
                          <td><code style={{ fontSize: '0.8rem' }}>{sweep.reservationId}</code></td>
                        </tr>
                      )}
                      {sweep.systemWalletId && (
                        <tr>
                          <td className="text-muted">System Wallet ID</td>
                          <td>{sweep.systemWalletId}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <SweepMetadataCard metadata={metadata} />
            </div>

            <div className="col-md-6">
              <SweepTransactionCard sweep={sweep} explorerUrl={explorerUrl} onCopy={handleCopy} />
              <SweepTimestampsCard sweep={sweep} metadata={metadata} />
            </div>
          </div>

          {failureReason && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0 text-danger">
                  <i className="bx bx-error me-2"></i>
                  Failure Reason
                </h5>
              </div>
              <div className="card-body">
                <pre className="mb-0 text-danger" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                  {failureReason}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
