'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import { getUserTransactionSummary, getUserTransactionDaily, getUserTransactionByCoin } from '@/lib/api/userTransactions'
import LocaleDatePicker from '@/components/LocaleDatePicker'
import { formatUsd, formatChange } from '@/lib/utils/format'
import DailyTrendChart from '@/components/dashboard/DailyTrendChart'
import TransactionByCoinTable from '@/components/dashboard/TransactionByCoinTable'
import RefreshButton from '@/components/RefreshButton'
import { logger } from '@/lib/utils/logger'

const summaryValueStyle = { fontSize: '1.75rem' }
const changeTextStyle = { fontSize: '0.8rem' }

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

function SummaryCard({ title, value, change, icon, color = 'primary', valueColor, t }) {
  const numChange = typeof change === 'number' ? change : parseFloat(change)
  const isPositive = numChange >= 0
  const changeColor = isPositive ? 'text-success' : 'text-danger'
  const changeIcon = isPositive ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt'

  return (
    <div className="col-6 col-xl-3">
      <div className="card h-100">
        <div className="card-body">
          <div className="d-flex align-items-start justify-content-between">
            <div className="content-left">
              <span className="text-muted form-label">{title}</span>
              <h3 className={`mb-0${valueColor ? ` text-${valueColor}` : ''}`} style={summaryValueStyle}>{value}</h3>
              {change !== undefined && change !== null && !isNaN(numChange) && (
                <small className={changeColor} style={changeTextStyle}>
                  <i className={`bx ${changeIcon}`}></i>
                  {formatChange(numChange)} {t ? t('userDashboard.vsPrev', { defaultValue: 'vs prev' }) : 'vs prev'}
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
    const fromDate = new Date(from + 'T00:00:00')
    const toDate = new Date(to + 'T00:00:00')
    const fmtDate = (d) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    return `${fmtDate(fromDate)} - ${fmtDate(toDate)}`
  }, [dateRange, locale])

  const loadData = async () => {
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

    // Summary
    if (summaryResult.status === 'fulfilled') {
      setSummary(summaryResult.value)
    } else {
      logger.error('Failed to load transaction summary:', summaryResult.reason)
      setError(summaryResult.reason?.message || 'Failed to load summary')
    }
    setLoadingSummary(false)

    // Daily
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

    // By coin
    if (byCoinResult.status === 'fulfilled') {
      const res = byCoinResult.value
      setByCoinData(res?.items || res || [])
    } else {
      logger.error('Failed to load by-coin data:', byCoinResult.reason)
    }
    setLoadingByCoin(false)
  }

  useEffect(() => {
    loadData()
  }, [token, dateRange])


  const current = summary?.current || {}
  const previous = summary?.previous || {}
  const changes = summary?.changes || {}
  const counts = current?.counts || {}

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center mb-4 gap-3">
        <h4 className="mb-0">
          <i className="bx bx-bar-chart-alt-2 text-primary me-2"></i>
          {t('nav.dashboard', { defaultValue: 'Dashboard' })}
        </h4>
        <RefreshButton onClick={loadData} loading={loadingSummary || loadingDaily || loadingByCoin} />
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
              <span className="align-self-center">&ndash;</span>
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
            value={formatCurrencyPlain(current.netFlowUsd)}
            change={changes.netFlowPercent}
            icon="bx-line-chart"
            color="info"
            valueColor={(() => { const nf = parseFloat(current.netFlowUsd || 0); return nf > 0 ? 'success' : nf < 0 ? 'danger' : undefined })()}
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
          <TransactionByCoinTable byCoinData={byCoinData} loading={loadingByCoin} t={t} />
        </div>
      </div>
    </div>
  )
}
