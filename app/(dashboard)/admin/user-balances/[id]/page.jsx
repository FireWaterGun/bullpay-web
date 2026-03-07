'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

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
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

export default function UserBalanceDetailPage() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const { id: userId } = useParams()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  const loadDetail = useCallback(async () => {
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
  }, [token, userId, toast, t])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  if (loading) {
    return <PageSpinner />
  }

  if (!data) {
    return (
      <div className="grow pb-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[3rem] text-surface-500"></i>
          <p className="text-surface-500 mt-2">{t('admin.userBalance.notFound', { defaultValue: 'User balance not found' })}</p>
          <Button
            onClick={() => router.back()}
            className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none"
          >
            {t('common.back', { defaultValue: 'Back' })}
          </Button>
        </div>
      </div>
    )
  }

  const assets = data.assets || []

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Button variant="outline-secondary" className="mb-3" href="/admin/user-balances">
            <i className="bx bx-arrow-back mr-2"></i>{t('admin.userBalance.backToList', { defaultValue: 'Back to User Balances' })}
          </Button>

          <Card className="mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-user mr-2"></i>
                    {t('admin.userBalance.detailTitle', { id: userId, defaultValue: 'User #{{id}} Balances' })}
                  </h4>
                  {data.valuedAt && (
                    <span className="text-surface-500 text-[0.8rem]">{t('admin.userBalance.valuedAt', { defaultValue: 'Valued at' })} {fmtDate(data.valuedAt)}</span>
                  )}
                </div>
                <RefreshButton onClick={loadDetail} loading={loading} />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-x-6 gap-4 mb-4">
            <SummaryCard
              title={t('admin.userBalance.totalAssets', { defaultValue: 'Total Assets' })}
              value={data.totalAssets ?? 0}
              icon="bx-coin-stack"
              color="primary"
            />
            <SummaryCard
              title={t('admin.userBalance.totalValueUsd', { defaultValue: 'Total Value (USD)' })}
              value={`$${data.totalValueUsd ?? '0.00'}`}
              icon="bx-dollar-circle"
              color="success"
            />
          </div>

          <Card>
            <div className="px-5 py-4 border-b border-surface-200">
              <h5 className="mb-0">
                <i className="bx bx-coin-stack mr-2"></i>
                {t('admin.userBalance.assets', { defaultValue: 'Assets' })}
              </h5>
            </div>
            {assets.length === 0 ? (
              <div className="p-5">
                <CardEmptyState icon="bx-coin-stack" message={t('admin.userBalance.noAssets', { defaultValue: 'No assets found for this user' })} />
              </div>
            ) : (
              <Table>
                <thead>
                  <tr className="whitespace-nowrap">
                    <th>{t('admin.detail.coin', { defaultValue: 'Coin' })}</th>
                    <th>{t('admin.detail.network', { defaultValue: 'Network' })}</th>
                    <th className="text-right">{t('admin.userBalance.confirmed', { defaultValue: 'Confirmed' })}</th>
                    <th className="text-right">{t('admin.userBalance.unconfirmed', { defaultValue: 'Unconfirmed' })}</th>
                    <th className="text-right">{t('admin.userBalance.locked', { defaultValue: 'Locked' })}</th>
                    <th className="text-right">{t('admin.userBalance.available', { defaultValue: 'Available' })}</th>
                    <th className="text-right">{t('admin.userBalance.total', { defaultValue: 'Total' })}</th>
                    <th className="text-right">{t('admin.userBalance.priceUsd', { defaultValue: 'Price (USD)' })}</th>
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
                              <div className="font-semibold text-[0.85rem]">{coinSym}</div>
                              <div className="text-surface-500 text-[0.7rem]">
                                {asset.coin?.type === 'native' ? t('admin.detail.native', { defaultValue: 'Native' }) : t('admin.detail.token', { defaultValue: 'Token' })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="font-medium text-[0.85rem]">{netName}</div>
                            {asset.network?.explorerUrl && (
                              <a
                                href={asset.network.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-surface-500 text-[0.7rem]"
                              >
                                {t('admin.detail.explorer', { defaultValue: 'Explorer' })} <i className="bx bx-link-external text-[0.65rem]"></i>
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <span className="font-medium">{asset.confirmedBalance || '0'}</span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <span
                            className={`font-medium ${parseFloat(asset.unconfirmedBalance) > 0 ? 'text-warning' : 'text-surface-500'}`}
                          >
                            {asset.unconfirmedBalance || '0'}
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <span
                            className={`font-medium ${parseFloat(asset.lockedBalance) > 0 ? 'text-danger' : 'text-surface-500'}`}
                          >
                            {asset.lockedBalance || '0'}
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <span className="font-medium">{asset.availableBalance || '0'}</span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <span className="font-medium">{asset.totalBalance || '0'}</span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <span className="font-medium">${asset.priceUsd ?? '-'}</span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <span className="font-medium">${asset.valueUsd || '0.00'}</span>
                        </td>
                        <td>
                          <span className="whitespace-nowrap text-[0.8rem]">{fmtDate(asset.updatedAt)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
