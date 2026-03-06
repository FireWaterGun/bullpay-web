import { Alert, Badge, Button, Card } from '@/components/ui';
import Table from '@/components/ui/Table';

const NETWORKS = [
  { key: 'eth', name: 'Ethereum', symbol: 'ETH', nativeCoin: 'ETH', type: 'eip1559' },
  { key: 'bsc', name: 'BNB Smart Chain', symbol: 'BSC', nativeCoin: 'BNB', type: 'legacy' },
  { key: 'pol', name: 'Polygon', symbol: 'POL', nativeCoin: 'POL', type: 'eip1559' },
  { key: 'arbitrum', name: 'Arbitrum', symbol: 'ARBITRUM', nativeCoin: 'ETH', type: 'eip1559' },
  { key: 'optimism', name: 'Optimism', symbol: 'OPTIMISM', nativeCoin: 'ETH', type: 'eip1559' },
  { key: 'base', name: 'Base', symbol: 'BASE', nativeCoin: 'ETH', type: 'eip1559' },
  { key: 'avax', name: 'Avalanche', symbol: 'AVAX', nativeCoin: 'AVAX', type: 'eip1559' },
];

const OPERATIONS = ['withdrawal', 'sweep', 'topup'];

export default function GasPriceTab({ t, getVal, onEdit }) {
  return (
    <>
      <Alert variant="primary" className="mb-4">
        <i className="bx bx-info-circle mr-1"></i>
        {t('admin.gasSettings.gasPriceInfo', {
          defaultValue: 'Gas price multipliers control how aggressively transactions are priced. Higher multipliers = faster confirmation but higher cost. BSC uses Legacy (gasPrice only), all other networks use EIP-1559 (base + priority fee).',
        })}
      </Alert>

      <div className="overflow-x-auto">
        <Table responsive={false} className="border-t">
          <thead>
            <tr>
              <th>{t('admin.gasSettings.colNetwork', { defaultValue: 'Network' })}</th>
              <th className="text-center">{t('admin.gasSettings.colMaxGwei', { defaultValue: 'Max Gwei' })}</th>
              <th className="text-center">{t('admin.gasSettings.colWithdrawal', { defaultValue: 'Withdrawal' })}</th>
              <th className="text-center">{t('admin.gasSettings.colSweep', { defaultValue: 'Sweep' })}</th>
              <th className="text-center">{t('admin.gasSettings.colTopup', { defaultValue: 'Topup' })}</th>
              <th className="text-right">{t('admin.gasSettings.colActions', { defaultValue: 'Actions' })}</th>
            </tr>
          </thead>
          <tbody>
            {NETWORKS.map((net) => {
              const maxGwei = getVal(`gas_price.${net.key}.max_gas_price_gwei`);
              return (
                <tr key={net.key}>
                  <td>
                    <div className="flex items-center">
                      <div>
                        <strong>{net.name}</strong>
                        <div>
                          <Badge className={`rounded-full ${net.type === 'eip1559' ? 'bg-cyan-50 text-cyan-700' : 'bg-amber-50 text-amber-700'} mr-1`}>
                            {net.type === 'eip1559' ? 'EIP-1559' : 'Legacy'}
                          </Badge>
                          <small className="text-surface-500">{net.symbol}</small>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="font-semibold">{maxGwei}</span>
                    {maxGwei !== '—' && <div className="text-surface-500 text-sm">gwei</div>}
                  </td>
                  {OPERATIONS.map((op) => {
                    const baseVal = getVal(`gas_price.${net.key}.${op}.base_multiplier`);
                    const priVal = net.type === 'eip1559' ? getVal(`gas_price.${net.key}.${op}.priority_multiplier`) : null;
                    return (
                      <td key={op} className="text-center">
                        <div>
                          <span className="text-surface-800 font-medium">
                            {baseVal}{baseVal !== '—' && '×'}
                          </span>
                          <div className="text-surface-500 text-sm">base</div>
                        </div>
                        {priVal !== null && (
                          <div className="mt-1">
                            <span className="text-surface-800 font-medium">
                              {priVal}{priVal !== '—' && '×'}
                            </span>
                            <div className="text-surface-500 text-sm">priority</div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-right">
                    <Button
                      title={t('admin.gasSettings.edit', { defaultValue: 'Edit' })}
                      onClick={() => onEdit(net)}
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

      {/* Formula info */}
      <Card className="bg-lighter mt-3">
        <div className="p-5 py-3">
          <h6 className="mb-2">
            <i className="bx bx-math mr-1"></i>
            {t('admin.gasSettings.formulaTitle', { defaultValue: 'How Multipliers Work' })}
          </h6>
          <div className="grid grid-cols-12 gap-x-6 gap-3">
            <div className="md:col-span-6">
              <small className="text-surface-500 block mb-1">EIP-1559 Networks</small>
              <code>maxFeePerGas = baseFee × baseMultiplier</code><br />
              <code>maxPriorityFee = suggestedTip × priorityMultiplier</code>
            </div>
            <div className="md:col-span-6">
              <small className="text-surface-500 block mb-1">Legacy Networks (BSC)</small>
              <code>gasPrice = networkGasPrice × baseMultiplier</code>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
