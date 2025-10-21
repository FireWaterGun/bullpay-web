import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings, updateSweepSetting } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'

export default function SweepOverrides() {
  const { t } = useTranslation()
  const { user, token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [coinOverrides, setCoinOverrides] = useState({})
  const [networkOverrides, setNetworkOverrides] = useState({})
  
  // Coin Override Form State
  const [showCoinForm, setShowCoinForm] = useState(false)
  const [coinForm, setCoinForm] = useState({
    coin: '',
    minBalance: '',
    gasBuffer: ''
  })
  const [editingCoin, setEditingCoin] = useState(null)
  
  // Network Override Form State
  const [showNetworkForm, setShowNetworkForm] = useState(false)
  const [networkForm, setNetworkForm] = useState({
    coinNetworkId: '',
    minBalance: '',
    gasBuffer: ''
  })
  const [editingNetwork, setEditingNetwork] = useState(null)
  
  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState({ id: '', type: '' })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoadingData(true)
      const data = await getSweepSettings(token)
      
      const settingsMap = {}
      data.forEach(setting => {
        const key = setting.keyName.replace('sweep.', '')
        settingsMap[key] = setting
      })
      
      setCoinOverrides(settingsMap.coin_specific_settings?.parsedValue || {})
      setNetworkOverrides(settingsMap.network_specific_settings?.parsedValue || {})
    } catch (error) {
      console.error('Failed to load sweep overrides:', error)
      toast.error(t('admin.sweep.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  // Coin Override Handlers
  function handleAddCoin() {
    setCoinForm({ coin: '', minBalance: '', gasBuffer: '' })
    setEditingCoin(null)
    setShowCoinForm(true)
  }

  function handleEditCoin(coin, config) {
    setCoinForm({
      coin: coin,
      minBalance: config.minBalance || '',
      gasBuffer: config.gasBuffer || ''
    })
    setEditingCoin(coin)
    setShowCoinForm(true)
  }

  async function handleSaveCoin() {
    try {
      if (!coinForm.coin.trim()) {
        toast.error(t('admin.sweep.coinRequired', { defaultValue: 'Coin symbol is required' }))
        return
      }

      const newOverrides = { ...coinOverrides }
      const override = {}
      
      if (coinForm.minBalance !== '') override.minBalance = parseFloat(coinForm.minBalance)
      if (coinForm.gasBuffer !== '') override.gasBuffer = parseFloat(coinForm.gasBuffer)
      
      if (Object.keys(override).length === 0) {
        toast.error(t('admin.sweep.oneFieldRequired', { defaultValue: 'At least one field is required' }))
        return
      }

      newOverrides[coinForm.coin.toUpperCase()] = override

      setLoading(true)
      await updateSweepSetting(token, 'sweep.coin_specific_settings', newOverrides)
      
      setCoinOverrides(newOverrides)
      setShowCoinForm(false)
      toast.success(t('admin.sweep.saveSuccess', { defaultValue: 'Override saved successfully' }))
    } catch (error) {
      console.error('Failed to save coin override:', error)
      toast.error(error?.message || t('admin.sweep.saveError', { defaultValue: 'Failed to save override' }))
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteCoin(coin) {
    setDeleteTarget({ id: coin, type: 'coin' })
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    try {
      setLoading(true)
      
      if (deleteTarget.type === 'coin') {
        const newOverrides = { ...coinOverrides }
        delete newOverrides[deleteTarget.id]
        await updateSweepSetting(token, 'sweep.coin_specific_settings', newOverrides)
        setCoinOverrides(newOverrides)
      } else if (deleteTarget.type === 'network') {
        const newOverrides = { ...networkOverrides }
        delete newOverrides[deleteTarget.id]
        await updateSweepSetting(token, 'sweep.network_specific_settings', newOverrides)
        setNetworkOverrides(newOverrides)
      }
      
      setShowDeleteModal(false)
      toast.success(t('admin.sweep.deleteSuccess', { defaultValue: 'Override deleted successfully' }))
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error(error?.message || t('admin.sweep.deleteError', { defaultValue: 'Failed to delete override' }))
    } finally {
      setLoading(false)
    }
  }

  // Network Override Handlers
  function handleAddNetwork() {
    setNetworkForm({ coinNetworkId: '', minBalance: '', gasBuffer: '' })
    setEditingNetwork(null)
    setShowNetworkForm(true)
  }

  function handleEditNetwork(coinNetworkId, config) {
    setNetworkForm({
      coinNetworkId: coinNetworkId,
      minBalance: config.minBalance || '',
      gasBuffer: config.gasBuffer || ''
    })
    setEditingNetwork(coinNetworkId)
    setShowNetworkForm(true)
  }

  async function handleSaveNetwork() {
    try {
      if (!networkForm.coinNetworkId.trim()) {
        toast.error(t('admin.sweep.coinNetworkIdRequired', { defaultValue: 'Coin-Network ID is required' }))
        return
      }

      const newOverrides = { ...networkOverrides }
      const override = {}
      
      if (networkForm.minBalance !== '') override.minBalance = parseFloat(networkForm.minBalance)
      if (networkForm.gasBuffer !== '') override.gasBuffer = parseFloat(networkForm.gasBuffer)
      
      if (Object.keys(override).length === 0) {
        toast.error(t('admin.sweep.oneFieldRequired', { defaultValue: 'At least one field is required' }))
        return
      }

      newOverrides[networkForm.coinNetworkId] = override

      setLoading(true)
      await updateSweepSetting(token, 'sweep.network_specific_settings', newOverrides)
      
      setNetworkOverrides(newOverrides)
      setShowNetworkForm(false)
      toast.success(t('admin.sweep.saveSuccess', { defaultValue: 'Override saved successfully' }))
    } catch (error) {
      console.error('Failed to save network override:', error)
      toast.error(error?.message || t('admin.sweep.saveError', { defaultValue: 'Failed to save override' }))
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteNetwork(coinNetworkId) {
    setDeleteTarget({ id: coinNetworkId, type: 'network' })
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
              <h5 className="mb-0">{t('admin.sweep.overridesTitle', { defaultValue: 'Sweep Overrides' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.sweep.overridesDesc', { defaultValue: 'Configure specific sweep settings for individual coins and networks' })}
              </p>
            </div>
            <div className="card-body">
              {/* Coin Overrides */}
              <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    {t('admin.sweep.coinOverrides', { defaultValue: 'Coin Overrides' })}
                    <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                      {Object.keys(coinOverrides).length}
                    </span>
                  </h6>
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleAddCoin}>
                    <i className="bx bx-plus me-1"></i>
                    {t('admin.sweep.addOverride', { defaultValue: 'Add Override' })}
                  </button>
                </div>
                
                {Object.keys(coinOverrides).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.sweep.coin', { defaultValue: 'Coin' })}</th>
                          <th>{t('admin.sweep.minBalance', { defaultValue: 'Min Balance' })}</th>
                          <th>{t('admin.sweep.gasBuffer', { defaultValue: 'Gas Buffer' })}</th>
                          <th className="text-end">{t('actions.actions', { defaultValue: 'Actions' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(coinOverrides).map(([coin, config]) => (
                          <tr key={coin}>
                            <td>
                              <strong>{coin}</strong>
                            </td>
                            <td>
                              {config.minBalance !== undefined ? (
                                <code>{config.minBalance}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.gasBuffer !== undefined ? (
                                <code>{config.gasBuffer}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-end">
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon me-1"
                                onClick={() => handleEditCoin(coin, config)}
                                disabled={loading}
                              >
                                <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon"
                                onClick={() => handleDeleteCoin(coin)}
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
                      {t('admin.sweep.noOverrides', { defaultValue: 'No coin overrides configured' })}
                    </p>
                    <small className="text-muted">
                      {t('admin.sweep.noOverridesHelp', { defaultValue: 'Add coin overrides to customize sweep settings per cryptocurrency' })}
                    </small>
                  </div>
                )}

              </div>

              {/* Network Overrides */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    {t('admin.sweep.networkOverrides', { defaultValue: 'Network Overrides' })}  
                    <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                      {Object.keys(networkOverrides).length}
                    </span>
                  </h6>
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleAddNetwork}>
                    <i className="bx bx-plus me-1"></i>
                    {t('admin.sweep.addNetworkOverride', { defaultValue: 'Add Network Override' })}
                  </button>
                </div>
                
                {Object.keys(networkOverrides).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.sweep.coinNetworkId', { defaultValue: 'Coin-Network ID' })}</th>
                          <th>{t('admin.sweep.minBalance', { defaultValue: 'Min Balance' })}</th>
                          <th>{t('admin.sweep.gasBuffer', { defaultValue: 'Gas Buffer' })}</th>
                          <th className="text-end">{t('actions.actions', { defaultValue: 'Actions' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(networkOverrides).map(([coinNetworkId, config]) => (
                          <tr key={coinNetworkId}>
                            <td>
                              <strong>{coinNetworkId}</strong>
                            </td>
                            <td>
                              {config.minBalance !== undefined ? (
                                <code>{config.minBalance}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.gasBuffer !== undefined ? (
                                <code>{config.gasBuffer}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-end">
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon me-1"
                                onClick={() => handleEditNetwork(coinNetworkId, config)}
                                disabled={loading}
                              >
                                <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon"
                                onClick={() => handleDeleteNetwork(coinNetworkId)}
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
                    <i className="bx bx-network-chart" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                    <p className="mt-3 mb-0">
                      {t('admin.sweep.noNetworkOverrides', { defaultValue: 'No network overrides configured' })}
                    </p>
                    <small className="text-muted">
                      {t('admin.sweep.noNetworkOverridesHelp', { defaultValue: 'Add network overrides to customize sweep settings per network' })}
                    </small>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coin Override Modal */}
      {showCoinForm && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingCoin ? t('admin.sweep.editCoinOverride', { defaultValue: 'Edit Coin Override' }) : t('admin.sweep.addCoinOverride', { defaultValue: 'Add Coin Override' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowCoinForm(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">{t('admin.sweep.coinSymbol', { defaultValue: 'Coin Symbol' })} *</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="BTC, ETH, USDT..."
                        value={coinForm.coin}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase()
                          if (/^[A-Z0-9]*$/.test(value) && value.length <= 20) {
                            setCoinForm({ ...coinForm, coin: value })
                          }
                        }}
                        disabled={!!editingCoin}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.sweep.minBalance', { defaultValue: 'Min Balance' })}</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="0.0001"
                        value={coinForm.minBalance}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[0-9.]*$/.test(value) && value.length <= 20) {
                            setCoinForm({ ...coinForm, minBalance: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.sweep.gasBuffer', { defaultValue: 'Gas Buffer' })}</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="0.00005"
                        value={coinForm.gasBuffer}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[0-9.]*$/.test(value) && value.length <= 20) {
                            setCoinForm({ ...coinForm, gasBuffer: value })
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
                    onClick={() => setShowCoinForm(false)}
                    disabled={loading}
                  >
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSaveCoin}
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

      {/* Network Override Modal */}
      {showNetworkForm && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingNetwork ? t('admin.sweep.editNetworkOverride', { defaultValue: 'Edit Network Override' }) : t('admin.sweep.addNetworkOverride', { defaultValue: 'Add Network Override' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowNetworkForm(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">{t('admin.sweep.coinNetworkId', { defaultValue: 'Coin-Network ID' })} *</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="1, 2, 3..."
                        value={networkForm.coinNetworkId}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[0-9]*$/.test(value) && value.length <= 20) {
                            setNetworkForm({ ...networkForm, coinNetworkId: value })
                          }
                        }}
                        disabled={!!editingNetwork}
                        maxLength={20}
                      />
                      <small className="text-muted">{t('admin.sweep.coinNetworkIdHelp', { defaultValue: 'Numeric coin_network_id' })}</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.sweep.minBalance', { defaultValue: 'Min Balance' })}</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="0.0001"
                        value={networkForm.minBalance}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[0-9.]*$/.test(value) && value.length <= 20) {
                            setNetworkForm({ ...networkForm, minBalance: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.sweep.gasBuffer', { defaultValue: 'Gas Buffer' })}</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="0.00005"
                        value={networkForm.gasBuffer}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[0-9.]*$/.test(value) && value.length <= 20) {
                            setNetworkForm({ ...networkForm, gasBuffer: value })
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
                    onClick={() => setShowNetworkForm(false)}
                    disabled={loading}
                  >
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSaveNetwork}
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
                    {t('admin.sweep.confirmDelete', { defaultValue: 'Confirm Delete' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    {deleteTarget.type === 'coin' 
                      ? t('admin.sweep.deleteCoinConfirm', { defaultValue: `Are you sure you want to delete override for ${deleteTarget.id}?`, id: deleteTarget.id })
                      : t('admin.sweep.deleteNetworkConfirm', { defaultValue: `Are you sure you want to delete override for network ${deleteTarget.id}?`, id: deleteTarget.id })
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
