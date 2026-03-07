import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { formatMs, formatPercent, formatUsd } from '@/lib/utils/settingsFormatters'

const NETWORKS = [
  { key: 'eth', name: 'Ethereum', symbol: 'ETH', icon: '/assets/img/coins/eth.svg' },
  { key: 'bsc', name: 'BNB Smart Chain', symbol: 'BSC', icon: '/assets/img/coins/bsc.svg' },
  { key: 'pol', name: 'Polygon', symbol: 'POL', icon: '/assets/img/coins/pol.svg' },
  { key: 'arbitrum', name: 'Arbitrum', symbol: 'ARBITRUM', icon: '/assets/img/coins/arbitrum.svg' },
  { key: 'optimism', name: 'Optimism', symbol: 'OPTIMISM', icon: '/assets/img/coins/optimism.svg' },
  { key: 'base', name: 'Base', symbol: 'BASE', icon: '/assets/img/coins/base.svg' },
  { key: 'avax', name: 'Avalanche', symbol: 'AVAX', icon: '/assets/img/coins/avax.svg' },
]

export default function RbfNetworkTab({ t, getVal, openNetworkEdit }) {
  return (
    <Card>
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300">
        <h6 className="mb-1">
          <i className="bx bx-network-chart mr-1 text-primary"></i>
          {t('admin.rbfSettings.networkTitle', { defaultValue: 'Per-Network Configuration' })}
        </h6>
        <p className="text-sm text-surface-500 mb-0">
          {t('admin.rbfSettings.networkInfo', {
            defaultValue: 'Gas bump percentages, timing thresholds, and cost limits per network.',
          })}
        </p>
      </div>

      {/* Table */}
      <Table>
        <thead>
          <tr>
            <th>{t('admin.rbfSettings.colNetwork', { defaultValue: 'Network' })}</th>
            <th className="text-center">{t('admin.rbfSettings.colStatus', { defaultValue: 'Status' })}</th>
            <th className="text-center">{t('admin.rbfSettings.colGasBump', { defaultValue: 'Gas Bump' })}</th>
            <th className="text-center">{t('admin.rbfSettings.colMinPending', { defaultValue: 'Min Pending' })}</th>
            <th className="text-center">
              {t('admin.rbfSettings.colReplaceInterval', { defaultValue: 'Replace Interval' })}
            </th>
            <th className="text-center">{t('admin.rbfSettings.colMinAmount', { defaultValue: 'Min Amount' })}</th>
            <th className="text-center">{t('admin.rbfSettings.colMaxCost', { defaultValue: 'Max Cost' })}</th>
            <th className="text-right">{t('admin.rbfSettings.colActions', { defaultValue: 'Actions' })}</th>
          </tr>
        </thead>
        <tbody>
          {NETWORKS.map((net) => {
            const enabled = getVal(`rbf.${net.key}.enabled`, '')
            const gasBump = getVal(`rbf.${net.key}.gas_bump_percent`, '')
            const minPending = getVal(`rbf.${net.key}.min_pending_duration`, '')
            const replaceInterval = getVal(`rbf.${net.key}.min_time_between_replaces`, '')
            const minAmount = getVal(`rbf.${net.key}.min_amount_usd`, '')
            const maxCost = getVal(`rbf.${net.key}.max_cost_usd`, '')

            return (
              <tr key={net.key}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <img src={net.icon} alt={net.symbol} className="w-7 h-7 rounded-full shrink-0" />
                    <div>
                      <strong>{net.name}</strong>
                      <div className="text-surface-500 text-xs">{net.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <Badge
                    color={enabled === 'true' ? 'success' : enabled === 'false' ? 'danger' : 'secondary'}
                    label
                    className="rounded-full"
                  >
                    {enabled === 'true'
                      ? t('admin.rbfSettings.enabled', { defaultValue: 'Enabled' })
                      : enabled === 'false'
                        ? t('admin.rbfSettings.disabled', { defaultValue: 'Disabled' })
                        : '—'}
                  </Badge>
                </td>
                <td className="text-center">
                  <span className="font-semibold">{formatPercent(gasBump)}</span>
                </td>
                <td className="text-center">
                  <span className="font-semibold">{formatMs(minPending)}</span>
                </td>
                <td className="text-center">
                  <span className="font-semibold">{formatMs(replaceInterval)}</span>
                </td>
                <td className="text-center">
                  <span className="font-semibold">{formatUsd(minAmount)}</span>
                </td>
                <td className="text-center">
                  <span className="font-semibold">{formatUsd(maxCost)}</span>
                </td>
                <td className="text-right">
                  <Button
                    title={t('admin.rbfSettings.edit', { defaultValue: 'Edit' })}
                    onClick={() => openNetworkEdit(net)}
                    variant="text-secondary"
                    size="icon-sm"
                  >
                    <i className="bx bx-edit text-[1rem]"></i>
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>

      {/* How it works */}
      <div className="px-5 py-4 border-t border-surface-200/40 dark:border-surface-200">
        <h6 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
          {t('admin.rbfSettings.howRbfWorks', { defaultValue: 'How RBF Works' })}
        </h6>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-100 dark:bg-white/[0.03]">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-info-100 text-info-600 shrink-0 dark:bg-info-600/20">
            <i className="bx bx-refresh text-xs"></i>
          </span>
          <div className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
            {t('admin.rbfSettings.howRbfWorksDesc', {
              defaultValue:
                'When a transaction is stuck pending longer than Min Pending duration, the system bumps the gas price by the Gas Bump percentage and resubmits. Replacements are spaced by the Replace Interval. Cost guards prevent uneconomical replacements.',
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
