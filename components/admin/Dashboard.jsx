'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getPaymentStats } from '@/lib/api/admin'
import { formatUsd, formatCoinAmount, formatPercent } from '@/lib/utils/format'
import { StatCard, DailyTrendCard } from '@/components/admin/DashboardCards'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'

export default function Dashboard() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [showAllTrends, setShowAllTrends] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoading(true)
      const data = await getPaymentStats(token)
      setStats(data)
    } catch (error) {
      logger.error('Failed to load payment stats:', error)
      toast.error(t('admin.dashboard.loadError', { defaultValue: 'Failed to load dashboard data' }))
    } finally {
      setLoading(false)
    }
  }

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
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="row g-4 mb-4">
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

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    {t('admin.dashboard.byCurrency', { defaultValue: 'Volume by Currency' })}
                  </h5>
                </div>
                <div className="card-body">
                  {Object.keys(byCurrency).length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <i className="bx bx-data" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                      <p className="mt-2 mb-0">{t('admin.dashboard.noData', { defaultValue: 'No data available' })}</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>{t('admin.dashboard.currency', { defaultValue: 'Currency' })}</th>
                            <th className="text-end">{t('admin.dashboard.count', { defaultValue: 'Count' })}</th>
                            <th className="text-end">{t('admin.dashboard.totalVolume', { defaultValue: 'Total Volume' })}</th>
                            <th className="text-end">{t('admin.dashboard.avgAmount', { defaultValue: 'Avg Amount' })}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(byCurrency).map(([currency, data]) => (
                            <tr key={currency}>
                              <td>
                                <span className="fw-medium">{currency}</span>
                              </td>
                              <td className="text-end">
                                <span className="badge bg-label-secondary">{data.count}</span>
                              </td>
                              <td className="text-end">
                                <span className="fw-medium">
                                  {formatCoinAmount(data.totalVolume)}
                                </span>
                              </td>
                              <td className="text-end text-muted">
                                {formatCoinAmount(data.averageAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    {t('admin.dashboard.topUsers', { defaultValue: 'Top Users' })}
                  </h5>
                </div>
                <div className="card-body">
                  {topUsers.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bx bx-user" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                      <p className="mt-2 mb-0 small">{t('admin.dashboard.noUsers', { defaultValue: 'No users yet' })}</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {topUsers.map((user, index) => (
                        <div key={user.userId} className="list-group-item px-0">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-0">
                                <span className="badge bg-label-primary me-2">{index + 1}</span>
                                {user.email}
                              </h6>
                              <small className="text-muted">
                                {user.paymentCount} {t('admin.dashboard.payments', { defaultValue: 'payments' })}
                              </small>
                            </div>
                            <div className="text-end">
                              <div className="fw-medium">
                                {formatUsd(user.totalAmountUsd || user.totalAmount || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-2">
            <div className="col-12">
              <div className="card" style={{
                borderRadius: '0.75rem',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <div className="card-header d-flex align-items-center" style={{ border: 'none' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(var(--bs-info-rgb), 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '0.75rem'
                  }}>
                    <i className="bx bx-trending-up" style={{ fontSize: '1.25rem', color: 'var(--bs-info)' }}></i>
                  </div>
                  <h5 className="mb-0" style={{ fontWeight: 600 }}>
                    {t('admin.dashboard.dailyTrends', { defaultValue: 'Daily Trends' })}
                  </h5>
                </div>
                <div className="card-body">
                  {Object.keys(trends).length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bx bx-line-chart" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                      <p className="mt-2 mb-0 small">{t('admin.dashboard.noTrends', { defaultValue: 'No trend data yet' })}</p>
                    </div>
                  ) : (
                    <>
                      <div
                        className="d-flex gap-3 pb-2"
                        style={{
                          overflowX: 'auto',
                          scrollbarWidth: 'thin'
                        }}
                      >
                        {visibleTrends.map(([date, currencies], idx) => (
                          <DailyTrendCard
                            key={date}
                            date={date}
                            currencies={currencies}
                            isToday={idx === 0}
                          />
                        ))}
                      </div>
                      {hasMoreTrends && (
                        <div className="text-end mt-2">
                          <button
                            className="btn btn-sm btn-link text-muted p-0"
                            onClick={() => setShowAllTrends(!showAllTrends)}
                          >
                            {showAllTrends ? t('common.showLess', { defaultValue: 'Show Less' }) : `+${sortedTrendDates.length - 7} more`}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
