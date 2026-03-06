'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import { getUserTransactionSummary, getUserTransactionDaily, getUserTransactionByCoin } from '@/lib/api/userTransactions'
import LocaleDatePicker from '@/components/LocaleDatePicker'
import { formatUsd, formatChange } from '@/lib/utils/format'
import DailyTrendChart from '@/components/dashboard/DailyTrendChart'
import TransactionByCoinTable from '@/components/dashboard/TransactionByCoinTable'
import RefreshButton from '@/components/RefreshButton'
import { logger } from '@/lib/utils/logger'

const formatCurrencyPlain = formatUsd

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

const kpiColors = {
  primary:   { bg: 'bg-primary-50 dark:bg-primary-500/10',  icon: 'text-primary-600 dark:text-primary-400' },
  danger:    { bg: 'bg-danger-50 dark:bg-danger-500/10',   icon: 'text-danger-600 dark:text-danger-400' },
  warning:   { bg: 'bg-warning-50 dark:bg-warning-500/10',  icon: 'text-warning-600 dark:text-warning-400' },
  info:      { bg: 'bg-info-50 dark:bg-info-500/10',     icon: 'text-info-600 dark:text-info-400' },
}

function SummaryCard({ title, value, change, icon, color = 'primary', valueColor, t }) {
  const numChange = typeof change === 'number' ? change : parseFloat(change)
  const isPositive = numChange >= 0
  const c = kpiColors[color] || kpiColors.primary

  return (
    <div className="bg-card rounded-xl shadow-sm border border-surface-100 p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-surface-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold mb-0 ${valueColor ?`text-${valueColor}-600` : 'text-surface-900'}`}>{value}</p>
          {change !== undefined && change !== null && !isNaN(numChange) && (
            <span className={`text-xs ${isPositive ?'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
              <i className={`bx ${isPositive ?'bx-up-arrow-alt' : 'bx-down-arrow-alt'}`}></i>
              {formatChange(numChange)} {t ? t('userDashboard.vsPrev', { defaultValue: 'vs prev' }) : 'vs prev'}
            </span>
          )}
        </div>
        <span className={`flex items-center justify-center w-10 h-10 rounded-lg ${c.bg} shrink-0`}>
          <i className={`bx ${icon} text-xl ${c.icon}`}></i>
        </span>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
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
    const fromDate = new Date(`${from  }T00:00:00`)
    const toDate = new Date(`${to  }T00:00:00`)
    const fmtDate = (d) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    return `${fmtDate(fromDate)} - ${fmtDate(toDate)}`
  }, [dateRange, locale])

  const loadData = useCallback(async () => {
    if (!token || !dateRange.from || !dateRange.to) return
    setError('')
    setLoadingSummary(true)
    setLoadingDaily(true)
    setLoadingByCoin(true)

    const [summaryResult, dailyResult, byCoinResult] = await Promise.allSettled([
      getUserTransactionSummary(token, dateRange.from, dateRange.to),
      getUserTransactionDaily(token, dateRange.from, dateRange.to),
      getUserTransactionByCoin(token, dateRange.from, dateRange.to),
    ])

    if (summaryResult.status === 'fulfilled') {
      setSummary(summaryResult.value)
    } else {
      logger.error('Failed to load transaction summary:', summaryResult.reason)
      setError(summaryResult.reason?.message || 'Failed to load summary')
    }
    setLoadingSummary(false)

    if (dailyResult.status === 'fulfilled') {
      const res = dailyResult.value
      const items = res?.items || res || []
      setDailyData(items.map(item => ({
        date: item.date,
        deposit: parseFloat(item.depositUsd || 0),
        withdrawal: parseFloat(item.withdrawalUsd || 0),
        netFlow: parseFloat(item.netFlowUsd || 0),
      })))
      setDailyMeta(res?.meta || null)
    } else {
      logger.error('Failed to load daily data:', dailyResult.reason)
    }
    setLoadingDaily(false)

    if (byCoinResult.status === 'fulfilled') {
      const res = byCoinResult.value
      setByCoinData(res?.items || res || [])
    } else {
      logger.error('Failed to load by-coin data:', byCoinResult.reason)
    }
    setLoadingByCoin(false)
  }, [token, dateRange])

  useEffect(() => {
    queueMicrotask(() => {
      void loadData()
    })
  }, [loadData])

  const current = summary?.current || {}
  const changes = summary?.changes || {}

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h4 className="text-xl font-semibold text-surface-900 flex items-center gap-2">
          <i className="bx bx-bar-chart-alt-2 text-primary-600"></i>
          {t('nav.dashboard', { defaultValue: 'Dashboard' })}
        </h4>
        <RefreshButton onClick={loadData} loading={loadingSummary || loadingDaily || loadingByCoin} />

        <div className="flex gap-2 flex-wrap items-center ml-auto">
          <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-surface-100 text-surface-600 rounded-lg">
            {dateRangeLabel}
          </span>
          {!showCustom ? (
            <>
              <select
                className="px-3 py-1.5 text-sm border border-surface-200 rounded-lg bg-card text-surface-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
              >
                <option value="today">{t('filter.today', { defaultValue: 'Today' })}</option>
                <option value="yesterday">{t('filter.yesterday', { defaultValue: 'Yesterday' })}</option>
                <option value="last7days">{t('filter.last7days', { defaultValue: 'Last 7 Days' })}</option>
                <option value="last30days">{t('filter.last30days', { defaultValue: 'Last 30 Days' })}</option>
                <option value="thisMonth">{t('filter.thisMonth', { defaultValue: 'This Month' })}</option>
                <option value="lastMonth">{t('filter.lastMonth', { defaultValue: 'Last Month' })}</option>
              </select>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-surface-200 rounded-lg text-surface-600 hover:bg-surface-50 transition-colors cursor-pointer"
                onClick={() => setShowCustom(true)}
              >
                <i className="bx bx-calendar"></i>
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
                minDate={customTo ? (() => { const d = new Date(`${customTo  }T00:00:00`); d.setMonth(d.getMonth() - 2); return d.toISOString().split('T')[0] })() : undefined}
              />
              <span className="self-center text-surface-400">&ndash;</span>
              <LocaleDatePicker
                value={customTo}
                onChange={setCustomTo}
                locale={locale}
                placeholder={t('filter.to', { defaultValue: 'To' })}
                t={t}
                minDate={customFrom ? customFrom : undefined}
                maxDate={customFrom ? (() => { const d = new Date(`${customFrom  }T00:00:00`); d.setMonth(d.getMonth() + 2); return d.toISOString().split('T')[0] })() : undefined}
              />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-surface-200 rounded-lg text-surface-600 hover:bg-surface-50 transition-colors cursor-pointer"
                onClick={() => { setShowCustom(false); setCustomFrom(''); setCustomTo('') }}
              >
                <i className="bx bx-reset"></i>
                {t('filter.reset', { defaultValue: 'Reset' })}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-danger-50 dark:bg-danger-500/10 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-300 rounded-lg p-3 text-sm mb-5">{error}</div>
      )}

      {/* KPI Summary Cards */}
      {loadingSummary ? (
        <div className="flex justify-center py-12 mb-5">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
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
            value={formatCurrencyPlain(current.netFlowUsd)}
            change={changes.netFlowPercent}
            icon="bx-line-chart"
            color="info"
            valueColor={(() => { const nf = parseFloat(current.netFlowUsd || 0); return nf > 0 ? 'success' : nf < 0 ? 'danger' : undefined })()}
            t={t}
          />
        </div>
      )}

      {/* Daily Trend Chart */}
      <div className="bg-card rounded-xl shadow-sm border border-surface-100 mb-5">
        <div className="px-5 py-4 border-b border-surface-100">
          <h5 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-0">
            <i className="bx bx-bar-chart-alt-2 text-primary-600"></i>
            {t('userDashboard.dailyTrend', { defaultValue: 'Daily Trend Chart' })}
          </h5>
        </div>
        <div className="p-5">
          {loadingDaily ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <DailyTrendChart data={dailyData} meta={dailyMeta} height={300} locale={locale} t={t} />
          )}
        </div>
      </div>

      {/* Transaction by Coin */}
      <TransactionByCoinTable byCoinData={byCoinData} loading={loadingByCoin} t={t} />
    </>
  )
}
