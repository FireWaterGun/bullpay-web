'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import CardEmptyState from '@/components/CardEmptyState'

function FeeTypeBadge({ config }) {
  if (config.fee?.fixed) {
    return <span className="badge bg-label-info">fixed</span>
  }
  if (config.fee?.percentage || config.fee?.min) {
    return <span className="badge bg-label-info">percentage</span>
  }
  if (config.fee?.type) {
    return <span className="badge bg-label-info">{config.fee.type}</span>
  }
  return <span className="text-muted">-</span>
}

function FeeConfigDisplay({ config }) {
  if (config.fee?.fixed) {
    return <code>Fixed: {config.fee.fixed}</code>
  }
  if (config.fee?.percentage || config.fee?.min) {
    return <code>{config.fee.percentage || '0'}% (min: {config.fee.min}{config.fee.max ? `, max: ${config.fee.max}` : ''})</code>
  }
  return <span className="text-muted">-</span>
}

const TABLE_CONFIG = {
  coin: {
    titleKey: 'admin.withdrawal.coinOverrides',
    titleDefault: 'Coin Overrides',
    emptyKey: 'admin.withdrawal.noCoinOverrides',
    emptyDefault: 'No coin overrides configured',
    firstColKey: 'admin.withdrawal.coin',
    firstColDefault: 'Coin',
    showMaximum: false
  },
  network: {
    titleKey: 'admin.withdrawal.networkOverrides',
    titleDefault: 'Network Overrides',
    emptyKey: 'admin.withdrawal.noNetworkOverrides',
    emptyDefault: 'No network overrides configured',
    firstColKey: 'admin.withdrawal.network',
    firstColDefault: 'Network',
    showMaximum: false
  },
  coinNetwork: {
    titleKey: 'admin.withdrawal.coinNetworkOverrides',
    titleDefault: 'Coin-Network Overrides',
    emptyKey: 'admin.withdrawal.noCoinNetworkOverrides',
    emptyDefault: 'No coin-network overrides configured',
    firstColKey: 'admin.withdrawal.coinNetworkId',
    firstColDefault: 'CoinNetwork ID',
    showMaximum: true
  }
}

export default function OverrideTable({ type, data, onEdit, loading }) {
  const { t } = useAdminTranslation()
  const cfg = TABLE_CONFIG[type]
  const entries = Object.entries(data)

  return (
    <div className={type !== 'coinNetwork' ? 'mb-5' : undefined}>
      <div className="mb-3">
        <div className="d-flex align-items-center">
          <div className="flex-grow-1">
            <h6 className="mb-0">
              {t(cfg.titleKey, { defaultValue: cfg.titleDefault })}
              <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                {entries.length}
              </span>
            </h6>
          </div>
          {/* Hidden: Add button */}
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>{t(cfg.firstColKey, { defaultValue: cfg.firstColDefault })}</th>
                <th>{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</th>
                {cfg.showMaximum && (
                  <th>{t('admin.withdrawal.maximum', { defaultValue: 'Maximum' })}</th>
                )}
                <th>{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</th>
                <th>{t('admin.withdrawal.feeConfig', { defaultValue: 'Fee Config' })}</th>
                <th className="text-end">{t('admin.detail.actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, config]) => (
                <tr key={key}>
                  <td><strong>{key}</strong></td>
                  <td>
                    {config.minimum ? (
                      <code>{config.minimum}</code>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  {cfg.showMaximum && (
                    <td>
                      {config.maximum ? (
                        <code>{config.maximum}</code>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  )}
                  <td><FeeTypeBadge config={config} /></td>
                  <td><FeeConfigDisplay config={config} /></td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-icon me-1"
                      onClick={() => onEdit(type, key, config)}
                      disabled={loading}
                    >
                      <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <CardEmptyState
          icon="bx-data"
          message={t(cfg.emptyKey, { defaultValue: cfg.emptyDefault })}
        />
      )}
    </div>
  )
}
