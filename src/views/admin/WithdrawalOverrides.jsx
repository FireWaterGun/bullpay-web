import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings, updateSweepSetting } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'

export default function WithdrawalOverrides() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [coinOverrides, setCoinOverrides] = useState({})
  const [networkOverrides, setNetworkOverrides] = useState({})
  const [coinNetworkOverrides, setCoinNetworkOverrides] = useState({})
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'coin', 'network', 'coinNetwork'
  const [editingKey, setEditingKey] = useState(null)
  const [formData, setFormData] = useState({
    key: '',
    minimum: '',
    maximum: '',
    feeType: 'percentage',
    feePercentage: '',
    feeMin: '',
    feeMax: '',
    feeFixed: ''
  })
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState({ key: '', type: '' })

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
      
      setCoinOverrides(settingsMap.coin_overrides?.parsedValue || {})
      setNetworkOverrides(settingsMap.network_overrides?.parsedValue || {})
      setCoinNetworkOverrides(settingsMap.coin_network_overrides?.parsedValue || {})
    } catch (error) {
      console.error('Failed to load withdrawal overrides:', error)
      toast.error(t('admin.withdrawal.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  // Validation helper
  function validateNumberInput(e) {
    const value = e.target.value
    // Allow only numbers and decimal point, max 20 characters
    if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
      return true
    }
    e.preventDefault()
    return false
  }

  // Modal handlers
  function handleAdd(type) {
    setModalType(type)
    setEditingKey(null)
    setFormData({
      key: '',
      minimum: '',
      maximum: '',
      feeType: 'percentage',
      feePercentage: '',
      feeMin: '',
      feeMax: '',
      feeFixed: ''
    })
    setShowModal(true)
  }

  function handleEdit(type, key, config) {
    setModalType(type)
    setEditingKey(key)
    setFormData({
      key: key,
      minimum: config.minimum || '',
      maximum: config.maximum || '',
      feeType: config.fee?.type || 'percentage',
      feePercentage: config.fee?.percentage || '',
      feeMin: config.fee?.min || '',
      feeMax: config.fee?.max || '',
      feeFixed: config.fee?.fixed || ''
    })
    setShowModal(true)
  }

  async function handleSave() {
    try {
      if (!formData.key.trim()) {
        toast.error(t('admin.withdrawal.keyRequired', { defaultValue: 'Key is required' }))
        return
      }

      const config = {}
      if (formData.minimum) config.minimum = formData.minimum
      if (formData.maximum) config.maximum = formData.maximum
      
      config.fee = { type: formData.feeType }
      if (formData.feeType === 'percentage') {
        if (formData.feePercentage) config.fee.percentage = formData.feePercentage
        if (formData.feeMin) config.fee.min = formData.feeMin
        if (formData.feeMax) config.fee.max = formData.feeMax
      } else if (formData.feeType === 'fixed') {
        if (formData.feeFixed) config.fee.fixed = formData.feeFixed
      }

      setLoading(true)
      
      let newData, settingKey
      if (modalType === 'coin') {
        newData = { ...coinOverrides, [formData.key.toUpperCase()]: config }
        settingKey = 'payment.withdraw.coin_overrides'
        await updateSweepSetting(token, settingKey, newData)
        setCoinOverrides(newData)
      } else if (modalType === 'network') {
        newData = { ...networkOverrides, [formData.key.toUpperCase()]: config }
        settingKey = 'payment.withdraw.network_overrides'
        await updateSweepSetting(token, settingKey, newData)
        setNetworkOverrides(newData)
      } else if (modalType === 'coinNetwork') {
        newData = { ...coinNetworkOverrides, [formData.key]: config }
        settingKey = 'payment.withdraw.coin_network_overrides'
        await updateSweepSetting(token, settingKey, newData)
        setCoinNetworkOverrides(newData)
      }
      
      setShowModal(false)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Override saved successfully' }))
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save override' }))
    } finally {
      setLoading(false)
    }
  }

  function handleDelete(type, key) {
    setDeleteTarget({ key, type })
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    try {
      setLoading(true)
      
      let newData, settingKey
      if (deleteTarget.type === 'coin') {
        newData = { ...coinOverrides }
        delete newData[deleteTarget.key]
        settingKey = 'payment.withdraw.coin_overrides'
        await updateSweepSetting(token, settingKey, newData)
        setCoinOverrides(newData)
      } else if (deleteTarget.type === 'network') {
        newData = { ...networkOverrides }
        delete newData[deleteTarget.key]
        settingKey = 'payment.withdraw.network_overrides'
        await updateSweepSetting(token, settingKey, newData)
        setNetworkOverrides(newData)
      } else if (deleteTarget.type === 'coinNetwork') {
        newData = { ...coinNetworkOverrides }
        delete newData[deleteTarget.key]
        settingKey = 'payment.withdraw.coin_network_overrides'
        await updateSweepSetting(token, settingKey, newData)
        setCoinNetworkOverrides(newData)
      }
      
      setShowDeleteModal(false)
      toast.success(t('admin.withdrawal.deleteSuccess', { defaultValue: 'Override deleted successfully' }))
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error(error?.message || t('admin.withdrawal.deleteError', { defaultValue: 'Failed to delete override' }))
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
              <h5 className="mb-0">{t('admin.withdrawal.overrides', { defaultValue: 'Overrides' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.withdrawal.overridesDescription', { defaultValue: 'Coin, network, and coin-network specific withdrawal configurations' })}
              </p>
            </div>
            <div className="card-body">
              
              {/* Coin Overrides */}
              <div className="mb-5">
                <div className="mb-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="mb-0">
                        {t('admin.withdrawal.coinOverrides', { defaultValue: 'Coin Overrides' })}
                        <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                          {Object.keys(coinOverrides).length}
                        </span>
                      </h6>
                    </div>
                    <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAdd('coin')}>
                        <i className="bx bx-plus me-1"></i>
                        {t('actions.add', { defaultValue: 'Add' })}
                      </button>
                    </div>
                  </div>
                </div>
                
                {Object.keys(coinOverrides).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.withdrawal.coin', { defaultValue: 'Coin' })}</th>
                          <th>{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</th>
                          <th>{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</th>
                          <th>{t('admin.withdrawal.feeConfig', { defaultValue: 'Fee Config' })}</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(coinOverrides).map(([coin, config]) => (
                          <tr key={coin}>
                            <td><strong>{coin}</strong></td>
                            <td>
                              {config.minimum ? (
                                <code>{config.minimum}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.fee?.fixed ? (
                                <span className="badge bg-label-info">fixed</span>
                              ) : config.fee?.percentage || config.fee?.min ? (
                                <span className="badge bg-label-info">percentage</span>
                              ) : config.fee?.type ? (
                                <span className="badge bg-label-info">{config.fee.type}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.fee?.fixed ? (
                                <code>Fixed: {config.fee.fixed}</code>
                              ) : (config.fee?.percentage || config.fee?.min) ? (
                                <code>{config.fee.percentage || '0'}% (min: {config.fee.min}{config.fee.max ? `, max: ${config.fee.max}` : ''})</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-end">
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon me-1"
                                onClick={() => handleEdit('coin', coin, config)}
                                disabled={loading}
                              >
                                <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon"
                                onClick={() => handleDelete('coin', coin)}
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
                    <p className="mt-3 mb-0">{t('admin.withdrawal.noCoinOverrides', { defaultValue: 'No coin overrides configured' })}</p>
                  </div>
                )}
              </div>

              {/* Network Overrides */}
              <div className="mb-5">
                <div className="mb-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="mb-0">
                        {t('admin.withdrawal.networkOverrides', { defaultValue: 'Network Overrides' })}
                        <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                          {Object.keys(networkOverrides).length}
                        </span>
                      </h6>
                    </div>
                    <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAdd('network')}>
                        <i className="bx bx-plus me-1"></i>
                        {t('actions.add', { defaultValue: 'Add' })}
                      </button>
                    </div>
                  </div>
                </div>
                
                {Object.keys(networkOverrides).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.withdrawal.network', { defaultValue: 'Network' })}</th>
                          <th>{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</th>
                          <th>{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</th>
                          <th>{t('admin.withdrawal.feeConfig', { defaultValue: 'Fee Config' })}</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(networkOverrides).map(([network, config]) => (
                          <tr key={network}>
                            <td><strong>{network}</strong></td>
                            <td>
                              {config.minimum ? (
                                <code>{config.minimum}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.fee?.fixed ? (
                                <span className="badge bg-label-info">fixed</span>
                              ) : config.fee?.percentage || config.fee?.min ? (
                                <span className="badge bg-label-info">percentage</span>
                              ) : config.fee?.type ? (
                                <span className="badge bg-label-info">{config.fee.type}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.fee?.fixed ? (
                                <code>Fixed: {config.fee.fixed}</code>
                              ) : (config.fee?.percentage || config.fee?.min) ? (
                                <code>{config.fee.percentage || '0'}% (min: {config.fee.min}{config.fee.max ? `, max: ${config.fee.max}` : ''})</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-end">
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon me-1"
                                onClick={() => handleEdit('network', network, config)}
                                disabled={loading}
                              >
                                <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon"
                                onClick={() => handleDelete('network', network)}
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
                    <p className="mt-3 mb-0">{t('admin.withdrawal.noNetworkOverrides', { defaultValue: 'No network overrides configured' })}</p>
                  </div>
                )}
              </div>

              {/* Coin-Network Overrides */}
              <div>
                <div className="mb-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="mb-0">
                        {t('admin.withdrawal.coinNetworkOverrides', { defaultValue: 'Coin-Network Overrides' })}
                        <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                          {Object.keys(coinNetworkOverrides).length}
                        </span>
                      </h6>
                    </div>
                    <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAdd('coinNetwork')}>
                        <i className="bx bx-plus me-1"></i>
                        {t('actions.add', { defaultValue: 'Add' })}
                      </button>
                    </div>
                  </div>
                </div>
                
                {Object.keys(coinNetworkOverrides).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.withdrawal.coinNetworkId', { defaultValue: 'CoinNetwork ID' })}</th>
                          <th>{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</th>
                          <th>{t('admin.withdrawal.maximum', { defaultValue: 'Maximum' })}</th>
                          <th>{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</th>
                          <th>{t('admin.withdrawal.feeConfig', { defaultValue: 'Fee Config' })}</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(coinNetworkOverrides).map(([coinNetworkId, config]) => (
                          <tr key={coinNetworkId}>
                            <td><strong>{coinNetworkId}</strong></td>
                            <td>
                              {config.minimum ? (
                                <code>{config.minimum}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.maximum ? (
                                <code>{config.maximum}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.fee?.fixed ? (
                                <span className="badge bg-label-info">fixed</span>
                              ) : config.fee?.percentage || config.fee?.min ? (
                                <span className="badge bg-label-info">percentage</span>
                              ) : config.fee?.type ? (
                                <span className="badge bg-label-info">{config.fee.type}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.fee?.fixed ? (
                                <code>Fixed: {config.fee.fixed}</code>
                              ) : (config.fee?.percentage || config.fee?.min) ? (
                                <code>{config.fee.percentage || '0'}% (min: {config.fee.min}{config.fee.max ? `, max: ${config.fee.max}` : ''})</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-end">
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon me-1"
                                onClick={() => handleEdit('coinNetwork', coinNetworkId, config)}
                                disabled={loading}
                              >
                                <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon"
                                onClick={() => handleDelete('coinNetwork', coinNetworkId)}
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
                    <p className="mt-3 mb-0">{t('admin.withdrawal.noCoinNetworkOverrides', { defaultValue: 'No coin-network overrides configured' })}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingKey 
                      ? t('admin.withdrawal.editOverride', { defaultValue: 'Edit Override' })
                      : t('admin.withdrawal.addOverride', { defaultValue: 'Add Override' })
                    }
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">
                        {modalType === 'coin' && t('admin.withdrawal.coinSymbol', { defaultValue: 'Coin Symbol' })}
                        {modalType === 'network' && t('admin.withdrawal.networkName', { defaultValue: 'Network Name' })}
                        {modalType === 'coinNetwork' && t('admin.withdrawal.coinNetworkId', { defaultValue: 'CoinNetwork ID' })}
                        *
                      </label>
                      <input 
                        type="text"
                        className="form-control"
                        value={formData.key}
                        onChange={(e) => {
                          const value = e.target.value
                          // For coin/network: allow a-z, A-Z, 0-9
                          // For coinNetwork: allow only numbers
                          if (modalType === 'coinNetwork') {
                            if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                              setFormData({ ...formData, key: value })
                            }
                          } else {
                            if (value === '' || (/^[a-zA-Z0-9]*$/.test(value) && value.length <= 20)) {
                              setFormData({ ...formData, key: value })
                            }
                          }
                        }}
                        disabled={!!editingKey}
                        placeholder={modalType === 'coinNetwork' ? '999999' : 'BTC, ETH, etc.'}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={formData.minimum}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, minimum: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                    {modalType === 'coinNetwork' && (
                      <div className="col-md-6">
                        <label className="form-label">{t('admin.withdrawal.maximum', { defaultValue: 'Maximum' })}</label>
                        <input 
                          type="text"
                          className="form-control"
                          value={formData.maximum}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                              setFormData({ ...formData, maximum: value })
                            }
                          }}
                          maxLength={20}
                        />
                      </div>
                    )}
                    <div className="col-12">
                      <label className="form-label">{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</label>
                      <select 
                        className="form-select"
                        value={formData.feeType}
                        onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed</option>
                      </select>
                    </div>
                    {formData.feeType === 'percentage' && (
                      <>
                        <div className="col-md-4">
                          <label className="form-label">{t('admin.withdrawal.feePercentage', { defaultValue: 'Fee %' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.feePercentage}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, feePercentage: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">{t('admin.withdrawal.feeMin', { defaultValue: 'Min Fee' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.feeMin}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, feeMin: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">{t('admin.withdrawal.feeMax', { defaultValue: 'Max Fee' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.feeMax}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, feeMax: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                      </>
                    )}
                    {formData.feeType === 'fixed' && (
                      <div className="col-12">
                        <label className="form-label">{t('admin.withdrawal.feeFixed', { defaultValue: 'Fixed Fee' })}</label>
                        <input 
                          type="text"
                          className="form-control"
                          value={formData.feeFixed}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                              setFormData({ ...formData, feeFixed: value })
                            }
                          }}
                          maxLength={20}
                        />
                      </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {t('admin.withdrawal.confirmDelete', { defaultValue: 'Confirm Delete' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    {t('admin.withdrawal.deleteConfirm', { 
                      defaultValue: `Are you sure you want to delete this override?` 
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
