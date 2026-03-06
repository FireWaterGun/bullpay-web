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

export default function GasTopupTab({ t, getVal, onEdit }) {
  return (
    <>
      <Alert variant="primary" className="mb-4">
        <i className="bx bx-info-circle mr-1"></i>
        {t('admin.gasSettings.gasTopupInfo', {
          defaultValue: 'Max topup amount is the safety cap for native coin sent to temp wallets for gas. The actual topup amount is calculated based on the gas deficit — this is just the maximum allowed per topup.',
        })}
      </Alert>

      <div className="overflow-x-auto">
        <Table responsive={false} className="border-t">
          <thead>
            <tr>
              <th>{t('admin.gasSettings.colNetwork', { defaultValue: 'Network' })}</th>
              <th className="text-center">{t('admin.gasSettings.colMaxAmount', { defaultValue: 'Max Topup Amount' })}</th>
              <th className="text-center">{t('admin.gasSettings.colNativeCoin', { defaultValue: 'Native Coin' })}</th>
              <th className="text-right">{t('admin.gasSettings.colActions', { defaultValue: 'Actions' })}</th>
            </tr>
          </thead>
          <tbody>
            {NETWORKS.map((net) => {
              const amount = getVal(`gas_topup.${net.key}.max_topup_amount`);
              return (
                <tr key={net.key}>
                  <td>
                    <strong>{net.name}</strong>
                    <div className="text-surface-500 text-sm">{net.symbol}</div>
                  </td>
                  <td className="text-center">
                    <span className="font-semibold">{amount}</span>
                  </td>
                  <td className="text-center">
                    <Badge className="bg-primary-50 text-primary-600">{net.nativeCoin}</Badge>
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

      {/* Info card */}
      <Card className="bg-lighter mt-3">
        <div className="p-5 py-3">
          <h6 className="mb-2">
            <i className="bx bx-info-circle mr-1"></i>
            {t('admin.gasSettings.gasTopupHowItWorks', { defaultValue: 'How Topup Works' })}
          </h6>
          <div className="text-surface-500 text-sm">
            {t('admin.gasSettings.gasTopupHowItWorksDesc', {
              defaultValue: 'When a temp wallet needs to sweep tokens but lacks gas, the system sends native coin from the gas wallet. The topup amount = (required gas) − (current balance), capped at the max topup amount above.',
            })}
          </div>
        </div>
      </Card>
    </>
  );
}
