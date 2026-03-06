'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';

import dynamic from 'next/dynamic';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useAuth } from '@/app/providers';
import {
  getCoinNetworkById,
  createCoinNetwork,
  updateCoinNetwork,
  deleteCoinNetwork,
  getCoins,
  getNetworks } from
'@/lib/api/admin';
const DeleteConfirmModal = dynamic(() => import('@/components/modals/DeleteConfirmModal'), { ssr: false });
const ErrorModal = dynamic(() => import('@/components/modals/ErrorModal'), { ssr: false });
import { useToast } from '@/app/providers';
import CoinSelector from '@/components/crypto/CoinSelector';
import NetworkSelector from '@/components/crypto/NetworkSelector';
import ConfigurationForm from '@/components/crypto/ConfigurationForm';
import { logger } from '@/lib/utils/logger';
import { Alert, Spinner, Button } from '@/components/ui';

export default function SupportedCryptoForm() {
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const toast = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [coins, setCoins] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [formData, setFormData] = useState({
    coinId: '',
    networkId: '',
    contractAddress: '',
    decimals: '',
    withdrawEnabled: true,
    status: 'active'
  });
  const [coinNetworkMeta, setCoinNetworkMeta] = useState(null);

  const selectedCoin = useMemo(() => {
    return coins.find((c) => c.id === parseInt(formData.coinId));
  }, [coins, formData.coinId]);

  const selectedNetwork = useMemo(() => {
    return networks.find((n) => n.id === parseInt(formData.networkId));
  }, [networks, formData.networkId]);

  useEffect(() => {
    loadCoinsAndNetworks();
    if (isEdit && id) {
      loadCoinNetwork();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadCoinsAndNetworks() {
    try {
      const [coinsRes, networksRes] = await Promise.all([
      getCoins(token, 1, 100),
      getNetworks(token, 1, 100)]
      );
      setCoins(coinsRes?.items || []);
      setNetworks(networksRes?.items || []);
    } catch (e) {
      logger.error('Failed to load coins and networks:', e);
    }
  }

  async function loadCoinNetwork() {
    setLoading(true);
    setError('');
    try {
      const coinNetwork = await getCoinNetworkById(token, parseInt(id));

      if (coinNetwork) {
        setFormData({
          coinId: coinNetwork.coinId?.toString() || '',
          networkId: coinNetwork.networkId?.toString() || '',
          contractAddress: coinNetwork.contractAddress || '',
          decimals: coinNetwork.decimals?.toString() || '',
          withdrawEnabled: coinNetwork.withdrawEnabled ?? true,
          status: coinNetwork.status || 'active'
        });
        setCoinNetworkMeta({
          id: coinNetwork.id,
          tokenStandard: coinNetwork.tokenStandard || null,
          coin: coinNetwork.coin || null,
          network: coinNetwork.network || null,
          createdAt: coinNetwork.createdAt,
          updatedAt: coinNetwork.updatedAt
        });
      } else {
        setError('Supported crypto not found');
      }
    } catch (e) {
      setError(e?.message || 'Failed to load supported crypto');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate contract address (1-255 chars if provided)
      if (formData.contractAddress && formData.contractAddress.length > 255) {
        throw new Error(t('crypto.contractAddressTooLong', { defaultValue: 'Contract address must be 255 characters or less' }));
      }

      let data;
      if (isEdit) {
        // PUT: only send editable fields
        data = {
          withdrawEnabled: formData.withdrawEnabled,
          status: formData.status || 'active'
        };
      } else {
        // POST: send all fields including coinId, networkId, decimals
        data = {
          coinId: parseInt(formData.coinId),
          networkId: parseInt(formData.networkId),
          ...(formData.contractAddress && { contractAddress: formData.contractAddress }),
          ...(formData.decimals && { decimals: parseInt(formData.decimals) }),
          withdrawEnabled: formData.withdrawEnabled,
          status: formData.status || 'active'
        };
      }

      if (isEdit) {
        await updateCoinNetwork(token, parseInt(id), data);
        toast.success(t('crypto.updateSuccess', { defaultValue: 'Coin network updated successfully' }));
        router.push('/admin/coin-networks');
      } else {
        await createCoinNetwork(token, data);
        toast.success(t('crypto.createSuccess', { defaultValue: 'Coin network created successfully' }));
        router.push('/admin/coin-networks');
      }
    } catch (e) {
      const message = e?.message || (isEdit ? 'Failed to update coin-network' : 'Failed to create coin-network');
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !id) return;

    setLoading(true);
    setError('');
    setShowDeleteConfirm(false);

    try {
      await deleteCoinNetwork(token, parseInt(id));
      router.push('/admin/coin-networks');
    } catch (e) {
      const message = e?.message || 'Failed to delete coin-network';
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading && isEdit) {
    return (
      <div className="grow py-6">
        <div className="text-center py-6">
          <Spinner role="status" className="text-primary" />

          
        </div>
      </div>);

  }

  return (
    <div className="grow py-6">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Button variant="outline-secondary" size="icon" className="mr-3"
        href="/admin/coin-networks">
          
          
          <i className="bx bx-arrow-back"></i>
        </Button>
        <div>
          <h4 className="mb-1">
            {isEdit ?
            t('crypto.editCoinNetwork', { defaultValue: 'Edit Coin-Network' }) :
            t('crypto.createCoinNetwork', { defaultValue: 'Add Coin-Network' })
            }
          </h4>
          <p className="text-surface-500 mb-0">
            {isEdit ?
            t('crypto.editCoinNetworkDesc', { defaultValue: 'Update coin-network configuration' }) :
            t('crypto.createCoinNetworkDesc', { defaultValue: 'Add a new coin-network pair' })
            }
          </p>
        </div>
      </div>

      {error &&
      <Alert role="alert" className="mb-4">
          <i className="bx bx-error-circle mr-2"></i>
          {error}
        </Alert>
      }

      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
            <CoinSelector
            coins={coins}
            formData={formData}
            setFormData={setFormData}
            isEdit={isEdit} />
          

            <NetworkSelector
            networks={networks}
            formData={formData}
            setFormData={setFormData}
            isEdit={isEdit} />
          

            <ConfigurationForm
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loading={loading}
            isEdit={isEdit}
            onCancel={() => router.push('/admin/coin-networks')} />
          

          {/* Delete Button Card - Hidden */}
        </div>
      </div>

      <ErrorModal
        show={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage} />
      

      <DeleteConfirmModal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={loading}
        message={t('crypto.deleteCoinNetworkConfirm', { defaultValue: 'Are you sure you want to delete this coin-network pair?' })}
        itemName={selectedCoin?.symbol || formData.coinId}
        itemDetails={`on ${selectedNetwork?.symbol || formData.networkId}`} />
      
    </div>);

}