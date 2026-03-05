'use client';

import { useEffect, useState } from 'react';

import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useAuth } from '@/app/providers';
import { getNetworks } from '@/lib/api/admin';
import TableEmptyState from '@/components/TableEmptyState';
import { Alert, Badge, Button, Card, Input, Label } from '../../../../components/ui';

// Network color mapping for gradient badges
function getNetworkColor(symbol, darker = false) {
  const colors = {
    BTC: darker ? '#E17F00' : '#F7931A',
    ETH: darker ? '#5F7AA0' : '#627EEA',
    BNB: darker ? '#D4A000' : '#F3BA2F',
    POL: darker ? '#6B21A8' : '#8247E5',
    SOL: darker ? '#8C3FD9' : '#9945FF',
    TRX: darker ? '#C91E1E' : '#FF060A',
    AVAX: darker ? '#C22E2E' : '#E84142',
    ARB: darker ? '#1F4FA0' : '#2D374B',
    BASE: darker ? '#0040C8' : '#0052FF',
    OP: darker ? '#CC0000' : '#FF0420',
    MANTA: darker ? '#1A1A2E' : '#2A2A4A'
  };
  return colors[symbol?.toUpperCase()] || (darker ? '#6366F1' : '#818CF8');
}

function tryLoadImage(url) {
  return new Promise((resolve) => {
    if (!url) {resolve(false);return;}
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Manual mapping: network symbol or name → icon filename (without extension)
const NETWORK_ICON_MAP = {
  'bitcoin segwit': 'segwit',
  'lightning network': 'btc',
  'zksync era': 'zk',
  'starknet': 'strk',
  'opbnb': 'bnb',
  'avalanche c-chain': 'avax',
  'bnb smart chain': 'bsc',
  'arbitrum one': 'arbitrum',
  'scroll': 'scroll',
  'celo': 'celo',
  'kava evm': 'kava',
  'polkadot asset hub': 'dot',
  'ronin': 'ronin',
  'sonic': 's'
};

async function findNetworkImage(network) {
  // Try logoUrl from API first
  if (network.logoUrl) {
    if (await tryLoadImage(network.logoUrl)) return { id: network.id, url: network.logoUrl, type: 'remote' };
  }
  const symbol = (network.symbol || '').toLowerCase();
  const name = (network.name || '').toLowerCase();
  const nameNoSpaces = name.replace(/\s+/g, '');
  const mapped = NETWORK_ICON_MAP[name];
  const candidates = [...new Set([mapped, symbol, nameNoSpaces].filter(Boolean))];
  for (const key of candidates) {
    for (const ext of ['svg', 'png']) {
      const url = `/assets/img/coins/${key}.${ext}`;
      if (await tryLoadImage(url)) return { id: network.id, url, type: 'local' };
    }
  }
  return { id: network.id, url: null, type: 'gradient' };
}

export default function NetworkList() {
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [networkImages, setNetworkImages] = useState({});
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
    loadNetworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApplyFilter() {
    setSearchQuery(draftSearch);
    loadNetworks(1, draftSearch);
  }

  function handleResetFilter() {
    setDraftSearch('');
    setSearchQuery('');
    loadNetworks(1, '');
  }

  async function loadNetworks(page = pagination.page, search = searchQuery) {
    setLoading(true);
    setError('');
    try {
      // Use server-side pagination
      const response = await getNetworks(token, page, 10);
      const networkList = response?.items || [];
      const paginationData = response?.pagination || {};

      // Client-side search filtering if search query exists
      let filtered = networkList;
      if (search) {
        filtered = networkList.filter((network) =>
        network.name?.toLowerCase().includes(search.toLowerCase()) ||
        network.chainId?.toString().includes(search)
        );
      }

      setNetworks(filtered);
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || 10,
        total: paginationData.total || filtered.length,
        totalPages: paginationData.totalPages || 1,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false
      });

      // Find icons for all networks
      const results = await Promise.all(filtered.map((n) => findNetworkImage(n)));
      const imgMap = {};
      results.forEach((r) => {imgMap[r.id] = { url: r.url, type: r.type };});
      setNetworkImages(imgMap);
    } catch (e) {
      setError(e?.message || 'Failed to load networks');
    } finally {
      setLoading(false);
    }
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadNetworks(newPage);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <div className="grow py-6">
      <Card>
        <div className="px-5 py-4 border-b border-surface-200">
          {/* Header */}
          <div className="flex justify-between items-center flex-wrap gap-3 mb-3">
            <div>
              <h4 className="mb-1">
                <i className="bx bx-globe mr-2"></i>
                {t('crypto.networksList', { defaultValue: 'Networks' })}
              </h4>
              <p className="text-muted mb-0">{t('crypto.manageNetworksList', { defaultValue: 'Manage blockchain networks' })}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-12 gap-x-6 gap-3 items-end">
            <div className="md:col-span-3 sm:col-span-6">
              <Label>{t('filter.search', { defaultValue: 'Search' })}</Label>
              <Input
                type="text"

                placeholder={t('crypto.searchNetworks', { defaultValue: 'Search by name or chain ID...' })}
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>{t('crypto.networkName', { defaultValue: 'Network' })}</th>
                <th className="text-center">{t('crypto.chainId', { defaultValue: 'Chain ID' })}</th>
                <th>{t('crypto.explorerUrl', { defaultValue: 'Explorer' })}</th>
                <th className="text-center">{t('invoices.statusCol', { defaultValue: 'Status' })}</th>
                <th className="text-center">{t('actions.actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              {networks.length === 0 ?
              <TableEmptyState
                colSpan={5}
                icon="bx-network-chart"
                message={searchQuery ?
                t('crypto.noNetworksFound', { defaultValue: 'No networks found' }) :
                t('crypto.noNetworks', { defaultValue: 'No networks yet' })
                } /> :


              networks.map((network) =>
              <tr key={network.id}>
                    <td className="align-middle">
                      <div className="flex items-center">
                        {networkImages[network.id]?.url ?
                    <img
                      src={networkImages[network.id].url}
                      alt={network.symbol || network.name}
                      width="40"
                      height="40"
                      className="mr-3 object-contain" /> :



                    <div
                      className="mr-3 rounded-full flex items-center justify-center font-bold w-10 h-10 text-white text-xs"
                      style={{ background: `linear-gradient(135deg, ${getNetworkColor(network.symbol)} 0%, ${getNetworkColor(network.symbol, true)} 100%)`, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                      title={network.name}>
                      
                            {(network.symbol || network.name || '?').substring(0, 3)}
                          </div>
                    }
                        <span className="font-medium">{network.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="text-center align-middle">
                      {network.chainId || 'N/A'}
                    </td>
                    <td className="align-middle">
                      {network.explorerUrl ?
                  <a
                    href={network.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline">
                    
                          <i className="bx bx-link-external mr-1"></i>
                          {new URL(network.explorerUrl).hostname}
                        </a> :

                  <span className="text-muted">N/A</span>
                  }
                    </td>
                    <td className="text-center align-middle">
                      <Badge color={network.status === 'active' ? 'success' :
                  network.status === 'maintenance' ? 'warning' :
                  'secondary'} label>
                    
                        {network.status === 'active' ?
                    t('admin.active', { defaultValue: 'Active' }) :
                    network.status === 'maintenance' ?
                    t('crypto.maintenance', { defaultValue: 'Maintenance' }) :
                    t('crypto.inactive', { defaultValue: 'Inactive' })
                    }
                      </Badge>
                    </td>
                    <td className="text-center align-middle">
                      <Button size="icon"
                  href={`/admin/networks/${network.id}`}

                  title={t('actions.edit', { defaultValue: 'Edit' })}>
                    
                        <i className="bx bx-edit text-primary text-xl"></i>
                      </Button>
                    </td>
                  </tr>
              )
              }
            </tbody>
          </table>
        </div>

        {/* Search results info */}
        {!loading && searchQuery && networks.length > 0 &&
        <div className="px-5 py-3 border-t border-surface-200">
            <div className="text-muted text-sm">
              {t('crypto.searchResults', {
              count: networks.length,
              defaultValue: `Found ${networks.length} result(s) in current page`
            })}
            </div>
          </div>
        }

        {/* Pagination - hide when searching */}
        {!loading && networks.length > 0 && !searchQuery &&
        <div className="px-5 py-3 border-t border-surface-200 flex justify-between items-center">
            <div className="text-muted text-sm">
              {t('invoices.showingEntries', {
              start: pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
              defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
            })}
            </div>
            <div className="inline-flex rounded-lg shadow-sm">
              <Button

              disabled={!pagination.hasPrev || loading}
              onClick={() => handlePageChange(pagination.page - 1)} variant="outline-secondary" size="sm">
              
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </Button>
              <Button

              disabled variant="outline-secondary" size="sm">
              
                {pagination.page} / {pagination.totalPages}
              </Button>
              <Button

              disabled={!pagination.hasNext || loading}
              onClick={() => handlePageChange(pagination.page + 1)} variant="outline-secondary" size="sm">
              
                {t('actions.next', { defaultValue: 'Next' })}
                <i className="bx bx-chevron-right"></i>
              </Button>
            </div>
          </div>
        }
      </Card>
    </div>);

}