import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings, updateSweepSetting } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'

export default function WithdrawalPolicy() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [autoApprove, setAutoApprove] = useState({})
  const [gasSettings, setGasSettings] = useState({})
  const [policy, setPolicy] = useState({})
  const [reconciliation, setReconciliation] = useState({})
  const [reservation, setReservation] = useState({})
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'autoApprove', 'gas', 'policy', 'reservation', 'reconciliation'
  const [formData, setFormData] = useState({})
  
  // Gas Network Form
  const [showGasNetworkForm, setShowGasNetworkForm] = useState(false)
  const [editingGasNetwork, setEditingGasNetwork] = useState(null)
  const [gasNetworkFormData, setGasNetworkFormData] = useState({ network: '', minNative: '' })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoadingData(true)
      const data = await getSweepSettings(token, 'payment', 'global', 1, 100)
      
      const settingsMap = {}
      data.forEach(setting => {
        const key = setting.keyName.replace('payment.withdraw.', '')
        settingsMap[key] = setting
      })
      
      setAutoApprove(settingsMap.auto_approve?.parsedValue || {})
      
      // Gas settings with defaults
      const gasData = settingsMap.gas?.parsedValue || {}
      setGasSettings({
        bufferMultiplier: gasData.bufferMultiplier ?? 1.5,
        minNativeByNetwork: gasData.minNativeByNetwork || {}
      })
      
      setPolicy(settingsMap.policy?.parsedValue || {})
      setReconciliation(settingsMap.reconciliation?.parsedValue || {})
      setReservation(settingsMap.reservation?.parsedValue || {})
    } catch (error) {
      console.error('Failed to load withdrawal policy:', error)
      toast.error(t('admin.withdrawal.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  function handleEdit(type) {
    setModalType(type)
    switch(type) {
      case 'autoApprove':
        setFormData({ enabled: autoApprove.enabled || false, thresholdUsd: autoApprove.thresholdUsd || 0 })
        break
      case 'gas':
        setFormData({ bufferMultiplier: gasSettings.bufferMultiplier ?? 1.5 })
        break
      case 'policy':
        setFormData({ countPendingInUsage: policy.countPendingInUsage || false })
        break
      case 'reservation':
        setFormData({ reserveTtlSeconds: reservation.reserveTtlSeconds || '', headroomPercent: reservation.headroomPercent || '' })
        break
      case 'reconciliation':
        setFormData({ staleMinutes: reconciliation.staleMinutes || '', maxPerRun: reconciliation.maxPerRun || '', jitterMsMin: reconciliation.jitterMs?.min || '', jitterMsMax: reconciliation.jitterMs?.max || '' })
        break
    }
    setShowModal(true)
  }

  function handleAddGasNetwork() {
    setEditingGasNetwork(null)
    setGasNetworkFormData({ network: '', minNative: '' })
    setShowGasNetworkForm(true)
  }

  function handleEditGasNetwork(network, minNative) {
    setEditingGasNetwork(network)
    setGasNetworkFormData({ network, minNative })
    setShowGasNetworkForm(true)
  }

  async function handleSaveGasNetwork() {
    try {
      setLoading(true)
      const minNativeByNetwork = { ...(gasSettings.minNativeByNetwork || {}) }
      
      if (editingGasNetwork && editingGasNetwork !== gasNetworkFormData.network) {
        delete minNativeByNetwork[editingGasNetwork]
      }
      
      minNativeByNetwork[gasNetworkFormData.network] = gasNetworkFormData.minNative
      
      const newSettings = { ...gasSettings, minNativeByNetwork }
      await updateSweepSetting(token, 'payment.withdraw.gas', newSettings)
      setGasSettings(newSettings)
      setShowGasNetworkForm(false)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteGasNetwork(network) {
    if (!confirm(t('admin.withdrawal.confirmDelete', { defaultValue: 'Are you sure you want to delete this?' }))) return
    
    try {
      setLoading(true)
      const minNativeByNetwork = { ...(gasSettings.minNativeByNetwork || {}) }
      delete minNativeByNetwork[network]
      
      const newSettings = { ...gasSettings, minNativeByNetwork }
      await updateSweepSetting(token, 'payment.withdraw.gas', newSettings)
      setGasSettings(newSettings)
      toast.success(t('admin.withdrawal.deleteSuccess', { defaultValue: 'Deleted successfully' }))
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error(error?.message || t('admin.withdrawal.deleteError', { defaultValue: 'Failed to delete' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setLoading(true)
      let settingKey, settingValue

      switch(modalType) {
        case 'autoApprove':
          settingKey = 'payment.withdraw.auto_approve'
          settingValue = { enabled: formData.enabled, thresholdUsd: parseFloat(formData.thresholdUsd) || 0 }
          await updateSweepSetting(token, settingKey, settingValue)
          setAutoApprove(settingValue)
          break
        case 'gas':
          settingKey = 'payment.withdraw.gas'
          settingValue = { 
            bufferMultiplier: parseFloat(formData.bufferMultiplier) || 1.5,
            minNativeByNetwork: gasSettings.minNativeByNetwork || {}
          }
          await updateSweepSetting(token, settingKey, settingValue)
          setGasSettings(settingValue)
          break
        case 'policy':
          settingKey = 'payment.withdraw.policy'
          settingValue = { countPendingInUsage: formData.countPendingInUsage }
          await updateSweepSetting(token, settingKey, settingValue)
          setPolicy(settingValue)
          break
        case 'reservation':
          settingKey = 'payment.withdraw.reservation'
          settingValue = { reserveTtlSeconds: parseInt(formData.reserveTtlSeconds) || 0, headroomPercent: parseFloat(formData.headroomPercent) || 0 }
          await updateSweepSetting(token, settingKey, settingValue)
          setReservation(settingValue)
          break
        case 'reconciliation':
          settingKey = 'payment.withdraw.reconciliation'
          settingValue = { staleMinutes: parseInt(formData.staleMinutes) || 0, maxPerRun: parseInt(formData.maxPerRun) || 0, jitterMs: { min: parseInt(formData.jitterMsMin) || 0, max: parseInt(formData.jitterMsMax) || 0 } }
          await updateSweepSetting(token, settingKey, settingValue)
          setReconciliation(settingValue)
          break
      }

      setShowModal(false)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setLoading(false)
    }
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
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">{t('admin.withdrawal.policy', { defaultValue: 'Policy & Settings' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.withdrawal.policyDescription', { defaultValue: 'Auto-approve, gas, policy, and operational settings' })}
              </p>
            </div>
            <div className="card-body">
              
              {/* Auto Approve */}
              <div className="mb-4">
                <div className="mb-3">
                  <h6 className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{t('admin.withdrawal.autoApprove', { defaultValue: 'Auto Approve' })}</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>Automatically approve small withdrawals</p>
                </div>
                <div className="table-responsive">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <td width="35%" className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.enabled', { defaultValue: 'Enabled' })}</td>
                        <td className="py-3">
                          <div className="form-check form-switch mb-0">
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              checked={autoApprove.enabled || false}
                              onChange={(e) => {
                                const newValue = { ...autoApprove, enabled: e.target.checked }
                                setAutoApprove(newValue)
                                updateSweepSetting(token, 'payment.withdraw.auto_approve', newValue)
                                  .then(() => toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' })))
                                  .catch(err => {
                                    setAutoApprove(autoApprove)
                                    toast.error(err?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
                                  })
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.thresholdUsd', { defaultValue: 'Threshold (USD)' })}</td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            <code>{autoApprove.thresholdUsd || 0}</code>
                            <button type="button" className="btn btn-sm btn-icon" onClick={() => handleEdit('autoApprove')} style={{ marginLeft: 'auto' }}>
                              <i className="bx bx-edit text-primary" style={{ fontSize: '1rem' }}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <hr className="my-4" />

              {/* Gas Settings */}
              <div className="mb-4">
                <div className="mb-3">
                  <h6 className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{t('admin.withdrawal.gasSettings', { defaultValue: 'Gas Settings' })}</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>Native gas guard configuration</p>
                </div>
                <div className="table-responsive">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <td width="35%" className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.bufferMultiplier', { defaultValue: 'Buffer Multiplier' })}</td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            {gasSettings.bufferMultiplier !== undefined && gasSettings.bufferMultiplier !== null ? (
                              <code>{gasSettings.bufferMultiplier}</code>
                            ) : (
                              <span className="text-muted">Not set</span>
                            )}
                            <button type="button" className="btn btn-sm btn-icon" onClick={() => handleEdit('gas')} style={{ marginLeft: 'auto' }}>
                              <i className="bx bx-edit text-primary" style={{ fontSize: '1rem' }}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <hr className="my-4" />

              {/* Min Native by Network */}
              <div className="mb-4">
                <div className="mb-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{t('admin.withdrawal.minNativeByNetwork', { defaultValue: 'Min Native by Network' })}</h6>
                      <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>Minimum native balance required per network</p>
                    </div>
                    <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
                      <button type="button" className="btn btn-sm btn-primary" onClick={handleAddGasNetwork}>
                        <i className="bx bx-plus me-1"></i>
                        {t('actions.add', { defaultValue: 'Add' })}
                      </button>
                    </div>
                  </div>
                </div>

                {Object.keys(gasSettings.minNativeByNetwork || {}).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.withdrawal.network', { defaultValue: 'Network' })}</th>
                          <th>{t('admin.withdrawal.minNative', { defaultValue: 'Min Native' })}</th>
                          <th className="text-end">{t('actions.actions', { defaultValue: 'Actions' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(gasSettings.minNativeByNetwork || {}).map(([network, minNative]) => (
                          <tr key={network}>
                            <td><strong>{network}</strong></td>
                            <td><code>{minNative}</code></td>
                            <td className="text-end">
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon me-1"
                                onClick={() => handleEditGasNetwork(network, minNative)}
                                disabled={loading}
                              >
                                <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon"
                                onClick={() => handleDeleteGasNetwork(network)}
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
                    <p className="mt-3 mb-0">{t('admin.withdrawal.noNetworks', { defaultValue: 'No networks configured' })}</p>
                  </div>
                )}
              </div>

              {/* Policy Settings */}
              <div className="mb-4">
                <div className="mb-3">
                  <h6 className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{t('admin.withdrawal.policySettings', { defaultValue: 'Policy Settings' })}</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>Policy controls for withdrawal validation</p>
                </div>
                <div className="table-responsive">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <td width="35%" className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.countPendingInUsage', { defaultValue: 'Count Pending' })}</td>
                        <td className="py-3">
                          <div className="form-check form-switch mb-0">
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              checked={policy.countPendingInUsage || false}
                              onChange={(e) => {
                                const newValue = { ...policy, countPendingInUsage: e.target.checked }
                                setPolicy(newValue)
                                updateSweepSetting(token, 'payment.withdraw.policy', newValue)
                                  .then(() => toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' })))
                                  .catch(err => {
                                    setPolicy(policy)
                                    toast.error(err?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
                                  })
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <hr className="my-4" />

              {/* Reservation */}
              <div className="mb-4">
                <div className="mb-3">
                  <h6 className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{t('admin.withdrawal.reservation', { defaultValue: 'Reservation' })}</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>System wallet capacity management</p>
                </div>
                <div className="table-responsive">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <td width="35%" className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.reserveTtlSeconds', { defaultValue: 'Reserve TTL (s)' })}</td>
                        <td className="py-3"><code>{reservation.reserveTtlSeconds || '-'}</code></td>
                      </tr>
                      <tr>
                        <td className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.headroomPercent', { defaultValue: 'Headroom %' })}</td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            <code>{reservation.headroomPercent || '-'}</code>
                            <button type="button" className="btn btn-sm btn-icon" onClick={() => handleEdit('reservation')} style={{ marginLeft: 'auto' }}>
                              <i className="bx bx-edit text-primary" style={{ fontSize: '1rem' }}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <hr className="my-4" />

              {/* Reconciliation */}
              <div className="mb-4">
                <div className="mb-3">
                  <h6 className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{t('admin.withdrawal.reconciliation', { defaultValue: 'Reconciliation' })}</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>Background scanner tuning</p>
                </div>
                <div className="table-responsive">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <td width="35%" className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.staleMinutes', { defaultValue: 'Stale Minutes' })}</td>
                        <td className="py-3"><code>{reconciliation.staleMinutes || '-'}</code></td>
                      </tr>
                      <tr>
                        <td className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.maxPerRun', { defaultValue: 'Max Per Run' })}</td>
                        <td className="py-3"><code>{reconciliation.maxPerRun || '-'}</code></td>
                      </tr>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <td className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.jitterMs', { defaultValue: 'Jitter (ms)' })}</td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            {reconciliation.jitterMs ? (
                              <code>{reconciliation.jitterMs.min} - {reconciliation.jitterMs.max}</code>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                            <button type="button" className="btn btn-sm btn-icon" onClick={() => handleEdit('reconciliation')} style={{ marginLeft: 'auto' }}>
                              <i className="bx bx-edit text-primary" style={{ fontSize: '1rem' }}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalType === 'autoApprove' && t('admin.withdrawal.editAutoApprove', { defaultValue: 'Edit Auto Approve' })}
                    {modalType === 'gas' && t('admin.withdrawal.editGasSettings', { defaultValue: 'Edit Gas Settings' })}
                    {modalType === 'policy' && t('admin.withdrawal.editPolicy', { defaultValue: 'Edit Policy Settings' })}
                    {modalType === 'reservation' && t('admin.withdrawal.editReservation', { defaultValue: 'Edit Reservation' })}
                    {modalType === 'reconciliation' && t('admin.withdrawal.editReconciliation', { defaultValue: 'Edit Reconciliation' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    {modalType === 'autoApprove' && (
                      <>
                        <div className="col-12">
                          <div className="form-check form-switch">
                            <input 
                              type="checkbox"
                              className="form-check-input"
                              checked={formData.enabled || false}
                              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                            />
                            <label className="form-check-label">{t('admin.withdrawal.enabled', { defaultValue: 'Enabled' })}</label>
                          </div>
                        </div>
                        <div className="col-12">
                          <label className="form-label">{t('admin.withdrawal.thresholdUsd', { defaultValue: 'Threshold (USD)' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.thresholdUsd || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, thresholdUsd: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                      </>
                    )}
                    
                    {modalType === 'gas' && (
                      <div className="col-12">
                        <label className="form-label">{t('admin.withdrawal.bufferMultiplier', { defaultValue: 'Buffer Multiplier' })}</label>
                        <input 
                          type="text"
                          className="form-control"
                          value={formData.bufferMultiplier || ''}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                              setFormData({ ...formData, bufferMultiplier: value })
                            }
                          }}
                          maxLength={20}
                        />
                      </div>
                    )}
                    
                    {modalType === 'policy' && (
                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input 
                            type="checkbox"
                            className="form-check-input"
                            checked={formData.countPendingInUsage || false}
                            onChange={(e) => setFormData({ ...formData, countPendingInUsage: e.target.checked })}
                          />
                          <label className="form-check-label">{t('admin.withdrawal.countPendingInUsage', { defaultValue: 'Count Pending in Usage' })}</label>
                        </div>
                      </div>
                    )}
                    
                    {modalType === 'reservation' && (
                      <>
                        <div className="col-12">
                          <label className="form-label">{t('admin.withdrawal.reserveTtlSeconds', { defaultValue: 'Reserve TTL (seconds)' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.reserveTtlSeconds || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, reserveTtlSeconds: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label">{t('admin.withdrawal.headroomPercent', { defaultValue: 'Headroom %' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.headroomPercent || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, headroomPercent: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                      </>
                    )}
                    
                    {modalType === 'reconciliation' && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label">{t('admin.withdrawal.staleMinutes', { defaultValue: 'Stale Minutes' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.staleMinutes || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, staleMinutes: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">{t('admin.withdrawal.maxPerRun', { defaultValue: 'Max Per Run' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.maxPerRun || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, maxPerRun: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">{t('admin.withdrawal.jitterMsMin', { defaultValue: 'Jitter Min (ms)' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.jitterMsMin || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, jitterMsMin: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">{t('admin.withdrawal.jitterMsMax', { defaultValue: 'Jitter Max (ms)' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.jitterMsMax || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, jitterMsMax: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                  >
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSave}
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

      {/* Gas Network Form Modal */}
      {showGasNetworkForm && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingGasNetwork 
                      ? t('admin.withdrawal.editNetwork', { defaultValue: 'Edit Network' })
                      : t('admin.withdrawal.addNetwork', { defaultValue: 'Add Network' })
                    }
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowGasNetworkForm(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">{t('admin.withdrawal.network', { defaultValue: 'Network' })}*</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={gasNetworkFormData.network}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[a-zA-Z0-9]*$/.test(value) && value.length <= 20)) {
                            setGasNetworkFormData({ ...gasNetworkFormData, network: value })
                          }
                        }}
                        disabled={!!editingGasNetwork}
                        placeholder="ETH, BSC, etc."
                        maxLength={20}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">{t('admin.withdrawal.minNative', { defaultValue: 'Min Native' })}*</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={gasNetworkFormData.minNative}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                            setGasNetworkFormData({ ...gasNetworkFormData, minNative: value })
                          }
                        }}
                        placeholder="0.001"
                        maxLength={20}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowGasNetworkForm(false)}
                    disabled={loading}
                  >
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSaveGasNetwork}
                    disabled={loading || !gasNetworkFormData.network || !gasNetworkFormData.minNative}
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
    </div>
  )
}
