'use client'

import CoinImg from '@/components/CoinImg'
import { formatDate } from '@/lib/utils/format'
import { formatGasAmount, statusBadgeClass } from '@/components/admin/gasTopupHelpers'

export default function GasTopupRow({ topup, onCopy, onNavigate }) {
  const coinSymbol = (topup.coinNetwork?.coin?.symbol || topup.coinSymbol || '').toUpperCase()
  const networkSymbol = (topup.coinNetwork?.network?.symbol || topup.networkSymbol || '').toUpperCase()
  const networkName = topup.coinNetwork?.network?.name || topup.networkName || ''
  const decimals = topup.coinNetwork?.decimals || topup.decimals || 18

  return (
    <tr style={{ cursor: 'pointer' }} onClick={() => onNavigate(topup.id)}>
      <td>
        <span className="fw-semibold text-primary">{topup.id}</span>
      </td>
      <td>
        <div className="d-flex align-items-center">
          <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={28} className="me-2" />
          <div>
            <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{coinSymbol}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{networkName || networkSymbol}</div>
          </div>
        </div>
      </td>
      <td className="text-center">
        {topup.sweepId ? (
          <span className="fw-semibold">{topup.sweepId}</span>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td className="text-end text-nowrap">
        <span className="fw-semibold">
          {formatGasAmount(topup.topupGasRaw, decimals)}
        </span>
      </td>
      <td className="text-end text-nowrap">
        <span className="text-muted">
          {formatGasAmount(topup.requiredGasRaw, decimals)}
        </span>
      </td>
      <td className="text-center text-nowrap">
        <span className={statusBadgeClass(topup.status)}>
          {String(topup.status || '').toUpperCase()}
        </span>
      </td>
      <td>
        {topup.txHash ? (
          <div className="d-flex align-items-center">
            <span className="me-2">{topup.txHash}</span>
            <button
              className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
              onClick={() => onCopy(topup.txHash)}
              title="Copy tx hash"
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
          <div className="d-flex align-items-center">
            <span className="me-2">{topup.fromAddress}</span>
            <button
              className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
              onClick={() => onCopy(topup.fromAddress)}
              title="Copy address"
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
          <div className="d-flex align-items-center">
            <span className="me-2">{topup.toAddress}</span>
            <button
              className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
              onClick={() => onCopy(topup.toAddress)}
              title="Copy address"
            >
              <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
            </button>
          </div>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td className="text-center">
        <span className={topup.retryCount > 0 ? 'text-warning fw-semibold' : 'text-muted'}>
          {topup.retryCount || 0}
        </span>
      </td>
      <td className="text-nowrap" style={{ fontSize: '0.85rem' }}>
        {formatDate(topup.createdAt)}
      </td>
      <td className="text-nowrap" style={{ fontSize: '0.85rem' }}>
        {topup.completedAt ? formatDate(topup.completedAt) : <span className="text-muted">-</span>}
      </td>
    </tr>
  )
}
