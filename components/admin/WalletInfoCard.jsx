'use client'

import CoinImg from '@/components/CoinImg'
import { formatUsd } from '@/lib/utils/format'
import RefreshButton from '@/components/RefreshButton'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'

function formatAmount(val) {
  if (!val && val !== 0) return '0'
  let str = String(val)
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '')
  }
  return str || '0'
}

export default function WalletInfoCard({ wallet, assets, t, loading, onRefresh, onCopy }) {
  return (
    <div className="card mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h4 className="mb-1">
              <i className="bx bx-wallet mr-2"></i>
              {wallet?.walletName || t('admin.ledger.title', { defaultValue: 'Wallet Transactions' })}
            </h4>
            <p className="text-muted mb-0">
              {wallet?.networkName || ''} &middot; {wallet?.purpose || ''} &middot; {wallet?.walletType || ''}
            </p>
          </div>
          <RefreshButton onClick={onRefresh} loading={loading} />
        </div>
      </div>
      <div className="p-5">
        {wallet && (
          <div className="grid grid-cols-12 gap-x-6 gap-3 mb-3">
            <div className="md:col-span-4">
              <small className="text-muted block mb-1">
                <i className="bx bx-id-card mr-1"></i>Wallet ID
              </small>
              <span className="font-semibold">{wallet.id}</span>
            </div>
            <div className="md:col-span-4">
              <small className="text-muted block mb-1">
                <i className="bx bx-category mr-1"></i>Purpose
              </small>
              <span className="badge bg-cyan-50 text-cyan-700 capitalize">{wallet.purpose || 'N/A'}</span>
            </div>
            <div className="md:col-span-4">
              <small className="text-muted block mb-1">
                <i className="bx bx-chip mr-1"></i>Type
              </small>
              {wallet.walletType === 'hot' ? (
                <span className="badge bg-amber-50 text-amber-700">
                  <i className="bx bx-hot mr-1"></i>Hot
                </span>
              ) : (
                <span className="badge bg-cyan-50 text-cyan-700">
                  <i className="bx bx-shield mr-1"></i>Cold
                </span>
              )}
            </div>
            <div className="col-span-12">
              <small className="text-muted block mb-1">
                <i className="bx bx-wallet mr-1"></i>Address
              </small>
              <div className="flex items-center gap-2">
                <code className="text-primary" style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>
                  {wallet.address || 'N/A'}
                </code>
                {wallet.address && (
                  <button
                    onClick={(e) => onCopy(wallet.address, e)}
                    className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full"
                    title={t('actions.copy', { defaultValue: 'Copy' })}
                  >
                    <i className="bx bx-copy" style={{ fontSize: '1rem' }}></i>
                  </button>
                )}
              </div>
            </div>
            <div className="md:col-span-4">
              <small className="text-muted block mb-1">
                <i className="bx bx-check-circle mr-1"></i>Status
              </small>
              {wallet.status === 'active' ? (
                <span className="badge bg-green-50 text-green-700">{t('admin.detail.active', { defaultValue: 'Active' })}</span>
              ) : (
                <span className="badge bg-surface-100 text-surface-600">{wallet.status || 'N/A'}</span>
              )}
            </div>
          </div>
        )}

        {assets.length > 0 && (
          <>
            <hr className="my-3" />
            <h6 className="mb-3">
              <i className="bx bx-coin-stack mr-1"></i>
              Assets ({assets.length})
            </h6>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ whiteSpace: 'nowrap' }}>
                    <th>{t('admin.detail.coin', { defaultValue: 'Coin' })}</th>
                    <th>{t('admin.detail.network', { defaultValue: 'Network' })}</th>
                    <th className="text-right">Balance</th>
                    <th className="text-right">USD Value</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={`${asset.coinSymbol}-${asset.networkSymbol}`}>
                      <td>
                        <div className="flex items-center">
                          <CoinImg symbol={asset.coinSymbol} networkSymbol={asset.networkSymbol} size={24} className="mr-3" />
                          <span className="font-medium">{asset.coinSymbol || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted">{asset.networkName || asset.networkSymbol || '-'}</span>
                      </td>
                      <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                        {formatAmount(asset.balance)} <span className="text-muted">{asset.coinSymbol}</span>
                      </td>
                      <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                        {asset.fiatValue ? formatUsd(asset.fiatValue.amount) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
