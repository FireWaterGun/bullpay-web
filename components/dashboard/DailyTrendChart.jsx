'use client'

import { formatUsd } from '@/lib/utils/format'

function DailyTrendChart({ data, meta, height = 300, locale = 'en-US', t }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height }}>
        <div className="rounded-full bg-surface-100 flex items-center justify-center mb-3 w-16 h-16">
          <i className="bx bx-line-chart text-3xl"></i>
        </div>
        <span className="font-medium text-surface-900">{t ? t('userDashboard.noDataAvailable', { defaultValue: 'No data available' }) : 'No data available'}</span>
        <span className="text-surface-500 text-sm mt-1">{t ? t('userDashboard.noDataSub', { defaultValue: 'Select a date range with transactions' }) : 'Select a date range with transactions'}</span>
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
      <div className="overflow-x-auto">
        <div className="flex" style={{ minWidth: yAxisW + barAreaW + 120 }}>
          {/* Y-axis */}
          <div className="shrink-0 relative" style={{ width: yAxisW, height: chartH }}>
            {yScale.labels.map((v) => (
              <div className="absolute right-[8px] text-[0.72rem] text-surface-500 whitespace-nowrap"
                key={`y-${v}`}
                style={{ top: yPos(v) - 8 }}
              >
                {formatUsd(v)}
              </div>
            ))}
          </div>
          {/* Chart area */}
          <div className="relative flex-1" style={{ minWidth: barAreaW, height: chartH }}>
            {/* Grid lines */}
            {yScale.labels.map((v) => (
              <div className="absolute left-[0px] right-[0px]"
                key={`grid-${v}`}
                style={{ top: yPos(v), borderTop: v === 0 ? '1.5px solid var(--color-surface-500, #6b7280)' : '1px dashed var(--color-surface-200, #e5e7eb)' }}
              />
            ))}
            {/* Bars + line */}
            <svg className="absolute top-[0px] left-[0px]" width={barAreaW} height={chartH}>
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
                  <g key={item.date || i}>
                    <rect x={cx - barW - 1} y={depTop} width={barW} height={depH} rx={2} fill="var(--color-primary-600, #2563eb)">
                      <title>{t ? t('userDashboard.chartDeposit', { value: formatUsd(dep), defaultValue: `Deposit: ${formatUsd(dep)}` }) : `Deposit: ${formatUsd(dep)}`}</title>
                    </rect>
                    <rect x={cx + 1} y={wthTop} width={barW} height={wthH} rx={2} fill="url(#withdrawalPattern)">
                      <title>{t ? t('userDashboard.chartWithdrawal', { value: formatUsd(wth), defaultValue: `Withdrawal: ${formatUsd(wth)}` }) : `Withdrawal: ${formatUsd(wth)}`}</title>
                    </rect>
                  </g>
                )
              })}
              {/* Net flow line (smooth curve) */}
              <path d={netFlowPath} fill="none" stroke="#03c3ec" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Net flow dots */}
              {data.map((item, i) => {
                const cx = i * barGroupW + barGroupW / 2
                const cy = yPos(item.netFlow || 0)
                return (
                  <circle key={`dot-${item.date || i}`} cx={cx} cy={cy} r={3} fill="#03c3ec" stroke="#fff" strokeWidth="1.5">
                    <title>{t ? t('userDashboard.chartNetFlow', { value: formatUsd(item.netFlow || 0), defaultValue: `Net Flow: ${formatUsd(item.netFlow || 0)}` }) : `Net Flow: ${formatUsd(item.netFlow || 0)}`}</title>
                  </circle>
                )
              })}
            </svg>
          </div>
          {/* Legend */}
          <div className="w-[110px] shrink-0 flex flex-col justify-center gap-3 pl-[16px]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-primary-600 rounded-[3px] inline-block shrink-0"></span>
              <small>{t ? t('userDashboard.deposits', { defaultValue: 'Deposit' }) : 'Deposit'}</small>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-[3px] inline-block shrink-0" style={{ background: 'repeating-conic-gradient(#9ca3af 0% 25%, #6b7280 0% 50%) 50%/6px 6px' }}></span>
              <small>{t ? t('userDashboard.withdrawals', { defaultValue: 'Withdrawal' }) : 'Withdrawal'}</small>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 inline-block shrink-0" style={{ borderBottom: '2px solid #03c3ec' }}></span>
              <small>{t ? t('userDashboard.netFlow', { defaultValue: 'Net Flow' }) : 'Net Flow'}</small>
            </div>
          </div>
        </div>
        {/* X-axis labels */}
        <div className="flex" style={{ marginLeft: yAxisW, width: barAreaW }}>
          {data.map((item) => (
            <div className="text-center shrink-0" key={`x-${item.date}`} style={{ width: barGroupW }}>
              <small className="text-surface-500 text-[0.72rem]">
                {item.date ? new Date(item.date + 'T00:00:00').toLocaleDateString(locale, { month: 'short', day: 'numeric' }) : ''}
              </small>
            </div>
          ))}
        </div>
      </div>
      {/* Footer stats */}
      {meta && (
        <div className="mt-3 p-3 rounded-lg bg-primary-50 border border-primary-100">
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <i className="bx bx-calendar text-primary-600 mr-1"></i>
              <small className="font-medium">{meta.totalDays || 0} {t ? t('userDashboard.daysTotal', { defaultValue: 'days total' }) : 'days total'}</small>
              <small className="text-surface-500 mx-1">&bull;</small>
              <small>{meta.daysWithData || 0} {t ? t('userDashboard.daysWithData', { defaultValue: 'days with data' }) : 'days with data'}</small>
            </div>
            <div>
              <small className="text-green-500">
                <i className="bx bx-up-arrow-alt"></i>
                {meta.daysPositiveFlow || 0} {t ? t('userDashboard.daysPositiveFlow', { defaultValue: 'days positive flow' }) : 'days positive flow'}
              </small>
              <small className="text-surface-500 mx-1">&bull;</small>
              <small className="text-red-500">
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

export default DailyTrendChart
