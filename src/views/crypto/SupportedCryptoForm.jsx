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
import CoinSelector from './CoinSelector'
import NetworkSelector from './NetworkSelector'
import ConfigurationForm from './ConfigurationForm'

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
            <CoinSelector
              coins={coins}
              formData={formData}
              setFormData={setFormData}
              isEdit={isEdit}
            />

            <NetworkSelector
              networks={networks}
              formData={formData}
              setFormData={setFormData}
              isEdit={isEdit}
            />

            <ConfigurationForm
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              loading={loading}
              isEdit={isEdit}
              onCancel={() => navigate('/admin/coin-networks')}
            />

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
