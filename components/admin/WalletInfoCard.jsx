'use client'

import CoinImg from '@/components/CoinImg'
import { formatUsd } from '@/lib/utils/format'
import RefreshButton from '@/components/RefreshButton'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Table from '../ui/Table'

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
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h4 className="mb-1">
              <i className="bx bx-wallet mr-2"></i>
              {wallet?.walletName || t('admin.ledger.title', { defaultValue: 'Wallet Transactions' })}
            </h4>
            <p className="text-surface-500 mb-0">
              {wallet?.networkName || ''} &middot; {wallet?.purpose || ''} &middot; {wallet?.walletType || ''}
            </p>
          </div>
          <RefreshButton onClick={onRefresh} loading={loading} />
        </div>
      </div>
      <div className="p-5">
        {wallet && (
          <div className="grid grid-cols-12 gap-x-6 gap-3 mb-3">
            <div className="col-span-12 md:col-span-4">
              <small className="text-surface-500 block mb-1">
                <i className="bx bx-id-card mr-1"></i>Wallet ID
              </small>
              <span className="font-semibold">{wallet.id}</span>
            </div>
            <div className="col-span-12 md:col-span-4">
              <small className="text-surface-500 block mb-1">
                <i className="bx bx-category mr-1"></i>Purpose
              </small>
              <Badge color="info" label className="capitalize">
                {wallet.purpose || 'N/A'}
              </Badge>
            </div>
            <div className="col-span-12 md:col-span-4">
              <small className="text-surface-500 block mb-1">
                <i className="bx bx-chip mr-1"></i>Type
              </small>
              {wallet.walletType === 'hot' ? (
                <Badge color="warning" label>
                  <i className="bx bxs-hot mr-1"></i>Hot
                </Badge>
              ) : (
                <Badge color="info" label>
                  <i className="bx bx-shield mr-1"></i>Cold
                </Badge>
              )}
            </div>
            <div className="col-span-12">
              <small className="text-surface-500 block mb-1">
                <i className="bx bx-wallet mr-1"></i>Address
              </small>
              <div className="flex items-center gap-2">
                <code className="text-primary text-[0.875rem] break-all">{wallet.address || 'N/A'}</code>
                {wallet.address && (
                  <Button
                    onClick={(e) => onCopy(wallet.address, e)}
                    title={t('actions.copy', { defaultValue: 'Copy' })}
                    size="icon-sm"
                    variant="text-secondary"
                  >
                    <i className="bx bx-copy text-[1rem]"></i>
                  </Button>
                )}
              </div>
            </div>
            <div className="col-span-12 md:col-span-4">
              <small className="text-surface-500 block mb-1">
                <i className="bx bx-check-circle mr-1"></i>Status
              </small>
              {wallet.status === 'active' ? (
                <Badge color="success" label>
                  {t('admin.detail.active', { defaultValue: 'Active' })}
                </Badge>
              ) : (
                <Badge color="secondary">{wallet.status || 'N/A'}</Badge>
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
              <Table responsive={false} className="text-sm">
                <thead>
                  <tr className="whitespace-nowrap">
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
                          <CoinImg
                            symbol={asset.coinSymbol}
                            networkSymbol={asset.networkSymbol}
                            size={24}
                            className="mr-3"
                          />
                          <span className="font-medium">{asset.coinSymbol || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-surface-500">{asset.networkName || asset.networkSymbol || '-'}</span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        {formatAmount(asset.balance)} <span className="text-surface-500">{asset.coinSymbol}</span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        {asset.fiatValue ? formatUsd(asset.fiatValue.amount) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
