import { Alert, Badge, Button, Card } from '@/components/ui';
import Table from '@/components/ui/Table';
import { formatMs, formatPercent, formatUsd } from '@/lib/utils/settingsFormatters';

const NETWORKS = [
  { key: 'eth', name: 'Ethereum', symbol: 'ETH' },
  { key: 'bsc', name: 'BNB Smart Chain', symbol: 'BSC' },
  { key: 'pol', name: 'Polygon', symbol: 'POL' },
  { key: 'arbitrum', name: 'Arbitrum', symbol: 'ARBITRUM' },
  { key: 'optimism', name: 'Optimism', symbol: 'OPTIMISM' },
  { key: 'base', name: 'Base', symbol: 'BASE' },
  { key: 'avax', name: 'Avalanche', symbol: 'AVAX' },
];

export default function RbfNetworkTab({ t, getVal, openNetworkEdit }) {
  return (
    <>
      <Alert variant="primary" className="mb-4">
        <i className="bx bx-info-circle mr-1"></i>
        {t('admin.rbfSettings.networkInfo', {
          defaultValue: 'Per-network RBF settings control gas bump percentages, timing thresholds, and cost limits. Each network has different optimal values based on block times and gas price volatility.',
        })}
      </Alert>

      <div className="overflow-x-auto">
        <Table responsive={false} className="border-t">
          <thead>
            <tr>
              <th>{t('admin.rbfSettings.colNetwork', { defaultValue: 'Network' })}</th>
              <th className="text-center">{t('admin.rbfSettings.colStatus', { defaultValue: 'Status' })}</th>
              <th className="text-center">{t('admin.rbfSettings.colGasBump', { defaultValue: 'Gas Bump' })}</th>
              <th className="text-center">{t('admin.rbfSettings.colMinPending', { defaultValue: 'Min Pending' })}</th>
              <th className="text-center">{t('admin.rbfSettings.colReplaceInterval', { defaultValue: 'Replace Interval' })}</th>
              <th className="text-center">{t('admin.rbfSettings.colMinAmount', { defaultValue: 'Min Amount' })}</th>
              <th className="text-center">{t('admin.rbfSettings.colMaxCost', { defaultValue: 'Max Cost' })}</th>
              <th className="text-right">{t('admin.rbfSettings.colActions', { defaultValue: 'Actions' })}</th>
            </tr>
          </thead>
          <tbody>
            {NETWORKS.map((net) => {
              const enabled = getVal(`rbf.${net.key}.enabled`, '');
              const gasBump = getVal(`rbf.${net.key}.gas_bump_percent`, '');
              const minPending = getVal(`rbf.${net.key}.min_pending_duration`, '');
              const replaceInterval = getVal(`rbf.${net.key}.min_time_between_replaces`, '');
              const minAmount = getVal(`rbf.${net.key}.min_amount_usd`, '');
              const maxCost = getVal(`rbf.${net.key}.max_cost_usd`, '');

              return (
                <tr key={net.key}>
                  <td>
                    <strong>{net.name}</strong>
                    <div className="text-surface-500 text-sm">{net.symbol}</div>
                  </td>
                  <td className="text-center">
                    <Badge className={`rounded-full ${enabled === 'true' ? 'bg-green-50 text-green-700' :
                      enabled === 'false' ? 'bg-red-50 text-red-700' :
                      'bg-surface-100 text-surface-600'}`}>
                      {enabled === 'true' ?
                        t('admin.rbfSettings.enabled', { defaultValue: 'Enabled' }) :
                        enabled === 'false' ?
                        t('admin.rbfSettings.disabled', { defaultValue: 'Disabled' }) :
                        '—'}
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
                      size="sm"
                      className="text-secondary">
                      <i className="bx bx-edit text-[1rem]"></i>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>

      {/* Info card */}
      <Card className="bg-lighter mt-3">
        <div className="p-5 py-3">
          <h6 className="mb-2">
            <i className="bx bx-info-circle mr-1"></i>
            {t('admin.rbfSettings.howRbfWorks', { defaultValue: 'How RBF Works' })}
          </h6>
          <div className="text-surface-500 text-sm">
            {t('admin.rbfSettings.howRbfWorksDesc', {
              defaultValue: 'When a transaction is stuck pending longer than Min Pending duration, the system bumps the gas price by the Gas Bump percentage and resubmits. Replacements are spaced by the Replace Interval. Cost guards (Min Amount, Max Cost Ratio, Max Cost USD) prevent uneconomical replacements.',
            })}
          </div>
        </div>
      </Card>
    </>
  );
}
