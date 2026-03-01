'use client'

import { formatUsdAuto as formatUsd, formatPercent } from '@/lib/utils/format'

/**
 * Helper: returns color-related classname and style props based on a numeric value.
 */
function valueColor(value) {
  const n = parseFloat(value)
  if (n === 0) return { cls: 'text-muted', bgStyle: 'rgba(168,170,174,0.1)', cssColor: 'var(--bs-secondary-color)' }
  if (n > 0) return { cls: 'text-success', bgStyle: 'rgba(40, 199, 111, 0.1)', cssColor: 'var(--bs-success)' }
  return { cls: 'text-danger', bgStyle: 'rgba(234, 84, 85, 0.1)', cssColor: 'var(--bs-danger)' }
}

function RevenueCard({ revenueItems, deductionItems, netRevenue }) {
  return (
    <div className="col-md-6 mb-4">
      <div className="card h-100">
        <div className="card-header d-flex align-items-center">
          <i className="bx bx-trending-up text-success me-2 fs-4"></i>
          <h5 className="mb-0">REVENUE</h5>
        </div>
        <div className="card-body">
          <table className="table table-borderless mb-0">
            <tbody>
              {revenueItems.map((item) => (
                <tr key={item.code}>
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

              <tr style={{ borderTop: '2px solid var(--bs-border-color)' }}>
                <td className="fw-bold">Net Revenue</td>
                <td className={`text-end fw-bold fs-5 ${valueColor(netRevenue).cls}`} style={{ whiteSpace: 'nowrap' }}>{formatUsd(netRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ExpensesCard({ expenseItems, totalExpenses }) {
  return (
    <div className="col-md-6 mb-4">
      <div className="card h-100">
        <div className="card-header d-flex align-items-center">
          <i className="bx bx-trending-down text-danger me-2 fs-4"></i>
          <h5 className="mb-0">EXPENSES</h5>
        </div>
        <div className="card-body">
          <table className="table table-borderless mb-0">
            <tbody>
              {expenseItems.map((item) => (
                <tr key={item.code}>
                  <td>
                    <span className="badge bg-label-danger me-2">{item.code}</span>
                    <span>{item.name || item.code}</span>
                  </td>
                  <td className="text-end fw-medium" style={{ whiteSpace: 'nowrap' }}>{formatUsd(item.amountUsd)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--bs-border-color)' }}>
                <td className="fw-bold">Total Expenses</td>
                <td className={`text-end fw-bold fs-5 ${valueColor(totalExpenses).cls}`} style={{ whiteSpace: 'nowrap' }}>({formatUsd(totalExpenses)})</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function OperatingIncomeCard({ operatingIncome, profitMargin }) {
  const oi = valueColor(operatingIncome)
  const pm = valueColor(profitMargin)
  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-md-6">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 p-3" style={{ backgroundColor: oi.bgStyle }}>
                <i className={`bx ${parseFloat(operatingIncome) === 0 ? 'bx-minus-circle' : parseFloat(operatingIncome) > 0 ? 'bx-trending-up' : 'bx-trending-down'} fs-1`} style={{ color: oi.cssColor }}></i>
              </div>
              <div>
                <h6 className="text-muted mb-1">OPERATING INCOME</h6>
                <h2 className={`mb-0 fw-bold ${oi.cls}`}>
                  {formatUsd(operatingIncome)}
                </h2>
              </div>
            </div>
          </div>
          <div className="col-md-6 text-md-end mt-3 mt-md-0">
            <h6 className="text-muted mb-1">Profit Margin</h6>
            <h2 className={`mb-0 fw-bold ${pm.cls}`}>
              {formatPercent(profitMargin)}
            </h2>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdjustmentsCard({ adjustIncrease, adjustDecrease, netAdjustment }) {
  if (adjustIncrease.length === 0 && adjustDecrease.length === 0) return null
  return (
    <div className="card mb-4">
      <div className="card-header d-flex align-items-center">
        <i className="bx bx-transfer-alt text-info me-2 fs-4"></i>
        <h5 className="mb-0">ADJUSTMENTS <small className="text-muted fw-normal">(Non-operating)</small></h5>
      </div>
      <div className="card-body">
        <table className="table table-borderless mb-0">
          <tbody>
            {adjustIncrease.length > 0 && (
              <>
                <tr><td colSpan="2" className="pb-0 pt-0"><small className="text-muted fw-semibold">INCREASES</small></td></tr>
                {adjustIncrease.map((item, i) => (
                  <tr key={`ai-${i}`}>
                    <td>
                      <span className="badge bg-label-success me-2">{item.code}</span>
                      <span>{item.name || item.code}</span>
                      <small className="text-muted ms-2">({item.entries || 0} entries)</small>
                    </td>
                    <td className="text-end fw-medium text-success" style={{ whiteSpace: 'nowrap' }}>+{formatUsd(item.amountUsd)}</td>
                  </tr>
                ))}
              </>
            )}
            {adjustDecrease.length > 0 && (
              <>
                <tr><td colSpan="2" className="pb-0 pt-2"><small className="text-muted fw-semibold">DECREASES</small></td></tr>
                {adjustDecrease.map((item, i) => (
                  <tr key={`ad-${i}`}>
                    <td>
                      <span className="badge bg-label-danger me-2">{item.code}</span>
                      <span>{item.name || item.code}</span>
                      <small className="text-muted ms-2">({item.entries || 0} entries)</small>
                    </td>
                    <td className="text-end fw-medium text-danger" style={{ whiteSpace: 'nowrap' }}>({formatUsd(item.amountUsd)})</td>
                  </tr>
                ))}
              </>
            )}
            <tr style={{ borderTop: '2px solid var(--bs-border-color)' }}>
              <td className="fw-bold">Net Adjustment</td>
              <td className={`text-end fw-bold fs-5 ${valueColor(netAdjustment).cls}`} style={{ whiteSpace: 'nowrap' }}>
                {parseFloat(netAdjustment) > 0 ? '+' : ''}{formatUsd(netAdjustment)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NetIncomeCard({ netIncome }) {
  const ni = valueColor(netIncome)
  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-3 p-3" style={{ backgroundColor: ni.bgStyle }}>
            <i className={`bx ${parseFloat(netIncome) === 0 ? 'bx-minus-circle' : parseFloat(netIncome) > 0 ? 'bx-wallet' : 'bx-error-circle'} fs-1`} style={{ color: ni.cssColor }}></i>
          </div>
          <div>
            <h6 className="text-muted mb-1">NET INCOME</h6>
            <h2 className={`mb-0 fw-bold ${ni.cls}`}>
              {formatUsd(netIncome)}
            </h2>
          </div>
        </div>
      </div>
    </div>
  )
}

function CountsCard({ allItems }) {
  return (
    <div className="card mb-4">
      <div className="card-body py-3">
        <div className="d-flex flex-wrap gap-4">
          {allItems.map((item) => (
            <div key={item.code} className="d-flex align-items-center gap-2">
              <span className="badge bg-label-secondary">{item.code}</span>
              <span className="text-muted">{item.name || item.code}:</span>
              <span className="fw-semibold">{item.entries || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Renders the full income statement report body (revenue, expenses, operating
 * income, adjustments, net income, and counts).
 */
export default function IncomeStatementReport({ report }) {
  // Extract report data safely (matches actual API response structure)
  const revenue = report?.revenue || {}
  const expenses = report?.expenses || {}

  const revenueItems = revenue?.items || []
  const deductionItems = revenue?.deductions || []
  const expenseItems = expenses?.items || []

  const netRevenue = revenue?.netRevenueUsd || 0
  const totalExpenses = expenses?.totalExpensesUsd || 0
  const operatingIncome = report?.operatingIncomeUsd || 0
  const netIncome = report?.netIncomeUsd || 0
  const profitMargin = report?.profitMarginPercent || 0

  const adjustments = report?.adjustments || {}
  const adjustIncrease = adjustments?.increases || []
  const adjustDecrease = adjustments?.decreases || []
  const netAdjustment = adjustments?.netAdjustmentUsd || 0

  const allItems = [...revenueItems, ...deductionItems, ...expenseItems, ...adjustIncrease, ...adjustDecrease]

  return (
    <>
      <div className="row">
        <RevenueCard revenueItems={revenueItems} deductionItems={deductionItems} netRevenue={netRevenue} />
        <ExpensesCard expenseItems={expenseItems} totalExpenses={totalExpenses} />
      </div>

      <OperatingIncomeCard operatingIncome={operatingIncome} profitMargin={profitMargin} />

      <AdjustmentsCard adjustIncrease={adjustIncrease} adjustDecrease={adjustDecrease} netAdjustment={netAdjustment} />

      <NetIncomeCard netIncome={netIncome} />

      <CountsCard allItems={allItems} />
    </>
  )
}
