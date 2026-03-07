'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import CoinImg from '@/components/CoinImg'
import { useDateFormat } from '@/hooks/useDateFormat'
import TableEmptyState from '@/components/TableEmptyState'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import {
  formatAmount,
  getNetworkLabel,
  statusBadgeClass,
  formatStatusLabel,
} from '@/components/balance/withdrawalHelpers'

export default function WithdrawalTable({ items, pagination, loading, cnById, onPageChange }) {
  const { t } = useTranslation()
  const { fmtDate } = useDateFormat()

  return (
    <>
      <Table>
        <thead>
          <tr className="whitespace-nowrap">
            <th>ID</th>
            <th>{t('wallet.colCoin', { defaultValue: 'Coin' })}</th>
            <th>{t('balance.amount', { defaultValue: 'Amount' })}</th>
            <th>{t('balance.fee', { defaultValue: 'Fee' })}</th>
            <th>{t('wallet.colAddress', { defaultValue: 'Address' })}</th>
            <th>{t('common.status', { defaultValue: 'Status' })}</th>
            <th className="text-right">{t('common.createdAt', { defaultValue: 'Created at' })}</th>
            <th className="text-center">{t('actions.action', { defaultValue: 'Action' })}</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <TableEmptyState
              colSpan={8}
              icon="bx-transfer"
              message={t('balance.noWithdrawals', { defaultValue: 'No withdrawals' })}
              sub={t('balance.noWithdrawalsSub', { defaultValue: 'Your withdrawal history will appear here' })}
            />
          ) : (
            items.map((it) => {
              const coin = it.coin || it.coinNetwork?.coin || cnById.get(Number(it.coinNetworkId))?.coin
              const network = it.network || it.coinNetwork?.network || cnById.get(Number(it.coinNetworkId))?.network
              const sym = (coin?.symbol || 'COIN').toUpperCase()
              const networkSym = (network?.symbol || '').toString().toUpperCase()
              const networkName = network?.name || getNetworkLabel({ network }, coin)

              return (
                <tr key={it.id}>
                  <td>
                    <Link
                      href={`/withdrawals/${it.id}`}
                      className="font-mono font-semibold text-primary-600 no-underline hover:underline"
                    >
                      {it.id}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <CoinImg coin={coin} symbol={sym} networkSymbol={networkSym} showFallback />
                      <div>
                        <div className="font-medium text-surface-900 leading-[1.2]">{sym}</div>
                        <small className="text-surface-500 text-xs">{networkName}</small>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap font-medium text-surface-900">
                    {Number(it.amount) || it.amount} {sym}
                  </td>
                  <td className="whitespace-nowrap text-surface-500">
                    {formatAmount(
                      it.totalFeeRaw || it.totalFee || it.feeRaw || it.fee,
                      it.decimals || coin?.decimals || 18
                    )}
                  </td>
                  <td>
                    <span className="font-mono block truncate max-w-[200px] text-surface-700" title={it.toAddress}>
                      {it.toAddress}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={statusBadgeClass(it.status)}>
                      {formatStatusLabel(String(it.status || '').toUpperCase())}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-right text-surface-500 text-xs">{fmtDate(it.createdAt)}</td>
                  <td className="text-center">
                    <Link
                      href={`/withdrawals/${it.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-primary-300 text-primary-600 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-colors"
                      title={t('actions.view', { defaultValue: 'View' })}
                    >
                      <i className="bx bx-show text-sm"></i>
                    </Link>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </Table>

      <div className="px-5 py-1.5">
        <Pagination pagination={pagination} loading={loading} onPageChange={onPageChange} />
      </div>
    </>
  )
}
