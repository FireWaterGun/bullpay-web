import { useTranslation } from 'react-i18next'
import useEVMFeePolicy from './useEVMFeePolicy'
import ChainSettingsTable from './ChainSettingsTable'
import { ChainSettingModal, DeleteConfirmModal } from './EVMFeePolicyModals'
import ConfirmResetModal from '../../components/ConfirmResetModal'

export default function EVMFeePolicy() {
  const { t } = useTranslation()
  const {
    loading,
    loadingData,
    formData,
    showChainModal,
    setShowChainModal,
    showDeleteModal,
    setShowDeleteModal,
    chainForm,
    setChainForm,
    editingChain,
    deleteTarget,
    handleSave,
    handleInputChange,
    handleReset,
    showResetConfirm,
    setShowResetConfirm,
    confirmReset,
    validateNumberInput,
    hasChanges,
    handleEditChain,
    handleSaveChain,
    confirmDelete,
    getChainModalTitle
  } = useEVMFeePolicy()

  if (loadingData) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card mb-6">
            <div className="card-header">
              <h5 className="mb-0">{t('admin.evm.title', { defaultValue: 'EVM Fee Policy' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.evm.description', { defaultValue: 'Configure EVM blockchain fee policies and gas price settings' })}
              </p>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="row g-4">
                  <div className="col-12">
                    <h6 className="text-primary mb-4">
                      {t('admin.evm.defaultSettings', { defaultValue: 'Default Settings' })}
                    </h6>
                  </div>

                  <div className="col-md-6 mt-4">
                    <label htmlFor="defaultMinPriorityFee" className="form-label">
                      {t('admin.evm.defaultMinPriorityFee', { defaultValue: 'Default Min Priority Fee (gwei)' })}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="defaultMinPriorityFee"
                      placeholder="2"
                      step="0.1"
                      value={formData.defaultMinPriorityFee}
                      onChange={(e) => handleInputChange('defaultMinPriorityFee', e.target.value)}
                      onInput={validateNumberInput}
                    />
                    <small className="text-muted">
                      {t('admin.evm.defaultMinPriorityFeeHelp', { defaultValue: 'Default minimum priority fee for all EVM chains' })}
                    </small>
                  </div>

                  <div className="col-md-6 mt-4">
                    <label htmlFor="headroomMultiplier" className="form-label">
                      {t('admin.evm.headroomMultiplier', { defaultValue: 'Headroom Multiplier' })}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="headroomMultiplier"
                      placeholder="1.2"
                      step="0.01"
                      value={formData.headroomMultiplier}
                      onChange={(e) => handleInputChange('headroomMultiplier', e.target.value)}
                      onInput={validateNumberInput}
                    />
                    <small className="text-muted">
                      {t('admin.evm.headroomMultiplierHelp', { defaultValue: 'Default multiplier for maxFeePerGas (e.g., 1.2 = +20%)' })}
                    </small>
                  </div>

                  {/* Fee Bump Multipliers */}
                  <div className="col-12 mt-5">
                    <hr className="my-4" />
                    <h6 className="text-primary mb-4">
                      {t('admin.evm.feeBumpMultipliers', { defaultValue: 'Fee Bump Multipliers' })}
                    </h6>
                  </div>

                  <div className="col-md-6 mt-4">
                    <label htmlFor="bumpMultiplierUnderpriced" className="form-label">
                      {t('admin.evm.bumpMultiplierUnderpriced', { defaultValue: 'Bump Multiplier (Underpriced)' })}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="bumpMultiplierUnderpriced"
                      placeholder="1.2"
                      step="0.01"
                      value={formData.bumpMultiplierUnderpriced}
                      onChange={(e) => handleInputChange('bumpMultiplierUnderpriced', e.target.value)}
                      onInput={validateNumberInput}
                    />
                    <small className="text-muted">
                      {t('admin.evm.bumpMultiplierUnderpricedHelp', { defaultValue: 'Multiplier when underpriced error occurs' })}
                    </small>
                  </div>

                  <div className="col-md-6 mt-4">
                    <label htmlFor="bumpMultiplierReplacement" className="form-label">
                      {t('admin.evm.bumpMultiplierReplacement', { defaultValue: 'Bump Multiplier (Replacement)' })}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="bumpMultiplierReplacement"
                      placeholder="1.3"
                      step="0.01"
                      value={formData.bumpMultiplierReplacement}
                      onChange={(e) => handleInputChange('bumpMultiplierReplacement', e.target.value)}
                      onInput={validateNumberInput}
                    />
                    <small className="text-muted">
                      {t('admin.evm.bumpMultiplierReplacementHelp', { defaultValue: 'Multiplier when replacement-underpriced error occurs' })}
                    </small>
                  </div>

                  {/* Save/Reset Buttons for Default Settings */}
                  <div className="col-12 mt-4">
                    <div className="d-flex gap-2 justify-content-end">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleReset}
                        disabled={!hasChanges() || loading}
                      >
                        <i className="bx bx-reset me-1"></i>
                        {t('actions.reset', { defaultValue: 'Reset' })}
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !hasChanges()}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            {t('actions.saving', { defaultValue: 'Saving...' })}
                          </>
                        ) : (
                          <>
                            <i className="bx bx-save me-1"></i>
                            {t('actions.save', { defaultValue: 'Save Changes' })}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Chain-Specific Settings */}
                  <div className="col-12 mt-5">
                    <hr className="my-4" />
                    <h6 className="text-primary fw-semibold mb-4">
                      {t('admin.evm.chainSpecificSettings', { defaultValue: 'Chain-Specific Settings' })}
                    </h6>
                  </div>

                  <ChainSettingsTable
                    data={formData.minPriorityFeeByChain}
                    type="minPriority"
                    label={t('admin.evm.minPriorityFeeByChain', { defaultValue: 'Min Priority Fee by Chain (gwei)' })}
                    valueHeader="Value (gwei)"
                    keyPrefix="min-priority"
                    emptyMessage="No chain-specific settings"
                    onEdit={handleEditChain}
                    loading={loading}
                  />

                  <ChainSettingsTable
                    data={formData.headroomByChain}
                    type="headroom"
                    label={t('admin.evm.headroomByChain', { defaultValue: 'Headroom Multiplier by Chain' })}
                    valueHeader="Multiplier"
                    keyPrefix="headroom"
                    emptyMessage="No chain-specific settings"
                    onEdit={handleEditChain}
                    loading={loading}
                  />

                  {/* Max Fee Caps by Chain */}
                  <div className="col-12 mt-5">
                    <h6 className="text-primary fw-semibold mb-4">
                      {t('admin.evm.maxFeeCaps', { defaultValue: 'Maximum Fee Caps by Chain' })}
                    </h6>
                  </div>

                  <ChainSettingsTable
                    data={formData.maxFeeCapByChain}
                    type="maxFeeCap"
                    label={t('admin.evm.maxFeeCapByChain', { defaultValue: 'Generic Max Fee Cap (gwei)' })}
                    valueHeader="Cap (gwei)"
                    keyPrefix="max-fee"
                    emptyMessage="No caps configured"
                    onEdit={handleEditChain}
                    loading={loading}
                  />

                  <ChainSettingsTable
                    data={formData.maxPriorityCapByChain}
                    type="maxPriorityCap"
                    label={t('admin.evm.maxPriorityCapByChain', { defaultValue: 'Generic Max Priority Cap (gwei)' })}
                    valueHeader="Cap (gwei)"
                    keyPrefix="max-priority"
                    emptyMessage="No caps configured"
                    onEdit={handleEditChain}
                    loading={loading}
                  />

                  {/* Sweep Caps */}
                  <div className="col-12 mt-5">
                    <h6 className="text-primary fw-semibold mb-4">
                      {t('admin.evm.sweepCaps', { defaultValue: 'Sweep-Specific Caps' })}
                    </h6>
                  </div>

                  <ChainSettingsTable
                    data={formData.sweepMaxFeeCapByChain}
                    type="sweepMaxFeeCap"
                    label={t('admin.evm.sweepMaxFeeCapByChain', { defaultValue: 'Sweep Max Fee Cap (gwei)' })}
                    valueHeader="Cap (gwei)"
                    keyPrefix="sweep-fee"
                    emptyMessage="No caps configured"
                    onEdit={handleEditChain}
                    loading={loading}
                  />

                  <ChainSettingsTable
                    data={formData.sweepMaxPriorityCapByChain}
                    type="sweepMaxPriorityCap"
                    label={t('admin.evm.sweepMaxPriorityCapByChain', { defaultValue: 'Sweep Max Priority Cap (gwei)' })}
                    valueHeader="Cap (gwei)"
                    keyPrefix="sweep-priority"
                    emptyMessage="No caps configured"
                    onEdit={handleEditChain}
                    loading={loading}
                  />

                  {/* Withdraw Caps */}
                  <div className="col-12 mt-5">
                    <h6 className="text-primary fw-semibold mb-4">
                      {t('admin.evm.withdrawCaps', { defaultValue: 'Withdraw-Specific Caps' })}
                    </h6>
                  </div>

                  <ChainSettingsTable
                    data={formData.withdrawMaxFeeCapByChain}
                    type="withdrawMaxFeeCap"
                    label={t('admin.evm.withdrawMaxFeeCapByChain', { defaultValue: 'Withdraw Max Fee Cap (gwei)' })}
                    valueHeader="Cap (gwei)"
                    keyPrefix="withdraw-fee"
                    emptyMessage="No caps configured"
                    onEdit={handleEditChain}
                    loading={loading}
                  />

                  <ChainSettingsTable
                    data={formData.withdrawMaxPriorityCapByChain}
                    type="withdrawMaxPriorityCap"
                    label={t('admin.evm.withdrawMaxPriorityCapByChain', { defaultValue: 'Withdraw Max Priority Cap (gwei)' })}
                    valueHeader="Cap (gwei)"
                    keyPrefix="withdraw-priority"
                    emptyMessage="No caps configured"
                    onEdit={handleEditChain}
                    loading={loading}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <ChainSettingModal
        show={showChainModal}
        loading={loading}
        editingChain={editingChain}
        chainForm={chainForm}
        setChainForm={setChainForm}
        onClose={() => setShowChainModal(false)}
        onSave={handleSaveChain}
        getTitle={getChainModalTitle}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        loading={loading}
        deleteTarget={deleteTarget}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />

      {showResetConfirm && (
        <ConfirmResetModal
          title={t('actions.confirm', { defaultValue: 'Confirm' })}
          message={t('admin.evm.resetConfirm', { defaultValue: 'Are you sure you want to reset all settings?' })}
          onConfirm={confirmReset}
          onClose={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  )
}
