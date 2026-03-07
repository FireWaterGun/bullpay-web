'use client'

import { useEffect, useState, useCallback } from 'react'
import NextImage from 'next/image'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useAuth } from '@/app/providers'
import { getNetworks } from '@/lib/api/admin'
import TableEmptyState from '@/components/TableEmptyState'
import NetworkEditModal from '@/components/admin/NetworkEditModal'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'

const DEFAULT_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false }

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
    if (!url) {
      resolve(false)
      return
    }
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
  starknet: 'strk',
  opbnb: 'bnb',
  'avalanche c-chain': 'avax',
  'bnb smart chain': 'bsc',
  'arbitrum one': 'arbitrum',
  scroll: 'scroll',
  celo: 'celo',
  'kava evm': 'kava',
  'polkadot asset hub': 'dot',
  ronin: 'ronin',
  sonic: 's',
}

async function findNetworkImage(network) {
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

function NetworkIcon({ network, imageInfo }) {
  if (imageInfo?.url) {
    return (
      <NextImage
        src={imageInfo.url}
        alt={network.symbol || network.name}
        width={28}
        height={28}
        unoptimized
        className="mr-2 object-contain"
      />
    )
  }
  return (
    <div
      className="mr-2 rounded-full flex items-center justify-center font-bold w-7 h-7 text-white text-[0.6rem]"
      style={{
        background: `linear-gradient(135deg, ${getNetworkColor(network.symbol)} 0%, ${getNetworkColor(network.symbol, true)} 100%)`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      title={network.name}
    >
      {(network.symbol || network.name || '?').substring(0, 3)}
    </div>
  )
}

function getStatusBadge(status, t) {
  if (status === 'active') {
    return (
      <Badge color="success" label>
        {t('admin.active', { defaultValue: 'Active' })}
      </Badge>
    )
  }
  if (status === 'maintenance') {
    return (
      <Badge color="warning" label>
        {t('crypto.maintenance', { defaultValue: 'Maintenance' })}
      </Badge>
    )
  }
  return (
    <Badge color="secondary" label>
      {t('crypto.inactive', { defaultValue: 'Inactive' })}
    </Badge>
  )
}

function NetworkRow({ network, imageInfo, t, onEdit }) {
  return (
    <tr>
      <td className="align-middle">
        <div className="flex items-center">
          <NetworkIcon network={network} imageInfo={imageInfo} />
          <span className="font-medium">{network.name || 'N/A'}</span>
        </div>
      </td>
      <td className="text-center align-middle">{network.chainId || 'N/A'}</td>
      <td className="align-middle">
        {network.explorerUrl ? (
          <a href={network.explorerUrl} target="_blank" rel="noopener noreferrer" className="no-underline">
            <i className="bx bx-link-external mr-1"></i>
            {new URL(network.explorerUrl).hostname}
          </a>
        ) : (
          <span className="text-surface-500">N/A</span>
        )}
      </td>
      <td className="text-center align-middle">{getStatusBadge(network.status, t)}</td>
      <td className="text-center align-middle">
        <Button
          title={t('actions.edit', { defaultValue: 'Edit' })}
          onClick={() => onEdit(network.id)}
          variant="text-secondary"
          size="icon-sm"
        >
          <i className="bx bx-edit text-[1rem]"></i>
        </Button>
      </td>
    </tr>
  )
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
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION)
  const [editNetworkId, setEditNetworkId] = useState(null)

  const loadNetworks = useCallback(
    async ({ page = 1, search = '' } = {}) => {
      setLoading(true)
      setError('')
      try {
        const response = await getNetworks(token, page, 10)
        const networkList = response?.items || []
        const pd = response?.pagination || {}

        // Client-side search filtering if search query exists
        const filtered = search
          ? networkList.filter(
              (n) => n.name?.toLowerCase().includes(search.toLowerCase()) || n.chainId?.toString().includes(search)
            )
          : networkList

        setNetworks(filtered)
        setPagination({
          page: pd.page || page,
          limit: pd.limit || 10,
          total: pd.total || filtered.length,
          totalPages: pd.totalPages || 1,
          hasNext: pd.hasNext || false,
          hasPrev: pd.hasPrev || false,
        })

        // Find icons for all networks
        const results = await Promise.all(filtered.map((n) => findNetworkImage(n)))
        const imgMap = {}
        results.forEach((r) => {
          imgMap[r.id] = { url: r.url, type: r.type }
        })
        setNetworkImages(imgMap)
      } catch (e) {
        setError(e?.message || 'Failed to load networks')
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  useEffect(() => {
    loadNetworks()
  }, [loadNetworks])

  function handleApplyFilter() {
    setSearchQuery(draftSearch)
    loadNetworks({ page: 1, search: draftSearch })
  }

  function handleResetFilter() {
    setDraftSearch('')
    setSearchQuery('')
    loadNetworks({ page: 1, search: '' })
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadNetworks({ page: newPage, search: searchQuery })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="grow pb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bx bx-globe mr-2 text-primary"></i>
            {t('crypto.networksList', { defaultValue: 'Networks' })}
          </h4>
          <p className="text-surface-500 mb-0">
            {t('crypto.manageNetworksList', { defaultValue: 'Manage blockchain networks' })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="p-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-full sm:w-auto sm:min-w-[280px] sm:flex-1 sm:max-w-sm">
              <Label>{t('filter.search', { defaultValue: 'Search' })}</Label>
              <Input
                type="text"
                placeholder={t('crypto.searchNetworks', { defaultValue: 'Search by name or chain ID...' })}
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </div>
            <div className="flex gap-2 shrink-0">
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
      </Card>

      <Card>
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
              <th>{t('crypto.networkName', { defaultValue: 'Network' })}</th>
              <th className="text-center">{t('crypto.chainId', { defaultValue: 'Chain ID' })}</th>
              <th>{t('crypto.explorerUrl', { defaultValue: 'Explorer' })}</th>
              <th className="text-center">{t('invoices.statusCol', { defaultValue: 'Status' })}</th>
              <th className="text-center">{t('actions.actions', { defaultValue: 'Actions' })}</th>
            </tr>
          </thead>
          <tbody className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {networks.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                icon="bx-network-chart"
                message={
                  searchQuery
                    ? t('crypto.noNetworksFound', { defaultValue: 'No networks found' })
                    : t('crypto.noNetworks', { defaultValue: 'No networks yet' })
                }
              />
            ) : (
              networks.map((network) => (
                <NetworkRow
                  key={network.id}
                  network={network}
                  imageInfo={networkImages[network.id]}
                  t={t}
                  onEdit={setEditNetworkId}
                />
              ))
            )}
          </tbody>
        </Table>

        {/* Search results info */}
        {!loading && searchQuery && networks.length > 0 && (
          <div className="px-5 py-3 border-t border-surface-200">
            <div className="text-surface-500 text-sm">
              {t('crypto.searchResults', {
                count: networks.length,
                defaultValue: `Found ${networks.length} result(s) in current page`,
              })}
            </div>
          </div>
        )}

        {/* Pagination - hide when searching */}
        {!loading && networks.length > 0 && !searchQuery && (
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            loading={loading}
            className="px-5 py-3 border-t border-surface-200 mt-0"
          />
        )}
      </Card>

      {editNetworkId && (
        <NetworkEditModal
          networkId={editNetworkId}
          onClose={() => setEditNetworkId(null)}
          onSaved={() => loadNetworks({ page: pagination.page, search: searchQuery })}
        />
      )}
    </div>
  )
}
