import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getRevenueSummary, getRevenueDaily, getRevenueByCoin } from '../../api/admin'

function formatCurrency(value, decimals) {
  if (value === null || value === undefined) return '$0.00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '$0.00'
  // Auto-detect decimals: use more decimals for small values
  if (decimals === undefined) {
    const abs = Math.abs(num)
    if (abs === 0) decimals = 2
    else if (abs < 0.01) decimals = 8
    else if (abs < 1) decimals = 4
    else decimals = 2
  }
  const prefix = num < 0 ? '-$' : '$'
  const minD = Math.min(2, decimals)
  return prefix + Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: minD, maximumFractionDigits: Math.max(minD, decimals) })
}

function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '0%'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0%'
  return num.toFixed(decimals) + '%'
}

function getDateRange(preset) {
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  let from = to
  
  switch (preset) {
    case 'today':
      from = to
      break
    case 'yesterday': {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      from = yesterday.toISOString().split('T')[0]
      break
    }
    case 'last7days': {
      const last7 = new Date(now)
      last7.setDate(last7.getDate() - 6)
      from = last7.toISOString().split('T')[0]
      break
    }
    case 'last30days': {
      const last30 = new Date(now)
      last30.setDate(last30.getDate() - 29)
      from = last30.toISOString().split('T')[0]
      break
    }
    case 'thisMonth': {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      break
    }
    case 'lastMonth': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      from = lastMonth.toISOString().split('T')[0]
      const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from, to: endLastMonth.toISOString().split('T')[0] }
    }
    default:
      from = to
  }
  return { from, to }
}

function SummaryCard({ title, value, change, changeLabel, icon, color = 'primary' }) {
  const isPositive = change >= 0
  const changeColor = isPositive ? 'text-success' : 'text-danger'
  const changeIcon = isPositive ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt'
  
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="card h-100">
        <div className="card-body">
          <div className="d-flex align-items-start justify-content-between">
            <div className="content-left">
              <span className="text-muted d-block mb-1">{title}</span>
              <div className="d-flex align-items-center">
                <h4 className="mb-0 me-2">{value}</h4>
                {change !== undefined && change !== null && (
                  <small className={changeColor}>
                    <i className={`bx ${changeIcon}`}></i>
                    {isPositive ? '+' : ''}{typeof change === 'number' ? change.toFixed(1) : change}{changeLabel || '%'}
                  </small>
                )}
              </div>
            </div>
            <div className="avatar">
              <span className={`avatar-initial rounded bg-label-${color}`}>
                <i className={`bx ${icon} bx-sm`}></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SimpleBarChart({ data, height = 300 }) {
  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height }}>
        <span className="text-muted">No data available</span>
      </div>
    )
  }

  const allValues = data.flatMap(d => [d.revenue || 0, d.cost || 0, d.profit || 0])
  const rawMax = Math.max(...allValues, 0)
  const rawMin = Math.min(...allValues, 0)

  // Nice tick calculation
  function niceScale(min, max, ticks = 5) {
    const range = max - min || 1
    const roughStep = range / ticks
    const mag = Math.pow(10, Math.floor(Math.log10(roughStep)))
    const nice = roughStep / mag
    let step
    if (nice <= 1.5) step = 1 * mag
    else if (nice <= 3) step = 2 * mag
    else if (nice <= 7) step = 5 * mag
    else step = 10 * mag
    const niceMin = Math.floor(min / step) * step
    const niceMax = Math.ceil(max / step) * step
    const labels = []
    for (let v = niceMax; v >= niceMin; v -= step) {
      labels.push(parseFloat(v.toFixed(10)))
    }
    return { min: niceMin, max: niceMax, labels, step }
  }

  const yScale = niceScale(rawMin, rawMax, 5)
  const yRange = yScale.max - yScale.min || 1

  const padTop = 16
  const chartH = height - 60
  const yAxisW = 60
  const barAreaW = Math.max(data.length * 90, 400)
  const barGroupW = barAreaW / data.length
  const barW = Math.min(24, barGroupW * 0.3)

  const yPos = (val) => padTop + (chartH - padTop) - ((val - yScale.min) / yRange) * (chartH - padTop)
  const zeroY = yPos(0)

  // Profit line points
  const profitPoints = data.map((item, i) => {
    const cx = i * barGroupW + barGroupW / 2
    const cy = yPos(item.profit || 0)
    return `${cx},${cy}`
  }).join(' ')

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', minWidth: yAxisW + barAreaW + 120 }}>
          {/* Y-axis */}
          <div style={{ width: yAxisW, flexShrink: 0, position: 'relative', height: chartH }}>
            {yScale.labels.map((v, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: yPos(v) - 8,
                  right: 8,
                  fontSize: '0.72rem',
                  color: '#888',
                  whiteSpace: 'nowrap',
                }}
              >
                ${v.toLocaleString('en-US', { maximumFractionDigits: 8 })}
              </div>
            ))}
          </div>
          {/* Chart area */}
          <div style={{ position: 'relative', flex: 1, minWidth: barAreaW, height: chartH }}>
            {/* Grid lines */}
            {yScale.labels.map((v, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: yPos(v),
                  left: 0,
                  right: 0,
                  borderTop: v === 0 ? '1.5px solid #aaa' : '1px dashed #e5e5e5',
                }}
              />
            ))}
            {/* Bars */}
            <svg width={barAreaW} height={chartH} style={{ position: 'absolute', top: 0, left: 0 }}>
              <defs>
                <pattern id="costPattern" patternUnits="userSpaceOnUse" width="4" height="4">
                  <rect width="4" height="4" fill="#a8b8d8" />
                  <circle cx="2" cy="2" r="1" fill="#8898b8" />
                </pattern>
              </defs>
              {data.map((item, i) => {
                const cx = i * barGroupW + barGroupW / 2
                const rev = item.revenue || 0
                const cost = item.cost || 0

                const revTop = yPos(Math.max(rev, 0))
                const revBot = zeroY
                const revH = Math.max(revBot - revTop, rev > 0 ? 2 : 0)

                const costTop = yPos(Math.max(cost, 0))
                const costBot = zeroY
                const costH = Math.max(costBot - costTop, cost > 0 ? 2 : 0)

                return (
                  <g key={i}>
                    {/* Revenue bar */}
                    <rect
                      x={cx - barW - 1}
                      y={revTop}
                      width={barW}
                      height={revH}
                      rx={2}
                      fill="#696cff"
                    >
                      <title>Revenue: {formatCurrency(rev)}</title>
                    </rect>
                    {/* Cost bar */}
                    <rect
                      x={cx + 1}
                      y={costTop}
                      width={barW}
                      height={costH}
                      rx={2}
                      fill="url(#costPattern)"
                      stroke="#8898b8"
                      strokeWidth="0.5"
                    >
                      <title>Cost: {formatCurrency(cost)}</title>
                    </rect>
                  </g>
                )
              })}
              {/* Profit line */}
              <polyline
                points={profitPoints}
                fill="none"
                stroke="#03c3ec"
                strokeWidth="2"
                strokeDasharray="6,3"
              />
              {/* Profit dots */}
              {data.map((item, i) => {
                const cx = i * barGroupW + barGroupW / 2
                const cy = yPos(item.profit || 0)
                return (
                  <circle key={i} cx={cx} cy={cy} r={3} fill="#03c3ec" stroke="#fff" strokeWidth="1.5">
                    <title>Profit: {formatCurrency(item.profit)}</title>
                  </circle>
                )
              })}
            </svg>
          </div>
          {/* Legend (right side) */}
          <div style={{ width: 100, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, paddingLeft: 16 }}>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 14, height: 14, backgroundColor: '#696cff', borderRadius: 3, display: 'inline-block', flexShrink: 0 }}></span>
              <small>Revenue</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 14, height: 14, background: 'repeating-conic-gradient(#a8b8d8 0% 25%, #8898b8 0% 50%) 50%/6px 6px', borderRadius: 3, display: 'inline-block', flexShrink: 0 }}></span>
              <small>Cost</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 16, borderBottom: '2px dashed #03c3ec', display: 'inline-block', flexShrink: 0 }}></span>
              <small>Profit</small>
            </div>
          </div>
        </div>
        {/* X-axis labels */}
        <div style={{ display: 'flex', marginLeft: yAxisW }}>
          {data.map((item, i) => (
            <div key={i} style={{ width: barGroupW, textAlign: 'center' }}>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                {item.label || item.date}
              </small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function RevenueDashboard() {
  const { t } = useTranslation()
  const { token } = useAuth()
  
  const [datePreset, setDatePreset] = useState('thisMonth')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  
  const [summary, setSummary] = useState(null)
  const [dailyData, setDailyData] = useState([])
  const [byCoinData, setByCoinData] = useState([])
  
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingDaily, setLoadingDaily] = useState(false)
  const [loadingByCoin, setLoadingByCoin] = useState(false)
  const [error, setError] = useState('')

  const dateRange = useMemo(() => {
    if (showCustom && customFrom && customTo) {
      return { from: customFrom, to: customTo }
    }
    return getDateRange(datePreset)
  }, [datePreset, showCustom, customFrom, customTo])

  const dateRangeLabel = useMemo(() => {
    const { from, to } = dateRange
    if (from === to) return from
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${formatDate(fromDate)} - ${formatDate(toDate)}`
  }, [dateRange])

  useEffect(() => {
    if (!token || !dateRange.from || !dateRange.to) return

    const loadData = async () => {
      setError('')
      
      // Load summary
      setLoadingSummary(true)
      try {
        const summaryRes = await getRevenueSummary(token, dateRange.from, dateRange.to)
        setSummary(summaryRes)
      } catch (e) {
        console.error('Failed to load summary:', e)
        setError(e?.message || 'Failed to load summary')
      } finally {
        setLoadingSummary(false)
      }

      // Load daily data
      setLoadingDaily(true)
      try {
        const dailyRes = await getRevenueDaily(token, dateRange.from, dateRange.to)
        const items = dailyRes?.items || dailyRes || []
        const chartData = items.map(item => ({
          date: item.date,
          label: new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: parseFloat(item.revenueUsd || 0),
          cost: parseFloat(item.costUsd || 0),
          profit: parseFloat(item.profitUsd || 0),
        }))
        setDailyData(chartData)
      } catch (e) {
        console.error('Failed to load daily data:', e)
      } finally {
        setLoadingDaily(false)
      }

      // Load by coin data
      setLoadingByCoin(true)
      try {
        const byCoinRes = await getRevenueByCoin(token, dateRange.from, dateRange.to)
        setByCoinData(byCoinRes?.items || byCoinRes || [])
      } catch (e) {
        console.error('Failed to load by-coin data:', e)
      } finally {
        setLoadingByCoin(false)
      }
    }

    loadData()
  }, [token, dateRange])

  const totals = useMemo(() => {
    if (!byCoinData || byCoinData.length === 0) {
      return { revenue: 0, cost: 0, profit: 0, margin: 0 }
    }
    const revenue = byCoinData.reduce((sum, item) => sum + parseFloat(item.revenueUsd || 0), 0)
    const cost = byCoinData.reduce((sum, item) => sum + parseFloat(item.costUsd || 0), 0)
    const profit = byCoinData.reduce((sum, item) => sum + parseFloat(item.profitUsd || 0), 0)
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
    return { revenue, cost, profit, margin }
  }, [byCoinData])

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center mb-4 gap-3">
        <h4 className="mb-0">
          <i className="bx bx-bar-chart-alt-2 text-primary me-2"></i>
          {t('admin.revenueDashboard', { defaultValue: 'Revenue Dashboard' })}
        </h4>
        <div className="d-flex gap-2 flex-wrap align-items-center ms-auto">
          <span className="badge bg-label-secondary fs-6 fw-normal px-3 py-2">
            {dateRangeLabel}
          </span>
          {!showCustom ? (
            <>
              <select
                className="form-select form-select-sm"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="today">{t('filter.today', { defaultValue: 'Today' })}</option>
                <option value="yesterday">{t('filter.yesterday', { defaultValue: 'Yesterday' })}</option>
                <option value="last7days">{t('filter.last7days', { defaultValue: 'Last 7 Days' })}</option>
                <option value="last30days">{t('filter.last30days', { defaultValue: 'Last 30 Days' })}</option>
                <option value="thisMonth">{t('filter.thisMonth', { defaultValue: 'This Month' })}</option>
                <option value="lastMonth">{t('filter.lastMonth', { defaultValue: 'Last Month' })}</option>
              </select>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowCustom(true)}
              >
                <i className="bx bx-calendar me-1"></i>
                {t('filter.custom', { defaultValue: 'Custom' })}
              </button>
            </>
          ) : (
            <>
              <input
                type="date"
                className="form-control form-control-sm"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{ width: 'auto' }}
              />
              <span className="align-self-center">–</span>
              <input
                type="date"
                className="form-control form-control-sm"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{ width: 'auto' }}
              />
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setShowCustom(false)
                  setCustomFrom('')
                  setCustomTo('')
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">{error}</div>
      )}

      {/* Summary Cards */}
      <div className="row g-4 mb-4">
        <SummaryCard
          title={t('admin.revenue', { defaultValue: 'Revenue' })}
          value={loadingSummary ? '...' : formatCurrency(summary?.totalRevenueUsd)}
          icon="bx-trending-up"
          color="primary"
        />
        <SummaryCard
          title={t('admin.cost', { defaultValue: 'Cost' })}
          value={loadingSummary ? '...' : formatCurrency(summary?.totalCostUsd)}
          icon="bx-trending-down"
          color="danger"
        />
        <SummaryCard
          title={t('admin.profit', { defaultValue: 'Profit' })}
          value={loadingSummary ? '...' : formatCurrency(summary?.grossProfitUsd)}
          icon="bx-dollar-circle"
          color={parseFloat(summary?.grossProfitUsd || 0) >= 0 ? 'success' : 'warning'}
        />
        <SummaryCard
          title={t('admin.margin', { defaultValue: 'Margin' })}
          value={loadingSummary ? '...' : formatPercent(summary?.profitMarginPercent)}
          icon="bx-pie-chart-alt-2"
          color="info"
        />
      </div>

      {/* Daily Chart */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                {t('admin.revenueCostTrend', { defaultValue: 'Revenue & Cost Trend (Daily)' })}
              </h5>
            </div>
            <div className="card-body">
              {loadingDaily ? (
                <div className="d-flex justify-content-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <SimpleBarChart data={dailyData} height={280} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by Coin Table */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                {t('admin.revenueByCoin', { defaultValue: 'Revenue by Coin' })}
              </h5>
            </div>
            <div className="card-body p-0">
              {loadingByCoin ? (
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
                        <th>{t('admin.coin', { defaultValue: 'Coin' })}</th>
                        <th className="text-end">{t('admin.revenue', { defaultValue: 'Revenue' })}</th>
                        <th className="text-end">{t('admin.cost', { defaultValue: 'Cost' })}</th>
                        <th className="text-end">{t('admin.profit', { defaultValue: 'Profit' })}</th>
                        <th className="text-end">{t('admin.margin', { defaultValue: 'Margin' })}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {byCoinData.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center text-muted py-4">
                            {t('common.noData', { defaultValue: 'No data available' })}
                          </td>
                        </tr>
                      ) : (
                        <>
                          {byCoinData.map((item, index) => {
                            const revenue = parseFloat(item.revenueUsd || 0)
                            const cost = parseFloat(item.costUsd || 0)
                            const profit = parseFloat(item.profitUsd || 0)
                            const margin = parseFloat(item.marginPercent || 0)
                            
                            return (
                              <tr key={index}>
                                <td>
                                  <span className="fw-medium">{item.coinSymbol}</span>
                                  {item.networkName && (
                                    <small className="text-muted ms-1">/ {item.networkName}</small>
                                  )}
                                </td>
                                <td className="text-end">{formatCurrency(revenue)}</td>
                                <td className="text-end">{formatCurrency(cost)}</td>
                                <td className={`text-end ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {formatCurrency(profit)}
                                </td>
                                <td className="text-end">{formatPercent(margin)}</td>
                                <td></td>
                              </tr>
                            )
                          })}
                          {/* Total row */}
                          <tr className="table-light fw-bold">
                            <td>{t('common.total', { defaultValue: 'TOTAL' })}</td>
                            <td className="text-end">{formatCurrency(totals.revenue)}</td>
                            <td className="text-end">{formatCurrency(totals.cost)}</td>
                            <td className={`text-end ${totals.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                              {formatCurrency(totals.profit)}
                            </td>
                            <td className="text-end">{formatPercent(totals.margin)}</td>
                            <td></td>
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

      {/* Volume & Counts Summary */}
      {summary && (
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
                    <span className="fw-medium ms-3">
                      {summary?.counts?.gasTopups || 0} gas topups
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
