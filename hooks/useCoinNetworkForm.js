'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useAuth, useToast } from '@/app/providers';
import {
  getCoinNetworkById,
  createCoinNetwork,
  updateCoinNetwork,
  deleteCoinNetwork,
  getCoins,
  getNetworks,
} from '@/lib/api/admin';
import { logger } from '@/lib/utils/logger';

const DEFAULT_FORM_DATA = {
  coinId: '',
  networkId: '',
  contractAddress: '',
  decimals: '',
  withdrawEnabled: true,
  status: 'active',
};

function mapCoinNetworkToFormData(coinNetwork) {
  return {
    coinId: coinNetwork.coinId?.toString() || '',
    networkId: coinNetwork.networkId?.toString() || '',
    contractAddress: coinNetwork.contractAddress || '',
    decimals: coinNetwork.decimals?.toString() || '',
    withdrawEnabled: coinNetwork.withdrawEnabled ?? true,
    status: coinNetwork.status || 'active',
  };
}

/**
 * Custom hook for coin-network create/edit form logic.
 * Encapsulates data fetching, form state, validation, submit, and delete.
 */
export default function useCoinNetworkForm() {
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const toast = useToast();

  const coinNetworkId = Number(id);
  const isEdit = Boolean(id);
  const hasValidId = Number.isFinite(coinNetworkId) && coinNetworkId > 0;

  /* ── State ── */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [coins, setCoins] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  /* ── Derived ── */
  const selectedCoin = useMemo(() => {
    const selectedCoinId = Number(formData.coinId);
    return coins.find((coin) => coin.id === selectedCoinId);
  }, [coins, formData.coinId]);

  const selectedNetwork = useMemo(() => {
    const selectedNetworkId = Number(formData.networkId);
    return networks.find((network) => network.id === selectedNetworkId);
  }, [networks, formData.networkId]);

  /* ── Data loaders ── */
  const loadCoinsAndNetworks = useCallback(async () => {
    if (!token) return;

    try {
      const [coinsRes, networksRes] = await Promise.all([
        getCoins(token, 1, 100),
        getNetworks(token, 1, 100),
      ]);
      setCoins(coinsRes?.items || []);
      setNetworks(networksRes?.items || []);
    } catch (e) {
      logger.error('Failed to load coins and networks:', e);
    }
  }, [token]);

  const loadCoinNetwork = useCallback(async () => {
    if (!token || !isEdit || !hasValidId) return;

    setLoading(true);
    setError('');

    try {
      const coinNetwork = await getCoinNetworkById(token, coinNetworkId);

      if (coinNetwork) {
        setFormData(mapCoinNetworkToFormData(coinNetwork));
      } else {
        setError('Supported crypto not found');
      }
    } catch (e) {
      setError(e?.message || 'Failed to load supported crypto');
    } finally {
      setLoading(false);
    }
  }, [coinNetworkId, hasValidId, isEdit, token]);

  useEffect(() => {
    loadCoinsAndNetworks();
  }, [loadCoinsAndNetworks]);

  useEffect(() => {
    if (!isEdit) return;
    loadCoinNetwork();
  }, [isEdit, loadCoinNetwork]);

  /* ── Handlers ── */
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function showError(message) {
    setErrorMessage(message);
    setShowErrorModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const coinId = Number(formData.coinId);
      const networkId = Number(formData.networkId);
      const contractAddress = formData.contractAddress.trim();

      if (contractAddress && contractAddress.length > 255) {
        throw new Error(t('crypto.contractAddressTooLong', { defaultValue: 'Contract address must be 255 characters or less' }));
      }

      let data;

      if (isEdit) {
        if (!hasValidId) {
          throw new Error(t('common.invalidId', { defaultValue: 'Invalid ID' }));
        }

        data = {
          withdrawEnabled: formData.withdrawEnabled,
          status: formData.status || 'active',
        };

        await updateCoinNetwork(token, coinNetworkId, data);
        toast.success(t('crypto.updateSuccess', { defaultValue: 'Coin network updated successfully' }));
      } else {
        if (!coinId || !networkId) {
          throw new Error(t('crypto.coinNetworkRequired', { defaultValue: 'Please select coin and network' }));
        }

        data = {
          coinId,
          networkId,
          ...(contractAddress && { contractAddress }),
          ...(formData.decimals && { decimals: Number(formData.decimals) }),
          withdrawEnabled: formData.withdrawEnabled,
          status: formData.status || 'active',
        };

        await createCoinNetwork(token, data);
        toast.success(t('crypto.createSuccess', { defaultValue: 'Coin network created successfully' }));
      }

      router.push('/admin/coin-networks');
    } catch (e) {
      const message = e?.message || (isEdit ? 'Failed to update coin-network' : 'Failed to create coin-network');
      showError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !hasValidId) return;

    setLoading(true);
    setError('');
    setShowDeleteConfirm(false);

    try {
      await deleteCoinNetwork(token, coinNetworkId);
      router.push('/admin/coin-networks');
    } catch (e) {
      const message = e?.message || 'Failed to delete coin-network';
      showError(message);
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    router.push('/admin/coin-networks');
  }

  return {
    // State
    loading,
    error,
    isEdit,
    formData,
    setFormData,
    coins,
    networks,
    selectedCoin,
    selectedNetwork,

    // Modal state
    showDeleteConfirm,
    setShowDeleteConfirm,
    showErrorModal,
    setShowErrorModal,
    errorMessage,

    // Handlers
    handleChange,
    handleSubmit,
    handleDelete,
    goBack,

    // Translation
    t,
  };
}
