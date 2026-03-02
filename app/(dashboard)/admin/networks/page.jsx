'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useAuth } from '@/app/providers'
import { getNetworks } from '@/lib/api/admin'

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
    MANTA: darker ? '#1A1A2E' : '#2A2A4A',
  }
  return colors[symbol?.toUpperCase()] || (darker ? '#6366F1' : '#818CF8')
}

function tryLoadImage(url) {
  return new Promise((resolve) => {
    if (!url) { resolve(false); return }
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
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
  'sonic': 's',
}

async function findNetworkImage(network) {
  // Try logoUrl from API first
  if (network.logoUrl) {
    if (await tryLoadImage(network.logoUrl)) return { id: network.id, url: network.logoUrl, type: 'remote' }
  }
  const symbol = (network.symbol || '').toLowerCase()
  const name = (network.name || '').toLowerCase()
  const nameNoSpaces = name.replace(/\s+/g, '')
  const mapped = NETWORK_ICON_MAP[name]
  const candidates = [...new Set([mapped, symbol, nameNoSpaces].filter(Boolean))]
  for (const key of candidates) {
    for (const ext of ['svg', 'png']) {
      const url = `/assets/img/coins/${key}.${ext}`
      if (await tryLoadImage(url)) return { id: network.id, url, type: 'local' }
    }
  }
  return { id: network.id, url: null, type: 'gradient' }
}

export default function NetworkList() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const [networks, setNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [networkImages, setNetworkImages] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [draftSearch, setDraftSearch] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  useEffect(() => {
    loadNetworks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleApplyFilter() {
    setSearchQuery(draftSearch)
    loadNetworks(1, draftSearch)
  }

  function handleResetFilter() {
    setDraftSearch('')
    setSearchQuery('')
    loadNetworks(1, '')
  }

  async function loadNetworks(page = pagination.page, search = searchQuery) {
    setLoading(true)
    setError('')
    try {
      // Use server-side pagination
      const response = await getNetworks(token, page, 10)
      const networkList = response?.items || []
      const paginationData = response?.pagination || {}
      
      // Client-side search filtering if search query exists
      let filtered = networkList
      if (search) {
        filtered = networkList.filter(network => 
          network.name?.toLowerCase().includes(search.toLowerCase()) ||
          network.chainId?.toString().includes(search)
        )
      }

      setNetworks(filtered)
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || 10,
        total: paginationData.total || filtered.length,
        totalPages: paginationData.totalPages || 1,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false
      })

      // Find icons for all networks
      const results = await Promise.all(filtered.map(n => findNetworkImage(n)))
      const imgMap = {}
      results.forEach(r => { imgMap[r.id] = { url: r.url, type: r.type } })
      setNetworkImages(imgMap)
    } catch (e) {
      setError(e?.message || 'Failed to load networks')
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadNetworks(newPage)
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card">
        <div className="card-header">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div>
              <h4 className="mb-1">
                <i className="bx bx-globe me-2"></i>
                {t('crypto.networksList', { defaultValue: 'Networks' })}
              </h4>
              <p className="text-muted mb-0">{t('crypto.manageNetworksList', { defaultValue: 'Manage blockchain networks' })}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="row g-3 align-items-end">
            <div className="col-md-3 col-sm-6">
              <label className="form-label">{t('filter.search', { defaultValue: 'Search' })}</label>
              <input
                type="text"
                className="form-control"
                placeholder={t('crypto.searchNetworks', { defaultValue: 'Search by name or chain ID...' })}
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </div>
            <div className="col-auto d-flex gap-2">
              <button className="btn btn-primary" onClick={handleApplyFilter} disabled={loading}>
                <i className="bx bx-filter-alt me-1"></i>
                {t('filter.apply', { defaultValue: 'Apply Filters' })}
              </button>
              <button className="btn btn-outline-secondary" onClick={handleResetFilter} disabled={loading}>
                <i className="bx bx-reset me-1"></i>
                {t('filter.reset', { defaultValue: 'Reset' })}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="card-body">
            <div className="alert alert-danger mb-0" role="alert">
              <i className="bx bx-error-circle me-2"></i>
              {error}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="table-responsive">
          <table className="table table-hover">
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
              {networks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6">
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <i className="bx bx-network-chart mb-3" style={{ fontSize: '3rem', color: '#a1acb8' }}></i>
                      <p className="text-muted mb-0">
                        {searchQuery 
                          ? t('crypto.noNetworksFound', { defaultValue: 'No networks found' })
                          : t('crypto.noNetworks', { defaultValue: 'No networks yet' })
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                networks.map((network) => (
                  <tr key={network.id}>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div className="d-flex align-items-center">
                        {networkImages[network.id]?.url ? (
                          <img
                            src={networkImages[network.id].url}
                            alt={network.symbol || network.name}
                            width="32"
                            height="32"
                            className="me-3"
                            style={{ objectFit: 'contain' }}
                          />
                        ) : (
                          <div
                            className="me-3 rounded-circle d-flex align-items-center justify-content-center fw-bold"
                            style={{
                              width: 32,
                              height: 32,
                              background: `linear-gradient(135deg, ${getNetworkColor(network.symbol)} 0%, ${getNetworkColor(network.symbol, true)} 100%)`,
                              color: 'white',
                              fontSize: '0.75rem',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            }}
                            title={network.name}
                          >
                            {(network.symbol || network.name || '?').substring(0, 3)}
                          </div>
                        )}
                        <span className="fw-medium">{network.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      {network.chainId || 'N/A'}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      {network.explorerUrl ? (
                        <a 
                          href={network.explorerUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                        >
                          <i className="bx bx-link-external me-1"></i>
                          {new URL(network.explorerUrl).hostname}
                        </a>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      <span className={`badge bg-label-${
                        network.status === 'active' ? 'success' : 
                        network.status === 'maintenance' ? 'warning' : 
                        'secondary'
                      }`}>
                        {network.status === 'active' 
                          ? t('admin.active', { defaultValue: 'Active' })
                          : network.status === 'maintenance'
                          ? t('crypto.maintenance', { defaultValue: 'Maintenance' })
                          : t('crypto.inactive', { defaultValue: 'Inactive' })
                        }
                      </span>
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      <Link
                        href={`/admin/networks/${network.id}`}
                        className="btn btn-sm btn-icon"
                        title={t('actions.edit', { defaultValue: 'Edit' })}
                      >
                        <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Search results info */}
        {!loading && searchQuery && networks.length > 0 && (
          <div className="card-footer">
            <div className="text-muted small">
              {t('crypto.searchResults', { 
                count: networks.length,
                defaultValue: `Found ${networks.length} result(s) in current page`
              })}
            </div>
          </div>
        )}

        {/* Pagination - hide when searching */}
        {!loading && networks.length > 0 && !searchQuery && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              {t('invoices.showingEntries', {
                start: pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0,
                end: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total,
                defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
              })}
            </div>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={!pagination.hasPrev || loading}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled
              >
                {pagination.page} / {pagination.totalPages}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={!pagination.hasNext || loading}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                {t('actions.next', { defaultValue: 'Next' })}
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
