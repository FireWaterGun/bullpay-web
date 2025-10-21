import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings, updateSweepSetting } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'

export default function EVMFeePolicy() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [settings, setSettings] = useState({})
  const [originalData, setOriginalData] = useState({})
  const [formData, setFormData] = useState({
    defaultMinPriorityFee: '',
    minPriorityFeeByChain: {},
    headroomMultiplier: '',
    headroomByChain: {},
    maxFeeCapByChain: {},
    maxPriorityCapByChain: {},
    sweepMaxFeeCapByChain: {},
    sweepMaxPriorityCapByChain: {},
    withdrawMaxFeeCapByChain: {},
    withdrawMaxPriorityCapByChain: {},
    bumpMultiplierUnderpriced: '',
    bumpMultiplierReplacement: ''
  })

  // Modal states
  const [showDefaultsModal, setShowDefaultsModal] = useState(false)
  const [showBumpMultipliersModal, setShowBumpMultipliersModal] = useState(false)
  const [showChainModal, setShowChainModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [chainModalType, setChainModalType] = useState('') // 'minPriority', 'headroom', 'maxFeeCap', etc.
  const [chainForm, setChainForm] = useState({ chainId: '', value: '' })
  const [editingChain, setEditingChain] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState({ chainId: '', type: '' })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoadingData(true)
      const data = await getSweepSettings(token, 'blockchain', 'global', 1, 100)
      
      const settingsMap = {}
      data.forEach(setting => {
        const key = setting.keyName.replace('evm.fee_policy.', '')
        settingsMap[key] = setting
      })
      
      const initialData = {
        defaultMinPriorityFee: settingsMap.default_min_priority_fee?.parsedValue || '',
        minPriorityFeeByChain: settingsMap.min_priority_fee_by_chain?.parsedValue || {},
        headroomMultiplier: settingsMap.headroom_multiplier?.parsedValue || '',
        headroomByChain: settingsMap.headroom_by_chain?.parsedValue || {},
        maxFeeCapByChain: settingsMap.max_fee_cap_by_chain?.parsedValue || {},
        maxPriorityCapByChain: settingsMap.max_priority_cap_by_chain?.parsedValue || {},
        sweepMaxFeeCapByChain: settingsMap.sweep_max_fee_cap_by_chain?.parsedValue || {},
        sweepMaxPriorityCapByChain: settingsMap.sweep_max_priority_cap_by_chain?.parsedValue || {},
        withdrawMaxFeeCapByChain: settingsMap.withdraw_max_fee_cap_by_chain?.parsedValue || {},
        withdrawMaxPriorityCapByChain: settingsMap.withdraw_max_priority_cap_by_chain?.parsedValue || {},
        bumpMultiplierUnderpriced: settingsMap.bump_multiplier_underpriced?.parsedValue || '',
        bumpMultiplierReplacement: settingsMap.bump_multiplier_replacement?.parsedValue || ''
      }
      
      setFormData(initialData)
      setOriginalData(JSON.parse(JSON.stringify(initialData)))
      setSettings(settingsMap)
    } catch (error) {
      console.error('Failed to load EVM fee policy settings:', error)
      toast.error(t('admin.evm.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      setLoading(true)
      
      const updates = []
      
      if (formData.defaultMinPriorityFee !== originalData.defaultMinPriorityFee) {
        updates.push({ key: 'evm.fee_policy.default_min_priority_fee', value: formData.defaultMinPriorityFee })
      }
      
      if (JSON.stringify(formData.minPriorityFeeByChain) !== JSON.stringify(originalData.minPriorityFeeByChain)) {
        updates.push({ key: 'evm.fee_policy.min_priority_fee_by_chain', value: formData.minPriorityFeeByChain })
      }
      
      if (formData.headroomMultiplier !== originalData.headroomMultiplier) {
        updates.push({ key: 'evm.fee_policy.headroom_multiplier', value: formData.headroomMultiplier })
      }
      
      if (JSON.stringify(formData.headroomByChain) !== JSON.stringify(originalData.headroomByChain)) {
        updates.push({ key: 'evm.fee_policy.headroom_by_chain', value: formData.headroomByChain })
      }
      
      if (JSON.stringify(formData.maxFeeCapByChain) !== JSON.stringify(originalData.maxFeeCapByChain)) {
        updates.push({ key: 'evm.fee_policy.max_fee_cap_by_chain', value: formData.maxFeeCapByChain })
      }
      
      if (JSON.stringify(formData.maxPriorityCapByChain) !== JSON.stringify(originalData.maxPriorityCapByChain)) {
        updates.push({ key: 'evm.fee_policy.max_priority_cap_by_chain', value: formData.maxPriorityCapByChain })
      }
      
      if (JSON.stringify(formData.sweepMaxFeeCapByChain) !== JSON.stringify(originalData.sweepMaxFeeCapByChain)) {
        updates.push({ key: 'evm.fee_policy.sweep_max_fee_cap_by_chain', value: formData.sweepMaxFeeCapByChain })
      }
      
      if (JSON.stringify(formData.sweepMaxPriorityCapByChain) !== JSON.stringify(originalData.sweepMaxPriorityCapByChain)) {
        updates.push({ key: 'evm.fee_policy.sweep_max_priority_cap_by_chain', value: formData.sweepMaxPriorityCapByChain })
      }
      
      if (JSON.stringify(formData.withdrawMaxFeeCapByChain) !== JSON.stringify(originalData.withdrawMaxFeeCapByChain)) {
        updates.push({ key: 'evm.fee_policy.withdraw_max_fee_cap_by_chain', value: formData.withdrawMaxFeeCapByChain })
      }
      
      if (JSON.stringify(formData.withdrawMaxPriorityCapByChain) !== JSON.stringify(originalData.withdrawMaxPriorityCapByChain)) {
        updates.push({ key: 'evm.fee_policy.withdraw_max_priority_cap_by_chain', value: formData.withdrawMaxPriorityCapByChain })
      }
      
      if (formData.bumpMultiplierUnderpriced !== originalData.bumpMultiplierUnderpriced) {
        updates.push({ key: 'evm.fee_policy.bump_multiplier_underpriced', value: formData.bumpMultiplierUnderpriced })
      }
      
      if (formData.bumpMultiplierReplacement !== originalData.bumpMultiplierReplacement) {
        updates.push({ key: 'evm.fee_policy.bump_multiplier_replacement', value: formData.bumpMultiplierReplacement })
      }
      
      if (updates.length === 0) {
        toast.info(t('admin.evm.noChanges', { defaultValue: 'No changes to save' }))
        return
      }
      
      for (const update of updates) {
        await updateSweepSetting(token, update.key, update.value)
      }
      
      const updatedSettings = updates.map(u => {
        const keyName = u.key.replace('evm.fee_policy.', '').replace(/_/g, ' ')
        return keyName.charAt(0).toUpperCase() + keyName.slice(1)
      }).join(', ')
      
      toast.success(
        `Updated ${updates.length} setting(s) successfully! - ${updatedSettings}`,
        5000
      )
      
      await loadSettings()
    } catch (error) {
      console.error('Failed to save EVM fee policy settings:', error)
      toast.error(error?.message || t('admin.evm.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  function handleReset() {
    if (confirm(t('admin.evm.resetConfirm', { defaultValue: 'Are you sure you want to reset all settings?' }))) {
      loadSettings()
    }
  }

  function validateNumberInput(e) {
    const value = e.target.value
    if (value.length > 20) {
      e.target.value = value.slice(0, 20)
    }
  }

  function hasChanges() {
    return JSON.stringify(formData) !== JSON.stringify(originalData)
  }

  function countChanges() {
    let count = 0
    Object.keys(formData).forEach(key => {
      if (JSON.stringify(formData[key]) !== JSON.stringify(originalData[key])) {
        count++
      }
    })
    return count
  }

  // Helper to edit chain-specific values
  function handleChainValueChange(field, chainId, value) {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [chainId]: value === '' ? undefined : parseFloat(value)
      }
    }))
  }

  function handleRemoveChain(field, chainId) {
    setFormData(prev => {
      const newObj = { ...prev[field] }
      delete newObj[chainId]
      return { ...prev, [field]: newObj }
    })
  }

  // Chain Modal handlers
  function handleAddChain(type) {
    setChainModalType(type)
    setChainForm({ chainId: '', value: '' })
    setEditingChain(null)
    setShowChainModal(true)
  }

  function handleEditChain(type, chainId, value) {
    setChainModalType(type)
    setChainForm({ chainId, value: String(value) })
    setEditingChain(chainId)
    setShowChainModal(true)
  }

  async function handleSaveChain() {
    try {
      if (!chainForm.chainId.trim()) {
        toast.error(t('admin.evm.chainIdRequired', { defaultValue: 'Chain ID is required' }))
        return
      }
      if (!chainForm.value) {
        toast.error(t('admin.evm.valueRequired', { defaultValue: 'Value is required' }))
        return
      }

      setLoading(true)
      
      const fieldMap = {
        minPriority: { field: 'minPriorityFeeByChain', key: 'evm.fee_policy.min_priority_fee_by_chain' },
        headroom: { field: 'headroomByChain', key: 'evm.fee_policy.headroom_by_chain' },
        maxFeeCap: { field: 'maxFeeCapByChain', key: 'evm.fee_policy.max_fee_cap_by_chain' },
        maxPriorityCap: { field: 'maxPriorityCapByChain', key: 'evm.fee_policy.max_priority_cap_by_chain' },
        sweepMaxFeeCap: { field: 'sweepMaxFeeCapByChain', key: 'evm.fee_policy.sweep_max_fee_cap_by_chain' },
        sweepMaxPriorityCap: { field: 'sweepMaxPriorityCapByChain', key: 'evm.fee_policy.sweep_max_priority_cap_by_chain' },
        withdrawMaxFeeCap: { field: 'withdrawMaxFeeCapByChain', key: 'evm.fee_policy.withdraw_max_fee_cap_by_chain' },
        withdrawMaxPriorityCap: { field: 'withdrawMaxPriorityCapByChain', key: 'evm.fee_policy.withdraw_max_priority_cap_by_chain' }
      }

      const config = fieldMap[chainModalType]
      if (!config) return

      const newData = { ...formData[config.field], [chainForm.chainId]: parseFloat(chainForm.value) }
      await updateSweepSetting(token, config.key, newData)
      
      setFormData(prev => ({ ...prev, [config.field]: newData }))
      setOriginalData(prev => ({ ...prev, [config.field]: newData }))
      setShowChainModal(false)
      toast.success(t('admin.evm.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      console.error('Failed to save chain setting:', error)
      toast.error(error?.message || t('admin.evm.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteChain(type, chainId) {
    setDeleteTarget({ chainId, type })
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    try {
      setLoading(true)
      
      const fieldMap = {
        minPriority: { field: 'minPriorityFeeByChain', key: 'evm.fee_policy.min_priority_fee_by_chain' },
        headroom: { field: 'headroomByChain', key: 'evm.fee_policy.headroom_by_chain' },
        maxFeeCap: { field: 'maxFeeCapByChain', key: 'evm.fee_policy.max_fee_cap_by_chain' },
        maxPriorityCap: { field: 'maxPriorityCapByChain', key: 'evm.fee_policy.max_priority_cap_by_chain' },
        sweepMaxFeeCap: { field: 'sweepMaxFeeCapByChain', key: 'evm.fee_policy.sweep_max_fee_cap_by_chain' },
        sweepMaxPriorityCap: { field: 'sweepMaxPriorityCapByChain', key: 'evm.fee_policy.sweep_max_priority_cap_by_chain' },
        withdrawMaxFeeCap: { field: 'withdrawMaxFeeCapByChain', key: 'evm.fee_policy.withdraw_max_fee_cap_by_chain' },
        withdrawMaxPriorityCap: { field: 'withdrawMaxPriorityCapByChain', key: 'evm.fee_policy.withdraw_max_priority_cap_by_chain' }
      }

      const config = fieldMap[deleteTarget.type]
      if (!config) return

      const newData = { ...formData[config.field] }
      delete newData[deleteTarget.chainId]
      await updateSweepSetting(token, config.key, newData)
      
      setFormData(prev => ({ ...prev, [config.field]: newData }))
      setOriginalData(prev => ({ ...prev, [config.field]: newData }))
      setShowDeleteModal(false)
      toast.success(t('admin.evm.deleteSuccess', { defaultValue: 'Deleted successfully' }))
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error(error?.message || t('admin.evm.deleteError', { defaultValue: 'Failed to delete' }))
    } finally {
      setLoading(false)
    }
  }

  function getChainModalTitle() {
    const titles = {
      minPriority: 'Min Priority Fee',
      headroom: 'Headroom Multiplier',
      maxFeeCap: 'Max Fee Cap',
      maxPriorityCap: 'Max Priority Cap',
      sweepMaxFeeCap: 'Sweep Max Fee Cap',
      sweepMaxPriorityCap: 'Sweep Max Priority Cap',
      withdrawMaxFeeCap: 'Withdraw Max Fee Cap',
      withdrawMaxPriorityCap: 'Withdraw Max Priority Cap'
    }
    return t(`admin.evm.${chainModalType}`, { defaultValue: titles[chainModalType] || 'Chain Setting' })
  }

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
                {/* Default Settings */}
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

                  {/* Min Priority Fee by Chain */}
                  <div className="col-12 mt-4">
                    <div className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <span className="text-dark">{t('admin.evm.minPriorityFeeByChain', { defaultValue: 'Min Priority Fee by Chain (gwei)' })}</span>
                          <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                            {Object.keys(formData.minPriorityFeeByChain || {}).length}
                          </span>
                        </div>
                        <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddChain('minPriority')}>
                            <i className="bx bx-plus me-1"></i>
                            {t('actions.add', { defaultValue: 'Add' })}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {Object.keys(formData.minPriorityFeeByChain || {}).length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Chain ID</th>
                              <th>Value (gwei)</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(formData.minPriorityFeeByChain || {}).map(([chainId, value]) => (
                              <tr key={`min-priority-${chainId}`}>
                                <td><strong>{chainId}</strong></td>
                                <td><code>{value}</code></td>
                                <td className="text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon me-1"
                                    onClick={() => handleEditChain('minPriority', chainId, value)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon"
                                    onClick={() => handleDeleteChain('minPriority', chainId)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-trash text-danger" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-5">
                        <i className="bx bx-data" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <p className="mt-3 mb-0">No chain-specific settings</p>
                      </div>
                    )}
                  </div>

                  {/* Headroom by Chain */}
                  <div className="col-12 mt-4">
                    <div className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <span className="text-dark">{t('admin.evm.headroomByChain', { defaultValue: 'Headroom Multiplier by Chain' })}</span>
                          <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                            {Object.keys(formData.headroomByChain || {}).length}
                          </span>
                        </div>
                        <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddChain('headroom')}>
                            <i className="bx bx-plus me-1"></i>
                            {t('actions.add', { defaultValue: 'Add' })}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {Object.keys(formData.headroomByChain || {}).length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Chain ID</th>
                              <th>Multiplier</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(formData.headroomByChain || {}).map(([chainId, value]) => (
                              <tr key={`headroom-${chainId}`}>
                                <td><strong>{chainId}</strong></td>
                                <td><code>{value}</code></td>
                                <td className="text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon me-1"
                                    onClick={() => handleEditChain('headroom', chainId, value)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon"
                                    onClick={() => handleDeleteChain('headroom', chainId)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-trash text-danger" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-5">
                        <i className="bx bx-data" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <p className="mt-3 mb-0">No chain-specific settings</p>
                      </div>
                    )}
                  </div>

                  {/* Max Fee Caps by Chain */}
                  <div className="col-12 mt-5">
                    <h6 className="text-primary fw-semibold mb-4">
                      {t('admin.evm.maxFeeCaps', { defaultValue: 'Maximum Fee Caps by Chain' })}
                    </h6>
                  </div>

                  {/* Generic Max Fee Cap */}
                  <div className="col-12 mt-4">
                    <div className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <span className="text-dark">{t('admin.evm.maxFeeCapByChain', { defaultValue: 'Generic Max Fee Cap (gwei)' })}</span>
                          <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                            {Object.keys(formData.maxFeeCapByChain || {}).length}
                          </span>
                        </div>
                        <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddChain('maxFeeCap')}>
                            <i className="bx bx-plus me-1"></i>
                            {t('actions.add', { defaultValue: 'Add' })}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {Object.keys(formData.maxFeeCapByChain || {}).length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Chain ID</th>
                              <th>Cap (gwei)</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(formData.maxFeeCapByChain || {}).map(([chainId, value]) => (
                              <tr key={`max-fee-${chainId}`}>
                                <td><strong>{chainId}</strong></td>
                                <td><code>{value}</code></td>
                                <td className="text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon me-1"
                                    onClick={() => handleEditChain('maxFeeCap', chainId, value)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon"
                                    onClick={() => handleDeleteChain('maxFeeCap', chainId)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-trash text-danger" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-5">
                        <i className="bx bx-data" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <p className="mt-3 mb-0">No caps configured</p>
                      </div>
                    )}
                  </div>

                  {/* Generic Max Priority Cap */}
                  <div className="col-12 mt-4">
                    <div className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <span className="text-dark">{t('admin.evm.maxPriorityCapByChain', { defaultValue: 'Generic Max Priority Cap (gwei)' })}</span>
                          <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                            {Object.keys(formData.maxPriorityCapByChain || {}).length}
                          </span>
                        </div>
                        <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddChain('maxPriorityCap')}>
                            <i className="bx bx-plus me-1"></i>
                            {t('actions.add', { defaultValue: 'Add' })}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {Object.keys(formData.maxPriorityCapByChain || {}).length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Chain ID</th>
                              <th>Cap (gwei)</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(formData.maxPriorityCapByChain || {}).map(([chainId, value]) => (
                              <tr key={`max-priority-${chainId}`}>
                                <td><strong>{chainId}</strong></td>
                                <td><code>{value}</code></td>
                                <td className="text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon me-1"
                                    onClick={() => handleEditChain('maxPriorityCap', chainId, value)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon"
                                    onClick={() => handleDeleteChain('maxPriorityCap', chainId)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-trash text-danger" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-5">
                        <i className="bx bx-data" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <p className="mt-3 mb-0">No caps configured</p>
                      </div>
                    )}
                  </div>

                  {/* Sweep Caps */}
                  <div className="col-12 mt-5">
                    <h6 className="text-primary fw-semibold mb-4">
                      {t('admin.evm.sweepCaps', { defaultValue: 'Sweep-Specific Caps' })}
                    </h6>
                  </div>

                  {/* Sweep Max Fee Cap */}
                  <div className="col-12 mt-4">
                    <div className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <span className="text-dark">{t('admin.evm.sweepMaxFeeCapByChain', { defaultValue: 'Sweep Max Fee Cap (gwei)' })}</span>
                          <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                            {Object.keys(formData.sweepMaxFeeCapByChain || {}).length}
                          </span>
                        </div>
                        <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddChain('sweepMaxFeeCap')}>
                            <i className="bx bx-plus me-1"></i>
                            {t('actions.add', { defaultValue: 'Add' })}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {Object.keys(formData.sweepMaxFeeCapByChain || {}).length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Chain ID</th>
                              <th>Cap (gwei)</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(formData.sweepMaxFeeCapByChain || {}).map(([chainId, value]) => (
                              <tr key={`sweep-fee-${chainId}`}>
                                <td><strong>{chainId}</strong></td>
                                <td><code>{value}</code></td>
                                <td className="text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon me-1"
                                    onClick={() => handleEditChain('sweepMaxFeeCap', chainId, value)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon"
                                    onClick={() => handleDeleteChain('sweepMaxFeeCap', chainId)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-trash text-danger" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-5">
                        <i className="bx bx-data" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <p className="mt-3 mb-0">No caps configured</p>
                      </div>
                    )}
                  </div>

                  {/* Sweep Max Priority Cap */}
                  <div className="col-12 mt-4">
                    <div className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <span className="text-dark">{t('admin.evm.sweepMaxPriorityCapByChain', { defaultValue: 'Sweep Max Priority Cap (gwei)' })}</span>
                          <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                            {Object.keys(formData.sweepMaxPriorityCapByChain || {}).length}
                          </span>
                        </div>
                        <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddChain('sweepMaxPriorityCap')}>
                            <i className="bx bx-plus me-1"></i>
                            {t('actions.add', { defaultValue: 'Add' })}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {Object.keys(formData.sweepMaxPriorityCapByChain || {}).length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Chain ID</th>
                              <th>Cap (gwei)</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(formData.sweepMaxPriorityCapByChain || {}).map(([chainId, value]) => (
                              <tr key={`sweep-priority-${chainId}`}>
                                <td><strong>{chainId}</strong></td>
                                <td><code>{value}</code></td>
                                <td className="text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon me-1"
                                    onClick={() => handleEditChain('sweepMaxPriorityCap', chainId, value)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon"
                                    onClick={() => handleDeleteChain('sweepMaxPriorityCap', chainId)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-trash text-danger" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-5">
                        <i className="bx bx-data" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <p className="mt-3 mb-0">No caps configured</p>
                      </div>
                    )}
                  </div>

                  {/* Withdraw Caps */}
                  <div className="col-12 mt-5">
                    <h6 className="text-primary fw-semibold mb-4">
                      {t('admin.evm.withdrawCaps', { defaultValue: 'Withdraw-Specific Caps' })}
                    </h6>
                  </div>

                  {/* Withdraw Max Fee Cap */}
                  <div className="col-12 mt-4">
                    <div className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <span className="text-dark">{t('admin.evm.withdrawMaxFeeCapByChain', { defaultValue: 'Withdraw Max Fee Cap (gwei)' })}</span>
                          <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                            {Object.keys(formData.withdrawMaxFeeCapByChain || {}).length}
                          </span>
                        </div>
                        <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddChain('withdrawMaxFeeCap')}>
                            <i className="bx bx-plus me-1"></i>
                            {t('actions.add', { defaultValue: 'Add' })}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {Object.keys(formData.withdrawMaxFeeCapByChain || {}).length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Chain ID</th>
                              <th>Cap (gwei)</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(formData.withdrawMaxFeeCapByChain || {}).map(([chainId, value]) => (
                              <tr key={`withdraw-fee-${chainId}`}>
                                <td><strong>{chainId}</strong></td>
                                <td><code>{value}</code></td>
                                <td className="text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon me-1"
                                    onClick={() => handleEditChain('withdrawMaxFeeCap', chainId, value)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon"
                                    onClick={() => handleDeleteChain('withdrawMaxFeeCap', chainId)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-trash text-danger" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-5">
                        <i className="bx bx-data" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <p className="mt-3 mb-0">No caps configured</p>
                      </div>
                    )}
                  </div>

                  {/* Withdraw Max Priority Cap */}
                  <div className="col-12 mt-4">
                    <div className="mb-3">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <span className="text-dark">{t('admin.evm.withdrawMaxPriorityCapByChain', { defaultValue: 'Withdraw Max Priority Cap (gwei)' })}</span>
                          <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                            {Object.keys(formData.withdrawMaxPriorityCapByChain || {}).length}
                          </span>
                        </div>
                        <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
                          <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddChain('withdrawMaxPriorityCap')}>
                            <i className="bx bx-plus me-1"></i>
                            {t('actions.add', { defaultValue: 'Add' })}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {Object.keys(formData.withdrawMaxPriorityCapByChain || {}).length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Chain ID</th>
                              <th>Cap (gwei)</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(formData.withdrawMaxPriorityCapByChain || {}).map(([chainId, value]) => (
                              <tr key={`withdraw-priority-${chainId}`}>
                                <td><strong>{chainId}</strong></td>
                                <td><code>{value}</code></td>
                                <td className="text-end">
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon me-1"
                                    onClick={() => handleEditChain('withdrawMaxPriorityCap', chainId, value)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-icon"
                                    onClick={() => handleDeleteChain('withdrawMaxPriorityCap', chainId)}
                                    disabled={loading}
                                  >
                                    <i className="bx bx-trash text-danger" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-5">
                        <i className="bx bx-data" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <p className="mt-3 mb-0">No caps configured</p>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Chain Modal */}
      {showChainModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingChain 
                      ? t('admin.evm.editChainSetting', { defaultValue: `Edit ${getChainModalTitle()}` })
                      : t('admin.evm.addChainSetting', { defaultValue: `Add ${getChainModalTitle()}` })
                    }
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowChainModal(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">{t('admin.evm.chainId', { defaultValue: 'Chain ID' })} *</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="1, 56, 137..."
                        value={chainForm.chainId}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[0-9]*$/.test(value) && value.length <= 20) {
                            setChainForm({ ...chainForm, chainId: value })
                          }
                        }}
                        disabled={!!editingChain}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">{t('admin.evm.value', { defaultValue: 'Value' })} *</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="0.1, 1.2, 100..."
                        value={chainForm.value}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[0-9.]*$/.test(value) && value.length <= 20) {
                            setChainForm({ ...chainForm, value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowChainModal(false)}
                    disabled={loading}
                  >
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSaveChain}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {t('actions.saving', { defaultValue: 'Saving...' })}
                      </>
                    ) : (
                      <>
                        <i className="bx bx-save me-1"></i>
                        {t('actions.save', { defaultValue: 'Save' })}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {t('admin.evm.confirmDelete', { defaultValue: 'Confirm Delete' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    {t('admin.evm.deleteChainConfirm', { 
                      defaultValue: `Are you sure you want to delete chain ${deleteTarget.chainId}?`, 
                      chainId: deleteTarget.chainId 
                    })}
                  </p>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={loading}
                  >
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={confirmDelete}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {t('actions.deleting', { defaultValue: 'Deleting...' })}
                      </>
                    ) : (
                      <>
                        <i className="bx bx-trash me-1"></i>
                        {t('actions.delete', { defaultValue: 'Delete' })}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
