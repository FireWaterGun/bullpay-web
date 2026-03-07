'use client'

import CoinImg from '@/components/CoinImg'
import Card from '../ui/Card'
import Table from '../ui/Table'

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
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-detail mr-2"></i>
          {t('admin.gasTopup.details', { defaultValue: 'Details' })}
        </h5>
      </div>
      <div className="p-5">
        <Table>
          <tbody>
            <tr>
              <td className="text-surface-500 w-2/5">{t('admin.gasTopup.id', { defaultValue: 'ID' })}</td>
              <td className="font-medium">{topup.id}</td>
            </tr>
            {topup.sweepId && (
              <tr>
                <td className="text-surface-500">{t('admin.gasTopup.sweepId', { defaultValue: 'Sweep ID' })}</td>
                <td>
                  <a href={`/admin/sweeps/${topup.sweepId}`} className="font-medium">
                    {topup.sweepId}
                  </a>
                </td>
              </tr>
            )}
            <tr>
              <td className="text-surface-500">
                {t('admin.gasTopup.coinNetworkId', { defaultValue: 'Coin Network ID' })}
              </td>
              <td>{topup.coinNetworkId || 'N/A'}</td>
            </tr>
            {coinSymbol && (
              <tr>
                <td className="text-surface-500">{t('admin.gasTopup.coin', { defaultValue: 'Coin' })}</td>
                <td>
                  <div className="flex items-center">
                    <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} className="mr-3" />
                    <div>
                      <span className="font-medium">{coinSymbol}</span>
                      {networkName && <small className="text-surface-500 ml-1">/ {networkName}</small>}
                    </div>
                  </div>
                </td>
              </tr>
            )}
            <tr>
              <td className="text-surface-500">{t('admin.gasTopup.status', { defaultValue: 'Status' })}</td>
              <td>
                <span className={statusBadgeClass(topup.status)}>{String(topup.status || '').toUpperCase()}</span>
              </td>
            </tr>
            <tr>
              <td className="text-surface-500">{t('admin.gasTopup.topupGas', { defaultValue: 'Topup Gas' })}</td>
              <td>
                <span className="font-bold">{formatAmount(topup.topupGasRaw, decimals)}</span>
              </td>
            </tr>
            <tr>
              <td className="text-surface-500">
                {t('admin.gasTopup.topupGasRaw', { defaultValue: 'Topup Gas (Raw)' })}
              </td>
              <td>
                <code className="text-[0.8rem]">{topup.topupGasRaw || 'N/A'}</code>
              </td>
            </tr>
            <tr>
              <td className="text-surface-500">{t('admin.gasTopup.requiredGas', { defaultValue: 'Required Gas' })}</td>
              <td>
                <span className="font-medium">{formatAmount(topup.requiredGasRaw, decimals)}</span>
              </td>
            </tr>
            <tr>
              <td className="text-surface-500">
                {t('admin.gasTopup.requiredGasRaw', { defaultValue: 'Required Gas (Raw)' })}
              </td>
              <td>
                <code className="text-[0.8rem]">{topup.requiredGasRaw || 'N/A'}</code>
              </td>
            </tr>
            <tr>
              <td className="text-surface-500">{t('admin.gasTopup.decimals', { defaultValue: 'Decimals' })}</td>
              <td>{decimals}</td>
            </tr>
            {topup.nonce != null && (
              <tr>
                <td className="text-surface-500">{t('admin.gasTopup.nonce', { defaultValue: 'Nonce' })}</td>
                <td>{topup.nonce}</td>
              </tr>
            )}
            <tr>
              <td className="text-surface-500">{t('admin.gasTopup.retryCount', { defaultValue: 'Retry Count' })}</td>
              <td>
                <span className={topup.retryCount > 0 ? 'text-warning font-semibold' : ''}>
                  {topup.retryCount || 0} / {topup.maxRetries ?? 'N/A'}
                </span>
              </td>
            </tr>
            {topup.systemWalletId && (
              <tr>
                <td className="text-surface-500">
                  {t('admin.gasTopup.systemWalletId', { defaultValue: 'System Wallet ID' })}
                </td>
                <td>{topup.systemWalletId}</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </Card>
  )
}
