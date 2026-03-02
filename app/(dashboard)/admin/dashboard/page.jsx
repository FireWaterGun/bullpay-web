'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useAuth } from '@/app/providers'
import { getRevenueSummary, getRevenueDaily, getRevenueByCoin } from '@/lib/api/admin'
import LocaleDatePicker from '@/components/LocaleDatePicker'
import { formatUsdAuto, formatPercent as formatPercentShared } from '@/lib/utils/format'
import SummaryCard from '@/components/admin/RevenueSummaryCard'
import RevenueBarChart from '@/components/admin/RevenueBarChart'
import { RevenueByCoinTable, RevenueVolumeSummary } from '@/components/admin/RevenueByCoinTable'
import { logger } from '@/lib/utils/logger'

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

export default function AdminDashboardPage() {
  const { t, i18n } = useAdminTranslation()
  const { token, hasPermission, navigation } = useAuth()
  const router = useRouter()

  // Redirect if user doesn't have revenue dashboard permission
  useEffect(() => {
    if (navigation && !hasPermission('admin.revenue.view')) {
      // Find first available menu path from navigation
      const firstPath = navigation.menus
        ?.flatMap((s) => s.items)
        ?.find((item) => item.path)?.path
      router.replace(firstPath || '/admin/users')
    }
  }, [navigation, hasPermission, router])

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
        setDailyData(items.map(item => ({
          date: item.date,
          revenue: parseFloat(item.revenueUsd || 0),
          cost: parseFloat(item.costUsd || 0),
          profit: parseFloat(item.operatingProfitUsd || 0),
        })))
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

  const totals = useMemo(() => ({
    revenue: parseFloat(summary?.totalRevenueUsd || 0),
    cost: parseFloat(summary?.totalCostUsd || 0),
    adjustmentNet: parseFloat(summary?.totalAdjustmentNetUsd || 0),
    profit: parseFloat(summary?.operatingProfitUsd || 0),
    margin: parseFloat(summary?.profitMarginPercent || 0),
  }), [summary])

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
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
                className="btn btn-outline-secondary"
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
                className="btn btn-outline-secondary"
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
          title={t('admin.operatingProfit', { defaultValue: 'Operating Profit' })}
          value={loadingSummary ? '...' : formatCurrency(summary?.operatingProfitUsd)}
          icon="bx-dollar-circle"
          color={parseFloat(summary?.operatingProfitUsd || 0) > 0 ? 'success' : parseFloat(summary?.operatingProfitUsd || 0) < 0 ? 'danger' : 'warning'}
          valueColor={parseFloat(summary?.operatingProfitUsd || 0) > 0 ? 'success' : parseFloat(summary?.operatingProfitUsd || 0) < 0 ? 'danger' : undefined}
        />
        <SummaryCard
          title={t('admin.margin', { defaultValue: 'Margin' })}
          value={loadingSummary ? '...' : formatPercent(summary?.profitMarginPercent)}
          icon="bx-pie-chart-alt-2"
          color="info"
        />
      </div>

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
                <RevenueBarChart data={dailyData} height={280} locale={locale} t={t} />
              )}
            </div>
          </div>
        </div>
      </div>

      <RevenueByCoinTable
        byCoinData={byCoinData}
        totals={totals}
        loading={loadingByCoin}
        t={t}
      />

      {summary && (
        <RevenueVolumeSummary summary={summary} t={t} />
      )}
    </div>
  )
}
