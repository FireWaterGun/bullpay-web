'use client';

import { useEffect, useState } from 'react';

import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useAuth } from '@/app/providers';
import { getCoins } from '@/lib/api/admin';
import CoinImg from '@/components/CoinImg';
import TableEmptyState from '@/components/TableEmptyState';
import { Alert, Badge, Button, Card, Input, Label } from '@/components/ui';
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table';

export default function CoinList() {
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    loadCoins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApplyFilter() {
    setSearchQuery(draftSearch);
    loadCoins(1, pagination.limit, draftSearch);
  }

  function handleResetFilter() {
    setDraftSearch('');
    setSearchQuery('');
    loadCoins(1, pagination.limit, '');
  }

  async function loadCoins(page = pagination.page, limit = pagination.limit, search = searchQuery) {
    setLoading(true);
    setError('');
    try {
      const response = await getCoins(token, page, limit, search);
      const coinList = response?.items || [];
      const paginationData = response?.pagination || {};

      setCoins(coinList);
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 0,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false
      });

    } catch (e) {
      setError(e?.message || 'Failed to load coins');
    } finally {
      setLoading(false);
    }
  }

  function handlePageChange(newPage) {
    loadCoins(newPage, pagination.limit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="grow py-6">
      <Card>
        <div className="px-5 py-4 border-b border-surface-200">
          <div className="flex justify-between items-center flex-wrap gap-3 mb-3">
            <div>
              <h4 className="mb-1">
                <i className="bx bx-coin mr-2"></i>
                {t('nav.coins', { defaultValue: 'Coins' })}
              </h4>
              <p className="text-surface-500 mb-0">{t('crypto.manageCoinsList', { defaultValue: 'Manage cryptocurrency coins' })}</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-12 gap-x-6 gap-3 items-end">
            <div className="md:col-span-3 sm:col-span-6">
              <Label>{t('filter.search', { defaultValue: 'Search' })}</Label>
              <Input
                type="text"

                placeholder={t('crypto.searchCoins', { defaultValue: 'Search by name or symbol...' })}
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()} />
              
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
        {error &&
        <div className="p-5">
            <Alert role="alert" className="mb-0">
              <i className="bx bx-error-circle mr-2"></i>
              {error}
            </Alert>
          </div>
        }

        {/* Table */}
        <Table>
            <thead>
              <tr>
                <th>{t('crypto.coinName', { defaultValue: 'Coin' })}</th>
                <th>{t('crypto.symbol', { defaultValue: 'Symbol' })}</th>
                <th className="text-center">{t('crypto.type', { defaultValue: 'Type' })}</th>
                <th className="text-center">{t('crypto.decimals', { defaultValue: 'Decimals' })}</th>
                <th className="text-center">{t('invoices.statusCol')}</th>
                <th className="text-center">{t('invoices.actions')}</th>
              </tr>
            </thead>
            <tbody className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              {coins.length === 0 ?
              <TableEmptyState
                colSpan={6}
                icon="bx-coin"
                message={searchQuery ?
                t('crypto.noSearchResults', { defaultValue: 'No coins found matching your search' }) :
                t('crypto.noCoins', { defaultValue: 'No coins found' })
                } /> :


              coins.map((coin) =>
              <tr key={coin.id}>
                    <td className="align-middle">
                      <div className="flex items-center">
                        <CoinImg
                      symbol={coin.symbol}
                      logoUrl={coin.logoUrl}
                      size={40}
                      className="mr-3"
                      showFallback />
                    
                        <div>
                          <div className="font-medium">{coin.name || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle">
                      <span className="font-medium">{coin.symbol}</span>
                    </td>
                    <td className="text-center align-middle">
                      {coin.type === 'native' ?
                  t('crypto.native', { defaultValue: 'Native' }) :
                  t('crypto.token', { defaultValue: 'Token' })
                  }
                    </td>
                    <td className="text-center align-middle">{coin.decimals || 0}</td>
                    <td className="text-center align-middle">
                      {coin.status === 'active' ?
                  <Badge className="bg-green-50 text-green-700">{t('admin.active')}</Badge> :

                  <Badge className="bg-surface-100 text-surface-600">{coin.status}</Badge>
                  }
                    </td>
                    <td className="text-center align-middle">
                      <Button size="icon"
                  href={`/admin/coins/${coin.id}`}

                  title={t('actions.edit', { defaultValue: 'Edit' })}>
                    
                        <i className="bx bx-edit text-primary text-xl"></i>
                      </Button>
                    </td>
                  </tr>
              )
              }
            </tbody>
          </Table>

        {/* Pagination */}
        {!error && coins.length > 0 &&
          <Pagination pagination={pagination} onPageChange={handlePageChange} loading={loading} className="px-5 py-3 border-t border-surface-200 mt-0" />
        }
      </Card>
    </div>);

}