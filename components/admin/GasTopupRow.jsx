'use client'

import CoinImg from '@/components/CoinImg'
import { useDateFormat } from '@/hooks/useDateFormat'
import { formatGasAmount, statusBadgeClass } from '@/components/admin/gasTopupHelpers'

export default function GasTopupRow({ topup, onCopy, onNavigate, t }) {
  const { fmtDate } = useDateFormat()
  const coinSymbol = (topup.coinNetwork?.coin?.symbol || topup.coinSymbol || '').toUpperCase()
  const networkSymbol = (topup.coinNetwork?.network?.symbol || topup.networkSymbol || '').toUpperCase()
  const networkName = topup.coinNetwork?.network?.name || topup.networkName || ''
  const decimals = topup.coinNetwork?.decimals || topup.decimals || 18

  return (
    <tr style={{ cursor: 'pointer' }} onClick={() => onNavigate(topup.id)}>
      <td>
        <span className="font-semibold text-primary">{topup.id}</span>
      </td>
      <td>
        <div className="flex items-center">
          <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={28} className="mr-2" />
          <div>
            <div className="font-semibold" style={{ fontSize: '0.85rem' }}>{coinSymbol}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{networkName || networkSymbol}</div>
          </div>
        </div>
      </td>
      <td className="text-center">
        {topup.sweepId ? (
          <span className="font-semibold">{topup.sweepId}</span>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td className="text-right whitespace-nowrap">
        <span className="font-semibold">
          {formatGasAmount(topup.topupGasRaw, decimals)}
        </span>
      </td>
      <td className="text-right whitespace-nowrap">
        <span className="text-muted">
          {formatGasAmount(topup.requiredGasRaw, decimals)}
        </span>
      </td>
      <td className="text-center whitespace-nowrap">
        <span className={statusBadgeClass(topup.status)}>
          {t(`admin.gasTopup.${topup.status}`, { defaultValue: String(topup.status || '').toUpperCase() }).toUpperCase()}
        </span>
      </td>
      <td>
        {topup.txHash ? (
          <div className="flex items-center">
            <span className="mr-2">{topup.txHash}</span>
            <button
              className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full"
              onClick={() => onCopy(topup.txHash)}
              title={t('admin.gasTopup.copyTxHash', { defaultValue: 'Copy tx hash' })}
            >
              <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
            </button>
          </div>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        {topup.fromAddress ? (
          <div className="flex items-center">
            <span className="mr-2">{topup.fromAddress}</span>
            <button
              className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full"
              onClick={() => onCopy(topup.fromAddress)}
              title={t('admin.gasTopup.copyAddress', { defaultValue: 'Copy address' })}
            >
              <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
            </button>
          </div>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        {topup.toAddress ? (
          <div className="flex items-center">
            <span className="mr-2">{topup.toAddress}</span>
            <button
              className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full"
              onClick={() => onCopy(topup.toAddress)}
              title={t('admin.gasTopup.copyAddress', { defaultValue: 'Copy address' })}
            >
              <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
            </button>
          </div>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td className="text-center">
        <span className={topup.retryCount > 0 ? 'text-warning font-semibold' : 'text-muted'}>
          {topup.retryCount || 0}
        </span>
      </td>
      <td className="whitespace-nowrap" style={{ fontSize: '0.85rem' }}>
        {fmtDate(topup.createdAt)}
      </td>
      <td className="whitespace-nowrap" style={{ fontSize: '0.85rem' }}>
        {topup.completedAt ? fmtDate(topup.completedAt) : <span className="text-muted">-</span>}
      </td>
    </tr>
  )
}
