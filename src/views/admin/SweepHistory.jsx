import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'

export default function SweepHistory() {
  const { t } = useTranslation()
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{t('admin.sweep.historyTitle', { defaultValue: 'Sweep History' })}</h5>
                <p className="text-muted small mb-0 mt-1">
                  {t('admin.sweep.historyDesc', { defaultValue: 'View all sweep transactions and their status' })}
                </p>
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary">
                  <i className="bx bx-filter me-1"></i>
                  {t('actions.filters', { defaultValue: 'Filters' })}
                </button>
                <button type="button" className="btn btn-sm btn-outline-primary">
                  <i className="bx bx-refresh me-1"></i>
                  {t('actions.refresh', { defaultValue: 'Refresh' })}
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Filters */}
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <label className="form-label">{t('admin.sweep.coin', { defaultValue: 'Coin' })}</label>
                  <select className="form-select">
                    <option value="">{t('crypto.allCoins', { defaultValue: 'All Coins' })}</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">{t('admin.sweep.network', { defaultValue: 'Network' })}</label>
                  <select className="form-select">
                    <option value="">{t('crypto.allNetworks', { defaultValue: 'All Networks' })}</option>
                    <option value="Ethereum">Ethereum</option>
                    <option value="BSC">BSC</option>
                    <option value="Polygon">Polygon</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">{t('admin.sweep.status', { defaultValue: 'Status' })}</label>
                  <select className="form-select">
                    <option value="">{t('invoices.allStatus', { defaultValue: 'All Status' })}</option>
                    <option value="pending">{t('admin.sweep.pending', { defaultValue: 'Pending' })}</option>
                    <option value="completed">{t('admin.sweep.completed', { defaultValue: 'Completed' })}</option>
                    <option value="failed">{t('admin.sweep.failed', { defaultValue: 'Failed' })}</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">{t('admin.sweep.dateRange', { defaultValue: 'Date Range' })}</label>
                  <select className="form-select">
                    <option value="today">{t('admin.sweep.today', { defaultValue: 'Today' })}</option>
                    <option value="week">{t('admin.sweep.thisWeek', { defaultValue: 'This Week' })}</option>
                    <option value="month">{t('admin.sweep.thisMonth', { defaultValue: 'This Month' })}</option>
                  </select>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div className="card border shadow-none mb-0">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar flex-shrink-0 me-3">
                          <span className="avatar-initial rounded bg-label-primary">
                            <i className="bx bx-check-circle"></i>
                          </span>
                        </div>
                        <div>
                          <small className="text-muted d-block">{t('admin.sweep.totalSweeps', { defaultValue: 'Total Sweeps' })}</small>
                          <h6 className="mb-0">0</h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border shadow-none mb-0">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar flex-shrink-0 me-3">
                          <span className="avatar-initial rounded bg-label-success">
                            <i className="bx bx-check-double"></i>
                          </span>
                        </div>
                        <div>
                          <small className="text-muted d-block">{t('admin.sweep.completed', { defaultValue: 'Completed' })}</small>
                          <h6 className="mb-0">0</h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border shadow-none mb-0">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar flex-shrink-0 me-3">
                          <span className="avatar-initial rounded bg-label-warning">
                            <i className="bx bx-time"></i>
                          </span>
                        </div>
                        <div>
                          <small className="text-muted d-block">{t('admin.sweep.pending', { defaultValue: 'Pending' })}</small>
                          <h6 className="mb-0">0</h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border shadow-none mb-0">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar flex-shrink-0 me-3">
                          <span className="avatar-initial rounded bg-label-danger">
                            <i className="bx bx-x-circle"></i>
                          </span>
                        </div>
                        <div>
                          <small className="text-muted d-block">{t('admin.sweep.failed', { defaultValue: 'Failed' })}</small>
                          <h6 className="mb-0">0</h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>{t('admin.sweep.date', { defaultValue: 'Date' })}</th>
                      <th>{t('admin.sweep.coin', { defaultValue: 'Coin' })}</th>
                      <th>{t('admin.sweep.network', { defaultValue: 'Network' })}</th>
                      <th>{t('admin.sweep.amount', { defaultValue: 'Amount' })}</th>
                      <th>{t('admin.sweep.from', { defaultValue: 'From' })}</th>
                      <th>{t('admin.sweep.to', { defaultValue: 'To' })}</th>
                      <th>{t('admin.sweep.txHash', { defaultValue: 'Tx Hash' })}</th>
                      <th>{t('admin.sweep.status', { defaultValue: 'Status' })}</th>
                      <th>{t('actions.actions', { defaultValue: 'Actions' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="9" className="text-center text-muted py-5">
                        <i className="bx bx-info-circle bx-lg d-block mb-2"></i>
                        {t('admin.sweep.noHistory', { defaultValue: 'No sweep history available' })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center mt-4">
                <div className="text-muted small">
                  {t('invoices.showingEntries', { start: 0, end: 0, total: 0, defaultValue: 'Showing 0 to 0 of 0 entries' })}
                </div>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className="page-item disabled">
                      <a className="page-link" href="#">
                        <i className="bx bx-chevron-left"></i>
                      </a>
                    </li>
                    <li className="page-item active">
                      <a className="page-link" href="#">1</a>
                    </li>
                    <li className="page-item disabled">
                      <a className="page-link" href="#">
                        <i className="bx bx-chevron-right"></i>
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
