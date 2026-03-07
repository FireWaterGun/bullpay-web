'use client'

import CoinImg from '@/components/CoinImg'
import { useDateFormat } from '@/hooks/useDateFormat'
import { formatGasAmount, statusBadgeClass } from '@/components/admin/gasTopupHelpers'
import Button from '../ui/Button'

export default function GasTopupRow({ topup, onCopy, onNavigate, t }) {
  const { fmtDate } = useDateFormat()
  const coinSymbol = (topup.coinNetwork?.coin?.symbol || topup.coinSymbol || '').toUpperCase()
  const networkSymbol = (topup.coinNetwork?.network?.symbol || topup.networkSymbol || '').toUpperCase()
  const networkName = topup.coinNetwork?.network?.name || topup.networkName || ''
  const decimals = topup.coinNetwork?.decimals || topup.decimals || 18

  return (
    <tr
      className="cursor-pointer"
      onClick={() => onNavigate(topup.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate(topup.id)}
      tabIndex={0}
      role="link"
    >
      <td>
        <span className="font-semibold text-primary">{topup.id}</span>
      </td>
      <td>
        <div className="flex items-center">
          <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={28} className="mr-2" />
          <div>
            <div className="font-semibold text-[0.85rem]">{coinSymbol}</div>
            <div className="text-surface-500 text-xs">{networkName || networkSymbol}</div>
          </div>
        </div>
      </td>
      <td className="text-center">
        {topup.sweepId ? (
          <span className="font-semibold">{topup.sweepId}</span>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td className="text-right whitespace-nowrap">
        <span className="font-semibold">{formatGasAmount(topup.topupGasRaw, decimals)}</span>
      </td>
      <td className="text-right whitespace-nowrap">
        <span className="text-surface-500">{formatGasAmount(topup.requiredGasRaw, decimals)}</span>
      </td>
      <td className="text-center whitespace-nowrap">
        <span className={statusBadgeClass(topup.status)}>
          {t(`admin.gasTopup.${topup.status}`, {
            defaultValue: String(topup.status || '').toUpperCase(),
          }).toUpperCase()}
        </span>
      </td>
      <td>
        {topup.txHash ? (
          <div className="flex items-center">
            <span className="mr-2">{topup.txHash}</span>
            <Button
              onClick={() => onCopy(topup.txHash)}
              title={t('admin.gasTopup.copyTxHash', { defaultValue: 'Copy tx hash' })}
              size="icon-sm"
              variant="text-secondary"
            >
              <i className="bx bx-copy"></i>
            </Button>
          </div>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td>
        {topup.fromAddress ? (
          <div className="flex items-center">
            <span className="mr-2">{topup.fromAddress}</span>
            <Button
              onClick={() => onCopy(topup.fromAddress)}
              title={t('admin.gasTopup.copyAddress', { defaultValue: 'Copy address' })}
              size="icon-sm"
              variant="text-secondary"
            >
              <i className="bx bx-copy"></i>
            </Button>
          </div>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td>
        {topup.toAddress ? (
          <div className="flex items-center">
            <span className="mr-2">{topup.toAddress}</span>
            <Button
              onClick={() => onCopy(topup.toAddress)}
              title={t('admin.gasTopup.copyAddress', { defaultValue: 'Copy address' })}
              size="icon-sm"
              variant="text-secondary"
            >
              <i className="bx bx-copy"></i>
            </Button>
          </div>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td className="text-center">
        <span className={topup.retryCount > 0 ? 'text-warning font-semibold' : 'text-surface-500'}>
          {topup.retryCount || 0}
        </span>
      </td>
      <td className="whitespace-nowrap text-[0.85rem]">{fmtDate(topup.createdAt)}</td>
      <td className="whitespace-nowrap text-[0.85rem]">
        {topup.completedAt ? fmtDate(topup.completedAt) : <span className="text-surface-500">-</span>}
      </td>
    </tr>
  )
}
