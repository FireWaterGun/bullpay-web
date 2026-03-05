'use client'

import { formatUsdAuto } from '@/lib/utils/format'

const formatCurrency = formatUsdAuto

export default function RevenueBarChart({ data, height = 300, locale = 'en-US', t }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height }}>
        <div className="rounded-full bg-surface-100 text-surface-600 flex items-center justify-center mb-3 w-16 h-16">
          <i className="bx bx-bar-chart-alt-2 text-[2rem]"></i>
        </div>
        <span className="font-medium text-surface-900">{t ? t('admin.noDataAvailable', { defaultValue: 'No data available' }) : 'No data available'}</span>
        <span className="text-muted text-sm mt-1">{t ? t('admin.noDataSub', { defaultValue: 'Select a date range with data' }) : 'Select a date range with data'}</span>
      </div>
    )
  }

  const allValues = data.flatMap(d => [d.revenue || 0, d.cost || 0, d.profit || 0])
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
  const barAreaW = Math.max(data.length * 90, 400)
  const barGroupW = barAreaW / data.length
  const barW = Math.min(24, barGroupW * 0.3)

  const yPos = (val) => padTop + (chartH - padTop) - ((val - yScale.min) / yRange) * (chartH - padTop)
  const zeroY = yPos(0)

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
      <div className="overflow-x-auto">
        <div className="flex" style={{ minWidth: yAxisW + barAreaW + 120 }}>
          {/* Y-axis */}
          <div className="shrink-0 relative" style={{ width: yAxisW, height: chartH }}>
            {yScale.labels.map((v) => (
              <div className="absolute right-[8px] text-[0.72rem] text-surface-500 whitespace-nowrap"
                key={`y-${v}`}
                style={{ top: yPos(v) - 8 }}
              >
                {formatUsdAuto(v)}
              </div>
            ))}
          </div>
          {/* Chart area */}
          <div className="relative flex-1" style={{ minWidth: barAreaW, height: chartH }}>
            {yScale.labels.map((v) => (
              <div className="absolute left-[0px] right-[0px]"
                key={`grid-${v}`}
                style={{ top: yPos(v), borderTop: v === 0 ? '1.5px solid var(--color-surface-500)' : '1px dashed var(--color-surface-200)' }}
              />
            ))}
            <svg className="absolute top-[0px] left-[0px]" width={barAreaW} height={chartH}>
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
                    <rect
                      x={cx - barW - 1}
                      y={revTop}
                      width={barW}
                      height={revH}
                      rx={2}
                      fill="var(--color-primary-600, #2563eb)"
                    >
                      <title>{t ? t('admin.revenue', { defaultValue: 'Revenue' }) : 'Revenue'}: {formatCurrency(rev)}</title>
                    </rect>
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
                      <title>{t ? t('admin.cost', { defaultValue: 'Cost' }) : 'Cost'}: {formatCurrency(cost)}</title>
                    </rect>
                  </g>
                )
              })}
              <path
                d={profitPath}
                fill="none"
                stroke="#03c3ec"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {data.map((item, i) => {
                const cx = i * barGroupW + barGroupW / 2
                const cy = yPos(item.profit || 0)
                return (
                  <circle key={`dot-${item.date || i}`} cx={cx} cy={cy} r={3} fill="#03c3ec" stroke="#fff" strokeWidth="1.5">
                    <title>{t ? t('admin.operatingProfit', { defaultValue: 'Profit' }) : 'Profit'}: {formatCurrency(item.profit)}</title>
                  </circle>
                )
              })}
            </svg>
          </div>
          {/* Legend */}
          <div className="w-[100px] shrink-0 flex flex-col justify-center gap-3 pl-[16px]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-primary-600 rounded-[3px] inline-block shrink-0"></span>
              <small>{t ? t('admin.revenue', { defaultValue: 'Revenue' }) : 'Revenue'}</small>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-[3px] inline-block shrink-0" style={{ background: 'repeating-conic-gradient(var(--color-surface-400) 0% 25%, var(--color-surface-500) 0% 50%) 50%/6px 6px' }}></span>
              <small>{t ? t('admin.cost', { defaultValue: 'Cost' }) : 'Cost'}</small>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 inline-block shrink-0" style={{ borderBottom: '2px solid var(--color-cyan-500)' }}></span>
              <small>{t ? t('admin.operatingProfit', { defaultValue: 'Operating Profit' }) : 'Operating Profit'}</small>
            </div>
          </div>
        </div>
        {/* X-axis labels */}
        <div className="flex" style={{ marginLeft: yAxisW, width: barAreaW }}>
          {data.map((item) => (
            <div className="shrink-0 text-center" key={`x-${item.date}`} style={{ width: barGroupW }}>
              <small className="text-muted text-xs">
                {item.date ? new Date(item.date + 'T00:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric' }) : ''}
              </small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
