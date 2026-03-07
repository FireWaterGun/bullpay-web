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

const OPERATIONS = ['withdrawal', 'sweep', 'topup']

export default function GasPriceTab({ t, getVal, onEdit }) {
  return (
    <Card>
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300">
        <h6 className="mb-1">
          <i className="bx bx-gas-pump mr-1 text-primary"></i>
          {t('admin.gasSettings.gasPriceTitle', { defaultValue: 'Gas Price Multipliers' })}
        </h6>
        <p className="text-sm text-surface-500 mb-0">
          {t('admin.gasSettings.gasPriceInfo', {
            defaultValue:
              'Control how aggressively transactions are priced. Higher multipliers = faster confirmation but higher cost.',
          })}
        </p>
      </div>

      {/* Table */}
      <Table>
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
            const maxGwei = getVal(`gas_price.${net.key}.max_gas_price_gwei`)
            return (
              <tr key={net.key}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <Image src={net.icon} alt={net.symbol} width={28} height={28} className="rounded-full shrink-0" />
                    <div>
                      <strong>{net.name}</strong>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge color={net.type === 'eip1559' ? 'info' : 'warning'} label className="rounded-full">
                          {net.type === 'eip1559' ? 'EIP-1559' : 'Legacy'}
                        </Badge>
                        <span className="text-surface-500 text-xs">{net.symbol}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <span className="font-semibold">{maxGwei}</span>
                  {maxGwei !== '—' && <div className="text-surface-500 text-xs">gwei</div>}
                </td>
                {OPERATIONS.map((op) => {
                  const baseVal = getVal(`gas_price.${net.key}.${op}.base_multiplier`)
                  const priVal =
                    net.type === 'eip1559' ? getVal(`gas_price.${net.key}.${op}.priority_multiplier`) : null
                  return (
                    <td key={op} className="text-center">
                      <div>
                        <span className="font-medium">
                          {baseVal}
                          {baseVal !== '—' && '×'}
                        </span>
                        <div className="text-surface-500 text-xs">base</div>
                      </div>
                      {priVal !== null && (
                        <div className="mt-1">
                          <span className="font-medium">
                            {priVal}
                            {priVal !== '—' && '×'}
                          </span>
                          <div className="text-surface-500 text-xs">priority</div>
                        </div>
                      )}
                    </td>
                  )
                })}
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

      {/* Formula */}
      <div className="px-5 py-4 border-t border-surface-200/40 dark:border-surface-200">
        <h6 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
          {t('admin.gasSettings.formulaTitle', { defaultValue: 'How Multipliers Work' })}
        </h6>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-100 dark:bg-white/[0.03]">
            <Badge color="info" label className="shrink-0 mt-0.5">
              EIP-1559
            </Badge>
            <div className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              <code className="text-xs">maxFeePerGas = baseFee × base</code>
              <br />
              <code className="text-xs">maxPriorityFee = tip × priority</code>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-100 dark:bg-white/[0.03]">
            <Badge color="warning" label className="shrink-0 mt-0.5">
              Legacy
            </Badge>
            <div className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              <code className="text-xs">gasPrice = networkPrice × base</code>
              <div className="text-surface-500 mt-0.5">BSC only</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
