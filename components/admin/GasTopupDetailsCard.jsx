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
  t,
}) {
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bx bx-detail me-2"></i>
          {t('admin.gasTopup.details', { defaultValue: 'Details' })}
        </h5>
      </div>
      <div className="card-body">
        <table className="table table-borderless">
          <tbody>
            <tr>
              <td className="text-muted" style={{ width: '40%' }}>{t('admin.gasTopup.id', { defaultValue: 'ID' })}</td>
              <td className="fw-medium">{topup.id}</td>
            </tr>
            {topup.sweepId && (
              <tr>
                <td className="text-muted">{t('admin.gasTopup.sweepId', { defaultValue: 'Sweep ID' })}</td>
                <td>
                  <a href={`/admin/sweeps/${topup.sweepId}`} className="fw-medium">
                    {topup.sweepId}
                  </a>
                </td>
              </tr>
            )}
            <tr>
              <td className="text-muted">{t('admin.gasTopup.coinNetworkId', { defaultValue: 'Coin Network ID' })}</td>
              <td>{topup.coinNetworkId || 'N/A'}</td>
            </tr>
            {coinSymbol && (
              <tr>
                <td className="text-muted">{t('admin.gasTopup.coin', { defaultValue: 'Coin' })}</td>
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
              <td className="text-muted">{t('admin.gasTopup.status', { defaultValue: 'Status' })}</td>
              <td><span className={statusBadgeClass(topup.status)}>{String(topup.status || '').toUpperCase()}</span></td>
            </tr>
            <tr>
              <td className="text-muted">{t('admin.gasTopup.topupGas', { defaultValue: 'Topup Gas' })}</td>
              <td>
                <span className="fw-bold">
                  {formatAmount(topup.topupGasRaw, decimals)}
                </span>
              </td>
            </tr>
            <tr>
              <td className="text-muted">{t('admin.gasTopup.topupGasRaw', { defaultValue: 'Topup Gas (Raw)' })}</td>
              <td><code style={{ fontSize: '0.8rem' }}>{topup.topupGasRaw || 'N/A'}</code></td>
            </tr>
            <tr>
              <td className="text-muted">{t('admin.gasTopup.requiredGas', { defaultValue: 'Required Gas' })}</td>
              <td>
                <span className="fw-medium">
                  {formatAmount(topup.requiredGasRaw, decimals)}
                </span>
              </td>
            </tr>
            <tr>
              <td className="text-muted">{t('admin.gasTopup.requiredGasRaw', { defaultValue: 'Required Gas (Raw)' })}</td>
              <td><code style={{ fontSize: '0.8rem' }}>{topup.requiredGasRaw || 'N/A'}</code></td>
            </tr>
            <tr>
              <td className="text-muted">{t('admin.gasTopup.decimals', { defaultValue: 'Decimals' })}</td>
              <td>{decimals}</td>
            </tr>
            {topup.nonce != null && (
              <tr>
                <td className="text-muted">{t('admin.gasTopup.nonce', { defaultValue: 'Nonce' })}</td>
                <td>{topup.nonce}</td>
              </tr>
            )}
            <tr>
              <td className="text-muted">{t('admin.gasTopup.retryCount', { defaultValue: 'Retry Count' })}</td>
              <td>
                <span className={topup.retryCount > 0 ? 'text-warning fw-semibold' : ''}>
                  {topup.retryCount || 0} / {topup.maxRetries ?? 'N/A'}
                </span>
              </td>
            </tr>
            {topup.systemWalletId && (
              <tr>
                <td className="text-muted">{t('admin.gasTopup.systemWalletId', { defaultValue: 'System Wallet ID' })}</td>
                <td>{topup.systemWalletId}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
