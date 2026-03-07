'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/app/providers'
import { getIncomeStatement } from '@/lib/api/admin'
import { getDateRange } from '@/lib/utils/dateRange'
import DateFilterBar from '@/components/dashboard/DateFilterBar'
import IncomeStatementReport from '@/components/ledger/IncomeStatementReport'
import { logger } from '@/lib/utils/logger'
import CardEmptyState from '@/components/CardEmptyState'
import Card from '@/components/ui/Card'

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
  const { token, user } = useAuth()
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
            </div>
          </Card>

          {/* Report with data */}
          {report && hasData && <IncomeStatementReport report={report} t={t} />}

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
