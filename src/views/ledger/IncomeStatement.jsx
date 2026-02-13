import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getIncomeStatement } from '../../api/admin.ts'
import LocaleDatePicker from '../../components/LocaleDatePicker'

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

export default function IncomeStatement() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

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
    const fromD = new Date(from + 'T00:00:00')
    const toD = new Date(to + 'T00:00:00')
    const fmt = (d) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    return `${fmt(fromD)} - ${fmt(toD)}`
  }, [dateRange, locale])

  async function loadReport() {
    if (!fromDate || !toDate) {
      toast.error('From and To dates are required')
      return
    }
    try {
      setLoading(true)
      const params = { from: fromDate, to: toDate }
      if (coinNetworkId) params.coinNetworkId = Number(coinNetworkId)
      const data = await getIncomeStatement(token, params)
      setReport(data)
    } catch (error) {
      console.error('Failed to load income statement:', error)
      toast.error(t('admin.incomeStatement.loadError', { defaultValue: 'Failed to load income statement' }))
    } finally {
      setLoading(false)
    }
  }

  function formatUsd(val) {
    if (val === null || val === undefined) return '$0.00'
    const num = typeof val === 'string' ? parseFloat(val) : val
    if (isNaN(num)) return '$0.00'
    let decimals
    const abs = Math.abs(num)
    if (abs === 0) decimals = 2
    else if (abs < 0.01) decimals = 8
    else if (abs < 1) decimals = 4
    else decimals = 2
    const prefix = num < 0 ? '-$' : '$'
    const minD = Math.min(2, decimals)
    return prefix + Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: minD, maximumFractionDigits: Math.max(minD, decimals) })
  }

  function formatPercent(val) {
    if (!val && val !== 0) return '0.00%'
    return parseFloat(val).toFixed(2) + '%'
  }

  // Extract report data safely (matches actual API response structure)
  const revenue = report?.revenue || {}
  const expenses = report?.expenses || {}

  // Revenue items
  const revenueItems = revenue?.items || []

  // Deductions are nested inside revenue
  const deductionItems = revenue?.deductions || []

  // Expense items
  const expenseItems = expenses?.items || []

  // Use totals from API
  const grossRevenue = revenue?.grossRevenueUsd || 0
  const totalDeductions = revenue?.deductionsUsd || 0
  const netRevenue = revenue?.netRevenueUsd || 0
  const totalExpenses = expenses?.totalExpensesUsd || 0
  const netIncome = report?.netIncomeUsd || 0
  const profitMargin = report?.profitMarginPercent || 0

  // Check if report has any actual data
  const hasData = revenueItems.length > 0 || deductionItems.length > 0 || expenseItems.length > 0

  // Auto-load report when date range changes
  useEffect(() => {
    if (token && fromDate && toDate) {
      loadReport()
    }
  }, [token, fromDate, toDate, coinNetworkId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex flex-wrap align-items-center gap-3">
                <h4 className="mb-0">
                  <i className="bx bx-line-chart text-primary me-2"></i>
                  {t('admin.incomeStatement.title', { defaultValue: 'Income Statement' })}
                </h4>
                <div className="d-flex gap-2 flex-wrap align-items-center ms-auto">
                  <span className="badge bg-label-secondary fs-6 fw-normal px-3 py-2">
                    {dateRangeLabel}
                  </span>
                  {!showCustom ? (
                    <>
                      <select
                        className="form-select form-select-sm"
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
                        className="btn btn-sm btn-outline-secondary"
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
                        className="btn btn-outline-secondary btn-sm"
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
            </div>
          </div>

          {/* Report with data */}
          {report && hasData && (
            <>
              {/* Title Card */}
              <div className="card mb-4">
                <div className="card-body text-center py-4">
                  <h5 className="fw-bold mb-1">BULLPAY — INCOME STATEMENT</h5>
                  <h6 className="text-muted mb-0">Period: {fromDate} to {toDate}</h6>
                </div>
              </div>

              <div className="row">
                {/* Revenue Section */}
                <div className="col-md-6 mb-4">
                  <div className="card h-100">
                    <div className="card-header d-flex align-items-center">
                      <i className="bx bx-trending-up text-success me-2 fs-4"></i>
                      <h5 className="mb-0">REVENUE</h5>
                    </div>
                    <div className="card-body">
                      <table className="table table-borderless mb-0">
                        <tbody>
                          {revenueItems.map((item, i) => (
                            <tr key={i}>
                              <td>
                                <span className="badge bg-label-primary me-2">{item.code}</span>
                                <span>{item.name || item.code}</span>
                              </td>
                              <td className="text-end fw-medium" style={{ whiteSpace: 'nowrap' }}>{formatUsd(item.amountUsd)}</td>
                            </tr>
                          ))}

                          {/* Deductions */}
                          {deductionItems.length > 0 && (
                            <>
                              <tr><td colSpan="2" className="pb-0 pt-2"><small className="text-muted fw-semibold">DEDUCTIONS</small></td></tr>
                              {deductionItems.map((item, i) => (
                                <tr key={`d-${i}`}>
                                  <td>
                                    <span className="badge bg-label-warning me-2">{item.code}</span>
                                    <span>{item.name || item.code}</span>
                                  </td>
                                  <td className="text-end fw-medium text-danger" style={{ whiteSpace: 'nowrap' }}>({formatUsd(item.amountUsd)})</td>
                                </tr>
                              ))}
                            </>
                          )}

                          <tr style={{ borderTop: '2px solid #e9ecef' }}>
                            <td className="fw-bold">Net Revenue</td>
                            <td className={`text-end fw-bold fs-5 ${parseFloat(netRevenue) === 0 ? 'text-muted' : 'text-success'}`} style={{ whiteSpace: 'nowrap' }}>{formatUsd(netRevenue)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div className="col-md-6 mb-4">
                  <div className="card h-100">
                    <div className="card-header d-flex align-items-center">
                      <i className="bx bx-trending-down text-danger me-2 fs-4"></i>
                      <h5 className="mb-0">EXPENSES</h5>
                    </div>
                    <div className="card-body">
                      <table className="table table-borderless mb-0">
                        <tbody>
                          {expenseItems.map((item, i) => (
                            <tr key={i}>
                              <td>
                                <span className="badge bg-label-danger me-2">{item.code}</span>
                                <span>{item.name || item.code}</span>
                              </td>
                              <td className="text-end fw-medium" style={{ whiteSpace: 'nowrap' }}>{formatUsd(item.amountUsd)}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: '2px solid #e9ecef' }}>
                            <td className="fw-bold">Total Expenses</td>
                            <td className={`text-end fw-bold fs-5 ${parseFloat(totalExpenses) === 0 ? 'text-muted' : 'text-danger'}`} style={{ whiteSpace: 'nowrap' }}>({formatUsd(totalExpenses)})</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Income Summary */}
              <div className="card mb-4">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 p-3" style={{ backgroundColor: parseFloat(netIncome) === 0 ? 'rgba(168,170,174,0.1)' : parseFloat(netIncome) > 0 ? 'rgba(40, 199, 111, 0.1)' : 'rgba(234, 84, 85, 0.1)' }}>
                          <i className={`bx ${parseFloat(netIncome) === 0 ? 'bx-minus-circle' : parseFloat(netIncome) > 0 ? 'bx-trending-up' : 'bx-trending-down'} fs-1`} style={{ color: parseFloat(netIncome) === 0 ? '#a8aaae' : parseFloat(netIncome) > 0 ? '#28c76f' : '#ea5455' }}></i>
                        </div>
                        <div>
                          <h6 className="text-muted mb-1">NET INCOME (Gross Profit)</h6>
                          <h2 className={`mb-0 fw-bold ${parseFloat(netIncome) === 0 ? 'text-muted' : parseFloat(netIncome) > 0 ? 'text-success' : 'text-danger'}`}>
                            {formatUsd(netIncome)}
                          </h2>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 text-md-end mt-3 mt-md-0">
                      <h6 className="text-muted mb-1">Profit Margin</h6>
                      <h2 className={`mb-0 fw-bold ${parseFloat(profitMargin) === 0 ? 'text-muted' : parseFloat(profitMargin) > 0 ? 'text-success' : 'text-danger'}`}>
                        {formatPercent(profitMargin)}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Counts */}
              <div className="card mb-4">
                <div className="card-body py-3">
                  <div className="d-flex flex-wrap gap-4">
                    {[...revenueItems, ...deductionItems, ...expenseItems].map((item, i) => (
                      <div key={i} className="d-flex align-items-center gap-2">
                        <span className="badge bg-label-secondary">{item.code}</span>
                        <span className="text-muted">{item.name || item.code}:</span>
                        <span className="fw-semibold">{item.entries || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </>
          )}

          {/* Empty state - no data for this period */}
          {report && !hasData && !loading && (
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="mb-3">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 80, height: 80, backgroundColor: 'rgba(168,170,174,0.1)' }}>
                    <i className="bx bx-bar-chart-alt-2" style={{ fontSize: '2.5rem', color: '#a8aaae' }}></i>
                  </div>
                </div>
                <h5 className="mb-2">No transactions found</h5>
                <p className="text-muted mb-3" style={{ maxWidth: 400, margin: '0 auto' }}>
                  There are no revenue or expense records for the period <strong>{fromDate}</strong> to <strong>{toDate}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Empty state - no report loaded */}
          {!report && !loading && (
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="mb-3">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 80, height: 80, backgroundColor: 'rgba(105,108,255,0.08)' }}>
                    <i className="bx bx-line-chart" style={{ fontSize: '2.5rem', color: '#696cff' }}></i>
                  </div>
                </div>
                <h5 className="mb-2">Select a date range</h5>
                <p className="text-muted mb-0" style={{ maxWidth: 400, margin: '0 auto' }}>
                  Choose the period you want to view the Income Statement for.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
