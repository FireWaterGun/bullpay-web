'use client'

import { useMemo } from 'react'
import CoinImg from '@/components/CoinImg'
import { formatUsd } from '@/lib/utils/format'
import TableEmptyState from '@/components/TableEmptyState'

const tableHeaderStyle = { fontSize: '0.8rem' }

function TransactionByCoinTable({ byCoinData, loading, t }) {
  const byCoinTotals = useMemo(() => {
    if (!byCoinData || byCoinData.length === 0) {
      return { deposit: 0, withdrawal: 0, fee: 0, netFlow: 0 }
    }
    const deposit = byCoinData.reduce((sum, item) => sum + parseFloat(item.depositUsd || 0), 0)
    const withdrawal = byCoinData.reduce((sum, item) => sum + parseFloat(item.withdrawalUsd || 0), 0)
    const fee = byCoinData.reduce((sum, item) => sum + parseFloat(item.feeUsd || 0), 0)
    const netFlow = byCoinData.reduce((sum, item) => {
      return sum + parseFloat(item.netFlowUsd || 0)
    }, 0)
    return { deposit, withdrawal, fee, netFlow }
  }, [byCoinData])

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-surface-200">
        <h5 className="font-semibold mb-0">
          {t('userDashboard.transactionByCoin', { defaultValue: 'Transaction by Coin' })}
        </h5>
      </div>
      <div className="p-0">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="spinner w-8 h-8 border-3 text-primary-600" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="text-left uppercase font-semibold text-surface-500 px-4 py-3" style={tableHeaderStyle}>{t('admin.coin', { defaultValue: 'Coin' })}</th>
                  <th className="text-right uppercase font-semibold text-surface-500 px-4 py-3" style={tableHeaderStyle}>{t('userDashboard.deposits', { defaultValue: 'Deposits' })}</th>
                  <th className="text-right uppercase font-semibold text-surface-500 px-4 py-3" style={tableHeaderStyle}>{t('userDashboard.withdrawals', { defaultValue: 'Withdrawals' })}</th>
                  <th className="text-right uppercase font-semibold text-surface-500 px-4 py-3" style={tableHeaderStyle}>{t('userDashboard.feesCollected', { defaultValue: 'Fees' })}</th>
                  <th className="text-right uppercase font-semibold text-surface-500 whitespace-nowrap px-4 py-3" style={tableHeaderStyle}>{t('userDashboard.netFlow', { defaultValue: 'Net Flow' })}</th>
                </tr>
              </thead>
              <tbody>
                {byCoinData.length === 0 ? (
                  <TableEmptyState
                    colSpan={5}
                    icon="bx-coin-stack"
                    message={t('common.noData', { defaultValue: 'No data available' })}
                    sub={t('common.noDataSub', { defaultValue: 'No transactions in this period' })}
                  />
                ) : (
                  <>
                    {byCoinData.map((item) => {
                      const deposit = parseFloat(item.depositUsd || 0)
                      const withdrawal = parseFloat(item.withdrawalUsd || 0)
                      const fee = parseFloat(item.feeUsd || 0)
                      const netFlow = parseFloat(item.netFlowUsd || 0)

                      return (
                        <tr key={`${item.coinSymbol}-${item.networkName || 'all'}`} className="border-b border-surface-100 hover:bg-surface-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <CoinImg symbol={item.coinSymbol} size={24} className="mr-2" />
                              <span className="font-medium">{item.coinSymbol}</span>
                              {item.networkName && (
                                <small className="text-surface-500 ml-1">/ {item.networkName}</small>
                              )}
                            </div>
                          </td>
                          <td className="text-right px-4 py-3">{formatUsd(deposit)}</td>
                          <td className="text-right px-4 py-3">{formatUsd(withdrawal)}</td>
                          <td className="text-right px-4 py-3">{formatUsd(fee)}</td>
                          <td className={`text-right px-4 py-3 ${netFlow > 0 ? 'text-green-500' : netFlow < 0 ? 'text-red-500' : ''}`}>
                            {formatUsd(netFlow)}
                          </td>
                        </tr>
                      )
                    })}
                    {/* Total row */}
                    <tr className="bg-surface-50 font-semibold">
                      <td className="px-4 py-3">{t('common.total', { defaultValue: 'TOTAL' })}</td>
                      <td className="text-right px-4 py-3">{formatUsd(byCoinTotals.deposit)}</td>
                      <td className="text-right px-4 py-3">{formatUsd(byCoinTotals.withdrawal)}</td>
                      <td className="text-right px-4 py-3">{formatUsd(byCoinTotals.fee)}</td>
                      <td className={`text-right px-4 py-3 ${byCoinTotals.netFlow > 0 ? 'text-green-500' : byCoinTotals.netFlow < 0 ? 'text-red-500' : ''}`}>
                        {formatUsd(byCoinTotals.netFlow)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionByCoinTable
