'use client';

import dynamic from 'next/dynamic';
import useCoinNetworkForm from '@/hooks/useCoinNetworkForm';
import CoinSelector from '@/components/crypto/CoinSelector';
import NetworkSelector from '@/components/crypto/NetworkSelector';
import ConfigurationForm from '@/components/crypto/ConfigurationForm';
import { Alert, Spinner, Button } from '@/components/ui';

const DeleteConfirmModal = dynamic(() => import('@/components/modals/DeleteConfirmModal'), { ssr: false });
const ErrorModal = dynamic(() => import('@/components/modals/ErrorModal'), { ssr: false });

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
  } = useCoinNetworkForm();

  if (loading && isEdit) {
    return (
      <div className="grow py-6">
        <div className="text-center py-6">
          <Spinner role="status" className="text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="grow py-6">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Button variant="outline-secondary" size="icon" className="mr-3" href="/admin/coin-networks">
          <i className="bx bx-arrow-back"></i>
        </Button>
        <div>
          <h4 className="mb-1">
            {isEdit
              ? t('crypto.editCoinNetwork', { defaultValue: 'Edit Coin-Network' })
              : t('crypto.createCoinNetwork', { defaultValue: 'Add Coin-Network' })}
          </h4>
          <p className="text-surface-500 mb-0">
            {isEdit
              ? t('crypto.editCoinNetworkDesc', { defaultValue: 'Update coin-network configuration' })
              : t('crypto.createCoinNetworkDesc', { defaultValue: 'Add a new coin-network pair' })}
          </p>
        </div>
      </div>

      {error && (
        <Alert role="alert" className="mb-4">
          <i className="bx bx-error-circle mr-2"></i>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
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
            onCancel={goBack}
          />
        </div>
      </div>

      <ErrorModal
        show={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

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
  );
}