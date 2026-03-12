'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import CoinImg from '@/components/CoinImg'
import { formatCoinAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import TableEmptyState from '@/components/TableEmptyState'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import { getNetworkLabel, statusBadgeClass, formatStatusLabel } from '@/components/balance/withdrawalHelpers'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'

function truncateHash(hash) {
  if (!hash) return '-'
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

export default function WithdrawalTable({ items, pagination, loading, cnById, onPageChange }) {
  const router = useRouter()
  const { t } = useTranslation()
  const { fmtDate } = useDateFormat()
  const { copiedId, handleCopy } = useCopyFeedback()

  return (
    <>
      <Table>
        <thead>
          <tr className="whitespace-nowrap">
            <th>{t('common.id', { defaultValue: 'ID' })}</th>
            <th>{t('wallet.colCoin', { defaultValue: 'Coin' })}</th>
            <th className="text-right">{t('balance.amount', { defaultValue: 'Amount' })}</th>
            <th className="text-right">{t('balance.fee', { defaultValue: 'Fee' })}</th>
            <th>{t('wallet.colAddress', { defaultValue: 'Address' })}</th>
            <th>{t('common.status', { defaultValue: 'Status' })}</th>
            <th>{t('common.createdAt', { defaultValue: 'Created at' })}</th>
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
                <tr key={it.id} className="cursor-pointer" onClick={() => router.push(`/withdrawals/${it.id}`)}>
                  <td className="whitespace-nowrap">
                    <span className="font-mono font-semibold text-primary-600">{it.id}</span>
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
                  <td className="whitespace-nowrap text-right font-medium text-surface-900">
                    {formatCoinAmount(it.amount)} {sym}
                  </td>
                  <td className="whitespace-nowrap text-right text-surface-500">
                    {formatCoinAmount(it.totalFee || it.fee)} {sym}
                  </td>
                  <td className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs" title={it.toAddress}>{truncateHash(it.toAddress)}</span>
                      {it.toAddress && (
                        <Button
                          onClick={() => handleCopy(it.toAddress, it.id)}
                          title={t('actions.copy', { defaultValue: 'Copy' })}
                          size="icon-sm"
                          variant="text-secondary"
                        >
                          {copiedId === it.id ? (
                            <i className="bx bx-check text-success"></i>
                          ) : (
                            <i className="bx bx-copy"></i>
                          )}
                        </Button>
                      )}
                      {it.txHash && network?.explorerUrl && (
                        <Button
                          variant="text-secondary"
                          size="icon-sm"
                          href={`${network.explorerUrl}/tx/${it.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
                        >
                          <i className="bx bx-link-external text-[1rem]"></i>
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={statusBadgeClass(it.status)}>
                      {t(`status.${String(it.status || '').toLowerCase()}`, {
                        defaultValue: formatStatusLabel(String(it.status || '').toUpperCase()),
                      })}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-surface-500 text-xs">{fmtDate(it.createdAt)}</td>
                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="text-secondary"
                      size="icon-sm"
                      href={`/withdrawals/${it.id}`}
                      title={t('actions.view', { defaultValue: 'View' })}
                    >
                      <i className="bx bx-show text-[1rem]"></i>
                    </Button>
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
