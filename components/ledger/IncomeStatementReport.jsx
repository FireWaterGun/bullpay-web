'use client'

import { formatUsdAuto as formatUsd, formatPercent } from '@/lib/utils/format'
import Badge from '../ui/Badge'
import Card from '../ui/Card'

/**
 * Helper: returns color-related classname and style props based on a numeric value.
 */
function valueColor(value) {
  const n = parseFloat(value)
  if (n === 0) {
    return { cls: 'text-surface-500', bgStyle: 'rgba(168,170,174,0.1)', cssColor: 'var(--color-surface-500)' }
  }
  if (n > 0) return { cls: 'text-success', bgStyle: 'rgba(40, 199, 111, 0.1)', cssColor: 'var(--color-green-500)' }
  return { cls: 'text-danger', bgStyle: 'rgba(234, 84, 85, 0.1)', cssColor: 'var(--color-red-500)' }
}

function RevenueCard({ revenueItems, deductionItems, netRevenue, t }) {
  return (
    <div className="col-span-12 md:col-span-6 mb-4">
      <Card className="h-full">
        <div className="px-5 py-4 border-b border-surface-200 flex items-center">
          <i className="bx bx-trending-up text-success mr-2 text-2xl"></i>
          <h5 className="mb-0">{t?.('admin.incomeStatement.revenue', { defaultValue: 'REVENUE' }) || 'REVENUE'}</h5>
        </div>
        <div className="p-5">
          <table className="w-full mb-0">
            <tbody>
              {revenueItems.map((item) => (
                <tr key={item.code}>
                  <td>
                    <Badge color="primary" label className="mr-2">
                      {item.code}
                    </Badge>
                    <span>{item.name || item.code}</span>
                  </td>
                  <td className="text-right font-medium whitespace-nowrap">{formatUsd(item.amountUsd)}</td>
                </tr>
              ))}

              {/* Deductions */}
              {deductionItems.length > 0 && (
                <>
                  <tr>
                    <td colSpan="2" className="pb-0 pt-2">
                      <small className="text-surface-500 font-semibold">{t?.('admin.incomeStatement.deductions', { defaultValue: 'DEDUCTIONS' }) || 'DEDUCTIONS'}</small>
                    </td>
                  </tr>
                  {deductionItems.map((item, i) => (
                    <tr key={`d-${i}`}>
                      <td>
                        <Badge color="warning" label className="mr-2">
                          {item.code}
                        </Badge>
                        <span>{item.name || item.code}</span>
                      </td>
                      <td className="text-right font-medium text-danger whitespace-nowrap">
                        ({formatUsd(item.amountUsd)})
                      </td>
                    </tr>
                  ))}
                </>
              )}

              <tr style={{ borderTop: '2px solid var(--color-surface-200)' }}>
                <td className="font-bold">{t?.('admin.incomeStatement.netRevenue', { defaultValue: 'Net Revenue' }) || 'Net Revenue'}</td>
                <td className={`text-right font-bold text-xl ${valueColor(netRevenue).cls} whitespace-nowrap`}>
                  {formatUsd(netRevenue)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function ExpensesCard({ expenseItems, totalExpenses, t }) {
  return (
    <div className="col-span-12 md:col-span-6 mb-4">
      <Card className="h-full">
        <div className="px-5 py-4 border-b border-surface-200 flex items-center">
          <i className="bx bx-trending-down text-danger mr-2 text-2xl"></i>
          <h5 className="mb-0">{t?.('admin.incomeStatement.expenses', { defaultValue: 'EXPENSES' }) || 'EXPENSES'}</h5>
        </div>
        <div className="p-5">
          <table className="w-full mb-0">
            <tbody>
              {expenseItems.map((item) => (
                <tr key={item.code}>
                  <td>
                    <Badge color="danger" label className="mr-2">
                      {item.code}
                    </Badge>
                    <span>{item.name || item.code}</span>
                  </td>
                  <td className="text-right font-medium whitespace-nowrap">{formatUsd(item.amountUsd)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--color-surface-200)' }}>
                <td className="font-bold">{t?.('admin.incomeStatement.totalExpenses', { defaultValue: 'Total Expenses' }) || 'Total Expenses'}</td>
                <td className={`text-right font-bold text-xl ${valueColor(totalExpenses).cls} whitespace-nowrap`}>
                  ({formatUsd(totalExpenses)})
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function OperatingIncomeCard({ operatingIncome, profitMargin, t }) {
  const oi = valueColor(operatingIncome)
  const pm = valueColor(profitMargin)
  return (
    <Card className="mb-4">
      <div className="p-5">
        <div className="grid grid-cols-12 gap-x-6 items-center">
          <div className="col-span-12 md:col-span-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-3" style={{ backgroundColor: oi.bgStyle }}>
                <i
                  className={`bx ${parseFloat(operatingIncome) === 0 ? 'bx-minus-circle' : parseFloat(operatingIncome) > 0 ? 'bx-trending-up' : 'bx-trending-down'} text-[2.5rem]`}
                  style={{ color: oi.cssColor }}
                ></i>
              </div>
              <div>
                <h6 className="text-surface-500 mb-1">{t?.('admin.incomeStatement.operatingIncome', { defaultValue: 'OPERATING INCOME' }) || 'OPERATING INCOME'}</h6>
                <h2 className={`mb-0 font-bold ${oi.cls}`}>{formatUsd(operatingIncome)}</h2>
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-6 md:text-right mt-3 md:mt-0">
            <h6 className="text-surface-500 mb-1">Profit Margin</h6>
            <h2 className={`mb-0 font-bold ${pm.cls}`}>{formatPercent(profitMargin)}</h2>
          </div>
        </div>
      </div>
    </Card>
  )
}

function AdjustmentsCard({ adjustIncrease, adjustDecrease, netAdjustment, t }) {
  if (adjustIncrease.length === 0 && adjustDecrease.length === 0) return null
  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200 flex items-center">
        <i className="bx bx-transfer-alt text-info mr-2 text-2xl"></i>
        <h5 className="mb-0">
          {t?.('admin.incomeStatement.adjustments', { defaultValue: 'ADJUSTMENTS' }) || 'ADJUSTMENTS'} <small className="text-surface-500 font-normal">({t?.('admin.incomeStatement.nonOperating', { defaultValue: 'Non-operating' }) || 'Non-operating'})</small>
        </h5>
      </div>
      <div className="p-5">
        <table className="w-full mb-0">
          <tbody>
            {adjustIncrease.length > 0 && (
              <>
                <tr>
                  <td colSpan="2" className="pb-0 pt-0">
                    <small className="text-surface-500 font-semibold">{t?.('admin.incomeStatement.increases', { defaultValue: 'INCREASES' }) || 'INCREASES'}</small>
                  </td>
                </tr>
                {adjustIncrease.map((item, i) => (
                  <tr key={`ai-${i}`}>
                    <td>
                      <Badge color="success" label className="mr-2">
                        {item.code}
                      </Badge>
                      <span>{item.name || item.code}</span>
                      <small className="text-surface-500 ml-2">({item.entries || 0} {t?.('admin.incomeStatement.entries', { defaultValue: 'entries' }) || 'entries'})</small>
                    </td>
                    <td className="text-right font-medium text-success whitespace-nowrap">
                      +{formatUsd(item.amountUsd)}
                    </td>
                  </tr>
                ))}
              </>
            )}
            {adjustDecrease.length > 0 && (
              <>
                <tr>
                  <td colSpan="2" className="pb-0 pt-2">
                    <small className="text-surface-500 font-semibold">{t?.('admin.incomeStatement.decreases', { defaultValue: 'DECREASES' }) || 'DECREASES'}</small>
                  </td>
                </tr>
                {adjustDecrease.map((item, i) => (
                  <tr key={`ad-${i}`}>
                    <td>
                      <Badge color="danger" label className="mr-2">
                        {item.code}
                      </Badge>
                      <span>{item.name || item.code}</span>
                      <small className="text-surface-500 ml-2">({item.entries || 0} {t?.('admin.incomeStatement.entries', { defaultValue: 'entries' }) || 'entries'})</small>
                    </td>
                    <td className="text-right font-medium text-danger whitespace-nowrap">
                      ({formatUsd(item.amountUsd)})
                    </td>
                  </tr>
                ))}
              </>
            )}
            <tr style={{ borderTop: '2px solid var(--color-surface-200)' }}>
              <td className="font-bold">{t?.('admin.incomeStatement.netAdjustment', { defaultValue: 'Net Adjustment' }) || 'Net Adjustment'}</td>
              <td className={`text-right font-bold text-xl ${valueColor(netAdjustment).cls} whitespace-nowrap`}>
                {parseFloat(netAdjustment) > 0 ? '+' : ''}
                {formatUsd(netAdjustment)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function NetIncomeCard({ netIncome, t }) {
  const ni = valueColor(netIncome)
  return (
    <Card className="mb-4">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-3" style={{ backgroundColor: ni.bgStyle }}>
            <i
              className={`bx ${parseFloat(netIncome) === 0 ? 'bx-minus-circle' : parseFloat(netIncome) > 0 ? 'bx-wallet' : 'bx-error-circle'} text-[2.5rem]`}
              style={{ color: ni.cssColor }}
            ></i>
          </div>
          <div>
            <h6 className="text-surface-500 mb-1">{t?.('admin.incomeStatement.netIncome', { defaultValue: 'NET INCOME' }) || 'NET INCOME'}</h6>
            <h2 className={`mb-0 font-bold ${ni.cls}`}>{formatUsd(netIncome)}</h2>
          </div>
        </div>
      </div>
    </Card>
  )
}

function CountsCard({ allItems }) {
  return (
    <Card className="mb-4">
      <div className="p-5 py-3">
        <div className="flex flex-wrap gap-4">
          {allItems.map((item) => (
            <div key={item.code} className="flex items-center gap-2">
              <Badge color="secondary">{item.code}</Badge>
              <span className="text-surface-500">{item.name || item.code}:</span>
              <span className="font-semibold">{item.entries || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

/**
 * Renders the full income statement report body (revenue, expenses, operating
 * income, adjustments, net income, and counts).
 */
export default function IncomeStatementReport({ report, t }) {
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
      <div className="grid grid-cols-12 gap-x-6">
        <RevenueCard revenueItems={revenueItems} deductionItems={deductionItems} netRevenue={netRevenue} t={t} />
        <ExpensesCard expenseItems={expenseItems} totalExpenses={totalExpenses} t={t} />
      </div>

      <OperatingIncomeCard operatingIncome={operatingIncome} profitMargin={profitMargin} t={t} />

      <AdjustmentsCard adjustIncrease={adjustIncrease} adjustDecrease={adjustDecrease} netAdjustment={netAdjustment} t={t} />

      <NetIncomeCard netIncome={netIncome} t={t} />

      <CountsCard allItems={allItems} />
    </>
  )
}
