import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getNetworkById, createNetwork, updateNetwork, deleteNetwork } from '../../api/admin.ts'
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal'
import { useToastContext } from '../../context/ToastContext'
import NetworkFormFields from './NetworkFormFields'
import NetworkInfoPanel from './NetworkInfoPanel'
import { validateAndBuildPayload } from './networkFormValidation'

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
      const payload = validateAndBuildPayload(formData, isEdit)

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

  function handleCancel() {
    navigate('/admin/networks')
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
          onClick={handleCancel}
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
                <NetworkFormFields
                  formData={formData}
                  handleChange={handleChange}
                  isEdit={isEdit}
                  loading={loading}
                  onCancel={handleCancel}
                />
              </form>
            </div>
          </div>
        </div>
        {/* Read-only info panel (edit mode only) */}
        {isEdit && networkMeta && (
          <NetworkInfoPanel networkMeta={networkMeta} />
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
