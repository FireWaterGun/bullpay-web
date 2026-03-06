'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';

import { useAuth, useToast } from '@/app/providers';
import { getCoinNetworks } from '@/lib/api/admin';
import CoinImg from '@/components/CoinImg';
import { copyToClipboard as copyText } from '@/lib/utils/clipboard';
import TableEmptyState from '@/components/TableEmptyState';
import { Alert, Badge, Button, Card, Input, Label } from '@/components/ui';
import Pagination from '@/components/ui/Pagination';
import Table from '@/components/ui/Table';

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

function getPaginationState(paginationData, fallbackPage, fallbackLimit) {
  return {
    page: paginationData.page || fallbackPage,
    limit: paginationData.limit || fallbackLimit,
    total: paginationData.total || 0,
    totalPages: paginationData.totalPages || 0,
    hasNext: paginationData.hasNext || false,
    hasPrev: paginationData.hasPrev || false,
  };
}

function getStatusBadge(status, t) {
  if (status === 'active') {
    return {
      color: 'success',
      label: t('admin.active', { defaultValue: 'Active' }),
    };
  }

  if (status === 'maintenance') {
    return {
      color: 'warning',
      label: t('crypto.maintenance', { defaultValue: 'Maintenance' }),
    };
  }

  return {
    color: 'secondary',
    label: t('crypto.inactive', { defaultValue: 'Inactive' }),
  };
}

function CoinNetworkRow({ coinNetwork, t, onCopyContract }) {
  const statusBadge = getStatusBadge(coinNetwork.status, t);

  return (
    <tr key={coinNetwork.id}>
      <td className="align-middle">
        <div className="flex items-center">
          <CoinImg
            coin={coinNetwork.coin}
            symbol={coinNetwork.coin?.symbol}
            networkSymbol={coinNetwork.network?.symbol}
            size={40}
            className="mr-3"
            showFallback
          />
          <div>
            <div className="font-medium">{coinNetwork.coin?.name || 'N/A'}</div>
            <small className="text-surface-500">{coinNetwork.coin?.symbol || 'N/A'}</small>
          </div>
        </div>
      </td>

      <td className="align-middle">
        <div>
          <div className="font-medium">{coinNetwork.network?.name || 'N/A'}</div>
          {coinNetwork.network?.chainId && (
            <small className="text-surface-500">Chain ID: {coinNetwork.network.chainId}</small>
          )}
        </div>
      </td>

      <td className="text-center align-middle">
        {coinNetwork.contractAddress ? (
          <div className="inline-flex items-center gap-2">
            <code className="text-surface-900 text-sm text-xs">{coinNetwork.contractAddress}</code>
            <Button
              onClick={() => onCopyContract(coinNetwork.contractAddress)}
              title={t('actions.copy', { defaultValue: 'Copy' })}
              variant="outline-secondary"
              size="icon"
            >
              <i className="bx bx-copy"></i>
            </Button>
          </div>
        ) : (
          <span className="text-surface-500">{t('admin.detail.native', { defaultValue: 'Native' })}</span>
        )}
      </td>

      <td className="text-center align-middle">
        <Badge color={statusBadge.color} label>
          {statusBadge.label}
        </Badge>
      </td>

      <td className="text-center align-middle">
        <Button
          size="icon"
          href={`/admin/coin-networks/${coinNetwork.id}`}
          title={t('actions.edit', { defaultValue: 'Edit' })}
        >
          <i className="bx bx-edit text-primary text-xl"></i>
        </Button>
      </td>
    </tr>
  );
}

export default function SupportedCrypto() {
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();
  const [coinNetworks, setCoinNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);

  const loadCoinNetworks = useCallback(async ({ page = 1, limit = DEFAULT_PAGINATION.limit, search = '' } = {}) => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await getCoinNetworks(token, page, limit, search, '', '');
      const items = response?.items || [];
      const paginationData = response?.pagination || {};

      setCoinNetworks(items);
      setPagination(getPaginationState(paginationData, page, limit));
    } catch (e) {
      setError(e?.message || 'Failed to load supported crypto');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCoinNetworks({ page: 1, limit: DEFAULT_PAGINATION.limit, search: searchQuery });
  }, [loadCoinNetworks, searchQuery]);

  function handleApplyFilter() {
    const nextSearch = draftSearch.trim();

    if (nextSearch === searchQuery) {
      loadCoinNetworks({ page: 1, limit: pagination.limit, search: nextSearch });
      return;
    }

    setSearchQuery(nextSearch);
  }

  function handleResetFilter() {
    if (!draftSearch && !searchQuery) return;

    setDraftSearch('');

    if (!searchQuery) {
      loadCoinNetworks({ page: 1, limit: pagination.limit, search: '' });
      return;
    }

    setSearchQuery('');
  }

  function handlePageChange(newPage) {
    loadCoinNetworks({ page: newPage, limit: pagination.limit, search: searchQuery });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleCopyContract(contractAddress) {
    const ok = await copyText(contractAddress);
    if (ok) toast.success(t('actions.copied', { defaultValue: 'Copied' }));
  }

  return (
    <div className="grow py-6">
      <Card>
        <div className="px-5 py-4 border-b border-surface-200">
          <div className="flex justify-between items-center flex-wrap gap-3 mb-3">
            <div>
              <h4 className="mb-1">
                <i className="bx bx-link mr-2"></i>
                {t('nav.coinNetworks', { defaultValue: 'Coin Networks' })}
              </h4>
              <p className="text-surface-500 mb-0">{t('crypto.manageCoinNetworks', { defaultValue: 'Manage coin-network pairs' })}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-12 gap-x-6 gap-3 items-end">
            <div className="md:col-span-3 sm:col-span-6">
              <Label>{t('filter.search', { defaultValue: 'Search' })}</Label>
              <Input
                type="text"
                placeholder={t('crypto.searchSupported', { defaultValue: 'Search by coin or network...' })}
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </div>
            <div className="col-auto flex gap-2">
              <Button onClick={handleApplyFilter} disabled={loading}>
                <i className="bx bx-filter-alt mr-1"></i>
                {t('filter.apply', { defaultValue: 'Apply Filters' })}
              </Button>
              <Button onClick={handleResetFilter} disabled={loading} variant="outline-secondary">
                <i className="bx bx-reset mr-1"></i>
                {t('filter.reset', { defaultValue: 'Reset' })}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-5">
            <Alert role="alert" className="mb-0">
              <i className="bx bx-error-circle mr-2"></i>
              {error}
            </Alert>
          </div>
        )}

        {/* Table */}
        <Table>
          <thead>
            <tr>
              <th>{t('crypto.coinName', { defaultValue: 'Coin' })}</th>
              <th>{t('crypto.networkName', { defaultValue: 'Network' })}</th>
              <th className="text-center">{t('crypto.contractAddress', { defaultValue: 'Contract Address' })}</th>
              <th className="text-center">{t('invoices.statusCol', { defaultValue: 'Status' })}</th>
              <th className="text-center">{t('actions.actions', { defaultValue: 'Actions' })}</th>
            </tr>
          </thead>
          <tbody className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {coinNetworks.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                icon="bx-coin-stack"
                message={searchQuery
                  ? t('crypto.noSupportedFound', { defaultValue: 'No supported crypto found' })
                  : t('crypto.noSupported', { defaultValue: 'No supported crypto yet' })}
              />
            ) : (
              coinNetworks.map((coinNetwork) => (
                <CoinNetworkRow
                  key={coinNetwork.id}
                  coinNetwork={coinNetwork}
                  t={t}
                  onCopyContract={handleCopyContract}
                />
              ))
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-surface-200">
            <Pagination pagination={pagination} onPageChange={handlePageChange} loading={loading} className="mt-0" />
          </div>
        )}
      </Card>
    </div>
  );
}