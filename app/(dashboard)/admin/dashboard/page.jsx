'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { useAuth } from '@/app/providers'
import { getRevenueSummary, getRevenueDaily, getRevenueByCoin } from '@/lib/api/admin'
import { formatUsdAuto, formatPercent as formatPercentShared } from '@/lib/utils/format'
import SummaryCard from '@/components/admin/RevenueSummaryCard'
import RevenueBarChart from '@/components/admin/RevenueBarChart'
import { RevenueByCoinTable, RevenueVolumeSummary } from '@/components/admin/RevenueByCoinTable'
import DateFilterBar from '@/components/dashboard/DateFilterBar'
import { logger } from '@/lib/utils/logger'
import Alert from '@/components/ui/Alert'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { getDateRange } from '@/lib/utils/dateRange'

const formatCurrency = formatUsdAuto
const formatPercent = formatPercentShared

export default function AdminDashboardPage() {
  const { t } = useAdminTranslation()
  const { token, user, hasPermission, navigation } = useAuth()
  const router = useRouter()

  // Redirect if user doesn't have revenue dashboard permission
  useEffect(() => {
    if (navigation && !hasPermission('admin.revenue.view')) {
      // Find first available menu path from navigation
      const firstPath = navigation.menus?.flatMap((s) => s.items)?.find((item) => item.path)?.path
      router.replace(firstPath || '/admin/users')
    }
  }, [navigation, hasPermission, router])

  const locale = useLocale()

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

  useEffect(() => {
    if (!token || !dateRange.from || !dateRange.to) return

    const loadData = async () => {
      setError('')
      setLoadingSummary(true)
      setLoadingDaily(true)
      setLoadingByCoin(true)

      const [summaryResult, dailyResult, byCoinResult] = await Promise.allSettled([
        getRevenueSummary(token, dateRange.from, dateRange.to),
        getRevenueDaily(token, dateRange.from, dateRange.to),
        getRevenueByCoin(token, dateRange.from, dateRange.to),
      ])

      // Summary
      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value)
      } else {
        logger.error('Failed to load summary:', summaryResult.reason)
        setError(summaryResult.reason?.message || 'Failed to load summary')
      }
      setLoadingSummary(false)

      // Daily
      if (dailyResult.status === 'fulfilled') {
        const items = dailyResult.value?.items || dailyResult.value || []
        setDailyData(
          items.map((item) => ({
            date: item.date,
            revenue: parseFloat(item.revenueUsd || 0),
            cost: parseFloat(item.costUsd || 0),
            profit: parseFloat(item.operatingProfitUsd || 0),
          }))
        )
      } else {
        logger.error('Failed to load daily data:', dailyResult.reason)
      }
      setLoadingDaily(false)

      // By Coin
      if (byCoinResult.status === 'fulfilled') {
        setByCoinData(byCoinResult.value?.items || byCoinResult.value || [])
      } else {
        logger.error('Failed to load by-coin data:', byCoinResult.reason)
      }
      setLoadingByCoin(false)
    }

    loadData()
  }, [token, dateRange])

  const totals = useMemo(
    () => ({
      revenue: parseFloat(summary?.totalRevenueUsd || 0),
      cost: parseFloat(summary?.totalCostUsd || 0),
      adjustmentNet: parseFloat(summary?.totalAdjustmentNetUsd || 0),
      profit: parseFloat(summary?.operatingProfitUsd || 0),
      margin: parseFloat(summary?.profitMarginPercent || 0),
    }),
    [summary]
  )

  return (
    <div className="grow pb-6">
      <div className="flex flex-wrap items-center mb-4 gap-3">
        <h4 className="mb-0">
          <i className="bx bx-bar-chart-alt-2 text-primary-600 mr-2"></i>
          {t('admin.revenueDashboard', { defaultValue: 'Revenue Dashboard' })}
        </h4>
        <div className="ml-auto">
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
        </div>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="grid grid-cols-12 gap-x-6 gap-4 mb-4">
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
          title={t('admin.operatingProfit', { defaultValue: 'Operating Profit' })}
          value={loadingSummary ? '...' : formatCurrency(summary?.operatingProfitUsd)}
          icon="bx-dollar-circle"
          color={
            parseFloat(summary?.operatingProfitUsd || 0) > 0
              ? 'success'
              : parseFloat(summary?.operatingProfitUsd || 0) < 0
                ? 'danger'
                : 'warning'
          }
          valueColor={
            parseFloat(summary?.operatingProfitUsd || 0) > 0
              ? 'success'
              : parseFloat(summary?.operatingProfitUsd || 0) < 0
                ? 'danger'
                : undefined
          }
        />

        <SummaryCard
          title={t('admin.margin', { defaultValue: 'Margin' })}
          value={loadingSummary ? '...' : formatPercent(summary?.profitMarginPercent)}
          icon="bx-pie-chart-alt-2"
          color="info"
        />
      </div>

      <div className="grid grid-cols-12 gap-x-6 mb-4">
        <div className="col-span-12">
          <Card>
            <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
              <h5 className="text-base font-semibold text-surface-800 mb-0">
                {t('admin.revenueCostTrend', { defaultValue: 'Revenue & Cost Trend (Daily)' })}
              </h5>
            </div>
            <div className="p-5">
              {loadingDaily ? (
                <div className="flex justify-center py-5">
                  <Spinner role="status" className="text-primary-600" />
                </div>
              ) : (
                <RevenueBarChart data={dailyData} height={280} locale={locale} t={t} />
              )}
            </div>
          </Card>
        </div>
      </div>

      <RevenueByCoinTable byCoinData={byCoinData} totals={totals} loading={loadingByCoin} t={t} />

      {summary && <RevenueVolumeSummary summary={summary} t={t} />}
    </div>
  )
}
