import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getUserTransactionSummary, getUserTransactionDaily, getUserTransactionByCoin } from '../../api/userTransactions.ts'
import LocaleDatePicker from '../../components/LocaleDatePicker'

function getCoinAssetCandidates(symbol, logoUrl) {
  const sym = String(symbol || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const aliases = {
    btc: ['bitcoin'], eth: ['ethereum'], doge: ['dogecoin'], sol: ['solana'],
    matic: ['polygon'], ada: ['cardano'], xmr: ['monero'], zec: ['zcash'],
    usdt: ['usdterc20', 'tether'],
  }
  const names = [sym, ...(aliases[sym] || [])]
  if (sym.startsWith('usdt') && !names.includes('usdt')) names.push('usdt')
  const exts = ['svg', 'png']
  const byAssets = names.flatMap((n) => exts.map((ext) => `/assets/img/coins/${n}.${ext}`))
  const candidates = [...byAssets, ...(logoUrl ? [logoUrl] : []), '/assets/img/coins/default.svg']
  return Array.from(new Set(candidates))
}

function networkNameToSymbol(name) {
  const map = {
    'bnb smart chain': 'bnb', 'bsc': 'bnb', 'optimism': 'op', 'polygon': 'matic',
    'ethereum': 'eth', 'arbitrum': 'arb', 'avalanche': 'avax', 'base': 'base',
    'solana': 'sol', 'tron': 'trx',
  }
  return map[String(name || '').toLowerCase()] || null
}

function CoinImg({ symbol, networkSymbol, networkName, size = 24 }) {
  const resolvedNetworkSymbol = networkSymbol || networkNameToSymbol(networkName)
  const [idx, setIdx] = useState(0)
  const [netIdx, setNetIdx] = useState(0)
  const candidates = useMemo(() => getCoinAssetCandidates(symbol, null), [symbol])
  const networkCandidates = useMemo(() => getCoinAssetCandidates(resolvedNetworkSymbol, null), [resolvedNetworkSymbol])
  const src = candidates[Math.min(idx, candidates.length - 1)]
  const netSrc = networkCandidates[Math.min(netIdx, networkCandidates.length - 1)]
  const badgeSize = 14

  return (
    <div className="position-relative me-2" style={{ width: size, height: size, flexShrink: 0 }}>
      <img src={src} alt={symbol} width={size} height={size} style={{ objectFit: 'cover' }}
        onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))} />
      {resolvedNetworkSymbol && resolvedNetworkSymbol !== symbol?.toLowerCase() &&
       !(symbol === 'POL' && resolvedNetworkSymbol === 'matic') && (
        <div className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
          style={{ bottom: -2, right: -2, width: badgeSize, height: badgeSize, backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1px' }}>
          <img src={netSrc} alt={resolvedNetworkSymbol} width={badgeSize - 2} height={badgeSize - 2}
            className="rounded-circle" style={{ objectFit: 'cover' }}
            onError={() => setNetIdx((i) => (i + 1 < networkCandidates.length ? i + 1 : i))} />
        </div>
      )}
    </div>
  )
}

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

function SummaryCard({ title, value, change, icon, color = 'primary', valueColor, t }) {
  const numChange = typeof change === 'number' ? change : parseFloat(change)
  const isPositive = numChange >= 0
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
              {change !== undefined && change !== null && !isNaN(numChange) && (
                <small className={changeColor} style={{ fontSize: '0.8rem' }}>
                  <i className={`bx ${changeIcon}`}></i>
                  {isPositive ? '+' : ''}{numChange.toFixed(1)}% {t ? t('userDashboard.vsPrev', { defaultValue: 'vs prev' }) : 'vs prev'}
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

function DailyTrendChart({ data, meta, height = 300, locale = 'en-US', t }) {
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
              <defs>
                <pattern id="withdrawalPattern" patternUnits="userSpaceOnUse" width="4" height="4">
                  <rect width="4" height="4" fill="#a8b8d8" />
                  <circle cx="2" cy="2" r="1" fill="#8898b8" />
                </pattern>
              </defs>
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
                      fill="url(#withdrawalPattern)"
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
              <small>{t ? t('userDashboard.deposits', { defaultValue: 'Deposit' }) : 'Deposit'}</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 14, height: 14, background: 'repeating-conic-gradient(#a8b8d8 0% 25%, #8898b8 0% 50%) 50%/6px 6px', borderRadius: 3, display: 'inline-block', flexShrink: 0 }}></span>
              <small>{t ? t('userDashboard.withdrawals', { defaultValue: 'Withdrawal' }) : 'Withdrawal'}</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 16, borderBottom: '2px solid #03c3ec', display: 'inline-block', flexShrink: 0 }}></span>
              <small>{t ? t('userDashboard.netFlow', { defaultValue: 'Net Flow' }) : 'Net Flow'}</small>
            </div>
          </div>
        </div>
        {/* X-axis labels */}
        <div style={{ display: 'flex', marginLeft: yAxisW, width: barAreaW }}>
          {data.map((item, i) => (
            <div key={i} style={{ width: barGroupW, textAlign: 'center', flexShrink: 0 }}>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                {item.date ? new Date(item.date + 'T00:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric' }) : ''}
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
              <small className="fw-medium">{meta.totalDays || 0} {t ? t('userDashboard.daysTotal', { defaultValue: 'days total' }) : 'days total'}</small>
              <small className="text-muted mx-1">•</small>
              <small>{meta.daysWithData || 0} {t ? t('userDashboard.daysWithData', { defaultValue: 'days with data' }) : 'days with data'}</small>
            </div>
            <div>
              <small className="text-success">
                <i className="bx bx-up-arrow-alt"></i>
                {meta.daysPositiveFlow || 0} {t ? t('userDashboard.daysPositiveFlow', { defaultValue: 'days positive flow' }) : 'days positive flow'}
              </small>
              <small className="text-muted mx-1">•</small>
              <small className="text-danger">
                <i className="bx bx-down-arrow-alt"></i>
                {meta.daysNegativeFlow || 0} {t ? t('userDashboard.daysNegative', { defaultValue: 'days negative' }) : 'days negative'}
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UserTransactionsDashboard() {
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
  const [dailyMeta, setDailyMeta] = useState(null)

  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingDaily, setLoadingDaily] = useState(false)
  const [byCoinData, setByCoinData] = useState([])
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
    const fromDate = new Date(from + 'T00:00:00')
    const toDate = new Date(to + 'T00:00:00')
    const formatDate = (d) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    return `${formatDate(fromDate)} - ${formatDate(toDate)}`
  }, [dateRange, locale])

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

    // Load by coin
    setLoadingByCoin(true)
    try {
      const byCoinRes = await getUserTransactionByCoin(token, dateRange.from, dateRange.to)
      setByCoinData(byCoinRes?.items || byCoinRes || [])
    } catch (e) {
      console.error('Failed to load by-coin data:', e)
    } finally {
      setLoadingByCoin(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token, dateRange])


  const current = summary?.current || {}
  const previous = summary?.previous || {}
  const changes = summary?.changes || {}
  const counts = current?.counts || {}

  const byCoinTotals = useMemo(() => {
    if (!byCoinData || byCoinData.length === 0) {
      return { deposit: 0, withdrawal: 0, fee: 0, netFlow: 0 }
    }
    const deposit = byCoinData.reduce((sum, item) => sum + parseFloat(item.depositUsd || 0), 0)
    const withdrawal = byCoinData.reduce((sum, item) => sum + parseFloat(item.withdrawalUsd || 0), 0)
    const fee = byCoinData.reduce((sum, item) => sum + parseFloat(item.feeUsd || 0), 0)
    const netFlow = deposit - withdrawal
    return { deposit, withdrawal, fee, netFlow }
  }, [byCoinData])

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center mb-4 gap-3">
        <h4 className="mb-0">
          <i className="bx bx-bar-chart-alt-2 text-primary me-2"></i>
          {t('nav.dashboard', { defaultValue: 'Dashboard' })}
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
              <LocaleDatePicker
                value={customFrom}
                onChange={setCustomFrom}
                locale={locale}
                placeholder={t('filter.from', { defaultValue: 'From' })}
                t={t}
              />
              <span className="align-self-center">–</span>
              <LocaleDatePicker
                value={customTo}
                onChange={setCustomTo}
                locale={locale}
                placeholder={t('filter.to', { defaultValue: 'To' })}
                t={t}
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
            t={t}
          />
          <SummaryCard
            title={t('userDashboard.withdrawals', { defaultValue: 'Withdrawals' })}
            value={formatCurrencyPlain(current.totalWithdrawalUsd)}
            change={changes.withdrawalPercent}
            icon="bx-transfer-alt"
            color="danger"
            t={t}
          />
          <SummaryCard
            title={t('userDashboard.feesCollected', { defaultValue: 'Fees Collected' })}
            value={formatCurrencyPlain(current.totalFeeUsd)}
            change={changes.feePercent}
            icon="bx-dollar-circle"
            color="warning"
            t={t}
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
            t={t}
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
                <DailyTrendChart data={dailyData} meta={dailyMeta} height={300} locale={locale} t={t} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Transaction by Coin */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                {t('userDashboard.transactionByCoin', { defaultValue: 'Transaction by Coin' })}
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
                        <th className="text-end text-uppercase fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>{t('userDashboard.deposits', { defaultValue: 'Deposits' })}</th>
                        <th className="text-end text-uppercase fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>{t('userDashboard.withdrawals', { defaultValue: 'Withdrawals' })}</th>
                        <th className="text-end text-uppercase fw-semibold text-muted" style={{ fontSize: '0.8rem' }}>{t('userDashboard.feesCollected', { defaultValue: 'Fees' })}</th>
                        <th className="text-end text-uppercase fw-semibold text-muted text-nowrap" style={{ fontSize: '0.8rem' }}>{t('userDashboard.netFlow', { defaultValue: 'Net Flow' })}</th>
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
                            const deposit = parseFloat(item.depositUsd || 0)
                            const withdrawal = parseFloat(item.withdrawalUsd || 0)
                            const fee = parseFloat(item.feeUsd || 0)
                            const netFlow = deposit - withdrawal

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
                                <td className="text-end">{formatCurrencyPlain(deposit)}</td>
                                <td className="text-end">{formatCurrencyPlain(withdrawal)}</td>
                                <td className="text-end">{formatCurrencyPlain(fee)}</td>
                                <td className={`text-end ${netFlow > 0 ? 'text-success' : netFlow < 0 ? 'text-danger' : ''}`}>
                                  {formatCurrencyPlain(netFlow)}
                                </td>
                              </tr>
                            )
                          })}
                          {/* Total row */}
                          <tr className="table-light fw-semibold">
                            <td className="text-body">{t('common.total', { defaultValue: 'TOTAL' })}</td>
                            <td className="text-end text-body">{formatCurrencyPlain(byCoinTotals.deposit)}</td>
                            <td className="text-end text-body">{formatCurrencyPlain(byCoinTotals.withdrawal)}</td>
                            <td className="text-end text-body">{formatCurrencyPlain(byCoinTotals.fee)}</td>
                            <td className={`text-end ${byCoinTotals.netFlow > 0 ? 'text-success' : byCoinTotals.netFlow < 0 ? 'text-danger' : ''}`}>
                              {formatCurrencyPlain(byCoinTotals.netFlow)}
                            </td>
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
    </div>
  )
}
