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
import { useToastContext } from '../../context/ToastContext'

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
  const toast = useToastContext()
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
    withdrawEnabled: true,
    minWithdrawAmount: '',
    maxWithdrawAmount: '',
    withdrawFee: '',
    dailyWithdrawLimitUsd: '',
    status: 'active'
  })
  const [coinNetworkMeta, setCoinNetworkMeta] = useState(null)

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
          withdrawEnabled: coinNetwork.withdrawEnabled ?? true,
          minWithdrawAmount: cleanNumber(coinNetwork.minWithdrawAmount),
          maxWithdrawAmount: cleanNumber(coinNetwork.maxWithdrawAmount),
          withdrawFee: cleanNumber(coinNetwork.withdrawFee),
          dailyWithdrawLimitUsd: cleanNumber(coinNetwork.dailyWithdrawLimitUsd),
          status: coinNetwork.status || 'active'
        })
        setCoinNetworkMeta({
          id: coinNetwork.id,
          tokenStandard: coinNetwork.tokenStandard || null,
          coin: coinNetwork.coin || null,
          network: coinNetwork.network || null,
          createdAt: coinNetwork.createdAt,
          updatedAt: coinNetwork.updatedAt
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

  // DECIMAL(32,18) — crypto amounts: max 14 integer + 18 decimal digits
  const cryptoAmountFields = new Set([
    'minWithdrawAmount', 'maxWithdrawAmount',
    'withdrawFee'
  ])
  // DECIMAL(16,2) — USD amounts: max 14 integer + 2 decimal digits
  const usdAmountFields = new Set(['dailyWithdrawLimitUsd'])

  function handleChange(e) {
    const { name, value, type, checked } = e.target

    // Filter numeric fields: only digits and one dot
    if (cryptoAmountFields.has(name) || usdAmountFields.has(name)) {
      if (value !== '' && !/^\d*\.?\d*$/.test(value)) return
      const maxDec = usdAmountFields.has(name) ? 2 : 18
      const [intPart, decPart] = value.split('.')
      if (intPart && intPart.length > 14) return
      if (decPart !== undefined && decPart.length > maxDec) return
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
      // Validate contract address (1-255 chars if provided)
      if (formData.contractAddress && formData.contractAddress.length > 255) {
        throw new Error(t('crypto.contractAddressTooLong', { defaultValue: 'Contract address must be 255 characters or less' }))
      }

      // Validate crypto amount fields — DECIMAL(32,18): max 14 integer + 18 decimal
      const cryptoFields = ['minWithdrawAmount', 'maxWithdrawAmount', 'withdrawFee']
      const cryptoPattern = /^\d{1,14}(\.\d{1,18})?$/
      for (const field of cryptoFields) {
        if (formData[field] && !cryptoPattern.test(formData[field])) {
          throw new Error(`${field} must be a valid number (max 14 integer digits, max 18 decimal digits)`)
        }
      }
      // Validate USD amount — DECIMAL(16,2): max 14 integer + 2 decimal
      if (formData.dailyWithdrawLimitUsd && !/^\d{1,14}(\.\d{1,2})?$/.test(formData.dailyWithdrawLimitUsd)) {
        throw new Error(t('crypto.invalidDailyLimit', { defaultValue: 'Daily withdraw limit must be a number with max 2 decimal places' }))
      }

      let data
      if (isEdit) {
        // PUT: only send editable fields (contractAddress is not editable via API)
        data = {
          withdrawEnabled: formData.withdrawEnabled,
          ...(formData.minWithdrawAmount && { minWithdrawAmount: formData.minWithdrawAmount }),
          ...(formData.maxWithdrawAmount && { maxWithdrawAmount: formData.maxWithdrawAmount }),
          ...(formData.withdrawFee && { withdrawFee: formData.withdrawFee }),
          ...(formData.dailyWithdrawLimitUsd && { dailyWithdrawLimitUsd: formData.dailyWithdrawLimitUsd }),
          status: formData.status || 'active'
        }
      } else {
        // POST: send all fields including coinId, networkId, decimals
        data = {
          coinId: parseInt(formData.coinId),
          networkId: parseInt(formData.networkId),
          ...(formData.contractAddress && { contractAddress: formData.contractAddress }),
          ...(formData.decimals && { decimals: parseInt(formData.decimals) }),
          withdrawEnabled: formData.withdrawEnabled,
          minWithdrawAmount: formData.minWithdrawAmount,
          maxWithdrawAmount: formData.maxWithdrawAmount,
          withdrawFee: formData.withdrawFee,
          ...(formData.dailyWithdrawLimitUsd && { dailyWithdrawLimitUsd: formData.dailyWithdrawLimitUsd }),
          status: formData.status || 'active'
        }
      }

      if (isEdit) {
        await updateCoinNetwork(token, parseInt(id), data)
        toast.success(t('crypto.updateSuccess', { defaultValue: 'Coin network updated successfully' }))
        navigate('/admin/coin-networks')
      } else {
        await createCoinNetwork(token, data)
        toast.success(t('crypto.createSuccess', { defaultValue: 'Coin network created successfully' }))
        navigate('/admin/coin-networks')
      }
    } catch (e) {
      const message = e?.message || (isEdit ? 'Failed to update coin-network' : 'Failed to create coin-network')
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
      navigate('/admin/coin-networks')
    } catch (e) {
      const message = e?.message || 'Failed to delete coin-network'
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
          onClick={() => navigate('/admin/coin-networks')}
        >
          <i className="bx bx-arrow-back"></i>
        </button>
        <div>
          <h4 className="mb-1">
            {isEdit 
              ? t('crypto.editCoinNetwork', { defaultValue: 'Edit Coin-Network' })
              : t('crypto.createCoinNetwork', { defaultValue: 'Add Coin-Network' })
            }
          </h4>
          <p className="text-muted mb-0">
            {isEdit
              ? t('crypto.editCoinNetworkDesc', { defaultValue: 'Update coin-network configuration' })
              : t('crypto.createCoinNetworkDesc', { defaultValue: 'Add a new coin-network pair' })
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
            {/* Step 1: Select/Display Coin Card */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <span className="badge bg-primary rounded-pill me-2">1</span>
                  {isEdit ? t('crypto.coin', { defaultValue: 'Coin' }) : t('crypto.selectCoin', { defaultValue: 'Select a coin' })}
                  <span className="text-danger ms-1">*</span>
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {(isEdit ? coins.filter(c => c.id === parseInt(formData.coinId)) : coins).map(coin => {
                    const isActive = formData.coinId === String(coin.id)
                    return (
                      <div className="col-6 col-sm-4 col-md-3" key={coin.id}>
                        <div
                          role="button"
                          className={`card h-100 border-2 rounded-3 overflow-hidden ${isActive ? 'border-primary bg-label-primary shadow-sm' : 'border-2'}`}
                          onClick={() => {
                            if (!isEdit) {
                              setFormData(prev => ({
                                ...prev,
                                coinId: String(coin.id)
                              }))
                            }
                          }}
                          style={isEdit ? { cursor: 'default' } : {}}
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

            {/* Step 2: Select/Display Network Card */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <span className="badge bg-primary rounded-pill me-2">2</span>
                  {isEdit ? t('crypto.network', { defaultValue: 'Network' }) : t('crypto.selectNetwork', { defaultValue: 'Select a network' })}
                  <span className="text-danger ms-1">*</span>
                </h5>
              </div>
              <div className="card-body">
                {formData.coinId ? (
                  <div className="d-flex flex-wrap gap-2">
                    {(isEdit ? networks.filter(n => n.id === parseInt(formData.networkId)) : networks).map(network => {
                      const selected = formData.networkId === String(network.id)
                      return (
                        <button
                          type="button"
                          key={network.id}
                          className={`btn ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
                          onClick={() => {
                            if (!isEdit) {
                              setFormData(prev => ({
                                ...prev,
                                networkId: String(network.id)
                              }))
                            }
                          }}
                          style={isEdit ? { cursor: 'default' } : {}}
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
                  disabled={loading || isEdit}
                  min="0"
                  max="18"
                  placeholder="18"
                />
                <small className="text-muted">
                  {isEdit
                    ? t('crypto.decimalsReadOnly', { defaultValue: 'Decimals cannot be changed after creation' })
                    : t('crypto.coinNetworkDecimalsHelp', { defaultValue: 'Override coin decimals if needed' })
                  }
                </small>
              </div>

              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.minWithdrawAmount', { defaultValue: 'Min Withdraw Amount' })}
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="minWithdrawAmount"
                  name="minWithdrawAmount"
                  value={formData.minWithdrawAmount}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="20"
                  pattern="^\d+(\.\d+)?$"
                  maxLength={32}
                />
              </div>

              {/* Max Withdraw Amount */}
              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.maxWithdrawAmount', { defaultValue: 'Max Withdraw Amount' })}
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="maxWithdrawAmount"
                  name="maxWithdrawAmount"
                  value={formData.maxWithdrawAmount}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="50000"
                  pattern="^\d+(\.\d+)?$"
                  maxLength={32}
                />
              </div>

              {/* Withdraw Fee */}
              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.withdrawFee', { defaultValue: 'Withdraw Fee' })}
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="withdrawFee"
                  name="withdrawFee"
                  value={formData.withdrawFee}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="5"
                  pattern="^\d+(\.\d+)?$"
                  maxLength={32}
                />
              </div>

              {/* Daily Withdraw Limit USD */}
              <div className="col-md-6">
                <label className="form-label">
                  {t('crypto.dailyWithdrawLimitUsd', { defaultValue: 'Daily Withdraw Limit (USD)' })}
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="dailyWithdrawLimitUsd"
                  name="dailyWithdrawLimitUsd"
                  value={formData.dailyWithdrawLimitUsd}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="10000.00"
                  pattern="^\d+(\.\d{1,2})?$"
                  maxLength={17}
                />
                <small className="text-muted">
                  {t('crypto.dailyWithdrawLimitUsdHelp', { defaultValue: 'Maximum daily withdrawal limit in USD. Leave empty for no limit.' })}
                </small>
              </div>

              <div className="col-md-6">
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

              {/* Withdraw Toggle */}
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
                  </div>

                  {/* Action Buttons */}
                <div className="d-flex gap-2 justify-content-end mt-5">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/admin/coin-networks')}
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

          {/* Delete Button Card - Hidden */}
          {false && isEdit && (
            <div className="card">
              <div className="card-body">
                <h6 className="card-title text-danger mb-3">
                  <i className="bx bx-error-circle me-2"></i>
                  {t('crypto.dangerZone', { defaultValue: 'Danger Zone' })}
                </h6>
                <p className="text-muted mb-3">
                  {t('crypto.deleteCoinNetworkWarning', { defaultValue: 'Once you delete this coin-network pair, there is no going back. Please be certain.' })}
                </p>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                >
                  <i className="bx bx-trash me-1"></i>
                  {t('crypto.deleteCoinNetwork', { defaultValue: 'Delete Coin-Network' })}
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
        message={t('crypto.deleteCoinNetworkConfirm', { defaultValue: 'Are you sure you want to delete this coin-network pair?' })}
        itemName={selectedCoin?.symbol || formData.coinId}
        itemDetails={`on ${selectedNetwork?.symbol || formData.networkId}`}
      />
    </div>
  )
}
