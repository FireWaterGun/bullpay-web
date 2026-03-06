'use client';

import { formatUsdAuto, formatPercent as formatPercentShared } from '@/lib/utils/format';
import CoinImg from '@/components/CoinImg';
import TableEmptyState from '@/components/TableEmptyState';
import { Card, Spinner } from '@/components/ui'
import Table from '@/components/ui/Table';

const formatCurrency = formatUsdAuto;
const formatPercent = formatPercentShared;

export function RevenueByCoinTable({ byCoinData, totals, loading, t }) {
  return (
    <div className="grid grid-cols-12 gap-x-6 mb-4">
      <div className="col-span-12">
        <Card>
          <div className="px-5 py-4 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800 mb-0">
              {t('admin.revenueByCoin', { defaultValue: 'Revenue by Coin' })}
            </h5>
          </div>
          <div className="p-0">
            {loading ?
            <div className="flex justify-center py-5">
                <Spinner role="status" className="text-primary-600" />

              
              </div> :

            <div className="overflow-x-auto">
                <Table responsive={false} className="mb-0">
                  <thead>
                    <tr>
                      <th className="uppercase font-semibold text-surface-500 text-[0.8rem]">{t('admin.coin', { defaultValue: 'Coin' })}</th>
                      <th className="text-right uppercase font-semibold text-surface-500 text-[0.8rem]">{t('admin.revenue', { defaultValue: 'Revenue' })}</th>
                      <th className="text-right uppercase font-semibold text-surface-500 text-[0.8rem]">{t('admin.cost', { defaultValue: 'Cost' })}</th>
                      <th className="text-right uppercase font-semibold text-surface-500 text-[0.8rem]">{t('admin.operatingProfit', { defaultValue: 'Operating Profit' })}</th>
                      <th className="text-right uppercase font-semibold text-surface-500 text-[0.8rem]">{t('admin.margin', { defaultValue: 'Margin' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCoinData.length === 0 ?
                  <TableEmptyState
                    colSpan={5}
                    icon="bx-coin-stack"
                    message={t('common.noData', { defaultValue: 'No data available' })} /> :


                  <>
                        {byCoinData.map((item) => {
                      const revenue = parseFloat(item.revenueUsd || 0);
                      const cost = parseFloat(item.costUsd || 0);
                      const profit = parseFloat(item.operatingProfitUsd || 0);
                      const margin = parseFloat(item.marginPercent || 0);

                      return (
                        <tr key={`${item.coinSymbol}-${item.networkName || 'all'}`}>
                              <td>
                                <div className="flex items-center">
                                  <CoinImg symbol={item.coinSymbol} size={24} className="mr-2" />
                                  <span className="font-medium">{item.coinSymbol}</span>
                                  {item.networkName &&
                              <small className="text-surface-500 ml-1">/ {item.networkName}</small>
                              }
                                </div>
                              </td>
                              <td className="text-right">{formatCurrency(revenue)}</td>
                              <td className="text-right">{formatCurrency(cost)}</td>
                              <td className={`text-right ${profit > 0 ? 'text-success' : profit < 0 ? 'text-danger' : ''}`}>
                                {formatCurrency(profit)}
                              </td>
                              <td className="text-right">{formatPercent(margin)}</td>
                            </tr>);

                    })}
                        <tr className="font-bold">
                          <td>{t('common.total', { defaultValue: 'TOTAL' })}</td>
                          <td className="text-right">{formatCurrency(totals.revenue)}</td>
                          <td className="text-right">{formatCurrency(totals.cost)}</td>
                          <td className={`text-right ${totals.profit > 0 ? 'text-success' : totals.profit < 0 ? 'text-danger' : ''}`}>
                            {formatCurrency(totals.profit)}
                          </td>
                          <td className="text-right">{formatPercent(totals.margin)}</td>
                        </tr>
                      </>
                  }
                  </tbody>
                </Table>
              </div>
            }
          </div>
        </Card>
      </div>
    </div>);

}

export function RevenueVolumeSummary({ summary, t }) {
  return (
    <div className="grid grid-cols-12 gap-x-6">
      <div className="col-span-12">
        <Card>
          <div className="p-5 py-3">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <span className="text-surface-500 mr-2">{t('admin.volume', { defaultValue: 'Volume' })}:</span>
                <span className="font-medium mr-3">
                  Sweep {formatCurrency(summary?.totalSweepVolumeUsd || 0)}
                </span>
                <span className="text-surface-500">|</span>
                <span className="font-medium ml-3">
                  Withdrawal {formatCurrency(summary?.totalWithdrawalVolumeUsd || 0)}
                </span>
              </div>
              <div>
                <span className="text-surface-500 mr-2">{t('admin.counts', { defaultValue: 'Counts' })}:</span>
                <span className="font-medium mr-3">
                  {summary?.counts?.sweeps || 0} sweeps
                </span>
                <span className="text-surface-500">|</span>
                <span className="font-medium mx-3">
                  {summary?.counts?.withdrawals || 0} withdrawals
                </span>
                <span className="text-surface-500">|</span>
                <span className="font-medium mx-3">
                  {summary?.counts?.gasTopups || 0} gas topups
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>);

}