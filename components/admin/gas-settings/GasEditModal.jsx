import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, InputGroup, InputAddon, Label } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

const TABS = [
  { key: 'gasPrice', icon: 'bx-gas-pump' },
  { key: 'gasLimit', icon: 'bx-tachometer' },
  { key: 'gasTopup', icon: 'bx-coin-stack' },
]

const OPERATIONS = ['withdrawal', 'sweep', 'topup']

// ─── Sub-forms ─────────────────────────────────────────────

function GasPriceForm({ t, network, isEip1559, editForm, updateField, formErrors }) {
  const opLabels = {
    withdrawal: t('admin.gasSettings.opWithdrawal', { defaultValue: 'Withdrawal' }),
    sweep: t('admin.gasSettings.opSweep', { defaultValue: 'Sweep' }),
    topup: t('admin.gasSettings.opTopup', { defaultValue: 'Topup' }),
  }
  const opIcons = { withdrawal: 'bx-upload', sweep: 'bx-transfer', topup: 'bx-coin-stack' }
  const opBorderColors = {
    withdrawal: 'border-l-primary-600',
    sweep: 'border-l-green-500',
    topup: 'border-l-amber-500',
  }
  const opTextColors = { withdrawal: 'text-primary', sweep: 'text-success', topup: 'text-warning' }

  return (
    <>
      {/* Network type badge */}
      <div className="mb-4">
        <Badge color={isEip1559 ? 'info' : 'warning'} label className="rounded-full mr-2">
          {isEip1559 ? 'EIP-1559' : 'Legacy'}
        </Badge>
        <span className="text-surface-500">{network.symbol}</span>
      </div>

      {/* Max Gas Price */}
      <div className="mb-4">
        <Label className="font-semibold">
          {t('admin.gasSettings.maxGasPriceGwei', { defaultValue: 'Max Gas Price (Gwei)' })}
        </Label>
        <InputGroup error={formErrors.maxGasPriceGwei}>
          <Input
            type="text"
            inputMode="decimal"
            value={editForm.maxGasPriceGwei ?? ''}
            onChange={(e) => updateField('maxGasPriceGwei', e.target.value)}
          />
          <InputAddon>Gwei</InputAddon>
        </InputGroup>
        {formErrors.maxGasPriceGwei && (
          <div className="text-xs text-danger-500 mt-1 block">{formErrors.maxGasPriceGwei}</div>
        )}
        <div className="text-xs text-surface-500 mt-1">
          {t('admin.gasSettings.maxGasPriceDesc', {
            defaultValue: 'Safety cap — transactions will not exceed this gas price regardless of multipliers.',
          })}
        </div>
      </div>

      {/* Per-operation multipliers */}
      <div className="flex items-center mb-3">
        <h6 className="mb-0">
          {t('admin.gasSettings.operationMultipliers', { defaultValue: 'Operation Multipliers' })}
        </h6>
        <hr className="grow ml-3 my-0" />
      </div>

      {OPERATIONS.map((op) => (
        <Card key={op} className={`mb-3 border-l-[3px] ${opBorderColors[op]}`}>
          <div className="px-5 py-3">
            <h6 className={`mb-3 flex items-center ${opTextColors[op]}`}>
              <i className={`bx ${opIcons[op]} mr-2`}></i>
              {opLabels[op]}
            </h6>
            <div className={`grid gap-3 ${isEip1559 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <Label className="text-sm text-surface-500 mb-1">
                  {t('admin.gasSettings.baseMultiplier', { defaultValue: 'Base Multiplier' })}
                </Label>
                <InputGroup error={formErrors[`${op}Base`]}>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={editForm[`${op}Base`] ?? ''}
                    onChange={(e) => updateField(`${op}Base`, e.target.value)}
                  />
                  <InputAddon>×</InputAddon>
                </InputGroup>
                {formErrors[`${op}Base`] && (
                  <div className="text-xs text-danger-500 mt-1 block">{formErrors[`${op}Base`]}</div>
                )}
              </div>
              {isEip1559 && (
                <div>
                  <Label className="text-sm text-surface-500 mb-1">
                    {t('admin.gasSettings.priorityMultiplier', { defaultValue: 'Priority Multiplier' })}
                  </Label>
                  <InputGroup error={formErrors[`${op}Priority`]}>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={editForm[`${op}Priority`] ?? ''}
                      onChange={(e) => updateField(`${op}Priority`, e.target.value)}
                    />
                    <InputAddon>×</InputAddon>
                  </InputGroup>
                  {formErrors[`${op}Priority`] && (
                    <div className="text-xs text-danger-500 mt-1 block">{formErrors[`${op}Priority`]}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </>
  )
}

function GasLimitForm({ t, network, editForm, updateField, formErrors }) {
  return (
    <div>
      <div className="mb-4">
        <span className="text-surface-500">{network.symbol}</span>
      </div>
      <div className="mb-3">
        <Label className="font-semibold">
          {t('admin.gasSettings.gasLimitMultiplier', { defaultValue: 'Gas Limit Multiplier' })}
        </Label>
        <InputGroup error={formErrors.multiplier}>
          <Input
            type="text"
            inputMode="decimal"
            value={editForm.multiplier ?? ''}
            onChange={(e) => updateField('multiplier', e.target.value)}
          />
          <InputAddon>×</InputAddon>
        </InputGroup>
        {formErrors.multiplier && <div className="text-xs text-danger-500 mt-1 block">{formErrors.multiplier}</div>}
        <div className="text-xs text-surface-500 mt-1">
          {t('admin.gasSettings.gasLimitMultiplierDesc', {
            defaultValue:
              'Applied to estimateGas() result. 1.10 = 10% buffer, 1.20 = 20% buffer. Higher buffer prevents out-of-gas failures.',
          })}
        </div>
      </div>
      {editForm.multiplier && !isNaN(parseFloat(editForm.multiplier)) && (
        <Alert variant="info" className="mb-0">
          <i className="bx bx-calculator mr-1"></i>
          {t('admin.gasSettings.bufferPreview', {
            defaultValue: 'Buffer: +{{pct}}% above gas estimate',
            pct: ((parseFloat(editForm.multiplier) - 1) * 100).toFixed(0),
          })}
        </Alert>
      )}
    </div>
  )
}

function GasTopupForm({ t, network, editForm, updateField, formErrors }) {
  return (
    <div>
      <div className="mb-3">
        <span className="text-surface-500">{network.symbol}</span>
        <Badge color="primary" label className="ml-2">
          {network.nativeCoin}
        </Badge>
      </div>
      <div className="mb-3">
        <Label className="font-semibold">
          {t('admin.gasSettings.maxTopupAmount', { defaultValue: 'Max Topup Amount' })}
        </Label>
        <InputGroup error={formErrors.maxTopupAmount}>
          <Input
            type="text"
            inputMode="decimal"
            value={editForm.maxTopupAmount ?? ''}
            onChange={(e) => updateField('maxTopupAmount', e.target.value)}
          />
          <InputAddon>{network.nativeCoin}</InputAddon>
        </InputGroup>
        {formErrors.maxTopupAmount && (
          <div className="text-xs text-danger-500 mt-1 block">{formErrors.maxTopupAmount}</div>
        )}
        <div className="text-xs text-surface-500 mt-1">
          {t('admin.gasSettings.maxTopupAmountDesc', {
            defaultValue:
              'Maximum native coin to send per topup operation. Safety cap to prevent over-funding temp wallets.',
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Modal ────────────────────────────────────────────

export default function GasEditModal({
  t,
  editModal,
  editForm,
  setEditForm,
  formErrors,
  updateField,
  saving,
  onClose,
  onSave,
}) {
  const { tab, network } = editModal
  const isEip1559 = network.type === 'eip1559'

  const modalTitle = {
    gasPrice: t('admin.gasSettings.editGasPrice', {
      defaultValue: 'Edit Gas Price — {{network}}',
      network: network.name,
    }),
    gasLimit: t('admin.gasSettings.editGasLimit', {
      defaultValue: 'Edit Gas Limit — {{network}}',
      network: network.name,
    }),
    gasTopup: t('admin.gasSettings.editGasTopup', {
      defaultValue: 'Edit Gas Topup — {{network}}',
      network: network.name,
    }),
  }[tab]

  const tabIcon = TABS.find((item) => item.key === tab)?.icon || 'bx-cog'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      tabIndex="-1"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose()
      }}
    >
      <div className={`w-full mx-4 ${tab === 'gasPrice' ? 'max-w-[800px]' : 'max-w-lg'}`}>
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-300">
            <h5 className="text-lg font-semibold text-surface-800">
              <i className={`bx ${tabIcon} mr-2`}></i>
              {modalTitle}
            </h5>
            <button
              type="button"
              className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"
              onClick={onClose}
              disabled={saving}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>
          <div className="p-5">
            {tab === 'gasPrice' && (
              <GasPriceForm
                t={t}
                network={network}
                isEip1559={isEip1559}
                editForm={editForm}
                updateField={updateField}
                formErrors={formErrors}
              />
            )}
            {tab === 'gasLimit' && (
              <GasLimitForm
                t={t}
                network={network}
                editForm={editForm}
                updateField={updateField}
                formErrors={formErrors}
              />
            )}
            {tab === 'gasTopup' && (
              <GasTopupForm
                t={t}
                network={network}
                editForm={editForm}
                updateField={updateField}
                formErrors={formErrors}
              />
            )}
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200 dark:border-surface-300">
            <Button onClick={onClose} disabled={saving} variant="outline-secondary">
              {t('admin.gasSettings.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving && <Spinner role="status" className="w-4 h-4 mr-1" />}
              {t('admin.gasSettings.save', { defaultValue: 'Save Changes' })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
