'use client'

import { useState, useEffect, startTransition } from 'react'
import { useRouter, useSearchParams as useNextSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getTempWallets } from '@/lib/api/admin'
import { listCoins } from '@/lib/api/coins'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import CoinImg from '@/components/CoinImg'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import CoinNetworkFilterDropdown from '@/components/ui/CoinNetworkFilterDropdown'
import { Input, Label, Select } from '@/components/ui/Input'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import SortableHeader from '@/components/ui/SortableHeader'

const WALLET_STATUS_OPTIONS = ['active', 'used', 'expired', 'pooled', 'assigned', 'sweeped', 'disabled']

function truncateHash(hash) {
  if (!hash) return '-'
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

export default function TempWalletList() {
  const router = useRouter()
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()

  const toast = useToast()
  const searchParams = useNextSearchParams()

  const initStatus = searchParams.get('status') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initAddress = searchParams.get('address') || ''
  const initSortBy = searchParams.get('sortBy') || ''
  const rawSortOrder = searchParams.get('sortOrder') || ''
  const initSortOrder = ['asc', 'desc'].includes(rawSortOrder) ? rawSortOrder : ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [currentPage, setCurrentPage] = useState(initPage)
  const [coinNetworks, setCoinNetworks] = useState([])

  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [addressFilter, setAddressFilter] = useState(initAddress)
  const [sortBy, setSortBy] = useState(initSortBy)
  const [sortOrder, setSortOrder] = useState(initSortOrder)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initAddress) f.address = initAddress
    if (initSortBy) f.sortBy = initSortBy
    if (initSortOrder) f.sortOrder = initSortOrder
    return f
  })

  function handleSort(field, order) {
    setSortBy(field)
    setSortOrder(order)
    const f = { ...appliedFilters, sortBy: field, sortOrder: order }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  const { data, isLoading, isValidating, mutate, token } = useApi(
    ['admin-temp-wallets', currentPage, appliedFilters],
    (token) => getTempWallets(token, { page: currentPage, limit: 20, ...appliedFilters }).then((data) => {
      const m = data.meta || data.pagination || null
      return {
        items: data.items || [],
        pagination: m ? {
          total: m.total,
          page: m.page,
          limit: m.perPage || m.limit || 20,
          totalPages: m.lastPage || m.totalPages || 1,
          hasNext: m.hasNextPage ?? m.hasNext ?? false,
          hasPrev: m.hasPrevPage ?? m.hasPrev ?? false,
        } : null,
      }
    }),
    { onError: () => toast.error(t('admin.tempWallet.loadError', { defaultValue: 'Failed to load temp wallets' })), keepPreviousData: true }
  )
  const wallets = data?.items || []
  const pagination = data?.pagination || null

  useEffect(() => {
    if (!token) return
    listCoins(token)
      .then(setCoinNetworks)
      .catch(() => {})
  }, [token])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v))
    })
    if (page > 1) params.set('page', page)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  function applyFilters() {
    const f = {
      status: statusFilter || undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      address: addressFilter || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setCoinNetworkIdFilter('')
    setAddressFilter('')
    setSortBy('')
    setSortOrder('')
    setAppliedFilters({})
    setCurrentPage(1)
    syncSearchParams({}, 1)
  }

  const { copiedId, handleCopy } = useCopyFeedback()

  if (isLoading) {
    return <PageSpinner />
  }

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Header */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-wallet mr-2"></i>
                    {t('admin.tempWallets.title', { defaultValue: 'Temp Wallets' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.tempWallets.description', { defaultValue: 'Monitor temporary payment wallets' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline-secondary" href="/admin/temp-wallet-histories">
                    <i className="bx bx-history mr-1"></i>
                    {t('admin.tempWallets.usageHistories', { defaultValue: 'Usage Histories' })}
                  </Button>
                  <RefreshButton onClick={() => mutate()} loading={isValidating} />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('filter.status', { defaultValue: 'Status' })}</Label>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    {WALLET_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {t(`status.${s}`, { defaultValue: s.charAt(0).toUpperCase() + s.slice(1) })}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</Label>
                  <CoinNetworkFilterDropdown
                    coinNetworks={coinNetworks}
                    value={coinNetworkIdFilter}
                    onChange={setCoinNetworkIdFilter}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('filter.address', { defaultValue: 'Address' })}</Label>
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={addressFilter}
                    onChange={(e) => setAddressFilter(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={applyFilters} disabled={isValidating}>
                  <i className="bx bx-filter-alt mr-1"></i>
                  {t('filter.apply', { defaultValue: 'Apply Filters' })}
                </Button>
                <Button onClick={resetFilters} disabled={isValidating} variant="outline-secondary">
                  <i className="bx bx-reset mr-1"></i>
                  {t('filter.reset', { defaultValue: 'Reset' })}
                </Button>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card>
            <Table>
              <thead>
                <tr className="whitespace-nowrap">
                  <th>{t('table.id', { defaultValue: 'ID' })}</th>
                  <th className="text-center">{t('table.invoiceId', { defaultValue: 'Invoice' })}</th>
                  <th className="text-center">{t('table.userId', { defaultValue: 'User' })}</th>
                  <th>{t('table.coin', { defaultValue: 'Coin' })}</th>
                  <th>{t('table.address', { defaultValue: 'Address' })}</th>
                  <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                  <SortableHeader field="reuseCount" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-center">{t('admin.tempWallets.reuseCount', { defaultValue: 'Reuse' })}</SortableHeader>
                  <th className="text-right">{t('admin.tempWallets.totalReceived', { defaultValue: 'Received' })}</th>
                  <th className="text-right">{t('admin.tempWallets.totalSwept', { defaultValue: 'Swept' })}</th>
                  <th className="text-right">
                    {t('admin.tempWallets.lastSweepAmt', { defaultValue: 'Last Sweep Amt' })}
                  </th>
                  <th className="text-right">
                    {t('admin.tempWallets.leftoverNative', { defaultValue: 'Leftover Native' })}
                  </th>
                  <th className="text-right">
                    {t('admin.tempWallets.leftoverToken', { defaultValue: 'Leftover Token' })}
                  </th>
                  <SortableHeader field="lastAssignedAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>{t('admin.tempWallets.lastAssigned', { defaultValue: 'Last Assigned' })}</SortableHeader>
                  <th>{t('table.expires', { defaultValue: 'Expires' })}</th>
                  <SortableHeader field="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>{t('table.created', { defaultValue: 'Created' })}</SortableHeader>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {wallets.length === 0 ? (
                  <TableEmptyState
                    colSpan={17}
                    icon="bx-wallet-alt"
                    message={t('admin.tempWallets.noWallets', { defaultValue: 'No temp wallets found' })}
                    sub={t('admin.tempWallets.noWalletsSub', {
                      defaultValue: 'No temp wallets match the current filters',
                    })}
                  />
                ) : (
                  wallets.map((w) => (
                    <tr key={w.id} className="cursor-pointer" onClick={() => router.push(`/admin/temp-wallets/${w.id}`)}>
                      <td>
                        <span className="font-semibold text-primary">{w.id}</span>
                      </td>
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        {w.invoiceId ? (
                          <Link href={`/admin/invoices/${w.invoiceId}`} className="text-primary font-medium">
                            {w.invoiceId}
                          </Link>
                        ) : (
                          <span className="text-surface-500">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className="font-medium">{w.userId || '-'}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <CoinImg symbol={w.coinSymbol} networkSymbol={w.networkSymbol} size={28} />
                          <div>
                            <div className="font-semibold text-[0.85rem]">{w.coinSymbol || '-'}</div>
                            <div className="text-surface-500 text-[0.7rem]">{w.networkSymbol || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {w.address ? (
                          <div className="flex items-center">
                            <span className="mr-2 font-mono text-xs" title={w.address}>{truncateHash(w.address)}</span>
                            <Button
                              onClick={() => handleCopy(w.address, `addr-${w.id}`)}
                              title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                              size="icon-sm"
                              variant="text-secondary"
                            >
                              <i className={`bx ${copiedId === `addr-${w.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-surface-500">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-center">
                        <span className={getStatusBadgeClass(w.status, 'tempWallet')}>
                          {t(`status.${w.status}`, { defaultValue: w.status || '-' })}
                        </span>
                        {w.isExpired && (
                          <Badge color="danger" label className="ml-1 text-[0.6rem]">
                            {t('status.expired', { defaultValue: 'Expired' })}
                          </Badge>
                        )}
                      </td>
                      <td className="text-center">
                        <span className="font-medium">{w.reuseCount ?? 0}</span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span className="font-medium">{w.totalReceivedAmount || '0'}</span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span className="font-medium">{w.totalSweptAmount || '0'}</span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span className="font-medium">{w.lastSweepAmount || '-'}</span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span className="font-medium">{w.lastLeftoverNativeAmount || '-'}</span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span className="font-medium">{w.lastLeftoverTokenAmount || '-'}</span>
                      </td>
                      <td>
                        <span className="whitespace-nowrap">{fmtDate(w.lastAssignedAt)}</span>
                      </td>
                      <td>
                        <span className="whitespace-nowrap">{fmtDate(w.expiresAt)}</span>
                      </td>
                      <td>
                        <span className="whitespace-nowrap">{fmtDate(w.createdAt)}</span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="text-secondary"
                          size="icon-sm"
                          href={`/admin/temp-wallets/${w.id}`}
                          title={t('admin.detail.viewDetail', { defaultValue: 'View detail' })}
                        >
                          <i className="bx bx-show text-[1rem]"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            <div className="px-5 py-1.5">
              <Pagination
                pagination={pagination}
                onPageChange={(p) => {
                  startTransition(() => setCurrentPage(p))
                  syncSearchParams(appliedFilters, p)
                }}
                loading={isValidating}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
