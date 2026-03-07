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

export default function GasLimitTab({ t, getVal, onEdit }) {
  return (
    <Card>
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300">
        <h6 className="mb-1">
          <i className="bx bx-tachometer mr-1 text-primary"></i>
          {t('admin.gasSettings.gasLimitTitle', { defaultValue: 'Gas Limit Multiplier' })}
        </h6>
        <p className="text-sm text-surface-500 mb-0">
          {t('admin.gasSettings.gasLimitInfo', {
            defaultValue: 'Applied after estimateGas() to add a safety buffer. Unused gas is NOT charged.',
          })}
        </p>
      </div>

      {/* Table */}
      <Table>
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
            const multiplier = getVal(`gas_limit.${net.key}.multiplier`)
            const bufferPct = multiplier !== '—' ? ((parseFloat(multiplier) - 1) * 100).toFixed(0) : '—'
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
                  <span className="font-semibold">
                    {multiplier}
                    {multiplier !== '—' && '×'}
                  </span>
                </td>
                <td className="text-center">
                  {bufferPct !== '—' ? (
                    <Badge
                      color={parseInt(bufferPct) >= 20 ? 'warning' : parseInt(bufferPct) >= 15 ? 'info' : 'success'}
                      label
                      className="rounded-full"
                    >
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
          {t('admin.gasSettings.gasLimitFormula', { defaultValue: 'Formula' })}
        </h6>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-100 dark:bg-white/[0.03]">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-600 text-xs font-bold shrink-0 dark:bg-primary-600/20">
            f
          </span>
          <div className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
            <code className="text-xs">gasLimit = estimateGas() × multiplier</code>
            <div className="text-surface-500 mt-0.5">
              {t('admin.gasSettings.gasLimitFormulaNote', {
                defaultValue: 'Example: estimateGas() = 21,000 × 1.15 = 24,150 gas limit. Unused gas is not charged.',
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
