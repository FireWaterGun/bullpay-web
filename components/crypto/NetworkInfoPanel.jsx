'use client'

import { useTranslation } from 'react-i18next'
import { useDateFormat } from '@/hooks/useDateFormat'

/**
 * Read-only info sidebar panel shown in edit mode.
 * Displays network metadata and supported coins list.
 */
export default function NetworkInfoPanel({ networkMeta }) {
  const { t } = useTranslation()
  const { fmtDate } = useDateFormat()

  return (
    <div className="col-span-12 xl:col-span-4">
      <div className="card mb-4">
        <h5 className="px-5 py-4 border-b border-surface-200">{t('crypto.networkInfo', { defaultValue: 'Network Info' })}</h5>
        <div className="p-5">
          <ul className="list-unstyled mb-0">
            <li className="flex justify-between mb-3">
              <span className="text-muted">ID</span>
              <span className="font-medium">#{networkMeta.id}</span>
            </li>
            {networkMeta.wsUrl && (
              <li className="mb-3">
                <span className="text-muted block mb-1">WebSocket URL</span>
                <code className="text-sm" style={{ wordBreak: 'break-all' }}>{networkMeta.wsUrl}</code>
              </li>
            )}
            <li className="flex justify-between mb-3">
              <span className="text-muted">{t('crypto.coinsCount', { defaultValue: 'Supported Coins' })}</span>
              <span className="badge bg-primary-50 text-primary-600">{networkMeta.coinsCount}</span>
            </li>
            {networkMeta.createdAt && (
              <li className="flex justify-between mb-3">
                <span className="text-muted">{t('common.createdAt', { defaultValue: 'Created' })}</span>
                <span className="text-sm">{fmtDate(networkMeta.createdAt)}</span>
              </li>
            )}
            {networkMeta.updatedAt && (
              <li className="flex justify-between mb-3">
                <span className="text-muted">{t('common.updatedAt', { defaultValue: 'Updated' })}</span>
                <span className="text-sm">{fmtDate(networkMeta.updatedAt)}</span>
              </li>
            )}
          </ul>

          {/* Supported Coins List */}
          {networkMeta.supportedCoins.length > 0 && (
            <>
              <hr />
              <h6 className="mb-3">{t('crypto.supportedCoins', { defaultValue: 'Supported Coins' })}</h6>
              <div className="list-group list-group-flush">
                {networkMeta.supportedCoins.map((coin) => (
                  <div key={coin.id} className="list-group-item px-0 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{coin.coinSymbol}</span>
                      <small className="text-muted block">{coin.coinName}</small>
                    </div>
                    <div className="text-right">
                      <span className={`badge bg-label-${coin.status ==='active' ? 'success' : 'secondary'} mr-1`}>{coin.status}</span>
                      {coin.depositEnabled && <span className="badge bg-cyan-50 text-cyan-700 mr-1">Deposit</span>}
                      {coin.withdrawEnabled && <span className="badge bg-amber-50 text-amber-700">Withdraw</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
