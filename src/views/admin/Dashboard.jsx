import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useToastContext } from '../../context/ToastContext'
import { getPaymentStats } from '../../api/admin.ts'

export default function Dashboard() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

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
                                    {parseFloat(totalVolume).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 8
                                    })}
                                  </span>
                                </td>
                                <td className="text-end text-muted">
                                  {parseFloat(avgAmount).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 8
                                  })}
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
                                {parseFloat(user.totalAmount).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 4
                                })}
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
        </div>
      </div>
    </div>
  )
}
