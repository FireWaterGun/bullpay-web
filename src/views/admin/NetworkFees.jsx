import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings, updateSweepSetting } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'

export default function NetworkFees() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [baseFees, setBaseFees] = useState({})
  const [slippageByNetwork, setSlippageByNetwork] = useState({})
  
  // Base Fee Form State
  const [showBaseFeeForm, setShowBaseFeeForm] = useState(false)
  const [baseFeeForm, setBaseFeeForm] = useState({
    network: '',
    fee: ''
  })
  const [editingBaseFee, setEditingBaseFee] = useState(null)
  
  // Slippage Form State
  const [showSlippageForm, setShowSlippageForm] = useState(false)
  const [slippageForm, setSlippageForm] = useState({
    network: '',
    percent: ''
  })
  const [editingSlippage, setEditingSlippage] = useState(null)
  
  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState({ network: '', type: '' })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoadingData(true)
      const data = await getSweepSettings(token)
      
      const settingsMap = {}
      data.forEach(setting => {
        const key = setting.keyName.replace('network.fee.', '')
        settingsMap[key] = setting
      })
      
      setBaseFees(settingsMap.base_fees?.parsedValue || {})
      setSlippageByNetwork(settingsMap.slippage?.parsedValue?.byNetwork || {})
    } catch (error) {
      console.error('Failed to load network fee settings:', error)
      toast.error(t('admin.network.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  // Base Fee Handlers
  function handleAddBaseFee() {
    setBaseFeeForm({ network: '', fee: '' })
    setEditingBaseFee(null)
    setShowBaseFeeForm(true)
  }

  function handleEditBaseFee(network, fee) {
    setBaseFeeForm({ network, fee })
    setEditingBaseFee(network)
    setShowBaseFeeForm(true)
  }

  async function handleSaveBaseFee() {
    try {
      if (!baseFeeForm.network.trim()) {
        toast.error(t('admin.network.networkRequired', { defaultValue: 'Network symbol is required' }))
        return
      }
      if (!baseFeeForm.fee.trim()) {
        toast.error(t('admin.network.feeRequired', { defaultValue: 'Fee value is required' }))
        return
      }

      const newBaseFees = { ...baseFees }
      newBaseFees[baseFeeForm.network.toUpperCase()] = baseFeeForm.fee

      setLoading(true)
      await updateSweepSetting(token, 'network.fee.base_fees', newBaseFees)
      
      setBaseFees(newBaseFees)
      setShowBaseFeeForm(false)
      toast.success(t('admin.network.saveSuccess', { defaultValue: 'Network fee saved successfully' }))
    } catch (error) {
      console.error('Failed to save base fee:', error)
      toast.error(error?.message || t('admin.network.saveError', { defaultValue: 'Failed to save' }))
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteBaseFee(network) {
    setDeleteTarget({ network, type: 'baseFee' })
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    try {
      setLoading(true)
      
      if (deleteTarget.type === 'baseFee') {
        const newBaseFees = { ...baseFees }
        delete newBaseFees[deleteTarget.network]
        await updateSweepSetting(token, 'network.fee.base_fees', newBaseFees)
        setBaseFees(newBaseFees)
      } else if (deleteTarget.type === 'slippage') {
        const newSlippage = { ...slippageByNetwork }
        delete newSlippage[deleteTarget.network]
        await updateSweepSetting(token, 'network.fee.slippage', { byNetwork: newSlippage })
        setSlippageByNetwork(newSlippage)
      }
      
      setShowDeleteModal(false)
      toast.success(t('admin.network.deleteSuccess', { defaultValue: 'Deleted successfully' }))
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error(error?.message || t('admin.network.deleteError', { defaultValue: 'Failed to delete' }))
    } finally {
      setLoading(false)
    }
  }

  // Slippage Handlers
  function handleAddSlippage() {
    setSlippageForm({ network: '', percent: '' })
    setEditingSlippage(null)
    setShowSlippageForm(true)
  }

  function handleEditSlippage(network, percent) {
    setSlippageForm({ network, percent })
    setEditingSlippage(network)
    setShowSlippageForm(true)
  }

  async function handleSaveSlippage() {
    try {
      if (!slippageForm.network.trim()) {
        toast.error(t('admin.network.networkRequired', { defaultValue: 'Network symbol is required' }))
        return
      }
      if (!slippageForm.percent) {
        toast.error(t('admin.network.percentRequired', { defaultValue: 'Slippage percentage is required' }))
        return
      }

      const newSlippageByNetwork = { ...slippageByNetwork }
      newSlippageByNetwork[slippageForm.network.toUpperCase()] = parseFloat(slippageForm.percent)

      setLoading(true)
      // Need to preserve other slippage settings
      const currentSlippageSettings = await getSweepSettings(token)
      const slippageData = currentSlippageSettings.find(s => s.keyName === 'network.fee.slippage')?.parsedValue || {}
      const updatedSlippage = {
        ...slippageData,
        byNetwork: newSlippageByNetwork
      }
      await updateSweepSetting(token, 'network.fee.slippage', updatedSlippage)
      
      setSlippageByNetwork(newSlippageByNetwork)
      setShowSlippageForm(false)
      toast.success(t('admin.network.saveSuccess', { defaultValue: 'Slippage saved successfully' }))
    } catch (error) {
      console.error('Failed to save slippage:', error)
      toast.error(error?.message || t('admin.network.saveError', { defaultValue: 'Failed to save' }))
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteSlippage(network) {
    setDeleteTarget({ network, type: 'slippage' })
    setShowDeleteModal(true)
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
              <h5 className="mb-0">{t('admin.network.title', { defaultValue: 'Network Fees' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.network.description', { defaultValue: 'Configure base network fees and slippage settings' })}
              </p>
            </div>
            <div className="card-body">
              {/* Base Fees */}
              <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    {t('admin.network.baseFees', { defaultValue: 'Base Fees by Network' })}
                    <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                      {Object.keys(baseFees).length}
                    </span>
                  </h6>
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleAddBaseFee}>
                    <i className="bx bx-plus me-1"></i>
                    {t('admin.network.addNetwork', { defaultValue: 'Add Network' })}
                  </button>
                </div>
                
                {Object.keys(baseFees).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.network.network', { defaultValue: 'Network' })}</th>
                          <th>{t('admin.network.fee', { defaultValue: 'Fee' })}</th>
                          <th className="text-end">{t('actions.actions', { defaultValue: 'Actions' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(baseFees).map(([network, fee]) => (
                          <tr key={network}>
                            <td>
                              <strong>{network}</strong>
                            </td>
                            <td>
                              <code>{fee}</code>
                            </td>
                            <td className="text-end">
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon me-1"
                                onClick={() => handleEditBaseFee(network, fee)}
                                disabled={loading}
                              >
                                <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon"
                                onClick={() => handleDeleteBaseFee(network)}
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
                    <p className="mt-3 mb-0">
                      {t('admin.network.noBaseFees', { defaultValue: 'No base fees configured' })}
                    </p>
                    <small className="text-muted">
                      {t('admin.network.noBaseFeesHelp', { defaultValue: 'Add network-specific base fees for quick estimates' })}
                    </small>
                  </div>
                )}

              </div>

              {/* Slippage by Network */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    {t('admin.network.slippageByNetwork', { defaultValue: 'Slippage by Network' })}
                    <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                      {Object.keys(slippageByNetwork).length}
                    </span>
                  </h6>
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleAddSlippage}>
                    <i className="bx bx-plus me-1"></i>
                    {t('admin.network.addNetwork', { defaultValue: 'Add Network' })}
                  </button>
                </div>
                
                {Object.keys(slippageByNetwork).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.network.network', { defaultValue: 'Network' })}</th>
                          <th>{t('admin.network.slippagePercent', { defaultValue: 'Slippage %' })}</th>
                          <th className="text-end">{t('actions.actions', { defaultValue: 'Actions' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(slippageByNetwork).map(([network, percent]) => (
                          <tr key={network}>
                            <td>
                              <strong>{network}</strong>
                            </td>
                            <td>
                              <code>{percent}</code>
                            </td>
                            <td className="text-end">
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon me-1"
                                onClick={() => handleEditSlippage(network, percent)}
                                disabled={loading}
                              >
                                <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon"
                                onClick={() => handleDeleteSlippage(network)}
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
                    <p className="mt-3 mb-0">
                      {t('admin.network.noSlippage', { defaultValue: 'No network-specific slippage configured' })}
                    </p>
                    <small className="text-muted">
                      {t('admin.network.noSlippageHelp', { defaultValue: 'Add network-specific slippage percentages for fee volatility protection' })}
                    </small>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Base Fee Modal */}
      {showBaseFeeForm && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingBaseFee ? t('admin.network.editBaseFee', { defaultValue: 'Edit Base Fee' }) : t('admin.network.addBaseFee', { defaultValue: 'Add Base Fee' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowBaseFeeForm(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">{t('admin.network.networkSymbol', { defaultValue: 'Network Symbol' })} *</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="BTC, ETH, BNB..."
                        value={baseFeeForm.network}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase()
                          if (/^[A-Z0-9]*$/.test(value) && value.length <= 20) {
                            setBaseFeeForm({ ...baseFeeForm, network: value })
                          }
                        }}
                        disabled={!!editingBaseFee}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">{t('admin.network.fee', { defaultValue: 'Fee' })} *</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="0.001"
                        value={baseFeeForm.fee}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[0-9.]*$/.test(value) && value.length <= 20) {
                            setBaseFeeForm({ ...baseFeeForm, fee: value })
                          }
                        }}
                        maxLength={20}
                      />
                      <small className="text-muted">
                        {t('admin.network.baseFeeHelp', { defaultValue: 'Base network fee in native currency for quick estimates' })}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowBaseFeeForm(false)}
                    disabled={loading}
                  >
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSaveBaseFee}
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

      {/* Slippage Modal */}
      {showSlippageForm && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingSlippage ? t('admin.network.editSlippage', { defaultValue: 'Edit Slippage' }) : t('admin.network.addSlippage', { defaultValue: 'Add Slippage' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowSlippageForm(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">{t('admin.network.networkSymbol', { defaultValue: 'Network Symbol' })} *</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="BTC, ETH, BNB..."
                        value={slippageForm.network}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase()
                          if (/^[A-Z0-9]*$/.test(value) && value.length <= 20) {
                            setSlippageForm({ ...slippageForm, network: value })
                          }
                        }}
                        disabled={!!editingSlippage}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">{t('admin.network.slippagePercent', { defaultValue: 'Slippage %' })} *</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="0.15"
                        value={slippageForm.percent}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[0-9.]*$/.test(value) && value.length <= 20) {
                            setSlippageForm({ ...slippageForm, percent: value })
                          }
                        }}
                        maxLength={20}
                      />
                      <small className="text-muted">
                        {t('admin.network.slippageHelp', { defaultValue: 'Network-specific slippage percentage for fee volatility protection (e.g., 0.15 = 15%)' })}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowSlippageForm(false)}
                    disabled={loading}
                  >
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSaveSlippage}
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
                    {t('admin.network.confirmDelete', { defaultValue: 'Confirm Delete' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    {deleteTarget.type === 'baseFee' 
                      ? t('admin.network.deleteBaseFeeConfirm', { defaultValue: `Are you sure you want to delete base fee for ${deleteTarget.network}?`, network: deleteTarget.network })
                      : t('admin.network.deleteSlippageConfirm', { defaultValue: `Are you sure you want to delete slippage for ${deleteTarget.network}?`, network: deleteTarget.network })
                    }
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
