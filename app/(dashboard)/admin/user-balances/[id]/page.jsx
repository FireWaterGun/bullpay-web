'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getUserBalanceDetail } from '@/lib/api/admin'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import SummaryCard from '@/components/admin/RevenueSummaryCard'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import CardEmptyState from '@/components/CardEmptyState'

export default function UserBalanceDetailPage() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
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
      toast.error(t('admin.userBalance.loadDetailError', { defaultValue: 'Failed to load user balance detail' }))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!data) {
    return (
      <div className="grow py-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '3rem', color: 'var(--bs-secondary-color)' }}></i>
          <p className="text-muted mt-2">User balance not found</p>
          <button className="btn btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none" onClick={() => router.back()}>Back</button>
        </div>
      </div>
    )
  }

  const assets = data.assets || []

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Link href="/admin/user-balances" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 mb-3">
            <i className="bx bx-arrow-back mr-2"></i>Back to User Balances
          </Link>

          <div className="card mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-user mr-2"></i>
                    User #{userId} Balances
                  </h4>
                  {data.valuedAt && (
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                      Valued at {fmtDate(data.valuedAt)}
                    </span>
                  )}
                </div>
                <RefreshButton onClick={loadDetail} loading={loading} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-x-6 gap-4 mb-4">
            <SummaryCard title={t('admin.userBalance.totalAssets', { defaultValue: 'Total Assets' })} value={data.totalAssets ?? 0} icon="bx-coin-stack" color="primary" />
            <SummaryCard title={t('admin.userBalance.totalValueUsd', { defaultValue: 'Total Value (USD)' })} value={`$${data.totalValueUsd ?? '0.00'}`} icon="bx-dollar-circle" color="success" />
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b border-surface-200">
              <h5 className="mb-0"><i className="bx bx-coin-stack mr-2"></i>{t('admin.userBalance.assets', { defaultValue: 'Assets' })}</h5>
            </div>
            <div className="p-5">
              {assets.length === 0 ? (
                <CardEmptyState
                  icon="bx-coin-stack"
                  message="No assets found for this user"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ whiteSpace: 'nowrap' }}>
                        <th>{t('admin.detail.coin', { defaultValue: 'Coin' })}</th>
                        <th>{t('admin.detail.network', { defaultValue: 'Network' })}</th>
                        <th className="text-right">{t('status.confirmed', { defaultValue: 'Confirmed' })}</th>
                        <th className="text-right">{t('status.unconfirmed', { defaultValue: 'Unconfirmed' })}</th>
                        <th className="text-right">Locked</th>
                        <th className="text-right">Available</th>
                        <th className="text-right">Total</th>
                        <th className="text-right">Price (USD)</th>
                        <th className="text-right">{t('admin.userBalance.valueUsd', { defaultValue: 'Value (USD)' })}</th>
                        <th>{t('admin.detail.updated', { defaultValue: 'Updated' })}</th>
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
                              <div className="flex items-center gap-2">
                                <CoinImg symbol={coinSym} networkSymbol={netSym} size={28} />
                                <div>
                                  <div className="font-semibold" style={{ fontSize: '0.85rem' }}>{coinSym}</div>
                                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                    {asset.coin?.type === 'native' ? 'Native' : 'Token'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className="font-medium" style={{ fontSize: '0.85rem' }}>{netName}</div>
                                {asset.network?.explorerUrl && (
                                  <a href={asset.network.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-muted" style={{ fontSize: '0.7rem' }}>
                                    Explorer <i className="bx bx-link-external" style={{ fontSize: '0.65rem' }}></i>
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="text-right whitespace-nowrap"><span className="font-medium">{asset.confirmedBalance || '0'}</span></td>
                            <td className="text-right whitespace-nowrap">
                              <span className={`font-medium ${parseFloat(asset.unconfirmedBalance) > 0 ?'text-warning' : 'text-muted'}`}>
                                {asset.unconfirmedBalance || '0'}
                              </span>
                            </td>
                            <td className="text-right whitespace-nowrap">
                              <span className={`font-medium ${parseFloat(asset.lockedBalance) > 0 ?'text-danger' : 'text-muted'}`}>
                                {asset.lockedBalance || '0'}
                              </span>
                            </td>
                            <td className="text-right whitespace-nowrap"><span className="font-medium">{asset.availableBalance || '0'}</span></td>
                            <td className="text-right whitespace-nowrap"><span className="font-medium">{asset.totalBalance || '0'}</span></td>
                            <td className="text-right whitespace-nowrap"><span className="font-medium">${asset.priceUsd ?? '-'}</span></td>
                            <td className="text-right whitespace-nowrap"><span className="font-medium">${asset.valueUsd || '0.00'}</span></td>
                            <td><span style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{fmtDate(asset.updatedAt)}</span></td>
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
