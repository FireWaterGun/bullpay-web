'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth, useToast } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { getUserBalanceDetail } from '@/lib/api/admin'
import { formatDate } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg'
import SummaryCard from '@/components/admin/RevenueSummaryCard'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

export default function UserBalanceDetailPage() {
  const { t } = useTranslation()
  const { id: userId } = useParams()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => { loadDetail() }, [userId])

  async function loadDetail() {
    if (!token) return
    try {
      setLoading(true)
      const result = await getUserBalanceDetail(token, userId)
      setData(result)
    } catch (error) {
      logger.error('Failed to load user balance detail:', error)
      toast.error('Failed to load user balance detail')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!data) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: 'var(--bs-secondary-color)' }}></i>
          <p className="text-muted mt-2">User balance not found</p>
          <button className="btn btn-text-secondary" onClick={() => router.back()}>Back</button>
        </div>
      </div>
    )
  }

  const assets = data.assets || []

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <Link href="/admin/user-balances" className="btn btn-outline-secondary mb-3">
            <i className="bx bx-arrow-back me-2"></i>Back to User Balances
          </Link>

          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-user me-2"></i>
                    User #{userId} Balances
                  </h4>
                  {data.valuedAt && (
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      Valued at {formatDate(data.valuedAt)}
                    </span>
                  )}
                </div>
                <RefreshButton onClick={loadDetail} loading={loading} />
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <SummaryCard title="Total Assets" value={data.totalAssets ?? 0} icon="bx-coin-stack" color="primary" />
            <SummaryCard title="Total Value (USD)" value={`$${data.totalValueUsd ?? '0.00'}`} icon="bx-dollar-circle" color="success" />
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0"><i className="bx bx-coin-stack me-2"></i>Assets</h5>
            </div>
            <div className="card-body">
              {assets.length === 0 ? (
                <div className="text-center text-muted py-4">No assets found for this user</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr style={{ whiteSpace: 'nowrap' }}>
                        <th>Coin</th>
                        <th>Network</th>
                        <th className="text-end">Confirmed</th>
                        <th className="text-end">Unconfirmed</th>
                        <th className="text-end">Locked</th>
                        <th className="text-end">Available</th>
                        <th className="text-end">Total</th>
                        <th className="text-end">Price (USD)</th>
                        <th className="text-end">Value (USD)</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset, idx) => {
                        const coinSym = (asset.coin?.symbol || '').toUpperCase()
                        const netSym = (asset.network?.symbol || '').toUpperCase()
                        const netName = asset.network?.name || netSym

                        return (
                          <tr key={asset.coinNetworkId || idx}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <CoinImg symbol={coinSym} networkSymbol={netSym} size={28} />
                                <div>
                                  <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{coinSym}</div>
                                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                    {asset.coin?.type === 'native' ? 'Native' : 'Token'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className="fw-medium" style={{ fontSize: '0.85rem' }}>{netName}</div>
                                {asset.network?.explorerUrl && (
                                  <a href={asset.network.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-muted" style={{ fontSize: '0.7rem' }}>
                                    Explorer <i className="bx bx-link-external" style={{ fontSize: '0.65rem' }}></i>
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="text-end text-nowrap"><span className="fw-medium">{asset.confirmedBalance || '0'}</span></td>
                            <td className="text-end text-nowrap">
                              <span className={`fw-medium ${parseFloat(asset.unconfirmedBalance) > 0 ? 'text-warning' : 'text-muted'}`}>
                                {asset.unconfirmedBalance || '0'}
                              </span>
                            </td>
                            <td className="text-end text-nowrap">
                              <span className={`fw-medium ${parseFloat(asset.lockedBalance) > 0 ? 'text-danger' : 'text-muted'}`}>
                                {asset.lockedBalance || '0'}
                              </span>
                            </td>
                            <td className="text-end text-nowrap"><span className="fw-medium">{asset.availableBalance || '0'}</span></td>
                            <td className="text-end text-nowrap"><span className="fw-medium">{asset.totalBalance || '0'}</span></td>
                            <td className="text-end text-nowrap"><span className="fw-medium">${asset.priceUsd ?? '-'}</span></td>
                            <td className="text-end text-nowrap"><span className="fw-medium">${asset.valueUsd || '0.00'}</span></td>
                            <td><span style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{formatDate(asset.updatedAt)}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
