import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { 
  getCoinNetworkById, 
  createCoinNetwork, 
  updateCoinNetwork, 
  deleteCoinNetwork,
  getCoins,
  getNetworks
} from '../../api/admin.ts'
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal'

// Coin asset helpers (same as SupportedCrypto.jsx)
function getCoinAssetCandidates(symbol, logoUrl) {
  const sym = String(symbol || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const aliases = {
    btc: ['bitcoin'],
    eth: ['ethereum'],
    doge: ['dogecoin'],
    sol: ['solana'],
    matic: ['polygon'],
    pol: ['polygon'],
    ada: ['cardano'],
    xmr: ['monero'],
    zec: ['zcash'],
    usdt: ['usdterc20', 'tether'],
    usdc: ['usd-coin'],
    bnb: ['binance'],
    bsc: ['binance'],
    trx: ['tron'],
    arb: ['arbitrum'],
    op: ['optimism'],
    base: ['base'],
    ln: ['lightning'],
  }
  const names = [sym, ...(aliases[sym] || [])]
  if (sym.startsWith('usdt') && !names.includes('usdt')) names.push('usdt')
  const exts = ['svg', 'png']
  const byAssets = names.flatMap((n) =>
    exts.map((ext) => `/assets/img/coins/${n}.${ext}`)
  )
  const candidates = [
    ...byAssets,
    ...(logoUrl ? [logoUrl] : []),
    '/assets/img/coins/default.svg',
  ]
  return Array.from(new Set(candidates))
}

function CoinImg({ coin, symbol, size = 40 }) {
  const [idx, setIdx] = useState(0)
  const [showFallback, setShowFallback] = useState(false)
  const candidates = useMemo(
    () => getCoinAssetCandidates(symbol, coin?.logoUrl).filter(c => !c.includes('default.svg')),
    [coin?.logoUrl, symbol]
  )
  const src = candidates[Math.min(idx, candidates.length - 1)]
  
  const handleError = () => {
    if (idx + 1 < candidates.length) {
      setIdx(i => i + 1)
    } else {
      setShowFallback(true)
    }
  }
  
  // ถ้าไม่มี candidates เลย แสดง fallback ทันที
  if (candidates.length === 0 || showFallback) {
    const initial = (symbol || 'C').charAt(0).toUpperCase()
    const colors = ['#7367F0', '#00CFE8', '#28C76F', '#FF9F43', '#EA5455', '#9966FF', '#00D4BD']
    const colorIndex = initial.charCodeAt(0) % colors.length
    const bgColor = colors[colorIndex]
    
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '8px',
          backgroundColor: bgColor,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.5,
          fontWeight: 'bold'
        }}
      >
        {initial}
      </div>
    )
  }
  
  return (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      style={{ objectFit: 'cover', borderRadius: '8px' }}
      onError={handleError}
    />
  )
}

export default function SupportedCryptoForm() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [coins, setCoins] = useState([])
  const [networks, setNetworks] = useState([])
  const [formData, setFormData] = useState({
    coinId: '',
    networkId: '',
    contractAddress: '',
    decimals: '',
    depositEnabled: true,
    withdrawEnabled: true,
    minDepositAmount: '',
    minWithdrawAmount: '',
    maxWithdrawAmount: '',
    depositFee: '0',
    withdrawFee: '',
    depositConfirmations: '',
    status: 'active'
  })

  const selectedCoin = useMemo(() => {
    return coins.find(c => c.id === parseInt(formData.coinId))
  }, [coins, formData.coinId])

  const selectedNetwork = useMemo(() => {
    return networks.find(n => n.id === parseInt(formData.networkId))
  }, [networks, formData.networkId])

  useEffect(() => {
    loadCoinsAndNetworks()
    if (isEdit && id) {
      loadCoinNetwork()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadCoinsAndNetworks() {
    try {
      const [coinsRes, networksRes] = await Promise.all([
        getCoins(token, 1, 100),
        getNetworks(token, 1, 100)
      ])
      setCoins(coinsRes?.items || [])
      setNetworks(networksRes?.items || [])
    } catch (e) {
      console.error('Failed to load coins and networks:', e)
    }
  }

  async function loadCoinNetwork() {
    setLoading(true)
    setError('')
    try {
      const coinNetwork = await getCoinNetworkById(token, parseInt(id))
      
      if (coinNetwork) {
        // ฟังก์ชันตัด trailing zeros
        const cleanNumber = (value) => {
          if (!value) return ''
          const num = parseFloat(value)
          return isNaN(num) ? '' : num.toString()
        }
        
        setFormData({
          coinId: coinNetwork.coinId?.toString() || '',
          networkId: coinNetwork.networkId?.toString() || '',
          contractAddress: coinNetwork.contractAddress || '',
          decimals: coinNetwork.decimals?.toString() || '',
          depositEnabled: coinNetwork.depositEnabled ?? true,
          withdrawEnabled: coinNetwork.withdrawEnabled ?? true,
          minDepositAmount: cleanNumber(coinNetwork.minDepositAmount),
          minWithdrawAmount: cleanNumber(coinNetwork.minWithdrawAmount),
          maxWithdrawAmount: cleanNumber(coinNetwork.maxWithdrawAmount),
          depositFee: cleanNumber(coinNetwork.depositFee) || '0',
          withdrawFee: cleanNumber(coinNetwork.withdrawFee),
          depositConfirmations: coinNetwork.depositConfirmations?.toString() || '',
          status: coinNetwork.status || 'active'
        })
      } else {
        setError('Supported crypto not found')
      }
    } catch (e) {
      setError(e?.message || 'Failed to load supported crypto')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    
    // Validate decimals field (0-18 only)
    if (name === 'decimals' && value !== '') {
      const num = parseInt(value)
      if (num < 0 || num > 18) {
        return // Don't update if out of range
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate contract address format (Ethereum-style: 0x + 40 hex chars)
      if (formData.contractAddress) {
        const addressPattern = /^0x[a-fA-F0-9]{40}$/
        if (!addressPattern.test(formData.contractAddress)) {
          throw new Error(t('crypto.invalidContractAddress', { defaultValue: 'Invalid contract address format (must be 0x followed by 40 hex characters)' }))
        }
      }
      
      // Validate decimals
      if (formData.decimals) {
        const decimals = parseInt(formData.decimals)
        if (decimals < 0 || decimals > 18) {
          throw new Error(t('crypto.decimalsRangeError', { defaultValue: 'Decimals must be between 0 and 18' }))
        }
      }
      
      const data = {
        coinId: parseInt(formData.coinId),
        networkId: parseInt(formData.networkId),
        ...(formData.contractAddress && { contractAddress: formData.contractAddress }),
        ...(formData.decimals && { decimals: parseInt(formData.decimals) }),
        depositEnabled: formData.depositEnabled,
        withdrawEnabled: formData.withdrawEnabled,
        minDepositAmount: formData.minDepositAmount,
        minWithdrawAmount: formData.minWithdrawAmount,
        maxWithdrawAmount: formData.maxWithdrawAmount,
        depositFee: formData.depositFee || '0',
        withdrawFee: formData.withdrawFee,
        depositConfirmations: parseInt(formData.depositConfirmations),
        status: formData.status || 'active'
      }

      if (isEdit) {
        await updateCoinNetwork(token, parseInt(id), data)
      } else {
        await createCoinNetwork(token, data)
      }
      
      navigate('/admin/crypto/supported')
    } catch (e) {
      const message = e?.message || (isEdit ? 'Failed to update supported crypto' : 'Failed to create supported crypto')
      setErrorMessage(message)
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!isEdit || !id) return
    
    setLoading(true)
    setError('')
    setShowDeleteConfirm(false)

    try {
      await deleteCoinNetwork(token, parseInt(id))
      navigate('/admin/crypto/supported')
    } catch (e) {
      const message = e?.message || 'Failed to delete supported crypto'
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
            <span className="visually-hidden">{t('invoices.loading')}</span>
          </div>
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
          className="btn btn-icon btn-outline-secondary me-3"
          onClick={() => navigate('/admin/crypto/supported')}
        >
          <i className="bx bx-arrow-back"></i>
        </button>
        <div>
          <h4 className="mb-1">
            {isEdit 
              ? t('crypto.editSupported', { defaultValue: 'Edit Supported Crypto' })
              : t('crypto.createSupported', { defaultValue: 'Add Supported Crypto' })
            }
          </h4>
          <p className="text-muted mb-0">
            {isEdit
              ? t('crypto.editSupportedDesc', { defaultValue: 'Update supported cryptocurrency network' })
              : t('crypto.createSupportedDesc', { defaultValue: 'Add a new supported cryptocurrency network' })
            }
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <i className="bx bx-error-circle me-2"></i>
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-12">
            {/* Step 1: Select Coin Card */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <span className="badge bg-primary rounded-pill me-2">1</span>
                  {t('crypto.selectCoin', { defaultValue: 'Select a coin' })}
                  <span className="text-danger ms-1">*</span>
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {coins.map(coin => {
                    const isActive = formData.coinId === String(coin.id)
                    return (
                      <div className="col-6 col-sm-4 col-md-3" key={coin.id}>
                        <div
                          role="button"
                          className={`card h-100 border-2 rounded-3 overflow-hidden ${isActive ? 'border-primary bg-label-primary shadow-sm' : 'border-2'}`}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              coinId: String(coin.id)
                            }))
                          }}
                        >
                          <div className="card-body d-flex align-items-center gap-3 p-3">
                            <CoinImg coin={coin} symbol={coin.symbol} size={40} />
                            <div className="flex-grow-1 min-width-0">
                              <div className="fw-bold">{coin.symbol}</div>
                              <div className="text-muted small text-truncate">{coin.name}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {coins.length === 0 && (
                    <div className="col-12 text-muted">{t('common.noData', { defaultValue: 'No data' })}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Select Network Card */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <span className="badge bg-primary rounded-pill me-2">2</span>
                  {t('crypto.selectNetwork', { defaultValue: 'Select a network' })}
                  <span className="text-danger ms-1">*</span>
                </h5>
              </div>
              <div className="card-body">
                {formData.coinId ? (
                  <div className="d-flex flex-wrap gap-2">
                    {networks.map(network => {
                      const selected = formData.networkId === String(network.id)
                      return (
                        <button
                          type="button"
                          key={network.id}
                          className={`btn ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              networkId: String(network.id)
                            }))
                          }}
                        >
                          {network.symbol} - {network.name}
                        </button>
                      )
                    })}
                    {networks.length === 0 && (
                      <div className="text-muted small">{t('common.noData', { defaultValue: 'No data' })}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted">{t('crypto.selectCoinFirst', { defaultValue: 'Please select a coin first' })}</div>
                )}
              </div>
            </div>

            {/* Step 3: Configuration Card */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <span className="badge bg-primary rounded-pill me-2">3</span>
                  {t('crypto.configuration', { defaultValue: 'Configuration' })}
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">

              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.contractAddress', { defaultValue: 'Contract Address' })}
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="contractAddress"
                  name="contractAddress"
                  value={formData.contractAddress}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0x..."
                />
                <small className="text-muted">
                  {t('crypto.contractAddressHelp', { defaultValue: 'Leave empty for native coins' })}
                </small>
              </div>

              {/* Decimals */}
              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.decimals', { defaultValue: 'Decimals' })}
                </label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  id="decimals"
                  name="decimals"
                  value={formData.decimals}
                  onChange={handleChange}
                  disabled={loading}
                  min="0"
                  max="18"
                  placeholder="18"
                />
                <small className="text-muted">
                  {t('crypto.coinNetworkDecimalsHelp', { defaultValue: 'Override coin decimals if needed' })}
                </small>
              </div>

              {/* Toggles */}
              <div className="col-md-6">
                <div className="d-flex align-items-center justify-content-between p-3 border rounded">
                  <div>
                    <h6 className="mb-1">{t('crypto.depositEnabled', { defaultValue: 'Deposit Enabled' })}</h6>
                    <small className="text-muted">{t('crypto.allowDeposits', { defaultValue: 'Allow users to deposit' })}</small>
                  </div>
                  <div className="form-check form-switch form-switch-lg m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="depositEnabled"
                      id="depositEnabled"
                      checked={formData.depositEnabled}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="depositEnabled"></label>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center justify-content-between p-3 border rounded">
                  <div>
                    <h6 className="mb-1">{t('crypto.withdrawEnabled', { defaultValue: 'Withdraw Enabled' })}</h6>
                    <small className="text-muted">{t('crypto.allowWithdrawals', { defaultValue: 'Allow users to withdraw' })}</small>
                  </div>
                  <div className="form-check form-switch form-switch-lg m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="withdrawEnabled"
                      id="withdrawEnabled"
                      checked={formData.withdrawEnabled}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <label className="form-check-label" htmlFor="withdrawEnabled"></label>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.minDepositAmount', { defaultValue: 'Min Deposit Amount' })} <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-lg"
                  id="minDepositAmount"
                  name="minDepositAmount"
                  value={formData.minDepositAmount}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="10"
                />
              </div>

              {/* Deposit Fee */}
              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.depositFee', { defaultValue: 'Deposit Fee' })}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-lg"
                  id="depositFee"
                  name="depositFee"
                  value={formData.depositFee}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.depositConfirmations', { defaultValue: 'Deposit Confirmations' })} <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  id="depositConfirmations"
                  name="depositConfirmations"
                  value={formData.depositConfirmations}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  min="1"
                  placeholder="12"
                />
                <small className="text-muted">
                  {t('crypto.depositConfirmationsHelp', { defaultValue: 'Number of confirmations required' })}
                </small>
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.minWithdrawAmount', { defaultValue: 'Min Withdraw Amount' })} <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-lg"
                  id="minWithdrawAmount"
                  name="minWithdrawAmount"
                  value={formData.minWithdrawAmount}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="20.00"
                />
              </div>

              {/* Max Withdraw Amount */}
              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.maxWithdrawAmount', { defaultValue: 'Max Withdraw Amount' })} <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-lg"
                  id="maxWithdrawAmount"
                  name="maxWithdrawAmount"
                  value={formData.maxWithdrawAmount}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="50000.00"
                />
              </div>

              {/* Withdraw Fee */}
              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.withdrawFee', { defaultValue: 'Withdraw Fee' })} <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-lg"
                  id="withdrawFee"
                  name="withdrawFee"
                  value={formData.withdrawFee}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="5.00"
                />
              </div>

              <div className="col-md-12">
                <label className="form-label">
                  {t('crypto.status', { defaultValue: 'Status' })} <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-lg"
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="active">{t('crypto.statusActive', { defaultValue: 'Active' })}</option>
                  <option value="inactive">{t('crypto.statusInactive', { defaultValue: 'Inactive' })}</option>
                  <option value="maintenance">{t('crypto.statusMaintenance', { defaultValue: 'Maintenance' })}</option>
                </select>
                <small className="text-muted">
                  {t('crypto.statusHelp', { defaultValue: 'Current status of this coin-network pair' })}
                </small>
              </div>
                  </div>

                  {/* Action Buttons */}
                <div className="d-flex gap-2 justify-content-end mt-5">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/admin/crypto/supported')}
                    disabled={loading}
                  >
                    <i className="bx bx-x me-1"></i>
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !formData.coinId || !formData.networkId}
                  >
                    <i className={`bx ${loading ? 'bx-loader-alt bx-spin' : 'bx-save'} me-1`}></i>
                    {loading 
                      ? t('common.saving', { defaultValue: 'Saving...' })
                      : isEdit 
                        ? t('actions.update', { defaultValue: 'Update' })
                        : t('actions.create', { defaultValue: 'Create' })
                    }
                  </button>
                </div>
                </form>
              </div>
            </div>

          {/* Delete Button Card */}
          {isEdit && (
            <div className="card">
              <div className="card-body">
                <h6 className="card-title text-danger mb-3">
                  <i className="bx bx-error-circle me-2"></i>
                  {t('crypto.dangerZone', { defaultValue: 'Danger Zone' })}
                </h6>
                <p className="text-muted mb-3">
                  {t('crypto.deleteSupportedWarning', { defaultValue: 'Once you delete this supported crypto, there is no going back. Please be certain.' })}
                </p>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                >
                  <i className="bx bx-trash me-1"></i>
                  {t('crypto.deleteSupported', { defaultValue: 'Delete Supported Crypto' })}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-danger">
                    <i className="bx bx-error-circle me-2"></i>
                    {t('crypto.errorOccurred', { defaultValue: 'Error Occurred' })}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowErrorModal(false)}
                    disabled={loading}
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
                    {t('actions.ok', { defaultValue: 'OK' })}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      <DeleteConfirmModal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={loading}
        message={t('crypto.deleteSupportedConfirm', { defaultValue: 'Are you sure you want to delete this supported crypto?' })}
        itemName={selectedCoin?.symbol || formData.coinId}
        itemDetails={`on ${selectedNetwork?.symbol || formData.networkId}`}
      />
    </div>
  )
}
