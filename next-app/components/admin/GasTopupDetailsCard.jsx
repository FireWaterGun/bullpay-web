'use client'

import CoinImg from '@/components/CoinImg'

export default function GasTopupDetailsCard({
  topup,
  coinSymbol,
  networkSymbol,
  networkName,
  decimals,
  formatAmount,
  statusBadgeClass,
}) {
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bx bx-detail me-2"></i>
          Details
        </h5>
      </div>
      <div className="card-body">
        <table className="table table-borderless">
          <tbody>
            <tr>
              <td className="text-muted" style={{ width: '40%' }}>ID</td>
              <td className="fw-medium">{topup.id}</td>
            </tr>
            {topup.sweepId && (
              <tr>
                <td className="text-muted">Sweep ID</td>
                <td>
                  <a href={`/admin/sweeps/${topup.sweepId}`} className="fw-medium">
                    {topup.sweepId}
                  </a>
                </td>
              </tr>
            )}
            <tr>
              <td className="text-muted">Coin Network ID</td>
              <td>{topup.coinNetworkId || 'N/A'}</td>
            </tr>
            {coinSymbol && (
              <tr>
                <td className="text-muted">Coin</td>
                <td>
                  <div className="d-flex align-items-center">
                    <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} className="me-3" />
                    <div>
                      <span className="fw-medium">{coinSymbol}</span>
                      {networkName && (
                        <small className="text-muted ms-1">/ {networkName}</small>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )}
            <tr>
              <td className="text-muted">Status</td>
              <td><span className={statusBadgeClass(topup.status)}>{String(topup.status || '').toUpperCase()}</span></td>
            </tr>
            <tr>
              <td className="text-muted">Topup Gas</td>
              <td>
                <span className="fw-bold">
                  {formatAmount(topup.topupGasRaw, decimals)}
                </span>
              </td>
            </tr>
            <tr>
              <td className="text-muted">Topup Gas (Raw)</td>
              <td><code style={{ fontSize: '0.8rem' }}>{topup.topupGasRaw || 'N/A'}</code></td>
            </tr>
            <tr>
              <td className="text-muted">Required Gas</td>
              <td>
                <span className="fw-medium">
                  {formatAmount(topup.requiredGasRaw, decimals)}
                </span>
              </td>
            </tr>
            <tr>
              <td className="text-muted">Required Gas (Raw)</td>
              <td><code style={{ fontSize: '0.8rem' }}>{topup.requiredGasRaw || 'N/A'}</code></td>
            </tr>
            <tr>
              <td className="text-muted">Decimals</td>
              <td>{decimals}</td>
            </tr>
            {topup.nonce != null && (
              <tr>
                <td className="text-muted">Nonce</td>
                <td>{topup.nonce}</td>
              </tr>
            )}
            <tr>
              <td className="text-muted">Retry Count</td>
              <td>
                <span className={topup.retryCount > 0 ? 'text-warning fw-semibold' : ''}>
                  {topup.retryCount || 0} / {topup.maxRetries ?? 'N/A'}
                </span>
              </td>
            </tr>
            {topup.systemWalletId && (
              <tr>
                <td className="text-muted">System Wallet ID</td>
                <td>{topup.systemWalletId}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
