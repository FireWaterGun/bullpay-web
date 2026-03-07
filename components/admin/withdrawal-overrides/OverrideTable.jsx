'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import CardEmptyState from '@/components/CardEmptyState'
import Badge from '../../ui/Badge'
import Button from '../../ui/Button'
import Table from '@/components/ui/Table'

function FeeTypeBadge({ config }) {
  if (config.fee?.fixed) {
    return (
      <Badge color="info" label>
        fixed
      </Badge>
    )
  }
  if (config.fee?.percentage || config.fee?.min) {
    return (
      <Badge color="info" label>
        percentage
      </Badge>
    )
  }
  if (config.fee?.type) {
    return (
      <Badge color="info" label>
        {config.fee.type}
      </Badge>
    )
  }
  return <span className="text-surface-500">-</span>
}

function FeeConfigDisplay({ config }) {
  if (config.fee?.fixed) {
    return <code>Fixed: {config.fee.fixed}</code>
  }
  if (config.fee?.percentage || config.fee?.min) {
    return (
      <code>
        {config.fee.percentage || '0'}% (min: {config.fee.min}
        {config.fee.max ? `, max: ${config.fee.max}` : ''})
      </code>
    )
  }
  return <span className="text-surface-500">-</span>
}

const TABLE_CONFIG = {
  coin: {
    titleKey: 'admin.withdrawal.coinOverrides',
    titleDefault: 'Coin Overrides',
    emptyKey: 'admin.withdrawal.noCoinOverrides',
    emptyDefault: 'No coin overrides configured',
    firstColKey: 'admin.withdrawal.coin',
    firstColDefault: 'Coin',
    showMaximum: false,
  },
  network: {
    titleKey: 'admin.withdrawal.networkOverrides',
    titleDefault: 'Network Overrides',
    emptyKey: 'admin.withdrawal.noNetworkOverrides',
    emptyDefault: 'No network overrides configured',
    firstColKey: 'admin.withdrawal.network',
    firstColDefault: 'Network',
    showMaximum: false,
  },
  coinNetwork: {
    titleKey: 'admin.withdrawal.coinNetworkOverrides',
    titleDefault: 'Coin-Network Overrides',
    emptyKey: 'admin.withdrawal.noCoinNetworkOverrides',
    emptyDefault: 'No coin-network overrides configured',
    firstColKey: 'admin.withdrawal.coinNetworkId',
    firstColDefault: 'CoinNetwork ID',
    showMaximum: true,
  },
}

export default function OverrideTable({ type, data, onEdit, loading }) {
  const { t } = useAdminTranslation()
  const cfg = TABLE_CONFIG[type]
  const entries = Object.entries(data)

  return (
    <div className={type !== 'coinNetwork' ? 'mb-5' : undefined}>
      <div className="mb-3">
        <div className="flex items-center">
          <div className="grow">
            <h6 className="mb-0">
              {t(cfg.titleKey, { defaultValue: cfg.titleDefault })}
              <Badge className="rounded-full bg-primary ml-2 text-xs py-[0.35em] px-[0.65em]">{entries.length}</Badge>
            </h6>
          </div>
          {/* Hidden: Add button */}
        </div>
      </div>

      {entries.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <th>{t(cfg.firstColKey, { defaultValue: cfg.firstColDefault })}</th>
              <th>{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</th>
              {cfg.showMaximum && <th>{t('admin.withdrawal.maximum', { defaultValue: 'Maximum' })}</th>}
              <th>{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</th>
              <th>{t('admin.withdrawal.feeConfig', { defaultValue: 'Fee Config' })}</th>
              <th className="text-right">{t('admin.detail.actions', { defaultValue: 'Actions' })}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, config]) => (
              <tr key={key}>
                <td>
                  <strong>{key}</strong>
                </td>
                <td>{config.minimum ? <code>{config.minimum}</code> : <span className="text-surface-500">-</span>}</td>
                {cfg.showMaximum && (
                  <td>
                    {config.maximum ? <code>{config.maximum}</code> : <span className="text-surface-500">-</span>}
                  </td>
                )}
                <td>
                  <FeeTypeBadge config={config} />
                </td>
                <td>
                  <FeeConfigDisplay config={config} />
                </td>
                <td className="text-right">
                  <Button
                    type="button"
                    onClick={() => onEdit(type, key, config)}
                    disabled={loading}
                    size="icon"
                    className="mr-1"
                  >
                    <i className="bx bx-edit text-primary text-xl"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <CardEmptyState icon="bx-data" message={t(cfg.emptyKey, { defaultValue: cfg.emptyDefault })} />
      )}
    </div>
  )
}
