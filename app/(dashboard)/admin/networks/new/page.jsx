'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useAuth } from '@/app/providers'
import { getNetworkById, createNetwork, updateNetwork, deleteNetwork } from '@/lib/api/admin'
const DeleteConfirmModal = dynamic(() => import('@/components/modals/DeleteConfirmModal'), { ssr: false })
import { useToast } from '@/app/providers'
import NetworkFormFields from '@/components/crypto/NetworkFormFields'
import NetworkInfoPanel from '@/components/crypto/NetworkInfoPanel'
import { validateAndBuildPayload } from '@/components/crypto/networkFormValidation'

export default function NetworkForm() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const toast = useToast()
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
      router.push('/admin/networks')
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
      router.push('/admin/networks')
    } catch (e) {
      const message = e?.message || (isEdit ? 'Failed to update network' : 'Failed to create network')
      setErrorMessage(message)
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    router.push('/admin/networks')
  }

  if (loading && isEdit) {
    return (
      <div className="grow py-6">
        <div className="text-center py-6">
          <div className="spinner text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-2">{t('common.loading', { defaultValue: 'Loading...' })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grow py-6">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Link
          href="/admin/networks"
          className="btn btn-icon btn bg-surface-100 text-surface-700 hover:bg-surface-200 shadow-none mr-3"
        >
          <i className="bx bx-arrow-back"></i>
        </Link>
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

      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 xl:col-span-8">
          <div className="card mb-4">
            <h5 className="px-5 py-4 border-b border-surface-200">{t('crypto.networkInformation', { defaultValue: 'Network Information' })}</h5>
            <div className="p-5">
              {error && (
                <div className="alert alert-danger mb-4" role="alert">
                  <i className="bx bx-error-circle mr-2"></i>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowErrorModal(false)}>
          <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-xl">
              <div className="flex items-center justify-between p-5 border-b border-surface-200">
                <h5 className="text-lg font-semibold text-surface-800">
                  {t('crypto.operationFailed', { defaultValue: 'Operation Failed' })}
                </h5>
                <button
                  type="button"
                  className="cursor-pointer text-surface-500 hover:text-surface-700"
                  onClick={() => setShowErrorModal(false)}
                ></button>
              </div>
              <div className="p-5">
                <p className="mb-0">{errorMessage}</p>
              </div>
              <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
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
