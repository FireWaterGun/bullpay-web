import { formatUsdAuto } from '../../utils/format'

const formatCurrency = formatUsdAuto

export default function RevenueBarChart({ data, height = 300, locale = 'en-US', t }) {
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
            {yScale.labels.map((v) => (
              <div
                key={`y-${v}`}
                style={{
                  position: 'absolute',
                  top: yPos(v) - 8,
                  right: 8,
                  fontSize: '0.72rem',
                  color: 'var(--bs-secondary-color)',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatUsdAuto(v)}
              </div>
            ))}
          </div>
          {/* Chart area */}
          <div style={{ position: 'relative', flex: 1, minWidth: barAreaW, height: chartH }}>
            {/* Grid lines */}
            {yScale.labels.map((v) => (
              <div
                key={`grid-${v}`}
                style={{
                  position: 'absolute',
                  top: yPos(v),
                  left: 0,
                  right: 0,
                  borderTop: v === 0 ? '1.5px solid var(--bs-secondary-color)' : '1px dashed var(--bs-border-color)',
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
                  <g key={item.date || i}>
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
                  <circle key={`dot-${item.date || i}`} cx={cx} cy={cy} r={3} fill="#03c3ec" stroke="#fff" strokeWidth="1.5">
                    <title>Profit: {formatCurrency(item.profit)}</title>
                  </circle>
                )
              })}
            </svg>
          </div>
          {/* Legend (right side) */}
          <div style={{ width: 100, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, paddingLeft: 16 }}>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 14, height: 14, backgroundColor: 'var(--bs-primary)', borderRadius: 3, display: 'inline-block', flexShrink: 0 }}></span>
              <small>{t ? t('admin.revenue', { defaultValue: 'Revenue' }) : 'Revenue'}</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 14, height: 14, background: 'repeating-conic-gradient(var(--bs-gray-400) 0% 25%, var(--bs-gray-500) 0% 50%) 50%/6px 6px', borderRadius: 3, display: 'inline-block', flexShrink: 0 }}></span>
              <small>{t ? t('admin.cost', { defaultValue: 'Cost' }) : 'Cost'}</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ width: 16, borderBottom: '2px solid var(--bs-info)', display: 'inline-block', flexShrink: 0 }}></span>
              <small>{t ? t('admin.operatingProfit', { defaultValue: 'Operating Profit' }) : 'Operating Profit'}</small>
            </div>
          </div>
        </div>
        {/* X-axis labels */}
        <div style={{ display: 'flex', marginLeft: yAxisW, width: barAreaW }}>
          {data.map((item) => (
            <div key={`x-${item.date}`} style={{ width: barGroupW, flexShrink: 0, textAlign: 'center' }}>
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
