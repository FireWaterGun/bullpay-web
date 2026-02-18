import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useToastContext } from '../../context/ToastContext'
import { getPaymentStats } from '../../api/admin.ts'
import { formatUsd, formatCoinAmount } from '../../utils/format'

export default function Dashboard() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  
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
      console.error('Failed to load payment stats:', error)
      toast.error(t('admin.dashboard.loadError', { defaultValue: 'Failed to load dashboard data' }))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

  const overview = stats?.overview || {}
  const byStatus = stats?.byStatus || {}
  const byCurrency = stats?.byCurrency || {}
  const topUsers = stats?.topUsers || []
  // Mock 7 days data for testing UI
  const trendsx = {
    '2026-01-02': { USDT: { count: 3, volume: '1250.50' }, ETH: { count: 1, volume: '0.0045' } },
    '2026-01-01': { USDT: { count: 5, volume: '2100.00' }, BNB: { count: 2, volume: '0.85' }, POL: { count: 1, volume: '15.00' } },
    '2025-12-31': { USDC: { count: 4, volume: '980.25' }, ETH: { count: 2, volume: '0.125' } },
    '2025-12-30': { USDT: { count: 6, volume: '3200.00' }, USDC: { count: 3, volume: '1500.00' } },
    '2025-12-29': { BNB: { count: 1, volume: '0.5' }, POL: { count: 4, volume: '45.00' } },
    '2025-12-28': { USDT: { count: 2, volume: '500.00' }, ETH: { count: 1, volume: '0.02' } },
    '2025-12-27': { USDC: { count: 3, volume: '750.00' }, USDT: { count: 4, volume: '1800.00' }, BNB: { count: 1, volume: '0.3' } }
  }
  const trends = stats.trends.daily
  const sortedTrendDates = Object.entries(trends).sort((a, b) => b[0].localeCompare(a[0]))
  const visibleTrends = showAllTrends ? sortedTrendDates.slice(0, 30) : sortedTrendDates.slice(0, 7)
  const hasMoreTrends = sortedTrendDates.length > 7

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Overview Cards */}
          <div className="row g-4 mb-4">
            {/* Total Payments */}
            <div className="col-lg-3 col-md-6">
              <div className="card h-100" style={{ 
                borderRadius: '0.75rem',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '0.75rem',
                      backgroundColor: '#696cff15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className="bx bx-receipt" style={{ fontSize: '1.5rem', color: '#696cff' }}></i>
                    </div>
                  </div>
                  <h4 className="mb-1" style={{ fontWeight: 700, fontSize: '1.75rem' }}>
                    {overview.totalPayments || 0}
                  </h4>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {t('admin.dashboard.payments', { defaultValue: 'Total Payments' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Success Rate */}
            <div className="col-lg-3 col-md-6">
              <div className="card h-100" style={{ 
                borderRadius: '0.75rem',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '0.75rem',
                      backgroundColor: '#71dd3715',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className="bx bx-check-circle" style={{ fontSize: '1.5rem', color: '#71dd37' }}></i>
                    </div>
                  </div>
                  <h4 className="mb-1" style={{ fontWeight: 700, fontSize: '1.75rem' }}>
                    {overview.successRate || 0}%
                  </h4>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {t('admin.dashboard.successRate', { defaultValue: 'Success Rate' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Fiat Volume */}
            <div className="col-lg-3 col-md-6">
              <div className="card h-100" style={{ 
                borderRadius: '0.75rem',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '0.75rem',
                      backgroundColor: '#03c3ec15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className="bx bx-dollar" style={{ fontSize: '1.5rem', color: '#03c3ec' }}></i>
                    </div>
                  </div>
                  <h4 className="mb-1" style={{ fontWeight: 700, fontSize: '1.75rem' }}>
                    ${overview.fiat?.amount || '0.00'}
                  </h4>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {t('admin.dashboard.fiatVolume', { defaultValue: 'Fiat Volume' })} ({overview.fiat?.currency || 'USD'})
                  </p>
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="col-lg-3 col-md-6">
              <div className="card h-100" style={{ 
                borderRadius: '0.75rem',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '0.75rem',
                      backgroundColor: '#71dd3715',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <i className="bx bx-check-double" style={{ fontSize: '1.5rem', color: '#71dd37' }}></i>
                    </div>
                  </div>
                  <h4 className="mb-1" style={{ fontWeight: 700, fontSize: '1.75rem' }}>
                    {byStatus.completed || 0}
                  </h4>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {t('admin.dashboard.transactions', { defaultValue: 'Completed Transactions' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* By Currency */}
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
                          {Object.entries(byCurrency).map(([currency, data]) => {
                            // API already returns normalized amounts with decimals
                            const totalVolume = data.totalVolume
                            const avgAmount = data.averageAmount
                            
                            return (
                              <tr key={currency}>
                                <td>
                                  <span className="fw-medium">{currency}</span>
                                </td>
                                <td className="text-end">
                                  <span className="badge bg-label-secondary">{data.count}</span>
                                </td>
                                <td className="text-end">
                                  <span className="fw-medium">
                                    {formatCoinAmount(totalVolume)}
                                  </span>
                                </td>
                                <td className="text-end text-muted">
                                  {formatCoinAmount(avgAmount)}
                                </td>
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

            {/* Top Users */}
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

          {/* Daily Trends */}
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
                    backgroundColor: '#03c3ec15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '0.75rem'
                  }}>
                    <i className="bx bx-trending-up" style={{ fontSize: '1.25rem', color: '#03c3ec' }}></i>
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
                        {visibleTrends.map(([date, currencies], idx) => {
                          const totalTxn = Object.values(currencies).reduce((sum, d) => sum + d.count, 0)
                          const isToday = idx === 0
                          return (
                            <div 
                              key={date}
                              style={{
                                minWidth: 280,
                                padding: '1.25rem',
                                borderRadius: '0.75rem',
                                backgroundColor: isToday ? '#696cff' : '#e9ecef',
                                color: isToday ? '#fff' : 'inherit',
                                flexShrink: 0
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span style={{ 
                                  fontSize: '0.8125rem', 
                                  fontWeight: 500,
                                  color: isToday ? 'rgba(255,255,255,0.9)' : '#384551'
                                }}>
                                  {date}
                                </span>
                                <span style={{ 
                                  fontSize: '0.6875rem',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '1rem',
                                  backgroundColor: isToday ? 'rgba(255,255,255,0.2)' : '#d1d5db'
                                }}>
                                  {totalTxn}
                                </span>
                              </div>
                              <div className="mt-2">
                                <div 
                                  className="d-flex justify-content-between mb-1"
                                  style={{ 
                                    fontSize: '0.6875rem', 
                                    opacity: 0.7,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}
                                >
                                  <span style={{ width: '40%' }}>Coin</span>
                                  <span style={{ width: '25%', textAlign: 'center' }}>Txn</span>
                                  <span style={{ width: '35%', textAlign: 'right' }}>Volume</span>
                                </div>
                                {Object.entries(currencies).map(([currency, data]) => (
                                  <div 
                                    key={currency}
                                    className="d-flex justify-content-between align-items-center"
                                    style={{
                                      padding: '0.25rem 0',
                                      fontSize: '0.8125rem'
                                    }}
                                  >
                                    <span style={{ width: '40%', color: isToday ? 'rgba(255,255,255,0.95)' : '#384551' }}>{currency}</span>
                                    <span style={{ width: '25%', textAlign: 'center', color: isToday ? 'rgba(255,255,255,0.8)' : '#566a7f' }}>{data.count}</span>
                                    <span style={{ width: '35%', textAlign: 'right', fontWeight: 500 }}>
                                      {formatCoinAmount(data.volume, 4)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
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
