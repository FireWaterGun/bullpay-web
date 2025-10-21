import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings, updateSweepSetting } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'

export default function SweepOverrides() {
  const { t } = useTranslation()
  const { user, token } = useAuth()
  const { toast } = useToastContext()
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
      toast?.error?.(t('admin.sweep.loadError', { defaultValue: 'Failed to load settings' }))
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
        toast?.error?.(t('admin.sweep.coinRequired', { defaultValue: 'Coin symbol is required' }))
        return
      }

      const newOverrides = { ...coinOverrides }
      const override = {}
      
      if (coinForm.minBalance !== '') override.minBalance = parseFloat(coinForm.minBalance)
      if (coinForm.gasBuffer !== '') override.gasBuffer = parseFloat(coinForm.gasBuffer)
      
      if (Object.keys(override).length === 0) {
        toast?.error?.(t('admin.sweep.oneFieldRequired', { defaultValue: 'At least one field is required' }))
        return
      }

      newOverrides[coinForm.coin.toUpperCase()] = override

      setLoading(true)
      await updateSweepSetting(token, 'sweep.coin_specific_settings', newOverrides)
      
      setCoinOverrides(newOverrides)
      setShowCoinForm(false)
      toast?.success?.(t('admin.sweep.saveSuccess', { defaultValue: 'Override saved successfully' }))
    } catch (error) {
      console.error('Failed to save coin override:', error)
      toast?.error?.(error?.message || t('admin.sweep.saveError', { defaultValue: 'Failed to save override' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteCoin(coin) {
    if (!confirm(t('admin.sweep.deleteConfirm', { defaultValue: `Delete override for ${coin}?` }))) return

    try {
      const newOverrides = { ...coinOverrides }
      delete newOverrides[coin]

      setLoading(true)
      await updateSweepSetting(token, 'sweep.coin_specific_settings', newOverrides)
      
      setCoinOverrides(newOverrides)
      toast?.success?.(t('admin.sweep.deleteSuccess', { defaultValue: 'Override deleted successfully' }))
    } catch (error) {
      console.error('Failed to delete coin override:', error)
      toast?.error?.(error?.message || t('admin.sweep.deleteError', { defaultValue: 'Failed to delete override' }))
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
        toast?.error?.(t('admin.sweep.coinNetworkIdRequired', { defaultValue: 'Coin-Network ID is required' }))
        return
      }

      const newOverrides = { ...networkOverrides }
      const override = {}
      
      if (networkForm.minBalance !== '') override.minBalance = parseFloat(networkForm.minBalance)
      if (networkForm.gasBuffer !== '') override.gasBuffer = parseFloat(networkForm.gasBuffer)
      
      if (Object.keys(override).length === 0) {
        toast?.error?.(t('admin.sweep.oneFieldRequired', { defaultValue: 'At least one field is required' }))
        return
      }

      newOverrides[networkForm.coinNetworkId] = override

      setLoading(true)
      await updateSweepSetting(token, 'sweep.network_specific_settings', newOverrides)
      
      setNetworkOverrides(newOverrides)
      setShowNetworkForm(false)
      toast?.success?.(t('admin.sweep.saveSuccess', { defaultValue: 'Override saved successfully' }))
    } catch (error) {
      console.error('Failed to save network override:', error)
      toast?.error?.(error?.message || t('admin.sweep.saveError', { defaultValue: 'Failed to save override' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteNetwork(coinNetworkId) {
    if (!confirm(t('admin.sweep.deleteConfirm', { defaultValue: `Delete override for ${coinNetworkId}?` }))) return

    try {
      const newOverrides = { ...networkOverrides }
      delete newOverrides[coinNetworkId]

      setLoading(true)
      await updateSweepSetting(token, 'sweep.network_specific_settings', newOverrides)
      
      setNetworkOverrides(newOverrides)
      toast?.success?.(t('admin.sweep.deleteSuccess', { defaultValue: 'Override deleted successfully' }))
    } catch (error) {
      console.error('Failed to delete network override:', error)
      toast?.error?.(error?.message || t('admin.sweep.deleteError', { defaultValue: 'Failed to delete override' }))
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
                    <span className="badge bg-label-primary ms-2">
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
                                className="btn btn-sm btn-icon btn-outline-primary me-1"
                                onClick={() => handleEditCoin(coin, config)}
                                disabled={loading}
                              >
                                <i className="bx bx-edit"></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon btn-outline-danger"
                                onClick={() => handleDeleteCoin(coin)}
                                disabled={loading}
                              >
                                <i className="bx bx-trash"></i>
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

                {/* Coin Override Form */}
                {showCoinForm && (
                  <div className="card mt-3">
                    <div className="card-header">
                      <h6 className="mb-0">
                        {editingCoin ? t('admin.sweep.editCoinOverride', { defaultValue: 'Edit Coin Override' }) : t('admin.sweep.addCoinOverride', { defaultValue: 'Add Coin Override' })}
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label">{t('admin.sweep.coinSymbol', { defaultValue: 'Coin Symbol' })} *</label>
                          <input 
                            type="text"
                            className="form-control"
                            placeholder="BTC"
                            value={coinForm.coin}
                            onChange={(e) => setCoinForm({ ...coinForm, coin: e.target.value.toUpperCase() })}
                            disabled={!!editingCoin}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">{t('admin.sweep.minBalance', { defaultValue: 'Min Balance' })}</label>
                          <input 
                            type="number"
                            className="form-control"
                            placeholder="0.0001"
                            step="0.00001"
                            value={coinForm.minBalance}
                            onChange={(e) => setCoinForm({ ...coinForm, minBalance: e.target.value })}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">{t('admin.sweep.gasBuffer', { defaultValue: 'Gas Buffer' })}</label>
                          <input 
                            type="number"
                            className="form-control"
                            placeholder="0.00005"
                            step="0.00001"
                            value={coinForm.gasBuffer}
                            onChange={(e) => setCoinForm({ ...coinForm, gasBuffer: e.target.value })}
                          />
                        </div>
                        <div className="col-12">
                          <small className="text-muted">
                            {t('admin.sweep.atLeastOneField', { defaultValue: 'At least one field (Min Balance or Gas Buffer) must be specified' })}
                          </small>
                        </div>
                      </div>
                      <div className="d-flex gap-2 justify-content-end mt-3">
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary"
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
                )}
              </div>

              {/* Network Overrides */}
              <hr className="my-4" />
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    <i className="bx bx-network-chart me-2"></i>
                    {t('admin.sweep.networkOverrides', { defaultValue: 'Network Overrides' })}
                    <span className="badge bg-label-success ms-2">
                      {Object.keys(networkOverrides).length}
                    </span>
                  </h6>
                  <button type="button" className="btn btn-sm btn-success" onClick={handleAddNetwork}>
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
                                className="btn btn-sm btn-icon btn-outline-primary me-1"
                                onClick={() => handleEditNetwork(coinNetworkId, config)}
                                disabled={loading}
                              >
                                <i className="bx bx-edit"></i>
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-icon btn-outline-danger"
                                onClick={() => handleDeleteNetwork(coinNetworkId)}
                                disabled={loading}
                              >
                                <i className="bx bx-trash"></i>
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

                {/* Network Override Form */}
                {showNetworkForm && (
                  <div className="card mt-3">
                    <div className="card-header">
                      <h6 className="mb-0">
                        {editingNetwork ? t('admin.sweep.editNetworkOverride', { defaultValue: 'Edit Network Override' }) : t('admin.sweep.addNetworkOverride', { defaultValue: 'Add Network Override' })}
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label">{t('admin.sweep.coinNetworkId', { defaultValue: 'Coin-Network ID' })} *</label>
                          <input 
                            type="text"
                            className="form-control"
                            placeholder="1-eth"
                            value={networkForm.coinNetworkId}
                            onChange={(e) => setNetworkForm({ ...networkForm, coinNetworkId: e.target.value })}
                            disabled={!!editingNetwork}
                          />
                          <small className="text-muted">{t('admin.sweep.coinNetworkIdHelp', { defaultValue: 'Format: coin_network_id (e.g., 1-eth, 1-bsc)' })}</small>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">{t('admin.sweep.minBalance', { defaultValue: 'Min Balance' })}</label>
                          <input 
                            type="number"
                            className="form-control"
                            placeholder="0.0001"
                            step="0.00001"
                            value={networkForm.minBalance}
                            onChange={(e) => setNetworkForm({ ...networkForm, minBalance: e.target.value })}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">{t('admin.sweep.gasBuffer', { defaultValue: 'Gas Buffer' })}</label>
                          <input 
                            type="number"
                            className="form-control"
                            placeholder="0.00005"
                            step="0.00001"
                            value={networkForm.gasBuffer}
                            onChange={(e) => setNetworkForm({ ...networkForm, gasBuffer: e.target.value })}
                          />
                        </div>
                        <div className="col-12">
                          <small className="text-muted">
                            {t('admin.sweep.atLeastOneField', { defaultValue: 'At least one field (Min Balance or Gas Buffer) must be specified' })}
                          </small>
                        </div>
                      </div>
                      <div className="d-flex gap-2 justify-content-end mt-3">
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary"
                          onClick={() => setShowNetworkForm(false)}
                          disabled={loading}
                        >
                          {t('actions.cancel', { defaultValue: 'Cancel' })}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-success"
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
