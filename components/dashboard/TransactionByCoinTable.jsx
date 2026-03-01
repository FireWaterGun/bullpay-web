'use client'

import { useMemo } from 'react'
import CoinImg from '@/components/CoinImg'
import { formatUsd } from '@/lib/utils/format'

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
      <div className="card-header">
        <h5 className="card-title mb-0">
          {t('userDashboard.transactionByCoin', { defaultValue: 'Transaction by Coin' })}
        </h5>
      </div>
      <div className="card-body p-0">
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-uppercase fw-semibold text-muted" style={tableHeaderStyle}>{t('admin.coin', { defaultValue: 'Coin' })}</th>
                  <th className="text-end text-uppercase fw-semibold text-muted" style={tableHeaderStyle}>{t('userDashboard.deposits', { defaultValue: 'Deposits' })}</th>
                  <th className="text-end text-uppercase fw-semibold text-muted" style={tableHeaderStyle}>{t('userDashboard.withdrawals', { defaultValue: 'Withdrawals' })}</th>
                  <th className="text-end text-uppercase fw-semibold text-muted" style={tableHeaderStyle}>{t('userDashboard.feesCollected', { defaultValue: 'Fees' })}</th>
                  <th className="text-end text-uppercase fw-semibold text-muted text-nowrap" style={tableHeaderStyle}>{t('userDashboard.netFlow', { defaultValue: 'Net Flow' })}</th>
                </tr>
              </thead>
              <tbody>
                {byCoinData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      {t('common.noData', { defaultValue: 'No data available' })}
                    </td>
                  </tr>
                ) : (
                  <>
                    {byCoinData.map((item) => {
                      const deposit = parseFloat(item.depositUsd || 0)
                      const withdrawal = parseFloat(item.withdrawalUsd || 0)
                      const fee = parseFloat(item.feeUsd || 0)
                      const netFlow = parseFloat(item.netFlowUsd || 0)

                      return (
                        <tr key={`${item.coinSymbol}-${item.networkName || 'all'}`}>
                          <td>
                            <div className="d-flex align-items-center">
                              <CoinImg symbol={item.coinSymbol} size={24} className="me-2" />
                              <span className="fw-medium">{item.coinSymbol}</span>
                              {item.networkName && (
                                <small className="text-muted ms-1">/ {item.networkName}</small>
                              )}
                            </div>
                          </td>
                          <td className="text-end">{formatUsd(deposit)}</td>
                          <td className="text-end">{formatUsd(withdrawal)}</td>
                          <td className="text-end">{formatUsd(fee)}</td>
                          <td className={`text-end ${netFlow > 0 ? 'text-success' : netFlow < 0 ? 'text-danger' : ''}`}>
                            {formatUsd(netFlow)}
                          </td>
                        </tr>
                      )
                    })}
                    {/* Total row */}
                    <tr className="table-light fw-semibold">
                      <td className="text-body">{t('common.total', { defaultValue: 'TOTAL' })}</td>
                      <td className="text-end text-body">{formatUsd(byCoinTotals.deposit)}</td>
                      <td className="text-end text-body">{formatUsd(byCoinTotals.withdrawal)}</td>
                      <td className="text-end text-body">{formatUsd(byCoinTotals.fee)}</td>
                      <td className={`text-end ${byCoinTotals.netFlow > 0 ? 'text-success' : byCoinTotals.netFlow < 0 ? 'text-danger' : ''}`}>
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
