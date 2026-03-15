'use client'

import CoinImg from '@/components/CoinImg'
import { useDateFormat } from '@/hooks/useDateFormat'
import { formatGasAmount, statusBadgeClass } from '@/components/admin/gasTopupHelpers'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import Button from '../ui/Button'

export default function GasTopupRow({ topup, onCopy, onNavigate, onRetry, retryingId, t }) {
  const { fmtDate } = useDateFormat()
  const { copiedId, handleCopy } = useCopyFeedback()

  function truncateHash(hash) {
    if (!hash || hash.length <= 16) return hash || ''
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }

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
      <td onClick={e => e.stopPropagation()}>
        {topup.txHash ? (
          <div className="flex items-center">
            <span className="mr-2 font-mono text-xs">{truncateHash(topup.txHash)}</span>
            <Button
              onClick={() => handleCopy(topup.txHash, `tx-${topup.id}`)}
              title={t('admin.gasTopup.copyTxHash', { defaultValue: 'Copy tx hash' })}
              size="icon-sm"
              variant="text-secondary"
            >
              <i className={`bx ${copiedId === `tx-${topup.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
            </Button>
          </div>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td onClick={e => e.stopPropagation()}>
        {topup.fromAddress ? (
          <div className="flex items-center">
            <span className="mr-2 font-mono text-xs">{truncateHash(topup.fromAddress)}</span>
            <Button
              onClick={() => handleCopy(topup.fromAddress, `from-${topup.id}`)}
              title={t('admin.gasTopup.copyAddress', { defaultValue: 'Copy address' })}
              size="icon-sm"
              variant="text-secondary"
            >
              <i className={`bx ${copiedId === `from-${topup.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
            </Button>
          </div>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td onClick={e => e.stopPropagation()}>
        {topup.toAddress ? (
          <div className="flex items-center">
            <span className="mr-2 font-mono text-xs">{truncateHash(topup.toAddress)}</span>
            <Button
              onClick={() => handleCopy(topup.toAddress, `to-${topup.id}`)}
              title={t('admin.gasTopup.copyAddress', { defaultValue: 'Copy address' })}
              size="icon-sm"
              variant="text-secondary"
            >
              <i className={`bx ${copiedId === `to-${topup.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
            </Button>
          </div>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td className="text-center" onClick={e => e.stopPropagation()}>
        {topup.status === 'failed' ? (
          <Button
            onClick={() => onRetry(topup.id)}
            disabled={retryingId === topup.id}
            size="sm"
            variant="outline-warning"
            title={t('admin.gasTopup.retryTopup', { defaultValue: 'Retry this gas topup' })}
          >
            {retryingId === topup.id ? (
              <i className="bx bx-loader-alt bx-spin mr-1"></i>
            ) : (
              <i className="bx bx-revision mr-1"></i>
            )}
            {t('admin.gasTopup.retry', { defaultValue: 'Retry' })}
          </Button>
        ) : (
          <span className={topup.retryCount > 0 ? 'text-warning font-semibold' : 'text-surface-500'}>
            {topup.retryCount || 0}
          </span>
        )}
      </td>
      <td className="whitespace-nowrap text-[0.85rem]">{fmtDate(topup.createdAt)}</td>
      <td className="whitespace-nowrap text-[0.85rem]">
        {topup.completedAt ? fmtDate(topup.completedAt) : <span className="text-surface-500">-</span>}
      </td>
    </tr>
  )
}
