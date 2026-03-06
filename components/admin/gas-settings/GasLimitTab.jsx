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

export default function GasLimitTab({ t, getVal, onEdit }) {
  return (
    <>
      <Alert variant="primary" className="mb-4">
        <i className="bx bx-info-circle mr-1"></i>
        {t('admin.gasSettings.gasLimitInfo', {
          defaultValue: 'Gas limit multiplier is applied after estimateGas() to add a safety buffer, preventing out-of-gas failures. Unused gas is NOT charged — only the buffer risk cost.',
        })}
      </Alert>

      <div className="overflow-x-auto">
        <Table responsive={false} className="border-t">
          <thead>
            <tr>
              <th>{t('admin.gasSettings.colNetwork', { defaultValue: 'Network' })}</th>
              <th className="text-center">{t('admin.gasSettings.colMultiplier', { defaultValue: 'Multiplier' })}</th>
              <th className="text-center">{t('admin.gasSettings.colBuffer', { defaultValue: 'Buffer %' })}</th>
              <th className="text-right">{t('admin.gasSettings.colActions', { defaultValue: 'Actions' })}</th>
            </tr>
          </thead>
          <tbody>
            {NETWORKS.map((net) => {
              const multiplier = getVal(`gas_limit.${net.key}.multiplier`);
              const bufferPct = multiplier !== '—' ? ((parseFloat(multiplier) - 1) * 100).toFixed(0) : '—';
              return (
                <tr key={net.key}>
                  <td>
                    <strong>{net.name}</strong>
                    <div className="text-surface-500 text-sm">{net.symbol}</div>
                  </td>
                  <td className="text-center">
                    <span className="font-semibold">{multiplier}{multiplier !== '—' && '×'}</span>
                  </td>
                  <td className="text-center">
                    {bufferPct !== '—' ? (
                      <Badge className={`rounded-full ${parseInt(bufferPct) >= 20 ? 'bg-amber-50 text-amber-700' :
                        parseInt(bufferPct) >= 15 ? 'bg-cyan-50 text-cyan-700' :
                        'bg-green-50 text-green-700'}`}>
                        +{bufferPct}%
                      </Badge>
                    ) : (
                      <span className="text-surface-500">—</span>
                    )}
                  </td>
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
            {t('admin.gasSettings.gasLimitFormula', { defaultValue: 'Formula' })}
          </h6>
          <code>gasLimit = estimateGas() × multiplier</code>
          <div className="text-surface-500 text-sm mt-1">
            {t('admin.gasSettings.gasLimitFormulaNote', {
              defaultValue: 'Example: estimateGas() = 21,000 × 1.15 = 24,150 gas limit. Unused gas is not charged.',
            })}
          </div>
        </div>
      </Card>
    </>
  );
}
