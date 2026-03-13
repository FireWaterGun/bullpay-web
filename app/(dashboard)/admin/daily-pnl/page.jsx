'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import useApi from '@/hooks/useApi'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/app/providers'
import { getRevenueDaily } from '@/lib/api/admin'
import { getDateRange } from '@/lib/utils/dateRange'
import { formatUsdAuto, formatPercent } from '@/lib/utils/format'
import DateFilterBar from '@/components/dashboard/DateFilterBar'
import SummaryCard from '@/components/admin/RevenueSummaryCard'
import CoinNetworkFilterDropdown from '@/components/ui/CoinNetworkFilterDropdown'
import CardEmptyState from '@/components/CardEmptyState'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import SortableHeader from '@/components/ui/SortableHeader'
import Spinner from '@/components/ui/Spinner'
import { useCoins } from '@/hooks/useCoins'

function computeTotals(rows) {
  const totals = {
    sweepVolumeUsd: 0,
    withdrawalVolumeUsd: 0,
    revenueUsd: 0,
    costUsd: 0,
    operatingProfitUsd: 0,
  }
  for (const row of rows) {
    totals.sweepVolumeUsd += Number(row.sweepVolumeUsd) || 0
    totals.withdrawalVolumeUsd += Number(row.withdrawalVolumeUsd) || 0
    totals.revenueUsd += Number(row.revenueUsd) || 0
    totals.costUsd += Number(row.costUsd) || 0
    totals.operatingProfitUsd += Number(row.operatingProfitUsd) || 0
  }
  totals.marginPercent = totals.revenueUsd > 0 ? (totals.operatingProfitUsd / totals.revenueUsd) * 100 : 0
  return totals
}

function exportCsv(rows, totals, t) {
  const headers = [
    t('admin.dailyPnl.date', { defaultValue: 'Date' }),
    t('admin.dailyPnl.deposits', { defaultValue: 'Deposits' }),
    t('admin.dailyPnl.withdrawals', { defaultValue: 'Withdrawals' }),
    t('admin.dailyPnl.revenue', { defaultValue: 'Revenue' }),
    t('admin.dailyPnl.gasCosts', { defaultValue: 'Gas Costs' }),
    t('admin.dailyPnl.netPnl', { defaultValue: 'Net P&L' }),
    t('admin.dailyPnl.margin', { defaultValue: 'Margin' }),
  ]

  const csvRows = [headers.join(',')]
  for (const row of rows) {
    csvRows.push(
      [
        row.date,
        Number(row.sweepVolumeUsd).toFixed(2),
        Number(row.withdrawalVolumeUsd).toFixed(2),
        Number(row.revenueUsd).toFixed(2),
        Number(row.costUsd).toFixed(2),
        Number(row.operatingProfitUsd).toFixed(2),
        `${Number(row.marginPercent).toFixed(2)}%`,
      ].join(',')
    )
  }
  // Total row
  csvRows.push(
    [
      'TOTAL',
      totals.sweepVolumeUsd.toFixed(2),
      totals.withdrawalVolumeUsd.toFixed(2),
      totals.revenueUsd.toFixed(2),
      totals.costUsd.toFixed(2),
      totals.operatingProfitUsd.toFixed(2),
      `${totals.marginPercent.toFixed(2)}%`,
    ].join(',')
  )

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `daily-pnl-${rows[0]?.date || 'report'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function DailyPnlPage() {
  const { t } = useAdminTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const locale = useLocale()
  const { coins: coinNetworks } = useCoins()

  // Date filters
  const [datePreset, setDatePreset] = useState('last30days')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [coinNetworkId, setCoinNetworkId] = useState('')

  // Sort
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  const dateRange = useMemo(() => {
    if (showCustom && customFrom && customTo) {
      return { from: customFrom, to: customTo }
    }
    return getDateRange(datePreset)
  }, [datePreset, showCustom, customFrom, customTo])

  const fromDate = dateRange.from
  const toDate = dateRange.to

  const { data, isLoading, isValidating } = useApi(
    fromDate && toDate ? ['admin-daily-pnl', fromDate, toDate, coinNetworkId] : null,
    (token) => getRevenueDaily(token, fromDate, toDate, coinNetworkId ? Number(coinNetworkId) : undefined),
    { onError: () => toast.error(t('admin.dailyPnl.loadError', { defaultValue: 'Failed to load daily P&L data' })) }
  )

  const rows = useMemo(() => data?.items || (Array.isArray(data) ? data : []), [data])

  const totals = useMemo(() => computeTotals(rows), [rows])

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const aVal = sortField === 'date' ? a.date : Number(a[sortField]) || 0
      const bVal = sortField === 'date' ? b.date : Number(b[sortField]) || 0
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [rows, sortField, sortDir])

  function handleSort(field, order) {
    setSortField(field)
    setSortDir(order)
  }

  const pnlColor = (val) => {
    const n = Number(val) || 0
    if (n > 0) return 'text-success'
    if (n < 0) return 'text-danger'
    return ''
  }

  const hasData = rows.length > 0

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Header */}
          <Card className="mb-4">
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <h4 className="mb-0">
                  <i className="bx bx-calendar-check text-primary mr-2"></i>
                  {t('admin.dailyPnl.title', { defaultValue: 'Daily P&L' })}
                </h4>
                <div className="ml-auto flex items-center gap-2">
                  <DateFilterBar
                    locale={locale}
                    timezone={user?.timezone}
                    t={t}
                    datePreset={datePreset}
                    onPresetChange={setDatePreset}
                    customFrom={customFrom}
                    onCustomFromChange={setCustomFrom}
                    customTo={customTo}
                    onCustomToChange={setCustomTo}
                    showCustom={showCustom}
                    onShowCustomChange={setShowCustom}
                  />
                  <div className="w-44">
                    <CoinNetworkFilterDropdown
                      coinNetworks={coinNetworks}
                      value={coinNetworkId}
                      onChange={setCoinNetworkId}
                      allLabel={t('common.all', { defaultValue: 'All Coins' })}
                      className="!py-1.5 !text-sm !leading-normal"
                    />
                  </div>
                  {hasData && (
                    <button
                      type="button"
                      onClick={() => exportCsv(sortedRows, totals, t)}
                      className="inline-flex items-center px-3 py-1.5 text-sm border border-surface-300 rounded-md hover:bg-surface-100 transition-colors"
                      title={t('admin.dailyPnl.exportCsv', { defaultValue: 'Export CSV' })}
                    >
                      <i className="bx bx-download mr-1"></i>
                      CSV
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Summary Cards */}
          {hasData && !isValidating && (
            <div className="grid grid-cols-12 gap-x-6 gap-y-4 mb-4">
              <SummaryCard
                title={t('admin.dailyPnl.deposits', { defaultValue: 'Deposits' })}
                value={formatUsdAuto(totals.sweepVolumeUsd)}
                icon="bx-download"
                color="info"
              />
              <SummaryCard
                title={t('admin.dailyPnl.withdrawals', { defaultValue: 'Withdrawals' })}
                value={formatUsdAuto(totals.withdrawalVolumeUsd)}
                icon="bx-upload"
                color="warning"
              />
              <SummaryCard
                title={t('admin.dailyPnl.netPnl', { defaultValue: 'Net P&L' })}
                value={formatUsdAuto(totals.operatingProfitUsd)}
                icon={totals.operatingProfitUsd >= 0 ? 'bx-trending-up' : 'bx-trending-down'}
                color={totals.operatingProfitUsd >= 0 ? 'success' : 'danger'}
                valueColor={totals.operatingProfitUsd >= 0 ? 'success' : 'danger'}
              />
              <SummaryCard
                title={t('admin.dailyPnl.avgMargin', { defaultValue: 'Avg. Margin' })}
                value={formatPercent(totals.marginPercent)}
                icon="bx-pie-chart-alt-2"
                color="primary"
                valueColor={totals.marginPercent >= 0 ? 'success' : 'danger'}
              />
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <Card>
              <div className="p-10 text-center">
                <Spinner />
              </div>
            </Card>
          )}

          {/* Daily Table */}
          {hasData && !isValidating && (
            <Card>
              <Table>
                <thead>
                  <tr>
                    <SortableHeader field="date" sortBy={sortField} sortOrder={sortDir} onSort={handleSort}>
                      {t('admin.dailyPnl.date', { defaultValue: 'Date' })}
                    </SortableHeader>
                    <SortableHeader field="sweepVolumeUsd" sortBy={sortField} sortOrder={sortDir} onSort={handleSort} className="text-right">
                      {t('admin.dailyPnl.deposits', { defaultValue: 'Deposits' })}
                    </SortableHeader>
                    <SortableHeader field="withdrawalVolumeUsd" sortBy={sortField} sortOrder={sortDir} onSort={handleSort} className="text-right">
                      {t('admin.dailyPnl.withdrawals', { defaultValue: 'Withdrawals' })}
                    </SortableHeader>
                    <SortableHeader field="revenueUsd" sortBy={sortField} sortOrder={sortDir} onSort={handleSort} className="text-right">
                      {t('admin.dailyPnl.revenue', { defaultValue: 'Revenue' })}
                    </SortableHeader>
                    <SortableHeader field="costUsd" sortBy={sortField} sortOrder={sortDir} onSort={handleSort} className="text-right">
                      {t('admin.dailyPnl.gasCosts', { defaultValue: 'Gas Costs' })}
                    </SortableHeader>
                    <SortableHeader field="operatingProfitUsd" sortBy={sortField} sortOrder={sortDir} onSort={handleSort} className="text-right">
                      {t('admin.dailyPnl.netPnl', { defaultValue: 'Net P&L' })}
                    </SortableHeader>
                    <SortableHeader field="marginPercent" sortBy={sortField} sortOrder={sortDir} onSort={handleSort} className="text-right">
                      {t('admin.dailyPnl.margin', { defaultValue: 'Margin' })}
                    </SortableHeader>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => (
                    <tr key={row.date}>
                      <td className="whitespace-nowrap">{row.date}</td>
                      <td className="text-right">{formatUsdAuto(row.sweepVolumeUsd)}</td>
                      <td className="text-right">{formatUsdAuto(row.withdrawalVolumeUsd)}</td>
                      <td className="text-right">{formatUsdAuto(row.revenueUsd)}</td>
                      <td className="text-right">{formatUsdAuto(row.costUsd)}</td>
                      <td className={`text-right font-semibold ${pnlColor(row.operatingProfitUsd)}`}>
                        {formatUsdAuto(row.operatingProfitUsd)}
                      </td>
                      <td className={`text-right ${pnlColor(row.marginPercent)}`}>
                        {formatPercent(row.marginPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-surface-100/60 dark:bg-white/4">
                  <tr className="border-t-2 border-surface-200">
                    <td className="font-bold">
                      {t('admin.dailyPnl.total', { defaultValue: 'TOTAL' })}
                    </td>
                    <td className="text-right font-bold">{formatUsdAuto(totals.sweepVolumeUsd)}</td>
                    <td className="text-right font-bold">{formatUsdAuto(totals.withdrawalVolumeUsd)}</td>
                    <td className="text-right font-bold">{formatUsdAuto(totals.revenueUsd)}</td>
                    <td className="text-right font-bold">{formatUsdAuto(totals.costUsd)}</td>
                    <td className={`text-right font-bold ${pnlColor(totals.operatingProfitUsd)}`}>
                      {formatUsdAuto(totals.operatingProfitUsd)}
                    </td>
                    <td className={`text-right font-bold ${pnlColor(totals.marginPercent)}`}>
                      {formatPercent(totals.marginPercent)}
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </Card>
          )}

          {/* Empty state */}
          {!hasData && !isLoading && (
            <Card>
              <div className="p-5">
                <CardEmptyState
                  icon="bx-calendar-check"
                  message={t('admin.dailyPnl.noData', { defaultValue: 'No daily data found' })}
                  sub={t('admin.dailyPnl.noDataDesc', {
                    defaultValue: 'There are no revenue records for the selected period.',
                  })}
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
