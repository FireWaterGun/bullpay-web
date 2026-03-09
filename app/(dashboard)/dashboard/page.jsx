'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import {
  getUserTransactionSummary,
  getUserTransactionDaily,
  getUserTransactionByCoin,
} from '@/lib/api/userTransactions'
import { formatUsd, formatChange, formatCompactCount } from '@/lib/utils/format'
import DailyTrendChart from '@/components/dashboard/DailyTrendChart'
import TransactionByCoinTable from '@/components/dashboard/TransactionByCoinTable'
import DateFilterBar from '@/components/dashboard/DateFilterBar'
import RefreshButton from '@/components/RefreshButton'
import { logger } from '@/lib/utils/logger'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { getDateRange } from '@/lib/utils/dateRange'

const iconBgMap = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
  danger: 'bg-danger-100 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400',
  warning: 'bg-warning-100 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
  info: 'bg-info-100 text-info-600 dark:bg-info-500/15 dark:text-info-400',
}

function SummaryItem({ title, value, change, icon, color = 'primary', valueColor, count, t }) {
  const numChange = typeof change === 'number' ? change : parseFloat(change)
  const isPositive = numChange >= 0
  const hasChange = change !== undefined && change !== null && !isNaN(numChange)

  const valueColorClass =
    valueColor === 'success' ? 'text-success-500' : valueColor === 'danger' ? 'text-danger-500' : 'text-surface-900 dark:text-surface-100'

  return (
    <div className="flex-1 min-w-0 px-5 py-5 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-surface-500 dark:text-surface-400 text-sm">{title}</span>
          <h3 className={`mb-0 text-2xl font-semibold leading-tight ${valueColorClass}`}>{value}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            {count !== undefined && count !== null && (
              <span className="text-surface-400 dark:text-surface-500 text-[0.8rem]">
                {formatCompactCount(count)} {t('userDashboard.txns', { defaultValue: 'orders' })}
              </span>
            )}
            {hasChange && (
              <span
                className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
                  isPositive
                    ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400'
                    : 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400'
                }`}
              >
                {isPositive ? '+' : ''}{formatChange(numChange)}
              </span>
            )}
          </div>
        </div>
        <div
          className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ${iconBgMap[color] || iconBgMap.primary}`}
        >
          <i className={`bx ${icon} text-xl`}></i>
        </div>
      </div>
    </div>
  )
}

export default function UserTransactionsDashboard() {
  const { t, i18n } = useTranslation()
  const { token, user } = useAuth()

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
      setDailyData(
        items.map((item) => ({
          date: item.date,
          deposit: parseFloat(item.depositUsd || 0),
          withdrawal: parseFloat(item.withdrawalUsd || 0),
          netFlow: parseFloat(item.netFlowUsd || 0),
        }))
      )
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
  const counts = current.counts || {}

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center mb-6 gap-3">
        <h4 className="text-xl font-semibold text-surface-900 mb-0">
          <i className="bx bx-bar-chart-alt-2 text-primary-600 mr-2"></i>
          {t('nav.dashboard', { defaultValue: 'Dashboard' })}
        </h4>
        <RefreshButton onClick={loadData} loading={loadingSummary || loadingDaily || loadingByCoin} />
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

      {error && (
        <div className="rounded-lg bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400 px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* KPI Summary Cards */}
      {loadingSummary ? (
        <div className="flex justify-center py-10 mb-6">
          <Spinner size="lg" className="text-primary-600" />
        </div>
      ) : (
        <div className="mb-6">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-stretch">
              <SummaryItem
                title={t('userDashboard.deposits', { defaultValue: 'Deposits' })}
                value={formatUsd(current.totalDepositUsd)}
                change={changes.depositPercent}
                count={counts.deposits}
                icon="bx-wallet"
                color="primary"
                t={t}
              />
              <div className="hidden sm:flex items-center"><div className="w-px h-3/5 bg-surface-200 dark:bg-surface-300" /></div>
              <div className="sm:hidden mx-5"><div className="h-px bg-surface-200 dark:bg-surface-300" /></div>
              <SummaryItem
                title={t('userDashboard.withdrawals', { defaultValue: 'Withdrawals' })}
                value={formatUsd(current.totalWithdrawalUsd)}
                change={changes.withdrawalPercent}
                count={counts.withdrawals}
                icon="bx-transfer-alt"
                color="danger"
                t={t}
              />
              <div className="hidden sm:flex items-center"><div className="w-px h-3/5 bg-surface-200 dark:bg-surface-300" /></div>
              <div className="sm:hidden mx-5"><div className="h-px bg-surface-200 dark:bg-surface-300" /></div>
              <SummaryItem
                title={t('userDashboard.feesCollected', { defaultValue: 'Fees Collected' })}
                value={formatUsd(current.totalFeeUsd)}
                change={changes.feePercent}
                count={counts.fees}
                icon="bx-dollar-circle"
                color="warning"
                t={t}
              />
              <div className="hidden sm:flex items-center"><div className="w-px h-3/5 bg-surface-200 dark:bg-surface-300" /></div>
              <div className="sm:hidden mx-5"><div className="h-px bg-surface-200 dark:bg-surface-300" /></div>
              <SummaryItem
                title={t('userDashboard.netFlow', { defaultValue: 'Net Flow' })}
                value={formatUsd(current.netFlowUsd)}
                change={changes.netFlowPercent}
                icon="bx-line-chart"
                color="info"
                valueColor={(() => {
                  const nf = parseFloat(current.netFlowUsd || 0)
                  return nf > 0 ? 'success' : nf < 0 ? 'danger' : undefined
                })()}
                t={t}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Daily Trend Chart */}
      <div className="mb-6">
        <Card>
          <div className="px-6 py-4 border-b border-surface-200">
            <h5 className="text-base font-semibold text-surface-900 mb-0">
              <i className="bx bx-bar-chart-alt-2 text-primary-600 mr-2"></i>
              {t('userDashboard.dailyTrend', { defaultValue: 'Daily Trend Chart' })}
            </h5>
          </div>
          <div className="p-6">
            {loadingDaily ? (
              <div className="flex justify-center py-10">
                <Spinner size="lg" className="text-primary-600" />
              </div>
            ) : (
              <DailyTrendChart data={dailyData} meta={dailyMeta} height={300} locale={locale} t={t} />
            )}
          </div>
        </Card>
      </div>

      {/* Transaction by Coin */}
      <div className="mb-6">
        <TransactionByCoinTable byCoinData={byCoinData} loading={loadingByCoin} t={t} />
      </div>
    </>
  )
}
