import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getUserTransactionSummary, getUserTransactionDaily } from '../../api/userTransactions.ts'

function formatCurrency(value) {
  if (value === null || value === undefined) return '$0.00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '$0.00'
  const prefix = num < 0 ? '-$' : num > 0 ? '+$' : '$'
  return prefix + Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatCurrencyPlain(value) {
  if (value === null || value === undefined) return '$0.00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '$0.00'
  return '$' + Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getDateRange(preset) {
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  let from = to

  switch (preset) {
    case 'today':
      from = to
      break
    case 'last7days': {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      from = d.toISOString().split('T')[0]
      break
    }
    case 'last30days': {
      const d = new Date(now)
      d.setDate(d.getDate() - 29)
      from = d.toISOString().split('T')[0]
      break
    }
    case 'thisMonth': {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      break
    }
    default:
      from = to
  }
  return { from, to }
}

function SummaryCard({ title, value, change, icon, color = 'primary', valueColor }) {
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
              <h3 className={`mb-0${valueColor ? ` text-${valueColor}` : ''}`} style={{ fontSize: '1.75rem' }}>{value}</h3>
              {change !== undefined && change !== null && !isNaN(parseFloat(change)) && (
                <small className={changeColor} style={{ fontSize: '0.8rem' }}>
                  <i className={`bx ${changeIcon}`}></i>
                  {isPositive ? '+' : ''}{parseFloat(change).toFixed(1)}% vs prev
                </small>
              )}
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

function DailyTrendChart({ data, meta, height = 300 }) {
  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height }}>
        <span className="text-muted">No data available</span>
      </div>
    )
  }

  const allValues = data.flatMap(d => [d.deposit || 0, d.withdrawal || 0, d.netFlow || 0])
  const rawMax = Math.max(...allValues, 0)
  const rawMin = Math.min(...allValues, 0)

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
  const barAreaW = Math.max(data.length * 80, 400)
  const barGroupW = barAreaW / data.length
  const barW = Math.min(22, barGroupW * 0.28)

  const yPos = (val) => padTop + (chartH - padTop) - ((val - yScale.min) / yRange) * (chartH - padTop)
  const zeroY = yPos(0)

  // Net flow line - smooth cubic bezier path
  const netFlowPath = (() => {
    const points = data.map((item, i) => ({
      x: i * barGroupW + barGroupW / 2,
      y: yPos(item.netFlow || 0),
    }))
    if (points.length < 2) return ''
    let d = `M ${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const tension = 0.3
      const dx = curr.x - prev.x
      const cp1x = prev.x + dx * tension
      const cp2x = curr.x - dx * tension
      d += ` C ${cp1x},${prev.y} ${cp2x},${curr.y} ${curr.x},${curr.y}`
    }
    return d
  })()

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
                ${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}
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
            {/* Bars + line */}
            <svg width={barAreaW} height={chartH} style={{ position: 'absolute', top: 0, left: 0 }}>
              {data.map((item, i) => {
                const cx = i * barGroupW + barGroupW / 2
                const dep = item.deposit || 0
                const wth = item.withdrawal || 0

                const depTop = yPos(Math.max(dep, 0))
                const depBot = zeroY
                const depH = Math.max(depBot - depTop, dep > 0 ? 2 : 0)

                const wthTop = yPos(Math.max(wth, 0))
                const wthBot = zeroY
                const wthH = Math.max(wthBot - wthTop, wth > 0 ? 2 : 0)

                return (
                  <g key={i}>
                    {/* Deposit bar */}
                    <rect
                      x={cx - barW - 1}
                      y={depTop}
                      width={barW}
                      height={depH}
                      rx={2}
                      fill="#696cff"
                    >
                      <title>Deposit: ${dep.toLocaleString('en-US', { maximumFractionDigits: 2 })}</title>
                    </rect>
                    {/* Withdrawal bar */}
                    <rect
                      x={cx + 1}
                      y={wthTop}
                      width={barW}
                      height={wthH}
                      rx={2}
                      fill="#a8b8d8"
                    >
                      <title>Withdrawal: ${wth.toLocaleString('en-US', { maximumFractionDigits: 2 })}</title>
                    </rect>
                  </g>
                )
              })}
              {/* Net flow line (smooth curve) */}
              <path
                d={netFlowPath}
                fill="none"
                stroke="#03c3ec"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Net flow dots */}
              {data.map((item, i) => {
                const cx = i * barGroupW + barGroupW / 2
                const cy = yPos(item.netFlow || 0)
                return (
                  <circle key={i} cx={cx} cy={cy} r={3} fill="#03c3ec" stroke="#fff" strokeWidth="1.5">
                    <title>Net Flow: ${(item.netFlow || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</title>
                  </circle>
                )
              })}
            </svg>
          </div>
          {/* Legend */}
          <div style={{ width: 110, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, paddingLeft: 16 }}>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 14, height: 14, backgroundColor: '#696cff', borderRadius: 3, display: 'inline-block', flexShrink: 0 }}></span>
              <small>Deposit</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 14, height: 14, backgroundColor: '#a8b8d8', borderRadius: 3, display: 'inline-block', flexShrink: 0 }}></span>
              <small>Withdrawal</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 16, borderBottom: '2px solid #03c3ec', display: 'inline-block', flexShrink: 0 }}></span>
              <small>Net Flow</small>
            </div>
          </div>
        </div>
        {/* X-axis labels */}
        <div style={{ display: 'flex', marginLeft: yAxisW }}>
          {data.map((item, i) => (
            <div key={i} style={{ width: barGroupW, textAlign: 'center' }}>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                {item.label}
              </small>
            </div>
          ))}
        </div>
      </div>
      {/* Footer stats */}
      {meta && (
        <div className="mt-3 p-3 rounded" style={{ backgroundColor: 'rgba(105, 108, 255, 0.05)', border: '1px solid rgba(105, 108, 255, 0.1)' }}>
          <div className="d-flex flex-wrap gap-3 align-items-center">
            <div>
              <i className="bx bx-calendar text-primary me-1"></i>
              <small className="fw-medium">{meta.totalDays || 0} days total</small>
              <small className="text-muted mx-1">•</small>
              <small>{meta.daysWithData || 0} days with data</small>
            </div>
            <div>
              <small className="text-success">
                <i className="bx bx-up-arrow-alt"></i>
                {meta.daysPositiveFlow || 0} days positive flow
              </small>
              <small className="text-muted mx-1">•</small>
              <small className="text-danger">
                <i className="bx bx-down-arrow-alt"></i>
                {meta.daysNegativeFlow || 0} day{(meta.daysNegativeFlow || 0) !== 1 ? 's' : ''} negative
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UserTransactionsDashboard() {
  const { t } = useTranslation()
  const { token } = useAuth()

  const [datePreset, setDatePreset] = useState('thisMonth')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const [summary, setSummary] = useState(null)
  const [dailyData, setDailyData] = useState([])
  const [dailyMeta, setDailyMeta] = useState(null)

  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingDaily, setLoadingDaily] = useState(false)
  const [error, setError] = useState('')

  const [autoRefresh, setAutoRefresh] = useState(true)
  const refreshIntervalRef = useRef(null)

  const dateRange = useMemo(() => {
    if (showCustom && customFrom && customTo) {
      return { from: customFrom, to: customTo }
    }
    return getDateRange(datePreset)
  }, [datePreset, showCustom, customFrom, customTo])

  const dateRangeLabel = useMemo(() => {
    const { from, to } = dateRange
    if (from === to) return from
    const fromDate = new Date(from + 'T00:00:00')
    const toDate = new Date(to + 'T00:00:00')
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${fmt(fromDate)} → ${fmt(toDate)}`
  }, [dateRange])

  const loadData = async () => {
    if (!token || !dateRange.from || !dateRange.to) return
    setError('')

    // Load summary
    setLoadingSummary(true)
    try {
      const res = await getUserTransactionSummary(token, dateRange.from, dateRange.to)
      setSummary(res)
    } catch (e) {
      console.error('Failed to load transaction summary:', e)
      setError(e?.message || 'Failed to load summary')
    } finally {
      setLoadingSummary(false)
    }

    // Load daily
    setLoadingDaily(true)
    try {
      const res = await getUserTransactionDaily(token, dateRange.from, dateRange.to)
      const items = res?.items || res || []
      const chartData = items.map(item => ({
        date: item.date,
        label: new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        deposit: parseFloat(item.depositUsd || 0),
        withdrawal: parseFloat(item.withdrawalUsd || 0),
        netFlow: parseFloat(item.netFlowUsd || 0),
      }))
      setDailyData(chartData)
      setDailyMeta(res?.meta || null)
    } catch (e) {
      console.error('Failed to load daily data:', e)
    } finally {
      setLoadingDaily(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token, dateRange])

  // Auto-refresh
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadData()
      }, 300000) // 5 minutes
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
    }
  }, [autoRefresh, dateRange, token])

  const current = summary?.current || {}
  const previous = summary?.previous || {}
  const changes = summary?.changes || {}
  const counts = current?.counts || {}

  const presets = [
    { key: 'today', label: t('filter.today', { defaultValue: 'Today' }) },
    { key: 'last7days', label: t('filter.last7days', { defaultValue: '7 Days' }) },
    { key: 'last30days', label: t('filter.last30days', { defaultValue: '30 Days' }) },
    { key: 'thisMonth', label: t('filter.thisMonth', { defaultValue: 'This Month' }) },
  ]

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center mb-4 gap-3">
        <h4 className="mb-0">
          {t('nav.dashboard', { defaultValue: 'Dashboard' })}
        </h4>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="d-flex flex-wrap align-items-center gap-3">
            {/* Date range display */}
            <div className="d-flex align-items-center gap-2">
              <i className="bx bx-calendar text-primary"></i>
              <span className="fw-medium">{dateRangeLabel}</span>
            </div>

            {/* Auto-refresh toggle */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              <i className={`bx bx-revision ${autoRefresh ? 'text-success' : 'text-muted'}`}></i>
              <small>Auto-refresh:</small>
              <button
                className={`btn btn-xs ${autoRefresh ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{ fontSize: '0.7rem', padding: '2px 8px' }}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Quick filters */}
          <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
            
            {!showCustom ? (
              <>
                {presets.map(p => (
                  <button
                    key={p.key}
                    className={`btn btn-sm ${datePreset === p.key ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setDatePreset(p.key)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowCustom(true)}
                  style={{ fontSize: '0.78rem' }}
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
                <span>–</span>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  style={{ width: 'auto' }}
                />
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => { setShowCustom(false); setCustomFrom(''); setCustomTo('') }}
                >
                  <i className="bx bx-x"></i>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">{error}</div>
      )}

      {/* Section 1: KPI Summary Cards */}
      {loadingSummary ? (
        <div className="d-flex justify-content-center py-5 mb-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row g-4 mb-4">
          <SummaryCard
            title={t('userDashboard.deposits', { defaultValue: 'Deposits' })}
            value={formatCurrencyPlain(current.totalDepositUsd)}
            change={changes.depositPercent}
            icon="bx-wallet"
            color="primary"
          />
          <SummaryCard
            title={t('userDashboard.withdrawals', { defaultValue: 'Withdrawals' })}
            value={formatCurrencyPlain(current.totalWithdrawalUsd)}
            change={changes.withdrawalPercent}
            icon="bx-transfer-alt"
            color="danger"
          />
          <SummaryCard
            title={t('userDashboard.feesCollected', { defaultValue: 'Fees Collected' })}
            value={formatCurrencyPlain(current.totalFeeUsd)}
            change={changes.feePercent}
            icon="bx-dollar-circle"
            color="warning"
          />
          <SummaryCard
            title={t('userDashboard.netFlow', { defaultValue: 'Net Flow' })}
            value={formatCurrencyPlain(
              (parseFloat(current.totalDepositUsd || 0) - parseFloat(current.totalWithdrawalUsd || 0))
            )}
            change={changes.netFlowPercent}
            icon="bx-line-chart"
            color="info"
            valueColor={(() => { const nf = parseFloat(current.totalDepositUsd || 0) - parseFloat(current.totalWithdrawalUsd || 0); return nf > 0 ? 'success' : nf < 0 ? 'danger' : undefined })()}
          />
        </div>
      )}

      {/* Section 2: Daily Trend Chart */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bx bx-bar-chart-alt-2 text-primary me-2"></i>
                {t('userDashboard.dailyTrend', { defaultValue: 'Daily Trend Chart' })}
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
                <DailyTrendChart data={dailyData} meta={dailyMeta} height={300} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
