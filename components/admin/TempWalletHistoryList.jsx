'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getTempWalletHistories } from '@/lib/api/admin'
import { listCoins } from '@/lib/api/coins'
import { formatDate } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'

const HISTORY_STATUS_OPTIONS = ['assigned', 'deposited', 'swept', 'released', 'failed']
const SORT_BY_OPTIONS = [
  { value: 'createdAt', label: 'Created At' },
  { value: 'firstDepositAt', label: 'First Deposit' },
  { value: 'sweptAt', label: 'Swept At' },
  { value: 'releasedAt', label: 'Released At' },
]

function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'assigned') return 'badge bg-label-info'
  if (v === 'deposited') return 'badge bg-label-primary'
  if (v === 'swept') return 'badge bg-label-warning'
  if (v === 'released') return 'badge bg-label-success'
  if (v === 'failed') return 'badge bg-label-danger'
  return 'badge bg-label-secondary'
}

export default function TempWalletHistoryList() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()

  const initTempWalletId = searchParams.get('tempWalletId') || ''
  const initInvoiceId = searchParams.get('invoiceId') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initStatus = searchParams.get('status') || ''
  const initSortBy = searchParams.get('sortBy') || ''
  const initSortOrder = searchParams.get('sortOrder') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [histories, setHistories] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [coinNetworks, setCoinNetworks] = useState([])

  const [tempWalletIdFilter, setTempWalletIdFilter] = useState(initTempWalletId)
  const [invoiceIdFilter, setInvoiceIdFilter] = useState(initInvoiceId)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [sortByFilter, setSortByFilter] = useState(initSortBy)
  const [sortOrderFilter, setSortOrderFilter] = useState(initSortOrder)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initTempWalletId) f.tempWalletId = Number(initTempWalletId)
    if (initInvoiceId) f.invoiceId = Number(initInvoiceId)
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initStatus) f.status = initStatus
    if (initSortBy) f.sortBy = initSortBy
    if (initSortOrder) f.sortOrder = initSortOrder
    return f
  })

  useEffect(() => { loadHistories() }, [currentPage, appliedFilters])

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
      tempWalletId: tempWalletIdFilter ? Number(tempWalletIdFilter) : undefined,
      invoiceId: invoiceIdFilter ? Number(invoiceIdFilter) : undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      status: statusFilter || undefined,
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setTempWalletIdFilter('')
    setInvoiceIdFilter('')
    setCoinNetworkIdFilter('')
    setStatusFilter('')
    setSortByFilter('')
    setSortOrderFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    syncSearchParams({}, 1)
  }

  async function loadHistories() {
    if (!token) return
    try {
      setLoading(true)
      const data = await getTempWalletHistories(token, { page: currentPage, limit: 20, ...appliedFilters })
      setHistories(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load temp wallet histories:', error)
      toast.error(t('admin.tempWallet.loadHistoriesError', { defaultValue: 'Failed to load temp wallet histories' }))
    } finally {
      setLoading(false)
    }
  }

  if (loading && histories.length === 0) {
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
                    <i className="bx bx-history me-2"></i>
                    {t('admin.tempWalletHistories.title', { defaultValue: 'Temp Wallet Histories' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.tempWalletHistories.description', { defaultValue: 'Monitor wallet usage history (read-only)' })}
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <Link href="/admin/temp-wallets" className="btn btn-outline-secondary">
                    <i className="bx bx-wallet me-1"></i>
                    {t('admin.tempWallets.title', { defaultValue: 'Temp Wallets' })}
                  </Link>
                  <button className="btn btn-primary" onClick={loadHistories} disabled={loading}>
                    <i className="bx bx-refresh me-1"></i>
                    {t('actions.refresh', { defaultValue: 'Refresh' })}
                  </button>
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
                    {HISTORY_STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('admin.tempWalletHistories.tempWalletId', { defaultValue: 'Temp Wallet ID' })}</label>
                  <input type="number" className="form-control" placeholder={t('admin.tempWalletHistories.tempWalletId', { defaultValue: 'Temp Wallet ID' })} value={tempWalletIdFilter} onChange={(e) => setTempWalletIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.invoiceId', { defaultValue: 'Invoice ID' })}</label>
                  <input type="number" className="form-control" placeholder={t('filter.invoiceId', { defaultValue: 'Invoice ID' })} value={invoiceIdFilter} onChange={(e) => setInvoiceIdFilter(e.target.value)} />
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
                    <option value="asc">{t('filter.ascending', { defaultValue: t('admin.detail.ascending', { defaultValue: 'Ascending' }) })}</option>
                    <option value="desc">{t('filter.descending', { defaultValue: t('admin.detail.descending', { defaultValue: 'Descending' }) })}</option>
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
                      <th className="text-center">{t('admin.tempWalletHistories.walletId', { defaultValue: 'Wallet ID' })}</th>
                      <th className="text-center">{t('table.invoiceId', { defaultValue: 'Invoice ID' })}</th>
                      <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
                      <th className="text-center">{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</th>
                      <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                      <th>{t('admin.tempWalletHistories.firstDeposit', { defaultValue: 'First Deposit' })}</th>
                      <th>{t('admin.tempWalletHistories.swept', { defaultValue: 'Swept' })}</th>
                      <th>{t('admin.tempWalletHistories.released', { defaultValue: 'Released' })}</th>
                      <th>{t('table.created', { defaultValue: 'Created' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {histories.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="text-center text-muted py-4">
                          {t('admin.tempWalletHistories.noHistories', { defaultValue: 'No histories found' })}
                        </td>
                      </tr>
                    ) : (
                      histories.map((h) => (
                        <tr key={h.id}>
                          <td>
                            <span className="fw-semibold text-primary">{h.id}</span>
                          </td>
                          <td className="text-center">
                            <Link
                              href={`/admin/temp-wallets/${h.tempWalletId}`}
                              className="text-primary fw-medium"
                            >
                              {h.tempWalletId || '-'}
                            </Link>
                          </td>
                          <td className="text-center">
                            {h.invoiceId ? (
                              <Link
                                href={`/admin/invoices/${h.invoiceId}`}
                                className="text-primary fw-medium"
                              >
                                {h.invoiceId}
                              </Link>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-center">
                            <span className="fw-medium">{h.userId || '-'}</span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {(() => {
                              const cn = coinNetworks.find(c => c.id === h.coinNetworkId)
                              if (!cn) return <span className="fw-medium">{h.coinNetworkId || '-'}</span>
                              const sym = (cn.coin?.symbol || '').toUpperCase()
                              const net = (cn.network?.name || cn.network?.symbol || '').toUpperCase()
                              return (
                                <div className="d-flex align-items-center">
                                  <CoinImg symbol={sym} networkSymbol={(cn.network?.symbol || '').toUpperCase()} size={24} className="me-3" />
                                  <div>
                                    <div className="fw-medium" style={{ lineHeight: 1.2 }}>{sym}</div>
                                    {net && <small className="text-muted" style={{ fontSize: '0.75rem' }}>{net}</small>}
                                  </div>
                                </div>
                              )
                            })()}
                          </td>
                          <td className="text-nowrap text-center">
                            <span className={statusBadgeClass(h.status)}>
                              {String(h.status || '').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(h.firstDepositAt)}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(h.sweptAt)}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(h.releasedAt)}</span>
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap' }}>{formatDate(h.createdAt)}</span>
                          </td>
                          <td>
                            <Link
                              href={`/admin/temp-wallet-histories/${h.id}`}
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
