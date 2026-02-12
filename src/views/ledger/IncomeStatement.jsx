import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { getIncomeStatement } from '../../api/admin.ts'

export default function IncomeStatement() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()

  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)

  // Date filters (required)
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [fromDate, setFromDate] = useState(firstOfMonth.toISOString().split('T')[0])
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0])
  const [coinNetworkId, setCoinNetworkId] = useState('')

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
    if (!val && val !== 0) return '$0.00'
    const num = parseFloat(val)
    return '$' + Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
  const grossRevenue = revenue?.grossRevenueUsd || 0

  // Deductions are nested inside revenue
  const deductionItems = revenue?.deductions || []
  const totalDeductions = revenue?.deductionsUsd || 0

  // Net Revenue
  const netRevenue = revenue?.netRevenueUsd || 0

  // Expense items
  const expenseItems = expenses?.items || []
  const totalExpenses = expenses?.totalExpensesUsd || 0

  // Net Income & Profit Margin at root level
  const netIncome = report?.netIncomeUsd || 0
  const profitMargin = report?.profitMarginPercent || 0

  // Compute counts from revenue/expense items
  const allItems = [...revenueItems, ...deductionItems, ...expenseItems]
  function getItemEntries(code) {
    const item = allItems.find(i => i.code === code)
    return item?.entries ?? 0
  }
  function getItemAmountUsd(code) {
    const item = allItems.find(i => i.code === code)
    return item?.amountUsd ?? 0
  }

  // Volume from expense items (SG = sweep gas, WG = withdrawal gas)
  const sweepVolumeUsd = getItemAmountUsd('SG')
  const withdrawalVolumeUsd = getItemAmountUsd('WG')

  // Counts from items
  const sweepCount = getItemEntries('SG')
  const withdrawalCount = getItemEntries('WG') + getItemEntries('WF')
  const gasTopupCount = getItemEntries('SG')
  const adjustmentCount = getItemEntries('XI') + getItemEntries('XO')

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-line-chart me-2"></i>
                    {t('admin.incomeStatement.title', { defaultValue: 'Income Statement' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.incomeStatement.description', { defaultValue: 'Profit & Loss report for the platform' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">From Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">To Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label small mb-1">Coin Network ID</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Optional"
                    value={coinNetworkId}
                    onChange={(e) => setCoinNetworkId(e.target.value)}
                  />
                </div>
                <div className="col-md-3 col-sm-6">
                  <button className="btn btn-primary btn-sm w-100" onClick={loadReport} disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-1"></span>Loading...</>
                    ) : (
                      <><i className="bx bx-search me-1"></i>Generate Report</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Report */}
          {report && (
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
                          {revenueItems.length > 0 ? (
                            revenueItems.map((item, i) => (
                              <tr key={i}>
                                <td>
                                  <span className="badge bg-label-primary me-2">{item.code}</span>
                                  <span>{item.name || item.code}</span>
                                  {item.entries && <small className="text-muted ms-1">({item.entries})</small>}
                                </td>
                                <td className="text-end fw-medium">{formatUsd(item.amountUsd)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="text-muted" colSpan="2">No revenue items</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Deductions */}
                      {deductionItems.length > 0 && (
                        <>
                          <hr className="my-2" />
                          <small className="text-muted fw-semibold">DEDUCTIONS</small>
                          <table className="table table-borderless mb-0">
                            <tbody>
                              {deductionItems.map((item, i) => (
                                <tr key={i}>
                                  <td>
                                    <span className="badge bg-label-warning me-2">{item.code}</span>
                                    <span>{item.name || item.code}</span>
                                    {item.entries && <small className="text-muted ms-1">({item.entries})</small>}
                                  </td>
                                  <td className="text-end fw-medium text-danger">({formatUsd(item.amountUsd)})</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </>
                      )}

                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Net Revenue</span>
                        <span className="fw-bold text-success fs-5">{formatUsd(netRevenue)}</span>
                      </div>
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
                          {expenseItems.length > 0 ? (
                            expenseItems.map((item, i) => (
                              <tr key={i}>
                                <td>
                                  <span className="badge bg-label-danger me-2">{item.code}</span>
                                  <span>{item.name || item.code}</span>
                                  {item.entries && <small className="text-muted ms-1">({item.entries})</small>}
                                </td>
                                <td className="text-end fw-medium">{formatUsd(item.amountUsd)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="text-muted" colSpan="2">No expense items</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Total Expenses</span>
                        <span className="fw-bold text-danger fs-5">({formatUsd(totalExpenses)})</span>
                      </div>
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
                        <div className="rounded-3 p-3" style={{ backgroundColor: parseFloat(netIncome) >= 0 ? 'rgba(40, 199, 111, 0.1)' : 'rgba(234, 84, 85, 0.1)' }}>
                          <i className={`bx ${parseFloat(netIncome) >= 0 ? 'bx-trending-up' : 'bx-trending-down'} fs-1`} style={{ color: parseFloat(netIncome) >= 0 ? '#28c76f' : '#ea5455' }}></i>
                        </div>
                        <div>
                          <h6 className="text-muted mb-1">NET INCOME (Gross Profit)</h6>
                          <h2 className={`mb-0 fw-bold ${parseFloat(netIncome) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatUsd(netIncome)}
                          </h2>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 text-md-end mt-3 mt-md-0">
                      <h6 className="text-muted mb-1">Profit Margin</h6>
                      <h2 className={`mb-0 fw-bold ${parseFloat(profitMargin) >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatPercent(profitMargin)}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>

              {/* Volume & Counts (informational) */}
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bx bx-bar-chart me-2"></i>
                    Volume & Counts
                    <small className="text-muted ms-2">(informational — not P&L)</small>
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-4">
                    <div className="col-md-3 col-sm-6">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 p-2" style={{ backgroundColor: 'rgba(115, 103, 240, 0.1)' }}>
                          <i className="bx bx-transfer fs-4" style={{ color: '#7367f0' }}></i>
                        </div>
                        <div>
                          <small className="text-muted">Sweep Volume</small>
                          <div className="fw-bold">{formatUsd(sweepVolumeUsd)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 p-2" style={{ backgroundColor: 'rgba(255, 159, 67, 0.1)' }}>
                          <i className="bx bx-money-withdraw fs-4" style={{ color: '#ff9f43' }}></i>
                        </div>
                        <div>
                          <small className="text-muted">Withdrawal Volume</small>
                          <div className="fw-bold">{formatUsd(withdrawalVolumeUsd)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 p-2" style={{ backgroundColor: 'rgba(0, 207, 232, 0.1)' }}>
                          <i className="bx bx-hash fs-4" style={{ color: '#00cfe8' }}></i>
                        </div>
                        <div>
                          <small className="text-muted">Sweeps</small>
                          <div className="fw-bold">{sweepCount}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 p-2" style={{ backgroundColor: 'rgba(234, 84, 85, 0.1)' }}>
                          <i className="bx bx-hash fs-4" style={{ color: '#ea5455' }}></i>
                        </div>
                        <div>
                          <small className="text-muted">Withdrawals</small>
                          <div className="fw-bold">{withdrawalCount}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 p-2" style={{ backgroundColor: 'rgba(40, 199, 111, 0.1)' }}>
                          <i className="bx bx-gas-pump fs-4" style={{ color: '#28c76f' }}></i>
                        </div>
                        <div>
                          <small className="text-muted">Gas Topups</small>
                          <div className="fw-bold">{gasTopupCount}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 p-2" style={{ backgroundColor: 'rgba(168, 170, 174, 0.1)' }}>
                          <i className="bx bx-adjust fs-4" style={{ color: '#a8aaae' }}></i>
                        </div>
                        <div>
                          <small className="text-muted">Adjustments</small>
                          <div className="fw-bold">{adjustmentCount}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {!report && !loading && (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bx bx-line-chart" style={{ fontSize: '4rem', color: '#ccc' }}></i>
                <h5 className="text-muted mt-3">Select a date range and generate report</h5>
                <p className="text-muted">Choose the period you want to view the Income Statement for.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
