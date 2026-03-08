'use client'

import dynamic from 'next/dynamic'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'
import useCoinNetworkForm from '@/hooks/useCoinNetworkForm'
import CoinSelector from '@/components/crypto/CoinSelector'
import NetworkSelector from '@/components/crypto/NetworkSelector'
import ConfigurationForm from '@/components/crypto/ConfigurationForm'
import Alert from '@/components/ui/Alert'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

const DeleteConfirmModal = dynamic(() => import('@/components/modals/DeleteConfirmModal'), { ssr: false })
const ErrorModal = dynamic(() => import('@/components/modals/ErrorModal'), { ssr: false })

export default function SupportedCryptoForm() {
  const {
    loading,
    error,
    isEdit,
    formData,
    setFormData,
    coins,
    networks,
    selectedCoin,
    selectedNetwork,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showErrorModal,
    setShowErrorModal,
    errorMessage,
    handleChange,
    handleSubmit,
    handleDelete,
    goBack,
    t,
  } = useCoinNetworkForm()

  if (loading && isEdit) {
    return (
      <div className="grow pb-6">
        <div className="text-center py-6">
          <Spinner role="status" className="text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="grow pb-6">
      {/* Header */}
      <AdminBreadcrumb items={[
        { label: t('crypto.coinNetworks', { defaultValue: 'Coin Networks' }), href: '/admin/coin-networks', icon: 'bx-link' },
        { label: isEdit ? t('crypto.editCoinNetwork', { defaultValue: 'Edit Coin-Network' }) : t('crypto.createCoinNetwork', { defaultValue: 'Add Coin-Network' }) },
      ]} />

      {error && (
        <Alert role="alert" className="mb-4">
          <i className="bx bx-error-circle mr-2"></i>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <CoinSelector coins={coins} formData={formData} setFormData={setFormData} isEdit={isEdit} />

          <NetworkSelector networks={networks} formData={formData} setFormData={setFormData} isEdit={isEdit} />

          <ConfigurationForm
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loading={loading}
            isEdit={isEdit}
            onCancel={goBack}
          />
        </div>
      </div>

      <ErrorModal show={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />

      <DeleteConfirmModal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={loading}
        message={t('crypto.deleteCoinNetworkConfirm', {
          defaultValue: 'Are you sure you want to delete this coin-network pair?',
        })}
        itemName={selectedCoin?.symbol || formData.coinId}
        itemDetails={`on ${selectedNetwork?.symbol || formData.networkId}`}
      />
    </div>
  )
}
