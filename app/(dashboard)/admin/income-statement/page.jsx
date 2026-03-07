'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/app/providers'
import { getIncomeStatement } from '@/lib/api/admin'
import LocaleDatePicker from '@/components/LocaleDatePicker'
import { getDateRange } from '@/components/ledger/incomeStatementUtils'
import IncomeStatementReport from '@/components/ledger/IncomeStatementReport'
import { logger } from '@/lib/utils/logger'
import CardEmptyState from '@/components/CardEmptyState'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'

function hasReportData(report) {
  if (!report) return false
  const revenue = report.revenue || {}
  const expenses = report.expenses || {}
  const adjustments = report.adjustments || {}
  return (
    (revenue.items?.length || 0) > 0 ||
    (revenue.deductions?.length || 0) > 0 ||
    (expenses.items?.length || 0) > 0 ||
    (adjustments.increases?.length || 0) > 0 ||
    (adjustments.decreases?.length || 0) > 0
  )
}

export default function IncomeStatement() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const locale = useLocale()

  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)

  // Date filters
  const [datePreset, setDatePreset] = useState('thisMonth')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [coinNetworkId, setCoinNetworkId] = useState('')

  const dateRange = useMemo(() => {
    if (showCustom && customFrom && customTo) {
      return { from: customFrom, to: customTo }
    }
    return getDateRange(datePreset)
  }, [datePreset, showCustom, customFrom, customTo])

  const fromDate = dateRange.from
  const toDate = dateRange.to

  const dateRangeLabel = useMemo(() => {
    const { from, to } = dateRange
    if (from === to) return from
    const fromD = new Date(`${from}T00:00:00`)
    const toD = new Date(`${to}T00:00:00`)
    const fmt = (d) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    return `${fmt(fromD)} - ${fmt(toD)}`
  }, [dateRange, locale])

  const loadReport = useCallback(async () => {
    if (!fromDate || !toDate) {
      toast.error(t('admin.incomeStatement.datesRequired', { defaultValue: 'From and To dates are required' }))
      return
    }
    try {
      setLoading(true)
      const params = { from: fromDate, to: toDate }
      if (coinNetworkId) params.coinNetworkId = Number(coinNetworkId)
      const data = await getIncomeStatement(token, params)
      setReport(data)
    } catch (error) {
      logger.error('Failed to load income statement:', error)
      toast.error(t('admin.incomeStatement.loadError', { defaultValue: 'Failed to load income statement' }))
    } finally {
      setLoading(false)
    }
  }, [token, fromDate, toDate, coinNetworkId, t, toast])

  const hasData = hasReportData(report)

  // Auto-load report when date range changes
  useEffect(() => {
    if (token && fromDate && toDate) {
      loadReport()
    }
  }, [token, fromDate, toDate, coinNetworkId, loadReport])

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Header */}
          <Card className="mb-4">
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <h4 className="mb-0">
                  <i className="bx bx-line-chart text-primary mr-2"></i>
                  {t('admin.incomeStatement.title', { defaultValue: 'Income Statement' })}
                </h4>
                <div className="flex gap-2 flex-wrap items-center ml-auto">
                  <Badge color="secondary" className="text-base font-normal px-3 py-2">
                    {dateRangeLabel}
                  </Badge>
                  {!showCustom ? (
                    <>
                      <Select value={datePreset} onChange={(e) => setDatePreset(e.target.value)} className="w-auto">
                        <option value="today">{t('filter.today', { defaultValue: 'Today' })}</option>
                        <option value="yesterday">{t('filter.yesterday', { defaultValue: 'Yesterday' })}</option>
                        <option value="last7days">{t('filter.last7days', { defaultValue: 'Last 7 Days' })}</option>
                        <option value="last30days">{t('filter.last30days', { defaultValue: 'Last 30 Days' })}</option>
                        <option value="thisMonth">{t('filter.thisMonth', { defaultValue: 'This Month' })}</option>
                        <option value="lastMonth">{t('filter.lastMonth', { defaultValue: 'Last Month' })}</option>
                      </Select>
                      <Button onClick={() => setShowCustom(true)} variant="outline-secondary">
                        <i className="bx bx-calendar mr-1"></i>
                        {t('filter.custom', { defaultValue: 'Custom' })}
                      </Button>
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
                        minDate={
                          customTo
                            ? (() => {
                                const d = new Date(`${customTo}T00:00:00`)
                                d.setMonth(d.getMonth() - 2)
                                return d.toISOString().split('T')[0]
                              })()
                            : undefined
                        }
                      />

                      <span className="self-center">–</span>
                      <LocaleDatePicker
                        value={customTo}
                        onChange={setCustomTo}
                        locale={locale}
                        placeholder={t('filter.to', { defaultValue: 'To' })}
                        t={t}
                        minDate={customFrom ? customFrom : undefined}
                        maxDate={
                          customFrom
                            ? (() => {
                                const d = new Date(`${customFrom}T00:00:00`)
                                d.setMonth(d.getMonth() + 2)
                                return d.toISOString().split('T')[0]
                              })()
                            : undefined
                        }
                      />

                      <Button
                        onClick={() => {
                          setShowCustom(false)
                          setCustomFrom('')
                          setCustomTo('')
                        }}
                        variant="outline-secondary"
                      >
                        <i className="bx bx-reset mr-1"></i>
                        {t('filter.reset', { defaultValue: 'Reset' })}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Report with data */}
          {report && hasData && <IncomeStatementReport report={report} />}

          {/* Empty state - no data for this period */}
          {report && !hasData && !loading && (
            <Card>
              <div className="p-5">
                <CardEmptyState
                  icon="bx-bar-chart-alt-2"
                  message={t('admin.incomeStatement.noTransactions', { defaultValue: 'No transactions found' })}
                  sub={`There are no revenue or expense records for the period ${fromDate} to ${toDate}.`}
                />
              </div>
            </Card>
          )}

          {/* Empty state - no report loaded */}
          {!report && !loading && (
            <Card>
              <div className="p-5">
                <CardEmptyState
                  icon="bx-line-chart"
                  message="Select a date range"
                  sub="Choose the period you want to view the Income Statement for."
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
