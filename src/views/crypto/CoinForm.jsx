import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getCoinById, createCoin, updateCoin, deleteCoin } from '../../api/admin.ts'

export default function CoinForm() {
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
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    decimals: 8,
    isStableCoin: false,
    logoUrl: '',
    status: 'active'
  })

  useEffect(() => {
    if (isEdit && id) {
      loadCoin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadCoin() {
    setLoading(true)
    setError('')
    try {
      const coin = await getCoinById(token, parseInt(id))
      
      if (coin) {
        setFormData({
          symbol: coin.symbol || '',
          name: coin.name || '',
          decimals: coin.decimals || 8,
          isStableCoin: !!coin.isStableCoin,
          logoUrl: coin.logoUrl || '',
          status: coin.status || 'active'
        })
      } else {
        setError('Coin not found')
      }
    } catch (e) {
      setError(e?.message || 'Failed to load coin')
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
      await deleteCoin(token, parseInt(id))
      navigate('/app/crypto/coins')
    } catch (e) {
      const message = e?.message || 'Failed to delete coin'
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
      // Validation
      if (!isEdit) {
        // Create mode - validate required fields
        if (!formData.symbol || formData.symbol.length > 10) {
          throw new Error('Symbol is required and must be max 10 characters')
        }
        if (!formData.name || formData.name.length > 100) {
          throw new Error('Name is required and must be max 100 characters')
        }
        if (formData.decimals < 0 || formData.decimals > 18) {
          throw new Error('Decimals must be between 0 and 18')
        }
      }

      // Validate logoUrl if provided
      if (formData.logoUrl) {
        try {
          new URL(formData.logoUrl)
        } catch {
          throw new Error('Logo URL must be a valid URL')
        }
      }

      const payload = {
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        decimals: parseInt(formData.decimals),
        type: 'native',
        isStableCoin: formData.isStableCoin,
        logoUrl: formData.logoUrl || undefined,
        status: formData.status || 'active'
      }

      if (isEdit) {
        // Update existing coin
        await updateCoin(token, parseInt(id), payload)
      } else {
        // Create new coin
        await createCoin(token, payload)
      }
      
      // Navigate to coins list after success
      navigate('/app/crypto/coins')
    } catch (e) {
      const message = e?.message || (isEdit ? 'Failed to update coin' : 'Failed to create coin')
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
          onClick={() => navigate('/app/crypto/coins')}
        >
          <i className="bx bx-arrow-back"></i>
        </button>
        <div>
          <h4 className="mb-1">
            {isEdit ? t('crypto.editCoin', { defaultValue: 'Edit Coin' }) : t('crypto.createCoin', { defaultValue: 'Create Coin' })}
          </h4>
          <p className="text-muted mb-0">
            {isEdit ? t('crypto.editCoinDesc', { defaultValue: 'Update coin information' }) : t('crypto.createCoinDesc', { defaultValue: 'Add a new cryptocurrency' })}
          </p>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-xl-8">
          <div className="card mb-4">
            <h5 className="card-header">{t('crypto.coinInformation', { defaultValue: 'Coin Information' })}</h5>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger mb-4" role="alert">
                  <i className="bx bx-error-circle me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-4">
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
                      placeholder="BTC"
                      maxLength={10}
                      pattern="[A-Z0-9]+"
                      required
                      disabled={isEdit}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <small className="text-muted">{t('crypto.symbolHelp', { defaultValue: 'Coin ticker symbol (e.g., BTC, ETH)' })}</small>
                  </div>

                  {/* Name */}
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="name">
                      {t('crypto.coinName', { defaultValue: 'Name' })} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Bitcoin"
                      maxLength={100}
                      required
                    />
                    <small className="text-muted">{t('crypto.nameHelp', { defaultValue: 'Full coin name' })}</small>
                  </div>

                  {/* Decimals */}
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="decimals">
                      {t('crypto.decimals', { defaultValue: 'Decimals' })} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      id="decimals"
                      name="decimals"
                      value={formData.decimals}
                      onChange={handleChange}
                      min="0"
                      max="18"
                      required
                    />
                    <small className="text-muted">{t('crypto.decimalsHelp', { defaultValue: 'Number of decimal places (0-18)' })}</small>
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
                    </select>
                  </div>

                  {/* Logo URL */}
                  <div className="col-12">
                    <label className="form-label" htmlFor="logoUrl">
                      {t('crypto.logoUrl', { defaultValue: 'Logo URL' })}
                    </label>
                    <input
                      type="url"
                      className="form-control form-control-lg"
                      id="logoUrl"
                      name="logoUrl"
                      value={formData.logoUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/logo.png"
                    />
                    <small className="text-muted">{t('crypto.logoUrlHelp', { defaultValue: 'External URL to coin logo image' })}</small>
                  </div>

                  {/* Is Stable Coin */}
                  <div className="col-12">
                    <div className="form-check form-check-lg">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isStableCoin"
                        name="isStableCoin"
                        checked={formData.isStableCoin}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="isStableCoin">
                        {t('crypto.isStableCoin', { defaultValue: 'Stablecoin' })}
                      </label>
                    </div>
                    <small className="text-muted ms-4">{t('crypto.isStableCoinHelp', { defaultValue: 'Check if this is a stablecoin (e.g., USDT, USDC)' })}</small>
                  </div>

                  {/* Actions */}
                  <div className="col-12 pt-3">
                    <div className="d-flex gap-3 justify-content-between">
                      {/* Delete button - only show in edit mode */}
                      {isEdit && (
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
                      
                      <div className={`d-flex gap-3 ${!isEdit ? 'ms-auto' : ''}`}>
                        <button 
                          type="button" 
                          className="btn btn-lg btn-label-secondary"
                          onClick={() => navigate('/app/crypto/coins')}
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
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bx bx-error-circle text-danger me-2"></i>
                  {t('crypto.confirmDelete', { defaultValue: 'Confirm Delete' })}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-2">
                  {t('crypto.deleteConfirmMessage', { 
                    defaultValue: 'Are you sure you want to delete this coin?' 
                  })}
                </p>
                <p className="text-muted small mb-0">
                  <strong>{formData.symbol}</strong> - {formData.name}
                </p>
                <div className="alert alert-warning mt-3 mb-0">
                  <i className="bx bx-error-circle me-2"></i>
                  {t('crypto.deleteWarning', { 
                    defaultValue: 'This action cannot be undone.' 
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-label-secondary" 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      {t('actions.deleting', { defaultValue: 'Deleting...' })}
                    </>
                  ) : (
                    <>
                      <i className="bx bx-trash me-2"></i>
                      {t('actions.delete', { defaultValue: 'Delete' })}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
