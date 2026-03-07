'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getTempWallets } from '@/lib/api/admin'
import { listCoins } from '@/lib/api/coins'
import { useDateFormat } from '@/hooks/useDateFormat'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import CoinImg from '@/components/CoinImg'
import { logger } from '@/lib/utils/logger'
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

const WALLET_STATUS_OPTIONS = ['active', 'used', 'expired', 'pooled', 'assigned', 'sweeped', 'disabled']

export default function TempWalletList() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const SORT_BY_OPTIONS = [
    { value: 'createdAt', label: t('admin.detail.createdAt', { defaultValue: 'Created At' }) },
    { value: 'lastAssignedAt', label: t('admin.tempWallets.lastAssigned', { defaultValue: 'Last Assigned' }) },
    { value: 'lastSweepAt', label: t('admin.tempWallet.lastSweep', { defaultValue: 'Last Sweep' }) },
    { value: 'reuseCount', label: t('admin.tempWallet.reuseCount', { defaultValue: 'Reuse Count' }) },
  ]

  const { token } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()

  const initStatus = searchParams.get('status') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initAddress = searchParams.get('address') || ''
  const initSortBy = searchParams.get('sortBy') || ''
  const initSortOrder = searchParams.get('sortOrder') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [wallets, setWallets] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [coinNetworks, setCoinNetworks] = useState([])

  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [addressFilter, setAddressFilter] = useState(initAddress)
  const [sortByFilter, setSortByFilter] = useState(initSortBy)
  const [sortOrderFilter, setSortOrderFilter] = useState(initSortOrder)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initAddress) f.address = initAddress
    if (initSortBy) f.sortBy = initSortBy
    if (initSortOrder) f.sortOrder = initSortOrder
    return f
  })

  const loadWallets = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await getTempWallets(token, { page: currentPage, limit: 20, ...appliedFilters })
      setWallets(data.items || [])
      const m = data.meta || data.pagination || null
      setPagination(
        m
          ? {
              total: m.total,
              page: m.page,
              limit: m.perPage || m.limit || 20,
              totalPages: m.lastPage || m.totalPages || 1,
              hasNext: m.hasNextPage ?? m.hasNext ?? false,
              hasPrev: m.hasPrevPage ?? m.hasPrev ?? false,
            }
          : null
      )
    } catch (error) {
      logger.error('Failed to load temp wallets:', error)
      toast.error(t('admin.tempWallet.loadError', { defaultValue: 'Failed to load temp wallets' }))
    } finally {
      setLoading(false)
    }
  }, [token, currentPage, appliedFilters, toast, t])

  useEffect(() => {
    loadWallets()
  }, [loadWallets])

  useEffect(() => {
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
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setCoinNetworkIdFilter('')
    setAddressFilter('')
    setSortByFilter('')
    setSortOrderFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    syncSearchParams({}, 1)
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (loading && wallets.length === 0) {
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
                  <RefreshButton onClick={loadWallets} loading={loading} />
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
                        {s.charAt(0).toUpperCase() + s.slice(1)}
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
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('filter.sortBy', { defaultValue: 'Sort By' })}</Label>
                  <Select value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    {SORT_BY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</Label>
                  <Select value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="asc">
                      {t('filter.ascending', {
                        defaultValue: t('admin.detail.ascending', {
                          defaultValue: t('admin.detail.ascending', {
                            defaultValue: t('admin.detail.ascending', { defaultValue: 'Ascending' }),
                          }),
                        }),
                      })}
                    </option>
                    <option value="desc">
                      {t('filter.descending', {
                        defaultValue: t('admin.detail.descending', {
                          defaultValue: t('admin.detail.descending', {
                            defaultValue: t('admin.detail.descending', { defaultValue: 'Descending' }),
                          }),
                        }),
                      })}
                    </option>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={applyFilters} disabled={loading}>
                  <i className="bx bx-filter-alt mr-1"></i>
                  {t('filter.apply', { defaultValue: 'Apply Filters' })}
                </Button>
                <Button onClick={resetFilters} disabled={loading} variant="outline-secondary">
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
                  <th className="text-center">{t('admin.tempWallets.reuseCount', { defaultValue: 'Reuse' })}</th>
                  <th className="text-right">{t('admin.tempWallets.totalReceived', { defaultValue: 'Received' })}</th>
                  <th className="text-right">{t('admin.tempWallets.totalSwept', { defaultValue: 'Swept' })}</th>
                  <th className="text-right">Last Sweep Amt</th>
                  <th className="text-right">Leftover Native</th>
                  <th className="text-right">Leftover Token</th>
                  <th>
                    {t('admin.tempWallets.lastAssigned', {
                      defaultValue: t('admin.tempWallet.lastAssigned', {
                        defaultValue: t('admin.tempWallet.lastAssigned', { defaultValue: 'Last Assigned' }),
                      }),
                    })}
                  </th>
                  <th>{t('table.expires', { defaultValue: 'Expires' })}</th>
                  <th>{t('table.created', { defaultValue: 'Created' })}</th>
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
                    <tr key={w.id}>
                      <td>
                        <span className="font-semibold text-primary">{w.id}</span>
                      </td>
                      <td className="text-center">
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
                      <td>
                        {w.address ? (
                          <div className="flex items-center">
                            <span className="mr-2 whitespace-nowrap text-[0.85rem]">{w.address}</span>
                            <Button
                              onClick={() => handleCopy(w.address)}
                              title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                              size="icon-sm"
                              variant="text-secondary"
                            >
                              <i className="bx bx-copy"></i>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-surface-500">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-center">
                        <span className={getStatusBadgeClass(w.status, 'tempWallet')}>
                          {String(w.status || '').toUpperCase()}
                        </span>
                        {w.isExpired && (
                          <Badge color="danger" label className="ml-1 text-[0.6rem]">
                            EXPIRED
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
                      <td>
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
                  setCurrentPage(p)
                  syncSearchParams(appliedFilters, p)
                }}
                loading={loading}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
