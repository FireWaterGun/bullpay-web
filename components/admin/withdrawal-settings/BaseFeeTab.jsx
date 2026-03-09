import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

export default function BaseFeeTab({
  t,
  autoUpdateOn,
  savingAutoUpdate,
  handleToggleAutoUpdate,
  bufferMultiplier,
  alertThreshold,
  onEditBuffer,
  onEditAlert,
}) {
  return (
    <div className="grid grid-cols-12 gap-x-6">
      <div className="col-span-12 lg:col-span-8">
        {/* Auto-Update Toggle */}
        <Card className="mb-4">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300">
            <h5 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-refresh mr-2 text-info"></i>
              {t('admin.withdrawalSettings.baseFeeAutoUpdate', { defaultValue: 'Base Fee Auto-Update' })}
            </h5>
          </div>
          <div className="p-5">
            <p className="text-surface-500 mb-3 text-sm">
              {t('admin.withdrawalSettings.baseFeeAutoUpdateDesc', {
                defaultValue:
                  'When enabled, base fees are automatically recalculated every minute based on current network gas prices.',
              })}
            </p>
            <div className="flex items-center justify-between p-3 rounded bg-surface-100 dark:bg-white/[0.03]">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {t('admin.withdrawalSettings.autoUpdateToggleLabel', {
                    defaultValue: 'Auto-update base fees from gas prices',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ToggleSwitch checked={autoUpdateOn} disabled={savingAutoUpdate} onChange={handleToggleAutoUpdate} />
                <span className={`text-xs font-semibold ${autoUpdateOn ? 'text-success' : 'text-surface-400'}`}>
                  {autoUpdateOn ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Buffer & Alert */}
        <Card className="mb-4">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300">
            <h5 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-slider-alt mr-2 text-primary"></i>
              {t('admin.withdrawalSettings.baseFeeParams', { defaultValue: 'Base Fee Parameters' })}
            </h5>
          </div>
          <Table responsive={false}>
            <tbody>
              <tr>
                <td className="w-2/5">
                  <div>
                    <span className="font-semibold text-sm">
                      {t('admin.withdrawalSettings.bufferMultiplier', { defaultValue: 'Buffer Multiplier' })}
                    </span>
                    <br />
                    <small className="text-surface-500">
                      {t('admin.withdrawalSettings.bufferMultiplierDesc', {
                        defaultValue: 'Multiplied on gas cost (1.2 = 20% safety margin)',
                      })}
                    </small>
                  </div>
                </td>
                <td>
                  <code className="font-semibold">{bufferMultiplier}x</code>
                </td>
                <td className="text-right">
                  <Button type="button" onClick={onEditBuffer} variant="text-secondary" size="icon-sm">
                    <i className="bx bx-edit text-[1rem]"></i>
                  </Button>
                </td>
              </tr>
              <tr>
                <td>
                  <div>
                    <span className="font-semibold text-sm">
                      {t('admin.withdrawalSettings.alertThreshold', { defaultValue: 'Alert Threshold' })}
                    </span>
                    <br />
                    <small className="text-surface-500">
                      {t('admin.withdrawalSettings.alertThresholdDesc', {
                        defaultValue: 'Notify admin when base fee changes by more than this %',
                      })}
                    </small>
                  </div>
                </td>
                <td>
                  <code className="font-semibold">{(parseFloat(alertThreshold) * 100).toFixed(0)}%</code>
                </td>
                <td className="text-right">
                  <Button type="button" onClick={onEditAlert} variant="text-secondary" size="icon-sm">
                    <i className="bx bx-edit text-[1rem]"></i>
                  </Button>
                </td>
              </tr>
            </tbody>
          </Table>
        </Card>

        {/* Formula */}
        <Card className="mb-4">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300">
            <h5 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-math mr-2"></i>
              {t('admin.withdrawalSettings.feeFormula', { defaultValue: 'Fee Calculation Formula' })}
            </h5>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-2 mb-3">
              <div className="flex items-center gap-3 p-3 rounded bg-surface-100 dark:bg-white/[0.03]">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-xs font-bold shrink-0 dark:bg-primary-600/20">
                  1
                </span>
                <div>
                  <div className="font-semibold text-sm">
                    {t('admin.withdrawalSettings.baseFeeLabel', { defaultValue: 'Base Fee' })}
                  </div>
                  <div className="text-surface-500 text-xs font-mono">
                    {t('admin.withdrawalSettings.baseFeeFormula', {
                      defaultValue: 'Gas Limit × Gas Price × Buffer Multiplier',
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded bg-surface-100 dark:bg-white/[0.03]">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-info-100 text-info-600 text-xs font-bold shrink-0 dark:bg-info-600/20">
                  2
                </span>
                <div>
                  <div className="font-semibold text-sm">
                    {t('admin.withdrawalSettings.platformFeeLabel', { defaultValue: 'Platform Fee' })}
                  </div>
                  <div className="text-surface-500 text-xs font-mono">
                    {t('admin.withdrawalSettings.platformFeeFormula', { defaultValue: 'Amount × Fee Percent (%)' })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded bg-surface-100 dark:bg-white/[0.03]">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-success-100 text-success-600 text-xs font-bold shrink-0 dark:bg-success-600/20">
                  Σ
                </span>
                <div>
                  <div className="font-semibold text-sm">
                    {t('admin.withdrawalSettings.totalFeeLabel', { defaultValue: 'Total Fee' })}
                  </div>
                  <div className="text-surface-500 text-xs font-mono">
                    {t('admin.withdrawalSettings.totalFeeFormula', { defaultValue: 'Base Fee + Platform Fee' })}
                  </div>
                </div>
              </div>
            </div>
            <small className="text-surface-500">
              {t('admin.withdrawalSettings.feeFormulaNote', {
                defaultValue:
                  'Base fee covers on-chain gas costs. Platform fee (%) is your revenue margin. Both are configured per coin-network in the Fee & Limits tab.',
              })}
            </small>
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="col-span-12 lg:col-span-4">
        <Card className="mb-3">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300">
            <h6 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-dollar-circle mr-1"></i>
              {t('admin.withdrawalSettings.feeModel', { defaultValue: 'Fee Model' })}
            </h6>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Badge color="primary" label className="rounded-full mt-1">
                  1
                </Badge>
                <div>
                  <small className="font-semibold block">
                    {t('admin.withdrawalSettings.feeModelStep1', { defaultValue: 'Base Fee (gas cost)' })}
                  </small>
                  <small className="text-surface-500">
                    {t('admin.withdrawalSettings.feeModelStep1Desc', {
                      defaultValue: 'Auto-calculated from on-chain gas price × buffer multiplier',
                    })}
                  </small>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge color="primary" label className="rounded-full mt-1">
                  2
                </Badge>
                <div>
                  <small className="font-semibold block">
                    {t('admin.withdrawalSettings.feeModelStep2', { defaultValue: 'Platform Fee (%)' })}
                  </small>
                  <small className="text-surface-500">
                    {t('admin.withdrawalSettings.feeModelStep2Desc', {
                      defaultValue: 'Percentage fee on withdrawal amount — your revenue margin',
                    })}
                  </small>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge color="success" label className="rounded-full mt-1">
                  3
                </Badge>
                <div>
                  <small className="font-semibold block">
                    {t('admin.withdrawalSettings.feeModelStep3', { defaultValue: 'Total = Base + Platform' })}
                  </small>
                  <small className="text-surface-500">
                    {t('admin.withdrawalSettings.feeModelStep3Desc', {
                      defaultValue: 'Charged to user on each withdrawal. Edit per coin-network in Fee & Limits.',
                    })}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300">
            <h6 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-bulb mr-1"></i>
              {t('admin.withdrawalSettings.tips', { defaultValue: 'Tips' })}
            </h6>
          </div>
          <div className="p-5">
            <ul className="list-none mb-0 text-sm text-surface-500">
              <li className="mb-2">
                <i className="bx bx-right-arrow-alt mr-1"></i>
                {t('admin.withdrawalSettings.tip2', {
                  defaultValue: 'Gas buffer of 1.2–1.5x ensures transactions confirm without running out of gas.',
                })}
              </li>
              <li className="mb-2">
                <i className="bx bx-right-arrow-alt mr-1"></i>
                {t('admin.withdrawalSettings.tip5', {
                  defaultValue: 'Set alert threshold to 20–30% to get notified of significant gas price spikes.',
                })}
              </li>
              <li>
                <i className="bx bx-right-arrow-alt mr-1"></i>
                {t('admin.withdrawalSettings.tip6', {
                  defaultValue: 'Auto-update runs every minute. Disable only if you want to set base fees manually.',
                })}
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ── Toggle Switch ── */
function ToggleSwitch({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange()}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        checked ? 'bg-primary-600' : 'bg-surface-300',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}
