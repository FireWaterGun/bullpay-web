import { useTranslation } from 'react-i18next'

/**
 * Read-only info sidebar panel shown in edit mode.
 * Displays network metadata and supported coins list.
 */
export default function NetworkInfoPanel({ networkMeta }) {
  const { t } = useTranslation()

  return (
    <div className="col-12 col-xl-4">
      <div className="card mb-4">
        <h5 className="card-header">{t('crypto.networkInfo', { defaultValue: 'Network Info' })}</h5>
        <div className="card-body">
          <ul className="list-unstyled mb-0">
            <li className="d-flex justify-content-between mb-3">
              <span className="text-muted">ID</span>
              <span className="fw-medium">#{networkMeta.id}</span>
            </li>
            {networkMeta.wsUrl && (
              <li className="mb-3">
                <span className="text-muted d-block mb-1">WebSocket URL</span>
                <code className="small" style={{ wordBreak: 'break-all' }}>{networkMeta.wsUrl}</code>
              </li>
            )}
            <li className="d-flex justify-content-between mb-3">
              <span className="text-muted">{t('crypto.coinsCount', { defaultValue: 'Supported Coins' })}</span>
              <span className="badge bg-label-primary">{networkMeta.coinsCount}</span>
            </li>
            {networkMeta.createdAt && (
              <li className="d-flex justify-content-between mb-3">
                <span className="text-muted">{t('common.createdAt', { defaultValue: 'Created' })}</span>
                <span className="small">{new Date(networkMeta.createdAt).toLocaleString()}</span>
              </li>
            )}
            {networkMeta.updatedAt && (
              <li className="d-flex justify-content-between mb-3">
                <span className="text-muted">{t('common.updatedAt', { defaultValue: 'Updated' })}</span>
                <span className="small">{new Date(networkMeta.updatedAt).toLocaleString()}</span>
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
                  <div key={coin.id} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fw-medium">{coin.coinSymbol}</span>
                      <small className="text-muted d-block">{coin.coinName}</small>
                    </div>
                    <div className="text-end">
                      <span className={`badge bg-label-${coin.status === 'active' ? 'success' : 'secondary'} me-1`}>{coin.status}</span>
                      {coin.depositEnabled && <span className="badge bg-label-info me-1">Deposit</span>}
                      {coin.withdrawEnabled && <span className="badge bg-label-warning">Withdraw</span>}
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
