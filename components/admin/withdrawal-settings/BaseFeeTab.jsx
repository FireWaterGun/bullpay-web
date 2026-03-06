import { Badge, Button, Card } from '@/components/ui';
import Table from '@/components/ui/Table';

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
      <div className="lg:col-span-8">
        {/* Auto-Update Toggle */}
        <Card className="mb-4">
          <div className="px-5 py-4 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-refresh mr-2 text-info"></i>
              {t('admin.withdrawalSettings.baseFeeAutoUpdate', { defaultValue: 'Base Fee Auto-Update' })}
            </h5>
          </div>
          <div className="p-5">
            <p className="text-surface-500 mb-3 text-[0.875rem]">
              {t('admin.withdrawalSettings.baseFeeAutoUpdateDesc', { defaultValue: 'When enabled, base fees are automatically recalculated every minute based on current network gas prices.' })}
            </p>
            <div className="flex items-center justify-between p-3 rounded bg-surface-100">
              <div className="flex items-center gap-2">
                <Badge color={autoUpdateOn ? 'success' : 'secondary'} label>
                  {autoUpdateOn ? 'ON' : 'OFF'}
                </Badge>
                <span className="text-[0.875rem]">
                  {t('admin.withdrawalSettings.autoUpdateToggleLabel', { defaultValue: 'Auto-update base fees from gas prices' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  checked={autoUpdateOn}
                  onChange={handleToggleAutoUpdate}
                  disabled={savingAutoUpdate}
                  style={{ cursor: savingAutoUpdate ? 'not-allowed' : 'pointer' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Buffer & Alert */}
        <Card className="mb-4">
          <div className="px-5 py-4 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-slider-alt mr-2 text-primary"></i>
              {t('admin.withdrawalSettings.baseFeeParams', { defaultValue: 'Base Fee Parameters' })}
            </h5>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <Table responsive={false} className="mb-0">
                <tbody>
                  <tr className="bg-surface-100">
                    <td className="py-3 pl-3 w-2/5">
                      <div>
                        <span className="font-semibold text-[0.875rem]">{t('admin.withdrawalSettings.bufferMultiplier', { defaultValue: 'Buffer Multiplier' })}</span>
                        <br />
                        <small className="text-surface-500">{t('admin.withdrawalSettings.bufferMultiplierDesc', { defaultValue: 'Multiplied on gas cost (1.2 = 20% safety margin)' })}</small>
                      </div>
                    </td>
                    <td className="py-3">
                      <code className="text-xl">{bufferMultiplier}x</code>
                    </td>
                    <td className="py-3 text-right pr-3">
                      <Button
                        type="button"
                        onClick={onEditBuffer}
                        variant="outline-primary"
                        size="sm"
                        className="bg-transparent hover:bg-primary-600 hover:text-white">
                        <i className="bx bx-edit"></i>
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pl-3">
                      <div>
                        <span className="font-semibold text-[0.875rem]">{t('admin.withdrawalSettings.alertThreshold', { defaultValue: 'Alert Threshold' })}</span>
                        <br />
                        <small className="text-surface-500">{t('admin.withdrawalSettings.alertThresholdDesc', { defaultValue: 'Notify admin when base fee changes by more than this %' })}</small>
                      </div>
                    </td>
                    <td className="py-3">
                      <code className="text-xl">{(parseFloat(alertThreshold) * 100).toFixed(0)}%</code>
                    </td>
                    <td className="py-3 text-right pr-3">
                      <Button
                        type="button"
                        onClick={onEditAlert}
                        variant="outline-primary"
                        size="sm"
                        className="bg-transparent hover:bg-primary-600 hover:text-white">
                        <i className="bx bx-edit"></i>
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </div>
        </Card>

        {/* Formula */}
        <Card className="mb-4">
          <div className="px-5 py-4 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-math mr-2"></i>
              {t('admin.withdrawalSettings.feeFormula', { defaultValue: 'Fee Calculation Formula' })}
            </h5>
          </div>
          <div className="p-5">
            <div className="p-3 rounded mb-3 bg-surface-100 font-mono text-[0.9rem]">
              <div className="mb-2"><strong>Base Fee</strong> = {t('admin.withdrawalSettings.baseFeeFormula', { defaultValue: 'Gas Limit × Gas Price × Buffer Multiplier' })}</div>
              <div className="mb-2"><strong>Platform Fee</strong> = {t('admin.withdrawalSettings.platformFeeFormula', { defaultValue: 'Amount × Fee Percent (%)' })}</div>
              <div><strong>Total Fee</strong> = {t('admin.withdrawalSettings.totalFeeFormula', { defaultValue: 'Base Fee + Platform Fee' })}</div>
            </div>
            <small className="text-surface-500">
              {t('admin.withdrawalSettings.feeFormulaNote', { defaultValue: 'Base fee covers on-chain gas costs. Platform fee (%) is your revenue margin. Both are configured per coin-network in the Fee & Limits tab.' })}
            </small>
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-4">
        <Card className="mb-3">
          <div className="px-5 py-4 border-b border-surface-200">
            <h6 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-dollar-circle mr-1"></i>
              {t('admin.withdrawalSettings.feeModel', { defaultValue: 'Fee Model' })}
            </h6>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Badge className="bg-primary-50 text-primary-600 rounded-full mt-1">1</Badge>
                <div>
                  <small className="font-semibold block">{t('admin.withdrawalSettings.feeModelStep1', { defaultValue: 'Base Fee (gas cost)' })}</small>
                  <small className="text-surface-500">{t('admin.withdrawalSettings.feeModelStep1Desc', { defaultValue: 'Auto-calculated from on-chain gas price × buffer multiplier' })}</small>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-primary-50 text-primary-600 rounded-full mt-1">2</Badge>
                <div>
                  <small className="font-semibold block">{t('admin.withdrawalSettings.feeModelStep2', { defaultValue: 'Platform Fee (%)' })}</small>
                  <small className="text-surface-500">{t('admin.withdrawalSettings.feeModelStep2Desc', { defaultValue: 'Percentage fee on withdrawal amount — your revenue margin' })}</small>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-green-50 text-green-700 rounded-full mt-1">3</Badge>
                <div>
                  <small className="font-semibold block">{t('admin.withdrawalSettings.feeModelStep3', { defaultValue: 'Total = Base + Platform' })}</small>
                  <small className="text-surface-500">{t('admin.withdrawalSettings.feeModelStep3Desc', { defaultValue: 'Charged to user on each withdrawal. Edit per coin-network in Fee & Limits.' })}</small>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-surface-200">
            <h6 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-bulb mr-1"></i>
              {t('admin.withdrawalSettings.tips', { defaultValue: 'Tips' })}
            </h6>
          </div>
          <div className="p-5">
            <ul className="list-none mb-0 text-sm text-surface-500">
              <li className="mb-2">
                <i className="bx bx-right-arrow-alt mr-1"></i>
                {t('admin.withdrawalSettings.tip2', { defaultValue: 'Gas buffer of 1.2–1.5x ensures transactions confirm without running out of gas.' })}
              </li>
              <li className="mb-2">
                <i className="bx bx-right-arrow-alt mr-1"></i>
                {t('admin.withdrawalSettings.tip5', { defaultValue: 'Set alert threshold to 20–30% to get notified of significant gas price spikes.' })}
              </li>
              <li>
                <i className="bx bx-right-arrow-alt mr-1"></i>
                {t('admin.withdrawalSettings.tip6', { defaultValue: 'Auto-update runs every minute. Disable only if you want to set base fees manually.' })}
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
