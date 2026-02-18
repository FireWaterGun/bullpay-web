import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getRevenueSummary, getRevenueDaily, getRevenueByCoin } from '../../api/admin'
import LocaleDatePicker from '../../components/LocaleDatePicker'
import { formatUsdAuto, formatPercent as formatPercentShared, formatChange } from '../../utils/format'

// Coin asset helpers
function getCoinAssetCandidates(symbol, logoUrl) {
  const sym = String(symbol || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const aliases = {
    btc: ['bitcoin'],
    eth: ['ethereum'],
    doge: ['dogecoin'],
    sol: ['solana'],
    matic: ['polygon'],
    ada: ['cardano'],
    xmr: ['monero'],
    zec: ['zcash'],
    usdt: ['usdterc20', 'tether'],
  }
  const names = [sym, ...(aliases[sym] || [])]
  if (sym.startsWith('usdt') && !names.includes('usdt')) names.push('usdt')
  const exts = ['svg', 'png']
  const byAssets = names.flatMap((n) =>
    exts.map((ext) => `/assets/img/coins/${n}.${ext}`)
  )
  const candidates = [
    ...byAssets,
    ...(logoUrl ? [logoUrl] : []),
    '/assets/img/coins/default.svg',
  ]
  return Array.from(new Set(candidates))
}

function networkNameToSymbol(name) {
  const map = {
    'bnb smart chain': 'bnb',
    'bsc': 'bnb',
    'optimism': 'op',
    'polygon': 'matic',
    'ethereum': 'eth',
    'arbitrum': 'arb',
    'avalanche': 'avax',
    'base': 'base',
    'solana': 'sol',
    'tron': 'trx',
  }
  return map[String(name || '').toLowerCase()] || null
}

function CoinImg({ symbol, networkSymbol, networkName, size = 24 }) {
  const resolvedNetworkSymbol = networkSymbol || networkNameToSymbol(networkName)
  const [idx, setIdx] = useState(0)
  const [netIdx, setNetIdx] = useState(0)
  const candidates = useMemo(
    () => getCoinAssetCandidates(symbol, null),
    [symbol]
  )
  const networkCandidates = useMemo(
    () => getCoinAssetCandidates(resolvedNetworkSymbol, null),
    [resolvedNetworkSymbol]
  )
  const src = candidates[Math.min(idx, candidates.length - 1)]
  const netSrc = networkCandidates[Math.min(netIdx, networkCandidates.length - 1)]
  const badgeSize = 14

  return (
    <div className="position-relative me-2" style={{ width: size, height: size, flexShrink: 0 }}>
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        style={{ objectFit: 'cover' }}
        onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))}
      />
      {resolvedNetworkSymbol && resolvedNetworkSymbol !== symbol?.toLowerCase() &&
       !(symbol === 'POL' && resolvedNetworkSymbol === 'matic') && (
        <div
          className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
          style={{
            bottom: -2,
            right: -2,
            width: badgeSize,
            height: badgeSize,
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            padding: '1px'
          }}
        >
          <img
            src={netSrc}
            alt={resolvedNetworkSymbol}
            width={badgeSize - 2}
            height={badgeSize - 2}
            className="rounded-circle"
            style={{ objectFit: 'cover' }}
            onError={() => setNetIdx((i) => (i + 1 < networkCandidates.length ? i + 1 : i))}
          />
        </div>
      )}
    </div>
  )
}

const formatCurrency = formatUsdAuto
const formatPercent = formatPercentShared

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

function SummaryCard({ title, value, change, changeLabel, icon, color = 'primary', valueColor }) {
  const isPositive = change >= 0
  const changeColor = isPositive ? 'text-success' : 'text-danger'
  const changeIcon = isPositive ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt'
  
  return (
    <div className="col-6 col-xl-3">
      <div className="card h-100">
        <div className="card-body">
          <div className="d-flex align-items-start justify-content-between">
            <div className="content-left">
              <span className="form-label">{title}</span>
              <div className="d-flex align-items-center">
                <h4 className={`mb-0 me-2${valueColor ? ` text-${valueColor}` : ''}`}>{value}</h4>
                {change !== undefined && change !== null && (
                  <small className={changeColor}>
                    <i className={`bx ${changeIcon}`}></i>
                    {typeof change === 'number' ? formatChange(change) : change}{changeLabel && changeLabel !== '%' ? changeLabel : ''}
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

function SimpleBarChart({ data, height = 300, locale = 'en-US', t }) {
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

  // Profit line - smooth cubic bezier path
  const profitPath = (() => {
    const points = data.map((item, i) => ({
      x: i * barGroupW + barGroupW / 2,
      y: yPos(item.profit || 0),
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
              {/* Profit line (smooth curve) */}
              <path
                d={profitPath}
                fill="none"
                stroke="#03c3ec"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
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
              <small>{t ? t('admin.revenue', { defaultValue: 'Revenue' }) : 'Revenue'}</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 14, height: 14, background: 'repeating-conic-gradient(#a8b8d8 0% 25%, #8898b8 0% 50%) 50%/6px 6px', borderRadius: 3, display: 'inline-block', flexShrink: 0 }}></span>
              <small>{t ? t('admin.cost', { defaultValue: 'Cost' }) : 'Cost'}</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 16, borderBottom: '2px solid #03c3ec', display: 'inline-block', flexShrink: 0 }}></span>
              <small>{t ? t('admin.profit', { defaultValue: 'Profit' }) : 'Profit'}</small>
            </div>
          </div>
        </div>
        {/* X-axis labels */}
        <div style={{ display: 'flex', marginLeft: yAxisW, width: barAreaW }}>
          {data.map((item, i) => (
            <div key={i} style={{ width: barGroupW, flexShrink: 0, textAlign: 'center' }}>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                {item.date ? new Date(item.date + 'T00:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric' }) : ''}
              </small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function RevenueDashboard() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])
  
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
    const formatDate = (d) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    return `${formatDate(fromDate)} - ${formatDate(toDate)}`
  }, [dateRange, locale])

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
                className="form-select"
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
              <LocaleDatePicker
                value={customFrom}
                onChange={setCustomFrom}
                locale={locale}
                placeholder={t('filter.from', { defaultValue: 'From' })}
                t={t}
                maxDate={customTo ? customTo : undefined}
                minDate={customTo ? (() => { const d = new Date(customTo + 'T00:00:00'); d.setMonth(d.getMonth() - 2); return d.toISOString().split('T')[0] })() : undefined}
              />
              <span className="align-self-center">–</span>
              <LocaleDatePicker
                value={customTo}
                onChange={setCustomTo}
                locale={locale}
                placeholder={t('filter.to', { defaultValue: 'To' })}
                t={t}
                minDate={customFrom ? customFrom : undefined}
                maxDate={customFrom ? (() => { const d = new Date(customFrom + 'T00:00:00'); d.setMonth(d.getMonth() + 2); return d.toISOString().split('T')[0] })() : undefined}
              />
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setShowCustom(false)
                  setCustomFrom('')
                  setCustomTo('')
                }}
              >
                <i className="bx bx-reset me-1"></i>
                {t('filter.reset', { defaultValue: 'Reset' })}
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
          color={parseFloat(summary?.grossProfitUsd || 0) > 0 ? 'success' : parseFloat(summary?.grossProfitUsd || 0) < 0 ? 'danger' : 'warning'}
          valueColor={parseFloat(summary?.grossProfitUsd || 0) > 0 ? 'success' : parseFloat(summary?.grossProfitUsd || 0) < 0 ? 'danger' : undefined}
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
                <SimpleBarChart data={dailyData} height={280} locale={locale} t={t} />
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
                        <th className="text-uppercase fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>{t('admin.coin', { defaultValue: 'Coin' })}</th>
                        <th className="text-end text-uppercase fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>{t('admin.revenue', { defaultValue: 'Revenue' })}</th>
                        <th className="text-end text-uppercase fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>{t('admin.cost', { defaultValue: 'Cost' })}</th>
                        <th className="text-end text-uppercase fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>{t('admin.profit', { defaultValue: 'Profit' })}</th>
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
                            const profit = parseFloat(item.profitUsd || 0)
                            const margin = parseFloat(item.marginPercent || 0)
                            
                            return (
                              <tr key={index}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <CoinImg symbol={item.coinSymbol} size={24} />
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
