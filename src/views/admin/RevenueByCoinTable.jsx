import { formatUsdAuto, formatPercent as formatPercentShared } from '../../utils/format'
import CoinImg from '../../components/CoinImg'

const formatCurrency = formatUsdAuto
const formatPercent = formatPercentShared

export function RevenueByCoinTable({ byCoinData, totals, loading, t }) {
  return (
    <div className="row mb-4">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <h5 className="card-title mb-0">
              {t('admin.revenueByCoin', { defaultValue: 'Revenue by Coin' })}
            </h5>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-uppercase fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>{t('admin.coin', { defaultValue: 'Coin' })}</th>
                      <th className="text-end text-uppercase fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>{t('admin.revenue', { defaultValue: 'Revenue' })}</th>
                      <th className="text-end text-uppercase fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>{t('admin.cost', { defaultValue: 'Cost' })}</th>
                      <th className="text-end text-uppercase fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>{t('admin.operatingProfit', { defaultValue: 'Operating Profit' })}</th>
                      <th className="text-end text-uppercase fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>{t('admin.margin', { defaultValue: 'Margin' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCoinData.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          {t('common.noData', { defaultValue: 'No data available' })}
                        </td>
                      </tr>
                    ) : (
                      <>
                        {byCoinData.map((item, index) => {
                          const revenue = parseFloat(item.revenueUsd || 0)
                          const cost = parseFloat(item.costUsd || 0)
                          const profit = parseFloat(item.operatingProfitUsd || 0)
                          const margin = parseFloat(item.marginPercent || 0)

                          return (
                            <tr key={`${item.coinSymbol}-${item.networkName || 'all'}`}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <CoinImg symbol={item.coinSymbol} size={24} className="me-2" />
                                  <span className="fw-medium">{item.coinSymbol}</span>
                                  {item.networkName && (
                                    <small className="text-muted ms-1">/ {item.networkName}</small>
                                  )}
                                </div>
                              </td>
                              <td className="text-end">{formatCurrency(revenue)}</td>
                              <td className="text-end">{formatCurrency(cost)}</td>
                              <td className={`text-end ${profit > 0 ? 'text-success' : profit < 0 ? 'text-danger' : ''}`}>
                                {formatCurrency(profit)}
                              </td>
                              <td className="text-end">{formatPercent(margin)}</td>
                            </tr>
                          )
                        })}
                        {/* Total row */}
                        <tr className="table-light fw-bold">
                          <td>{t('common.total', { defaultValue: 'TOTAL' })}</td>
                          <td className="text-end">{formatCurrency(totals.revenue)}</td>
                          <td className="text-end">{formatCurrency(totals.cost)}</td>
                          <td className={`text-end ${totals.profit > 0 ? 'text-success' : totals.profit < 0 ? 'text-danger' : ''}`}>
                            {formatCurrency(totals.profit)}
                          </td>
                          <td className="text-end">{formatPercent(totals.margin)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function RevenueVolumeSummary({ summary, t }) {
  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-body py-3">
            <div className="d-flex flex-wrap justify-content-between gap-3">
              <div>
                <span className="text-muted me-2">{t('admin.volume', { defaultValue: 'Volume' })}:</span>
                <span className="fw-medium me-3">
                  Sweep {formatCurrency(summary?.totalSweepVolumeUsd || 0)}
                </span>
                <span className="text-muted">|</span>
                <span className="fw-medium ms-3">
                  Withdrawal {formatCurrency(summary?.totalWithdrawalVolumeUsd || 0)}
                </span>
              </div>
              <div>
                <span className="text-muted me-2">{t('admin.counts', { defaultValue: 'Counts' })}:</span>
                <span className="fw-medium me-3">
                  {summary?.counts?.sweeps || 0} sweeps
                </span>
                <span className="text-muted">|</span>
                <span className="fw-medium mx-3">
                  {summary?.counts?.withdrawals || 0} withdrawals
                </span>
                <span className="text-muted">|</span>
                <span className="fw-medium mx-3">
                  {summary?.counts?.gasTopups || 0} gas topups
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
