'use client'

import CoinImg from '@/components/CoinImg'
import { formatUsd } from '@/lib/utils/format'
import RefreshButton from '@/components/RefreshButton'
import { useTranslation } from 'react-i18next'

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
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h4 className="mb-1">
              <i className="bx bx-wallet me-2"></i>
              {wallet?.walletName || t('admin.ledger.title', { defaultValue: 'Wallet Transactions' })}
            </h4>
            <p className="text-muted mb-0">
              {wallet?.networkName || ''} &middot; {wallet?.purpose || ''} &middot; {wallet?.walletType || ''}
            </p>
          </div>
          <RefreshButton onClick={onRefresh} loading={loading} />
        </div>
      </div>
      <div className="card-body">
        {wallet && (
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <small className="text-muted d-block mb-1">
                <i className="bx bx-id-card me-1"></i>Wallet ID
              </small>
              <span className="fw-semibold">{wallet.id}</span>
            </div>
            <div className="col-md-4">
              <small className="text-muted d-block mb-1">
                <i className="bx bx-category me-1"></i>Purpose
              </small>
              <span className="badge bg-label-info text-capitalize">{wallet.purpose || 'N/A'}</span>
            </div>
            <div className="col-md-4">
              <small className="text-muted d-block mb-1">
                <i className="bx bx-chip me-1"></i>Type
              </small>
              {wallet.walletType === 'hot' ? (
                <span className="badge bg-label-warning">
                  <i className="bx bx-hot me-1"></i>Hot
                </span>
              ) : (
                <span className="badge bg-label-info">
                  <i className="bx bx-shield me-1"></i>Cold
                </span>
              )}
            </div>
            <div className="col-12">
              <small className="text-muted d-block mb-1">
                <i className="bx bx-wallet me-1"></i>Address
              </small>
              <div className="d-flex align-items-center gap-2">
                <code className="text-primary" style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>
                  {wallet.address || 'N/A'}
                </code>
                {wallet.address && (
                  <button
                    onClick={(e) => onCopy(wallet.address, e)}
                    className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                    title={t('actions.copy', { defaultValue: 'Copy' })}
                  >
                    <i className="bx bx-copy" style={{ fontSize: '1rem' }}></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-4">
              <small className="text-muted d-block mb-1">
                <i className="bx bx-check-circle me-1"></i>Status
              </small>
              {wallet.status === 'active' ? (
                <span className="badge bg-label-success">{t('admin.detail.active', { defaultValue: 'Active' })}</span>
              ) : (
                <span className="badge bg-label-secondary">{wallet.status || 'N/A'}</span>
              )}
            </div>
          </div>
        )}

        {assets.length > 0 && (
          <>
            <hr className="my-3" />
            <h6 className="mb-3">
              <i className="bx bx-coin-stack me-1"></i>
              Assets ({assets.length})
            </h6>
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr style={{ whiteSpace: 'nowrap' }}>
                    <th>{t('admin.detail.coin', { defaultValue: 'Coin' })}</th>
                    <th>{t('admin.detail.network', { defaultValue: 'Network' })}</th>
                    <th className="text-end">Balance</th>
                    <th className="text-end">USD Value</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={`${asset.coinSymbol}-${asset.networkSymbol}`}>
                      <td>
                        <div className="d-flex align-items-center">
                          <CoinImg symbol={asset.coinSymbol} networkSymbol={asset.networkSymbol} size={24} className="me-3" />
                          <span className="fw-medium">{asset.coinSymbol || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted">{asset.networkName || asset.networkSymbol || '-'}</span>
                      </td>
                      <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                        {formatAmount(asset.balance)} <span className="text-muted">{asset.coinSymbol}</span>
                      </td>
                      <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
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
