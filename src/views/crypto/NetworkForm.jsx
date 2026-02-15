import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getNetworkById, createNetwork, updateNetwork, deleteNetwork } from '../../api/admin.ts'
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal'
import { useToastContext } from '../../context/ToastContext'

export default function NetworkForm() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const toast = useToastContext()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'mainnet',
    chainId: '',
    rpcUrl: '',
    explorerUrl: '',
    apiUrl: '',
    isTestnet: false,
    confirmationBlocks: 1,
    status: 'active'
  })
  const [networkMeta, setNetworkMeta] = useState(null)

  useEffect(() => {
    if (isEdit && id) {
      loadNetwork()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadNetwork() {
    setLoading(true)
    setError('')
    try {
      const network = await getNetworkById(token, parseInt(id))
      
      if (network) {
        setFormData({
          name: network.name || '',
          symbol: network.symbol || '',
          type: network.type || 'mainnet',
          chainId: network.chainId || '',
          rpcUrl: network.rpcUrl || '',
          explorerUrl: network.explorerUrl || '',
          apiUrl: network.apiUrl || '',
          isTestnet: !!network.isTestnet,
          confirmationBlocks: network.confirmationBlocks || 1,
          status: network.status || 'active'
        })
        setNetworkMeta({
          id: network.id,
          wsUrl: network.wsUrl || null,
          createdAt: network.createdAt,
          updatedAt: network.updatedAt,
          coinsCount: network.coinsCount || 0,
          supportedCoins: network.supportedCoins || []
        })
      } else {
        setError('Network not found')
      }
    } catch (e) {
      setError(e?.message || 'Failed to load network')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    let processedValue = value
    
    // Auto-uppercase symbol
    if (name === 'symbol') {
      processedValue = value.toUpperCase()
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }))
  }

  async function handleDelete() {
    if (!isEdit || !id) return
    
    setLoading(true)
    setError('')
    setShowDeleteConfirm(false)

    try {
      await deleteNetwork(token, parseInt(id))
      navigate('/admin/networks')
    } catch (e) {
      const message = e?.message || 'Failed to delete network'
      setErrorMessage(message)
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validation for Create mode
      if (!isEdit) {
        // Required fields
        if (!formData.name || formData.name.trim().length === 0) {
          throw new Error('Name is required')
        }
        if (formData.name.length > 100) {
          throw new Error('Name must be max 100 characters')
        }
        if (!formData.symbol || formData.symbol.trim().length === 0) {
          throw new Error('Symbol is required')
        }
        if (formData.symbol.length > 10) {
          throw new Error('Symbol must be max 10 characters')
        }
        if (!formData.type || formData.type.trim().length === 0) {
          throw new Error('Network Type is required')
        }
      }

      // Type validation (for both create and update)
      const validTypes = ['mainnet', 'testnet', 'devnet', 'layer2', 'sidechain']
      if (formData.type && !validTypes.includes(formData.type)) {
        throw new Error('Network Type must be one of: mainnet, testnet, devnet, layer2, sidechain')
      }

      // Optional field validations (for both create and update)
      
      // Chain ID - must be positive integer if provided
      if (formData.chainId !== '' && formData.chainId !== null && formData.chainId !== undefined) {
        const chainIdNum = parseInt(formData.chainId)
        if (isNaN(chainIdNum) || chainIdNum <= 0) {
          throw new Error('Chain ID must be a positive integer')
        }
      }

      // Confirmation Blocks - must be >= 0
      if (formData.confirmationBlocks !== '' && formData.confirmationBlocks !== null) {
        const blocks = parseInt(formData.confirmationBlocks)
        if (isNaN(blocks) || blocks < 0) {
          throw new Error('Confirmation blocks must be >= 0')
        }
      }

      // URL validations
      if (formData.rpcUrl && formData.rpcUrl.trim()) {
        try {
          new URL(formData.rpcUrl)
        } catch {
          throw new Error('RPC URL must be a valid URL')
        }
      }
      if (formData.explorerUrl && formData.explorerUrl.trim()) {
        try {
          new URL(formData.explorerUrl)
        } catch {
          throw new Error('Explorer URL must be a valid URL')
        }
      }
      if (formData.apiUrl && formData.apiUrl.trim()) {
        try {
          new URL(formData.apiUrl)
        } catch {
          throw new Error('API URL must be a valid URL')
        }
      }

      // Status validation
      if (formData.status && !['active', 'inactive', 'maintenance', 'deprecated'].includes(formData.status)) {
        throw new Error('Status must be active, inactive, maintenance, or deprecated')
      }

      const payload = {
        name: formData.name.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        type: formData.type || 'mainnet',
        chainId: formData.chainId ? parseInt(formData.chainId) : null,
        rpcUrl: formData.rpcUrl?.trim() || undefined,
        explorerUrl: formData.explorerUrl?.trim() || undefined,
        apiUrl: formData.apiUrl?.trim() || undefined,
        isTestnet: formData.isTestnet,
        confirmationBlocks: formData.confirmationBlocks !== '' && formData.confirmationBlocks !== null && formData.confirmationBlocks !== undefined
          ? parseInt(formData.confirmationBlocks) 
          : 1,
        status: formData.status || 'active'
      }

      if (isEdit) {
        await updateNetwork(token, parseInt(id), payload)
        toast.success(t('crypto.networkUpdateSuccess', { defaultValue: 'Network updated successfully' }))
      } else {
        await createNetwork(token, payload)
        toast.success(t('crypto.networkCreateSuccess', { defaultValue: 'Network created successfully' }))
      }
      navigate('/admin/networks')
    } catch (e) {
      const message = e?.message || (isEdit ? 'Failed to update network' : 'Failed to create network')
      setErrorMessage(message)
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEdit) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-6">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">{t('common.loading', { defaultValue: 'Loading...' })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <button 
          type="button" 
          className="btn btn-icon btn-label-secondary me-3"
          onClick={() => navigate('/admin/networks')}
        >
          <i className="bx bx-arrow-back"></i>
        </button>
        <div>
          <h4 className="mb-1">
            {isEdit 
              ? t('crypto.editNetwork', { defaultValue: 'Edit Network' })
              : t('crypto.createNetwork', { defaultValue: 'Create Network' })
            }
          </h4>
          <p className="text-muted mb-0">
            {isEdit 
              ? t('crypto.editNetworkDesc', { defaultValue: 'Update network information' })
              : t('crypto.createNetworkDesc', { defaultValue: 'Add a new blockchain network' })
            }
          </p>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-xl-8">
          <div className="card mb-4">
            <h5 className="card-header">{t('crypto.networkInformation', { defaultValue: 'Network Information' })}</h5>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger mb-4" role="alert">
                  <i className="bx bx-error-circle me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-4">
                  {/* Name */}
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="name">
                      {t('crypto.networkName', { defaultValue: 'Network Name' })} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ethereum"
                      maxLength={100}
                      required
                    />
                    <small className="text-muted">{t('crypto.networkNameHelp', { defaultValue: 'Full network name' })}</small>
                  </div>

                  {/* Symbol */}
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="symbol">
                      {t('crypto.symbol', { defaultValue: 'Symbol' })} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="symbol"
                      name="symbol"
                      value={formData.symbol}
                      onChange={handleChange}
                      placeholder="ETH"
                      maxLength={20}
                      pattern="[A-Za-z0-9]+"
                      required
                      disabled={isEdit}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <small className="text-muted">{t('crypto.symbolHelp', { defaultValue: 'Network symbol (e.g., ETH, BSC)' })}</small>
                  </div>

                  {/* Type */}
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="type">
                      {t('crypto.networkType', { defaultValue: 'Network Type' })} <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-lg"
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      disabled={isEdit}
                    >
                      <option value="mainnet">Mainnet</option>
                      <option value="testnet">Testnet</option>
                      <option value="devnet">Devnet</option>
                      <option value="layer2">Layer 2</option>
                      <option value="sidechain">Sidechain</option>
                    </select>
                    <small className="text-muted">{t('crypto.networkTypeHelp', { defaultValue: 'Type of blockchain network' })}</small>
                  </div>

                  {/* Chain ID */}
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="chainId">
                      {t('crypto.chainId', { defaultValue: 'Chain ID' })}
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      id="chainId"
                      name="chainId"
                      value={formData.chainId}
                      onChange={handleChange}
                      placeholder="1"
                      min="1"
                    />
                    <small className="text-muted">{t('crypto.chainIdHelp', { defaultValue: 'EVM chain ID (leave empty for non-EVM)' })}</small>
                  </div>

                  {/* Confirmation Blocks */}
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="confirmationBlocks">
                      {t('crypto.confirmationBlocks', { defaultValue: 'Confirmation Blocks' })} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      id="confirmationBlocks"
                      name="confirmationBlocks"
                      value={formData.confirmationBlocks}
                      onChange={handleChange}
                      min="1"
                      max="1000"
                      required
                    />
                    <small className="text-muted">{t('crypto.confirmationBlocksHelp', { defaultValue: 'Number of blocks for confirmation' })}</small>
                  </div>

                  {/* RPC URL */}
                  <div className="col-12">
                    <label className="form-label" htmlFor="rpcUrl">
                      {t('crypto.rpcUrl', { defaultValue: 'RPC URL' })}
                    </label>
                    <input
                      type="url"
                      className="form-control form-control-lg"
                      id="rpcUrl"
                      name="rpcUrl"
                      value={formData.rpcUrl}
                      onChange={handleChange}
                      placeholder="https://eth.llamarpc.com"
                    />
                    <small className="text-muted">{t('crypto.rpcUrlHelp', { defaultValue: 'Blockchain RPC endpoint' })}</small>
                  </div>

                  {/* Explorer URL */}
                  <div className="col-12">
                    <label className="form-label" htmlFor="explorerUrl">
                      {t('crypto.explorerUrl', { defaultValue: 'Explorer URL' })}
                    </label>
                    <input
                      type="url"
                      className="form-control form-control-lg"
                      id="explorerUrl"
                      name="explorerUrl"
                      value={formData.explorerUrl}
                      onChange={handleChange}
                      placeholder="https://etherscan.io"
                    />
                    <small className="text-muted">{t('crypto.explorerUrlHelp', { defaultValue: 'Block explorer URL' })}</small>
                  </div>

                  {/* API URL */}
                  <div className="col-12">
                    <label className="form-label" htmlFor="apiUrl">
                      {t('crypto.apiUrl', { defaultValue: 'API URL' })}
                    </label>
                    <input
                      type="url"
                      className="form-control form-control-lg"
                      id="apiUrl"
                      name="apiUrl"
                      value={formData.apiUrl}
                      onChange={handleChange}
                      placeholder="https://api.etherscan.io/api"
                    />
                    <small className="text-muted">{t('crypto.apiUrlHelp', { defaultValue: 'External API endpoint (e.g., Etherscan API)' })}</small>
                  </div>

                  {/* Status */}
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="status">
                      {t('invoices.statusCol')}
                    </label>
                    <select
                      className="form-select form-select-lg"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="active">{t('admin.active', { defaultValue: 'Active' })}</option>
                      <option value="inactive">{t('crypto.inactive', { defaultValue: 'Inactive' })}</option>
                      <option value="maintenance">{t('crypto.maintenance', { defaultValue: 'Maintenance' })}</option>
                      <option value="deprecated">{t('crypto.deprecated', { defaultValue: 'Deprecated' })}</option>
                    </select>
                  </div>

                  {/* Is Testnet */}
                  <div className="col-12">
                    <div className="form-check form-check-lg">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isTestnet"
                        name="isTestnet"
                        checked={formData.isTestnet}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="isTestnet">
                        {t('crypto.isTestnet', { defaultValue: 'Testnet' })}
                      </label>
                    </div>
                    <small className="text-muted ms-4">{t('crypto.isTestnetHelp', { defaultValue: 'Check if this is a test network' })}</small>
                  </div>

                  {/* Actions */}
                  <div className="col-12 pt-3">
                    <div className="d-flex gap-3 justify-content-between">
                      {/* Delete button - Hidden */}
                      {false && isEdit && (
                        <button 
                          type="button" 
                          className="btn btn-lg btn-danger"
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={loading}
                        >
                          <i className="bx bx-trash me-2"></i>
                          {t('actions.delete', { defaultValue: 'Delete' })}
                        </button>
                      )}
                      
                      <div className={`d-flex gap-3 ms-auto`}>
                        <button 
                          type="button" 
                          className="btn btn-lg btn-label-secondary"
                          onClick={() => navigate('/admin/networks')}
                          disabled={loading}
                        >
                          {t('actions.cancel', { defaultValue: 'Cancel' })}
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-lg btn-primary"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              {t('actions.saving', { defaultValue: 'Saving...' })}
                            </>
                          ) : (
                            <>
                              <i className="bx bx-save me-2"></i>
                              {isEdit ? t('actions.update', { defaultValue: 'Update' }) : t('actions.create', { defaultValue: 'Create' })}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* Read-only info panel (edit mode only) */}
        {isEdit && networkMeta && (
          <div className="col-12 col-xl-4">
            <div className="card mb-4">
              <h5 className="card-header">{t('crypto.networkInfo', { defaultValue: 'Network Info' })}</h5>
              <div className="card-body">
                <ul className="list-unstyled mb-0">
                  <li className="d-flex justify-content-between mb-3">
                    <span className="text-muted">ID</span>
                    <span className="fw-medium">#{networkMeta.id}</span>
                  </li>
                  {networkMeta.wsUrl && (
                    <li className="mb-3">
                      <span className="text-muted d-block mb-1">WebSocket URL</span>
                      <code className="small" style={{ wordBreak: 'break-all' }}>{networkMeta.wsUrl}</code>
                    </li>
                  )}
                  <li className="d-flex justify-content-between mb-3">
                    <span className="text-muted">{t('crypto.coinsCount', { defaultValue: 'Supported Coins' })}</span>
                    <span className="badge bg-label-primary">{networkMeta.coinsCount}</span>
                  </li>
                  {networkMeta.createdAt && (
                    <li className="d-flex justify-content-between mb-3">
                      <span className="text-muted">{t('common.createdAt', { defaultValue: 'Created' })}</span>
                      <span className="small">{new Date(networkMeta.createdAt).toLocaleString()}</span>
                    </li>
                  )}
                  {networkMeta.updatedAt && (
                    <li className="d-flex justify-content-between mb-3">
                      <span className="text-muted">{t('common.updatedAt', { defaultValue: 'Updated' })}</span>
                      <span className="small">{new Date(networkMeta.updatedAt).toLocaleString()}</span>
                    </li>
                  )}
                </ul>

                {/* Supported Coins List */}
                {networkMeta.supportedCoins.length > 0 && (
                  <>
                    <hr />
                    <h6 className="mb-3">{t('crypto.supportedCoins', { defaultValue: 'Supported Coins' })}</h6>
                    <div className="list-group list-group-flush">
                      {networkMeta.supportedCoins.map((coin) => (
                        <div key={coin.id} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                          <div>
                            <span className="fw-medium">{coin.coinSymbol}</span>
                            <small className="text-muted d-block">{coin.coinName}</small>
                          </div>
                          <div className="text-end">
                            <span className={`badge bg-label-${coin.status === 'active' ? 'success' : 'secondary'} me-1`}>{coin.status}</span>
                            {coin.depositEnabled && <span className="badge bg-label-info me-1">Deposit</span>}
                            {coin.withdrawEnabled && <span className="badge bg-label-warning">Withdraw</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={loading}
        message={t('crypto.deleteNetworkConfirmMessage', { defaultValue: 'Are you sure you want to delete this network?' })}
        itemName={formData.symbol}
        itemDetails={`- ${formData.name}`}
      />

      {/* Error Modal */}
      {showErrorModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowErrorModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {t('crypto.operationFailed', { defaultValue: 'Operation Failed' })}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowErrorModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">{errorMessage}</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => setShowErrorModal(false)}
                >
                  {t('actions.close', { defaultValue: 'Close' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
