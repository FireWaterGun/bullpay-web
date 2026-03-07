'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import CardEmptyState from '@/components/CardEmptyState'
import Button from '../ui/Button'
import Table from '../ui/Table'

/**
 * Reusable override table for coin or network sweep overrides.
 *
 * @param {Object} props
 * @param {Object} props.overrides - Key-value map of overrides (e.g. { BTC: { minBalance, gasBuffer } })
 * @param {'coin'|'network'} props.type - Whether this table shows coin or network overrides
 * @param {boolean} props.loading - Disables action buttons when true
 * @param {Function} props.onEdit - Called with (key, config) when the edit button is clicked
 */
export default function SweepOverrideTable({ overrides, type, loading, onEdit }) {
  const { t } = useAdminTranslation()

  const isCoin = type === 'coin'

  const idLabel = isCoin
    ? t('admin.sweep.coin', { defaultValue: 'Coin' })
    : t('admin.sweep.coinNetworkId', { defaultValue: 'Coin-Network ID' })

  const emptyMessage = isCoin
    ? t('admin.sweep.noOverrides', { defaultValue: 'No coin overrides configured' })
    : t('admin.sweep.noNetworkOverrides', { defaultValue: 'No network overrides configured' })

  const emptyHelp = isCoin
    ? t('admin.sweep.noOverridesHelp', {
        defaultValue: 'Add coin overrides to customize sweep settings per cryptocurrency',
      })
    : t('admin.sweep.noNetworkOverridesHelp', {
        defaultValue: 'Add network overrides to customize sweep settings per network',
      })

  const entries = Object.entries(overrides)

  if (entries.length === 0) {
    return <CardEmptyState icon={isCoin ? 'bx-data' : 'bx-network-chart'} message={emptyMessage} sub={emptyHelp} />
  }

  return (
    <Table>
      <thead>
        <tr>
          <th>{idLabel}</th>
          <th>{t('admin.sweep.minBalance', { defaultValue: 'Min Balance' })}</th>
          <th>{t('admin.sweep.gasBuffer', { defaultValue: 'Gas Buffer' })}</th>
          <th className="text-right">{t('actions.actions', { defaultValue: 'Actions' })}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, config]) => (
          <tr key={key}>
            <td>
              <strong>{key}</strong>
            </td>
            <td>
              {config.minBalance !== undefined ? (
                <code>{config.minBalance}</code>
              ) : (
                <span className="text-surface-500">-</span>
              )}
            </td>
            <td>
              {config.gasBuffer !== undefined ? (
                <code>{config.gasBuffer}</code>
              ) : (
                <span className="text-surface-500">-</span>
              )}
            </td>
            <td className="text-right">
              <Button type="button" onClick={() => onEdit(key, config)} disabled={loading} size="icon" className="mr-1">
                <i className="bx bx-edit text-primary text-xl"></i>
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
