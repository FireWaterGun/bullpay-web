'use client'

import { useState } from 'react'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { getPaymentStats } from '@/lib/api/admin'
import { formatUsd, formatCoinAmount, formatPercent } from '@/lib/utils/format'
import { StatCard, DailyTrendCard } from '@/components/admin/DashboardCards'
import PageSpinner from '@/components/PageSpinner'
import CardEmptyState from '@/components/CardEmptyState'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Table from '../ui/Table'

const STYLE_CHART_CARD = {
  borderRadius: '0.75rem',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
}
const STYLE_CHART_ICON_BG = {
  borderRadius: '0.5rem',
  backgroundColor: 'rgba(6, 182, 212, 0.08)',
  marginRight: '0.75rem',
}

export default function Dashboard() {
  const { t } = useAdminTranslation()
  const toast = useToast()

  const { data: stats, isLoading: loading } = useApi(
    'admin-payment-stats',
    (token) => getPaymentStats(token),
    { onError: () => toast.error(t('admin.dashboard.loadError', { defaultValue: 'Failed to load dashboard data' })) }
  )

  const [showAllTrends, setShowAllTrends] = useState(false)

  if (loading) {
    return <PageSpinner />
  }

  const overview = stats?.overview || {}
  const byStatus = stats?.byStatus || {}
  const byCurrency = stats?.byCurrency || {}
  const topUsers = stats?.topUsers || []
  const trends = stats.trends.daily
  const sortedTrendDates = Object.entries(trends).sort((a, b) => b[0].localeCompare(a[0]))
  const visibleTrends = showAllTrends ? sortedTrendDates.slice(0, 30) : sortedTrendDates.slice(0, 7)
  const hasMoreTrends = sortedTrendDates.length > 7

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <div className="grid grid-cols-12 gap-x-6 gap-4 mb-4">
            <StatCard
              icon="bx-receipt"
              color="primary"
              value={overview.totalPayments || 0}
              label={t('admin.dashboard.payments', { defaultValue: 'Total Payments' })}
            />

            <StatCard
              icon="bx-check-circle"
              color="success"
              value={formatPercent(overview.successRate || 0)}
              label={t('admin.dashboard.successRate', { defaultValue: 'Success Rate' })}
            />

            <StatCard
              icon="bx-dollar"
              color="info"
              value={formatUsd(overview.fiat?.amount || 0)}
              label={`${t('admin.dashboard.fiatVolume', { defaultValue: 'Fiat Volume' })} (${overview.fiat?.currency || 'USD'})`}
            />

            <StatCard
              icon="bx-check-double"
              color="success"
              value={byStatus.completed || 0}
              label={t('admin.dashboard.transactions', { defaultValue: 'Completed Transactions' })}
            />
          </div>

          <div className="grid grid-cols-12 gap-x-6 gap-4">
            <div className="col-span-12 lg:col-span-8">
              <Card>
                <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
                  <h5 className="mb-0">{t('admin.dashboard.byCurrency', { defaultValue: 'Volume by Currency' })}</h5>
                </div>
                {Object.keys(byCurrency).length === 0 ? (
                  <div className="p-5">
                    <CardEmptyState
                      icon="bx-data"
                      message={t('admin.dashboard.noData', { defaultValue: 'No data available' })}
                    />
                  </div>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <th>{t('admin.dashboard.currency', { defaultValue: 'Currency' })}</th>
                        <th className="text-right">{t('admin.dashboard.count', { defaultValue: 'Count' })}</th>
                        <th className="text-right">
                          {t('admin.dashboard.totalVolume', { defaultValue: 'Total Volume' })}
                        </th>
                        <th className="text-right">{t('admin.dashboard.avgAmount', { defaultValue: 'Avg Amount' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(byCurrency).map(([currency, data]) => (
                        <tr key={currency}>
                          <td>
                            <span className="font-medium">{currency}</span>
                          </td>
                          <td className="text-right">
                            <Badge color="secondary">{data.count}</Badge>
                          </td>
                          <td className="text-right">
                            <span className="font-medium">{formatCoinAmount(data.totalVolume)}</span>
                          </td>
                          <td className="text-right text-surface-500">{formatCoinAmount(data.averageAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card>
            </div>

            <div className="col-span-12 lg:col-span-4">
              <Card>
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">{t('admin.dashboard.topUsers', { defaultValue: 'Top Users' })}</h5>
                </div>
                <div className="p-5">
                  {topUsers.length === 0 ? (
                    <CardEmptyState
                      icon="bx-user"
                      message={t('admin.dashboard.noUsers', { defaultValue: 'No users yet' })}
                    />
                  ) : (
                    <div className="divide-y divide-surface-200">
                      {topUsers.map((user, index) => (
                        <div key={user.userId} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <div>
                              <h6 className="mb-0">
                                <Badge color="primary" label className="mr-2">
                                  {index + 1}
                                </Badge>
                                {user.email}
                              </h6>
                              <small className="text-surface-500">
                                {user.paymentCount} {t('admin.dashboard.payments', { defaultValue: 'payments' })}
                              </small>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {formatUsd(user.totalAmountUsd || user.totalAmount || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-x-6 gap-4 mt-2">
            <div className="col-span-12">
              <Card
                style={STYLE_CHART_CARD}
                className="border-none"
              >
                <div className="px-5 py-4 border-b border-surface-200 flex items-center border-none">
                  <div
                    className="w-9 h-9 flex items-center justify-center"
                    style={STYLE_CHART_ICON_BG}
                  >
                    <i className="bx bx-trending-up text-xl text-info-500"></i>
                  </div>
                  <h5 className="mb-0 font-semibold">
                    {t('admin.dashboard.dailyTrends', { defaultValue: 'Daily Trends' })}
                  </h5>
                </div>
                <div className="p-5">
                  {Object.keys(trends).length === 0 ? (
                    <CardEmptyState
                      icon="bx-line-chart"
                      message={t('admin.dashboard.noTrends', { defaultValue: 'No trend data yet' })}
                    />
                  ) : (
                    <>
                      <div className="flex gap-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
                        {visibleTrends.map(([date, currencies], idx) => (
                          <DailyTrendCard key={date} date={date} currencies={currencies} isToday={idx === 0} />
                        ))}
                      </div>
                      {hasMoreTrends && (
                        <div className="text-right mt-2">
                          <Button
                            onClick={() => setShowAllTrends(!showAllTrends)}
                            size="sm"
                            className="bg-transparent text-primary-600 hover:underline shadow-none p-0 text-surface-500"
                          >
                            {showAllTrends
                              ? t('common.showLess', { defaultValue: 'Show Less' })
                              : `+${sortedTrendDates.length - 7} more`}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
