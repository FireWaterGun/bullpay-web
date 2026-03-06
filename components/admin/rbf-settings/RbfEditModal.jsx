import { Alert, Button, Card, Input, InputGroup, InputAddon, Label, Select, Spinner } from '@/components/ui';
import { formatMs, formatRatio } from '@/lib/utils/settingsFormatters';

export default function RbfEditModal({
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
  const { tab } = editModal;

  let modalTitle = '';
  let modalIcon = 'bx-cog';
  let modalSize = '';

  if (tab === 'global') {
    const groupTitles = {
      droppedDetection: t('admin.rbfSettings.editDroppedDetection', { defaultValue: 'Edit Dropped Detection' }),
      rateLimiting: t('admin.rbfSettings.editRateLimiting', { defaultValue: 'Edit Rate Limiting' }),
      safety: t('admin.rbfSettings.editSafety', { defaultValue: 'Edit Safety Limits' }),
    };
    const groupIcons = {
      droppedDetection: 'bx-search-alt',
      rateLimiting: 'bx-shield',
      safety: 'bx-lock-alt',
    };
    modalTitle = groupTitles[editModal.group];
    modalIcon = groupIcons[editModal.group];
  } else {
    modalTitle = t('admin.rbfSettings.editNetwork', { defaultValue: 'Edit RBF — {{network}}', network: editModal.network.name });
    modalIcon = 'bx-network-chart';
    modalSize = 'max-w-[800px]';
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      tabIndex="-1"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className={`w-full max-w-lg mx-4 ${modalSize}`}>
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              <i className={`bx ${modalIcon} mr-2`}></i>
              {modalTitle}
            </h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none" onClick={onClose} disabled={saving}><i className="bx bx-x"></i></button>
          </div>
          <div className="p-5">
            {tab === 'global' && <GlobalForm t={t} editModal={editModal} editForm={editForm} updateField={updateField} formErrors={formErrors} />}
            {tab === 'network' && <NetworkForm t={t} editModal={editModal} editForm={editForm} setEditForm={setEditForm} updateField={updateField} formErrors={formErrors} />}
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button onClick={onClose} disabled={saving} variant="outline-secondary">
              {t('admin.rbfSettings.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving && <Spinner role="status" className="w-4 h-4 mr-1" />}
              {t('admin.rbfSettings.save', { defaultValue: 'Save Changes' })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlobalForm({ t, editModal, editForm, updateField, formErrors }) {
  const { group } = editModal;

  if (group === 'droppedDetection') {
    return (
      <>
        <div className="mb-3">
          <Label className="font-semibold">
            {t('admin.rbfSettings.minNotFoundCount', { defaultValue: 'Min Not-Found Checks' })}
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            value={editForm.minNotFoundCount ?? ''}
            onChange={(e) => updateField('minNotFoundCount', e.target.value)}
            error={formErrors.minNotFoundCount} />
          {formErrors.minNotFoundCount && <div className="text-xs text-danger-500 mt-1">{formErrors.minNotFoundCount}</div>}
          <div className="text-xs text-surface-500 mt-1">
            {t('admin.rbfSettings.minNotFoundCountDesc', {
              defaultValue: 'Number of consecutive checks where transaction is not found before considering it dropped.',
            })}
          </div>
        </div>
        <div className="mb-3">
          <Label className="font-semibold">
            {t('admin.rbfSettings.minNotFoundDuration', { defaultValue: 'Min Not-Found Duration' })}
          </Label>
          <InputGroup error={formErrors.minNotFoundDuration}>
            <Input
              type="text"
              inputMode="numeric"
              value={editForm.minNotFoundDuration ?? ''}
              onChange={(e) => updateField('minNotFoundDuration', e.target.value)}
               />
            <InputAddon>ms</InputAddon>
          </InputGroup>
          {formErrors.minNotFoundDuration && <div className="text-xs text-danger-500 mt-1 block">{formErrors.minNotFoundDuration}</div>}
          <div className="text-xs text-surface-500 mt-1">
            {t('admin.rbfSettings.minNotFoundDurationDesc', {
              defaultValue: 'Minimum time (milliseconds) a transaction must be missing before considering it dropped.',
            })}
          </div>
          {editForm.minNotFoundDuration && !isNaN(Number(editForm.minNotFoundDuration)) && (
            <Alert variant="info" className="mt-2 mb-0 py-2">
              <i className="bx bx-time mr-1"></i>
              ≈ {formatMs(editForm.minNotFoundDuration)}
            </Alert>
          )}
        </div>
      </>
    );
  }

  if (group === 'rateLimiting') {
    return (
      <>
        <div className="mb-3">
          <Label className="font-semibold">
            {t('admin.rbfSettings.maxRbfPerHour', { defaultValue: 'Max RBF Per Hour' })}
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            value={editForm.maxRbfPerHour ?? ''}
            onChange={(e) => updateField('maxRbfPerHour', e.target.value)}
            error={formErrors.maxRbfPerHour} />
          {formErrors.maxRbfPerHour && <div className="text-xs text-danger-500 mt-1">{formErrors.maxRbfPerHour}</div>}
          <div className="text-xs text-surface-500 mt-1">
            {t('admin.rbfSettings.maxRbfPerHourDesc', {
              defaultValue: 'Maximum number of RBF replacement transactions the system can submit per hour (global).',
            })}
          </div>
        </div>
        <div className="mb-3">
          <Label className="font-semibold">
            {t('admin.rbfSettings.maxRbfPerAddress', { defaultValue: 'Max RBF Per Address' })}
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            value={editForm.maxRbfPerAddress ?? ''}
            onChange={(e) => updateField('maxRbfPerAddress', e.target.value)}
            error={formErrors.maxRbfPerAddress} />
          {formErrors.maxRbfPerAddress && <div className="text-xs text-danger-500 mt-1">{formErrors.maxRbfPerAddress}</div>}
          <div className="text-xs text-surface-500 mt-1">
            {t('admin.rbfSettings.maxRbfPerAddressDesc', {
              defaultValue: 'Maximum number of RBF replacement transactions per wallet address.',
            })}
          </div>
        </div>
      </>
    );
  }

  if (group === 'safety') {
    return (
      <div className="mb-3">
        <Label className="font-semibold">
          {t('admin.rbfSettings.maxReplacementsPerTx', { defaultValue: 'Max Replacements Per Tx' })}
        </Label>
        <Input
          type="text"
          inputMode="numeric"
          value={editForm.maxReplacementsPerTx ?? ''}
          onChange={(e) => updateField('maxReplacementsPerTx', e.target.value)}
          error={formErrors.maxReplacementsPerTx} />
        {formErrors.maxReplacementsPerTx && <div className="text-xs text-danger-500 mt-1">{formErrors.maxReplacementsPerTx}</div>}
        <div className="text-xs text-surface-500 mt-1">
          {t('admin.rbfSettings.maxReplacementsPerTxDesc', {
            defaultValue: 'Maximum number of times a single transaction can be replaced. Prevents infinite replacement loops.',
          })}
        </div>
      </div>
    );
  }

  return null;
}

function NetworkForm({ t, editModal, editForm, setEditForm, updateField, formErrors }) {
  const { network } = editModal;

  return (
    <>
      {/* Network badge */}
      <div className="mb-4">
        <span className="text-surface-500">{network.symbol}</span>
      </div>

      {/* Enabled toggle */}
      <div className="mb-4">
        <Label className="font-semibold">
          {t('admin.rbfSettings.enabledLabel', { defaultValue: 'RBF Enabled' })}
        </Label>
        <Select
          value={editForm.enabled ?? ''}
          onChange={(e) => setEditForm((f) => ({ ...f, enabled: e.target.value }))}>
          {editForm.enabled === '' && <option value="" disabled>—</option>}
          <option value="true">{t('admin.rbfSettings.enabled', { defaultValue: 'Enabled' })}</option>
          <option value="false">{t('admin.rbfSettings.disabled', { defaultValue: 'Disabled' })}</option>
        </Select>
        <div className="text-xs text-surface-500 mt-1">
          {t('admin.rbfSettings.enabledDesc', { defaultValue: 'Enable or disable RBF for this network.' })}
        </div>
      </div>

      {/* Gas Bump */}
      <Card style={{ borderLeft: '3px solid var(--color-amber-500)' }} className="mb-3">
        <div className="p-5 py-3">
          <h6 className="mb-3 flex items-center text-warning">
            <i className="bx bx-trending-up mr-2"></i>
            {t('admin.rbfSettings.gasBumpSection', { defaultValue: 'Gas Price Bump' })}
          </h6>
          <Label className="text-sm text-surface-500 mb-1">
            {t('admin.rbfSettings.gasBumpPercent', { defaultValue: 'Gas Bump Percent' })}
          </Label>
          <InputGroup error={formErrors.gasBumpPercent}>
            <Input
              type="text"
              inputMode="numeric"
              value={editForm.gasBumpPercent ?? ''}
              onChange={(e) => updateField('gasBumpPercent', e.target.value)}
               />
            <InputAddon>%</InputAddon>
          </InputGroup>
          {formErrors.gasBumpPercent && <div className="text-xs text-danger-500 mt-1 block">{formErrors.gasBumpPercent}</div>}
          <div className="text-xs text-surface-500 mt-1">
            {t('admin.rbfSettings.gasBumpPercentDesc', { defaultValue: 'Percentage to increase gas price when submitting RBF replacement.' })}
          </div>
        </div>
      </Card>

      {/* Timing */}
      <Card style={{ borderLeft: '3px solid var(--color-cyan-500)' }} className="mb-3">
        <div className="p-5 py-3">
          <h6 className="mb-3 flex items-center text-info">
            <i className="bx bx-time mr-2"></i>
            {t('admin.rbfSettings.timingSection', { defaultValue: 'Timing Thresholds' })}
          </h6>
          <div className="grid grid-cols-12 gap-x-6 gap-3">
            <div className="md:col-span-4">
              <Label className="text-sm text-surface-500 mb-1">
                {t('admin.rbfSettings.minPendingDuration', { defaultValue: 'Min Pending Duration' })}
              </Label>
              <InputGroup error={formErrors.minPendingDuration}>
                <Input type="text" inputMode="numeric" value={editForm.minPendingDuration ?? ''} onChange={(e) => updateField('minPendingDuration', e.target.value)} />
                <InputAddon>ms</InputAddon>
              </InputGroup>
              {formErrors.minPendingDuration && <div className="text-xs text-danger-500 mt-1 block">{formErrors.minPendingDuration}</div>}
              {editForm.minPendingDuration && !isNaN(Number(editForm.minPendingDuration)) && <small className="text-surface-500">≈ {formatMs(editForm.minPendingDuration)}</small>}
            </div>
            <div className="md:col-span-4">
              <Label className="text-sm text-surface-500 mb-1">
                {t('admin.rbfSettings.maxPendingDuration', { defaultValue: 'Max Pending Duration' })}
              </Label>
              <InputGroup error={formErrors.maxPendingDuration}>
                <Input type="text" inputMode="numeric" value={editForm.maxPendingDuration ?? ''} onChange={(e) => updateField('maxPendingDuration', e.target.value)} />
                <InputAddon>ms</InputAddon>
              </InputGroup>
              {formErrors.maxPendingDuration && <div className="text-xs text-danger-500 mt-1 block">{formErrors.maxPendingDuration}</div>}
              {editForm.maxPendingDuration && !isNaN(Number(editForm.maxPendingDuration)) && <small className="text-surface-500">≈ {formatMs(editForm.maxPendingDuration)}</small>}
            </div>
            <div className="md:col-span-4">
              <Label className="text-sm text-surface-500 mb-1">
                {t('admin.rbfSettings.minTimeBetweenReplaces', { defaultValue: 'Min Replace Interval' })}
              </Label>
              <InputGroup error={formErrors.minTimeBetweenReplaces}>
                <Input type="text" inputMode="numeric" value={editForm.minTimeBetweenReplaces ?? ''} onChange={(e) => updateField('minTimeBetweenReplaces', e.target.value)} />
                <InputAddon>ms</InputAddon>
              </InputGroup>
              {formErrors.minTimeBetweenReplaces && <div className="text-xs text-danger-500 mt-1 block">{formErrors.minTimeBetweenReplaces}</div>}
              {editForm.minTimeBetweenReplaces && !isNaN(Number(editForm.minTimeBetweenReplaces)) && <small className="text-surface-500">≈ {formatMs(editForm.minTimeBetweenReplaces)}</small>}
            </div>
          </div>
        </div>
      </Card>

      {/* Cost Limits */}
      <Card style={{ borderLeft: '3px solid var(--color-green-500)' }} className="mb-0">
        <div className="p-5 py-3">
          <h6 className="mb-3 flex items-center text-success">
            <i className="bx bx-dollar mr-2"></i>
            {t('admin.rbfSettings.costSection', { defaultValue: 'Cost Limits' })}
          </h6>
          <div className="grid grid-cols-12 gap-x-6 gap-3">
            <div className="md:col-span-4">
              <Label className="text-sm text-surface-500 mb-1">
                {t('admin.rbfSettings.minAmountUsd', { defaultValue: 'Min Amount (USD)' })}
              </Label>
              <InputGroup error={formErrors.minAmountUsd}>
                <InputAddon>$</InputAddon>
                <Input type="text" inputMode="decimal" value={editForm.minAmountUsd ?? ''} onChange={(e) => updateField('minAmountUsd', e.target.value)} />
              </InputGroup>
              {formErrors.minAmountUsd && <div className="text-xs text-danger-500 mt-1 block">{formErrors.minAmountUsd}</div>}
              <div className="text-xs text-surface-500 mt-1">
                {t('admin.rbfSettings.minAmountUsdDesc', { defaultValue: 'Minimum transaction USD value to allow RBF.' })}
              </div>
            </div>
            <div className="md:col-span-4">
              <Label className="text-sm text-surface-500 mb-1">
                {t('admin.rbfSettings.maxCostRatio', { defaultValue: 'Max Cost Ratio' })}
              </Label>
              <Input type="text" inputMode="decimal" value={editForm.maxCostRatio ?? ''} onChange={(e) => updateField('maxCostRatio', e.target.value)} error={formErrors.maxCostRatio} />
              {formErrors.maxCostRatio && <div className="text-xs text-danger-500 mt-1">{formErrors.maxCostRatio}</div>}
              <div className="text-xs text-surface-500 mt-1">
                {t('admin.rbfSettings.maxCostRatioDesc', { defaultValue: 'Max gas cost as fraction of tx value (0.05 = 5%).' })}
              </div>
              {editForm.maxCostRatio && !isNaN(Number(editForm.maxCostRatio)) && <small className="text-info">= {formatRatio(editForm.maxCostRatio)}</small>}
            </div>
            <div className="md:col-span-4">
              <Label className="text-sm text-surface-500 mb-1">
                {t('admin.rbfSettings.maxCostUsd', { defaultValue: 'Max Cost (USD)' })}
              </Label>
              <InputGroup error={formErrors.maxCostUsd}>
                <InputAddon>$</InputAddon>
                <Input type="text" inputMode="decimal" value={editForm.maxCostUsd ?? ''} onChange={(e) => updateField('maxCostUsd', e.target.value)} />
              </InputGroup>
              {formErrors.maxCostUsd && <div className="text-xs text-danger-500 mt-1 block">{formErrors.maxCostUsd}</div>}
              <div className="text-xs text-surface-500 mt-1">
                {t('admin.rbfSettings.maxCostUsdDesc', { defaultValue: 'Maximum USD gas cost for a single RBF replacement.' })}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
