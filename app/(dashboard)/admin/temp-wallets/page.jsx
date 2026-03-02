'use client'

import { useState, useEffect } from 'react'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import { getTempWallets } from '@/lib/api/admin'
import { listCoins } from '@/lib/api/coins'
import { formatDate } from '@/lib/utils/format'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import CoinImg from '@/components/CoinImg'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

const WALLET_STATUS_OPTIONS = ['active', 'used', 'expired', 'pooled', 'assigned', 'sweeped', 'disabled']

function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'active' || v === 'pooled') return 'badge bg-label-success'
  if (v === 'assigned') return 'badge bg-label-info'
  if (v === 'used' || v === 'sweeped') return 'badge bg-label-warning'
  if (v === 'expired' || v === 'disabled') return 'badge bg-label-danger'
  return 'badge bg-label-secondary'
}

export default function TempWalletList() {
  const { t } = useTranslation()
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

  useEffect(() => { loadWallets() }, [currentPage, appliedFilters])

  useEffect(() => {
    listCoins(token).then(setCoinNetworks).catch(() => {})
  }, [])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)) })
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

  async function loadWallets() {
    if (!token) return
    try {
      setLoading(true)
      const data = await getTempWallets(token, { page: currentPage, limit: 20, ...appliedFilters })
      setWallets(data.items || [])
      const m = data.meta || data.pagination || null
      setPagination(m ? {
        total: m.total,
        page: m.page,
        limit: m.perPage || m.limit || 20,
        totalPages: m.lastPage || m.totalPages || 1,
        hasNext: m.hasNextPage ?? m.hasNext ?? false,
        hasPrev: m.hasPrevPage ?? m.hasPrev ?? false,
      } : null)
    } catch (error) {
      logger.error('Failed to load temp wallets:', error)
      toast.error(t('admin.tempWallet.loadError', { defaultValue: 'Failed to load temp wallets' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (loading && wallets.length === 0) {
    return <PageSpinner />
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-wallet me-2"></i>
                    {t('admin.tempWallets.title', { defaultValue: 'Temp Wallets' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.tempWallets.description', { defaultValue: 'Monitor temporary payment wallets' })}
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <Link href="/admin/temp-wallet-histories" className="btn btn-outline-secondary">
                    <i className="bx bx-history me-1"></i>
                    {t('admin.tempWallets.usageHistories', { defaultValue: 'Usage Histories' })}
                  </Link>
                  <RefreshButton onClick={loadWallets} loading={loading} />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.status', { defaultValue: 'Status' })}</label>
                  <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    {WALLET_STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</label>
                  <div className="dropdown">
                    <button
                      className="form-select d-flex align-items-center justify-content-between"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{ textAlign: 'left' }}
                    >
                      {coinNetworkIdFilter ? (() => {
                        const cn = coinNetworks.find(c => String(c.id) === String(coinNetworkIdFilter))
                        if (!cn) return 'All'
                        const sym = (cn.coin?.symbol || '').toUpperCase()
                        const net = (cn.network?.symbol || '').toUpperCase()
                        return (
                          <span className="d-flex align-items-center gap-2">
                            <CoinImg symbol={sym} networkSymbol={net} size={22} />
                            <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{sym}</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{net}</span>
                          </span>
                        )
                      })() : <span className="text-muted">All</span>}
                    </button>
                    <ul className="dropdown-menu w-100" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      <li>
                        <button className="dropdown-item" onClick={() => setCoinNetworkIdFilter('')}>
                          <span className="text-muted">All</span>
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      {coinNetworks.map((cn) => {
                        const sym = (cn.coin?.symbol || '').toUpperCase()
                        const net = (cn.network?.symbol || '').toUpperCase()
                        return (
                          <li key={cn.id}>
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => setCoinNetworkIdFilter(String(cn.id))}>
                              <CoinImg symbol={sym} networkSymbol={net} size={28} />
                              <div>
                                <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{sym}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{net}</div>
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.address', { defaultValue: 'Address' })}</label>
                  <input type="text" className="form-control" placeholder="0x..." value={addressFilter} onChange={(e) => setAddressFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.sortBy', { defaultValue: 'Sort By' })}</label>
                  <select className="form-select" value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    {SORT_BY_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</label>
                  <select className="form-select" value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="asc">{t('filter.ascending', { defaultValue: t('admin.detail.ascending', { defaultValue: t('admin.detail.ascending', { defaultValue: t('admin.detail.ascending', { defaultValue: 'Ascending' }) }) }) })}</option>
                    <option value="desc">{t('filter.descending', { defaultValue: t('admin.detail.descending', { defaultValue: t('admin.detail.descending', { defaultValue: t('admin.detail.descending', { defaultValue: 'Descending' }) }) }) })}</option>
                  </select>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary" onClick={applyFilters} disabled={loading}>
                  <i className="bx bx-filter-alt me-1"></i>
                  {t('filter.apply', { defaultValue: 'Apply Filters' })}
                </button>
                <button className="btn btn-outline-secondary" onClick={resetFilters} disabled={loading}>
                  <i className="bx bx-reset me-1"></i>
                  {t('filter.reset', { defaultValue: 'Reset' })}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="table table-hover">
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>{t('table.id', { defaultValue: 'ID' })}</th>
                      <th className="text-center">{t('table.invoiceId', { defaultValue: 'Invoice' })}</th>
                      <th className="text-center">{t('table.userId', { defaultValue: 'User' })}</th>
                      <th>{t('table.coin', { defaultValue: 'Coin' })}</th>
                      <th>{t('table.address', { defaultValue: 'Address' })}</th>
                      <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                      <th className="text-center">{t('admin.tempWallets.reuseCount', { defaultValue: 'Reuse' })}</th>
                      <th className="text-end">{t('admin.tempWallets.totalReceived', { defaultValue: 'Received' })}</th>
                      <th className="text-end">{t('admin.tempWallets.totalSwept', { defaultValue: 'Swept' })}</th>
                      <th className="text-end">Last Sweep Amt</th>
                      <th className="text-end">Leftover Native</th>
                      <th className="text-end">Leftover Token</th>
                      <th>{t('admin.tempWallets.lastAssigned', { defaultValue: t('admin.tempWallet.lastAssigned', { defaultValue: t('admin.tempWallet.lastAssigned', { defaultValue: 'Last Assigned' }) }) })}</th>
                      <th>{t('table.expires', { defaultValue: 'Expires' })}</th>
                      <th>{t('table.created', { defaultValue: 'Created' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.length === 0 ? (
                      <tr>
                        <td colSpan="17" className="text-center text-muted py-4">
                          {t('admin.tempWallets.noWallets', { defaultValue: 'No temp wallets found' })}
                        </td>
                      </tr>
                    ) : (
                      wallets.map((w) => (
                        <tr key={w.id}>
                          <td>
                            <span className="fw-semibold text-primary">{w.id}</span>
                          </td>
                          <td className="text-center">
                            {w.invoiceId ? (
                              <Link
                                href={`/admin/invoices/${w.invoiceId}`}
                                className="text-primary fw-medium"
                              >
                                {w.invoiceId}
                              </Link>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-center">
                            <span className="fw-medium">{w.userId || '-'}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <CoinImg symbol={w.coinSymbol} networkSymbol={w.networkSymbol} size={28} />
                              <div>
                                <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{w.coinSymbol || '-'}</div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{w.networkSymbol || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {w.address ? (
                              <div className="d-flex align-items-center">
                                <span className="me-2" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                  {w.address}
                                </span>
                                <button
                                  className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                  onClick={() => handleCopy(w.address)}
                                  title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                                >
                                  <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-nowrap text-center">
                            <span className={statusBadgeClass(w.status)}>
                              {String(w.status || '').toUpperCase()}
                            </span>
                            {w.isExpired && (
                              <span className="badge bg-label-danger ms-1" style={{ fontSize: '0.6rem' }}>EXPIRED</span>
                            )}
                          </td>
                          <td className="text-center">
                            <span className="fw-medium">{w.reuseCount ?? 0}</span>
                          </td>
                          <td className="text-end text-nowrap">
                            <span className="fw-medium">{w.totalReceivedAmount || '0'}</span>
                          </td>
                          <td className="text-end text-nowrap">
                            <span className="fw-medium">{w.totalSweptAmount || '0'}</span>
                          </td>
                          <td className="text-end text-nowrap">
                            <span className="fw-medium">{w.lastSweepAmount || '-'}</span>
                          </td>
                          <td className="text-end text-nowrap">
                            <span className="fw-medium">{w.lastLeftoverNativeAmount || '-'}</span>
                          </td>
                          <td className="text-end text-nowrap">
                            <span className="fw-medium">{w.lastLeftoverTokenAmount || '-'}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(w.lastAssignedAt)}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(w.expiresAt)}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(w.createdAt)}</span>
                          </td>
                          <td>
                            <Link
                              href={`/admin/temp-wallets/${w.id}`}
                              className="btn btn-sm btn-icon btn-text-secondary"
                              title={t('admin.detail.viewDetail', { defaultValue: 'View detail' })}
                            >
                              <i className="bx bx-show" style={{ fontSize: '1.25rem' }}></i>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.total > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
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
                      onClick={() => { setCurrentPage(p => p - 1); syncSearchParams(appliedFilters, currentPage - 1) }}
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
                      onClick={() => { setCurrentPage(p => p + 1); syncSearchParams(appliedFilters, currentPage + 1) }}
                    >
                      {t('actions.next', { defaultValue: 'Next' })}
                      <i className="bx bx-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
