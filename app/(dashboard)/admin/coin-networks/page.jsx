'use client'

import { useState, startTransition } from 'react'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'

import useApi from '@/hooks/useApi'
import { getCoinNetworks } from '@/lib/api/admin'
import CoinImg from '@/components/CoinImg'
import dynamic from 'next/dynamic'
const CoinNetworkEditModal = dynamic(() => import('@/components/admin/CoinNetworkEditModal'), { ssr: false })
const preloadCoinNetworkEdit = () => import('@/components/admin/CoinNetworkEditModal')
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import TableEmptyState from '@/components/TableEmptyState'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
}

function getPaginationState(paginationData, fallbackPage, fallbackLimit) {
  return {
    page: paginationData.page || fallbackPage,
    limit: paginationData.limit || fallbackLimit,
    total: paginationData.total || 0,
    totalPages: paginationData.totalPages || 0,
    hasNext: paginationData.hasNext || false,
    hasPrev: paginationData.hasPrev || false,
  }
}

function getStatusBadge(status, t) {
  if (status === 'active') {
    return {
      color: 'success',
      label: t('admin.active', { defaultValue: 'Active' }),
    }
  }

  if (status === 'maintenance') {
    return {
      color: 'warning',
      label: t('crypto.maintenance', { defaultValue: 'Maintenance' }),
    }
  }

  return {
    color: 'secondary',
    label: t('crypto.inactive', { defaultValue: 'Inactive' }),
  }
}

function CoinNetworkRow({ coinNetwork, t, onCopyContract, onEdit, copiedId }) {
  const statusBadge = getStatusBadge(coinNetwork.status, t)

  return (
    <tr key={coinNetwork.id}>
      <td className="align-middle">
        <div className="flex items-center">
          <CoinImg
            coin={coinNetwork.coin}
            symbol={coinNetwork.coin?.symbol}
            networkSymbol={coinNetwork.network?.symbol}
            size={28}
            className="mr-2"
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
            <button
              type="button"
              onClick={() => onCopyContract(coinNetwork.contractAddress, `contract-${coinNetwork.id}`)}
              title={t('actions.copy', { defaultValue: 'Copy' })}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-100 dark:hover:bg-white/6 text-surface-500 hover:text-surface-700 transition-colors cursor-pointer"
            >
              <i className={`bx ${copiedId === `contract-${coinNetwork.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
            </button>
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
          title={t('actions.edit', { defaultValue: 'Edit' })}
          onClick={() => onEdit(coinNetwork.id)}
          variant="text-secondary"
          size="icon-sm"
        >
          <i className="bx bx-edit text-[1rem]"></i>
        </Button>
      </td>
    </tr>
  )
}

export default function SupportedCrypto() {
  const { t } = useAdminTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [draftSearch, setDraftSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editCoinNetworkId, setEditCoinNetworkId] = useState(null)

  const { data, error, isLoading, isValidating, mutate } = useApi(
    ['admin-coin-networks', currentPage, searchQuery],
    (token) => getCoinNetworks(token, currentPage, DEFAULT_PAGINATION.limit, searchQuery, '', ''),
    { keepPreviousData: true }
  )

  const coinNetworks = data?.items || []
  const pagination = data?.pagination
    ? getPaginationState(data.pagination, currentPage, DEFAULT_PAGINATION.limit)
    : DEFAULT_PAGINATION

  function handleApplyFilter() {
    const nextSearch = draftSearch.trim()
    setCurrentPage(1)
    if (nextSearch === searchQuery) {
      mutate()
    } else {
      setSearchQuery(nextSearch)
    }
  }

  function handleResetFilter() {
    if (!draftSearch && !searchQuery) return
    setDraftSearch('')
    setCurrentPage(1)
    if (!searchQuery) {
      mutate()
    } else {
      setSearchQuery('')
    }
  }

  function handlePageChange(newPage) {
    startTransition(() => setCurrentPage(newPage))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const { copiedId, handleCopy: handleCopyContract } = useCopyFeedback()

  return (
    <div className="grow pb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bx bx-link mr-2 text-primary"></i>
            {t('nav.coinNetworks', { defaultValue: 'Coin Networks' })}
          </h4>
          <p className="text-surface-500 mb-0">
            {t('crypto.manageCoinNetworks', { defaultValue: 'Manage coin-network pairs' })}
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
                placeholder={t('crypto.searchSupported', { defaultValue: 'Search by coin or network...' })}
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button onClick={handleApplyFilter} disabled={isValidating}>
                <i className="bx bx-filter-alt mr-1"></i>
                {t('filter.apply', { defaultValue: 'Apply Filters' })}
              </Button>
              <Button onClick={handleResetFilter} disabled={isValidating} variant="outline-secondary">
                <i className="bx bx-reset mr-1"></i>
                {t('filter.reset', { defaultValue: 'Reset' })}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card onMouseEnter={preloadCoinNetworkEdit}>
        {/* Error Alert */}
        {error && (
          <div className="p-5">
            <Alert role="alert" className="mb-0">
              <i className="bx bx-error-circle mr-2"></i>
              {error?.message || 'Failed to load supported crypto'}
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
          <tbody className={isValidating ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {coinNetworks.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                icon="bx-coin-stack"
                message={
                  searchQuery
                    ? t('crypto.noSupportedFound', { defaultValue: 'No supported crypto found' })
                    : t('crypto.noSupported', { defaultValue: 'No supported crypto yet' })
                }
              />
            ) : (
              coinNetworks.map((coinNetwork) => (
                <CoinNetworkRow
                  key={coinNetwork.id}
                  coinNetwork={coinNetwork}
                  t={t}
                  onCopyContract={handleCopyContract}
                  onEdit={setEditCoinNetworkId}
                  copiedId={copiedId}
                />
              ))
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-3 border-t border-surface-200">
            <Pagination pagination={pagination} onPageChange={handlePageChange} loading={isValidating} className="mt-0" />
          </div>
        )}
      </Card>

      {editCoinNetworkId && (
        <CoinNetworkEditModal
          coinNetworkId={editCoinNetworkId}
          onClose={() => setEditCoinNetworkId(null)}
          onSaved={() => mutate()}
        />
      )}
    </div>
  )
}
