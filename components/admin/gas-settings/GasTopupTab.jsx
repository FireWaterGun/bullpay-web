import Image from 'next/image'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

const NETWORKS = [
  {
    key: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    nativeCoin: 'ETH',
    type: 'eip1559',
    icon: '/assets/img/coins/eth.svg',
  },
  {
    key: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BSC',
    nativeCoin: 'BNB',
    type: 'legacy',
    icon: '/assets/img/coins/bsc.svg',
  },
  { key: 'pol', name: 'Polygon', symbol: 'POL', nativeCoin: 'POL', type: 'eip1559', icon: '/assets/img/coins/pol.svg' },
  {
    key: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ARBITRUM',
    nativeCoin: 'ETH',
    type: 'eip1559',
    icon: '/assets/img/coins/arbitrum.svg',
  },
  {
    key: 'optimism',
    name: 'Optimism',
    symbol: 'OPTIMISM',
    nativeCoin: 'ETH',
    type: 'eip1559',
    icon: '/assets/img/coins/optimism.svg',
  },
  { key: 'base', name: 'Base', symbol: 'BASE', nativeCoin: 'ETH', type: 'eip1559', icon: '/assets/img/coins/base.svg' },
  {
    key: 'avax',
    name: 'Avalanche',
    symbol: 'AVAX',
    nativeCoin: 'AVAX',
    type: 'eip1559',
    icon: '/assets/img/coins/avax.svg',
  },
]

export default function GasTopupTab({ t, getVal, onEdit }) {
  return (
    <Card>
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300">
        <h6 className="mb-1">
          <i className="bx bx-coin-stack mr-1 text-primary"></i>
          {t('admin.gasSettings.gasTopupTitle', { defaultValue: 'Gas Topup Limits' })}
        </h6>
        <p className="text-sm text-surface-500 mb-0">
          {t('admin.gasSettings.gasTopupInfo', {
            defaultValue:
              'Safety cap for native coin sent to temp wallets for gas. Actual topup is based on gas deficit.',
          })}
        </p>
      </div>

      {/* Table */}
      <Table>
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
            const amount = getVal(`gas_topup.${net.key}.max_topup_amount`)
            return (
              <tr key={net.key}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <Image src={net.icon} alt={net.symbol} width={28} height={28} className="rounded-full shrink-0" />
                    <div>
                      <strong>{net.name}</strong>
                      <div className="text-surface-500 text-xs">{net.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <span className="font-semibold">{amount}</span>
                </td>
                <td className="text-center">
                  <Badge color="primary" label>
                    {net.nativeCoin}
                  </Badge>
                </td>
                <td className="text-right">
                  <Button
                    title={t('admin.gasSettings.edit', { defaultValue: 'Edit' })}
                    onClick={() => onEdit(net)}
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
          {t('admin.gasSettings.gasTopupHowItWorks', { defaultValue: 'How Topup Works' })}
        </h6>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-100 dark:bg-white/[0.03]">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-info-100 text-info-600 shrink-0 dark:bg-info-600/20">
            <i className="bx bx-transfer text-xs"></i>
          </span>
          <div className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
            {t('admin.gasSettings.gasTopupHowItWorksDesc', {
              defaultValue:
                'When a temp wallet needs to sweep tokens but lacks gas, the system sends native coin from the gas wallet. The topup amount = (required gas) − (current balance), capped at the max above.',
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
