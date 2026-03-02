'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getAdminInvoices } from '@/lib/api/admin'
import { formatAmount, formatDate } from '@/lib/utils/format'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

export default function AdminInvoiceList() {
  const { t, i18n } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter states (draft — applied on "Apply")
  const [statusFilter, setStatusFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [merchantIdFilter, setMerchantIdFilter] = useState('')
  const [fromDateFilter, setFromDateFilter] = useState('')
  const [toDateFilter, setToDateFilter] = useState('')
  const [sortByFilter, setSortByFilter] = useState('')
  const [sortOrderFilter, setSortOrderFilter] = useState('')

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({})

  useEffect(() => {
    loadInvoices()
  }, [currentPage, appliedFilters])

  function applyFilters() {
    setAppliedFilters({
      status: statusFilter || undefined,
      userId: userIdFilter ? Number(userIdFilter) : undefined,
      merchantId: merchantIdFilter ? Number(merchantIdFilter) : undefined,
      fromDate: fromDateFilter || undefined,
      toDate: toDateFilter || undefined,
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined,
    })
    setCurrentPage(1)
  }

  function resetFilters() {
    setStatusFilter('')
    setUserIdFilter('')
    setMerchantIdFilter('')
    setFromDateFilter('')
    setToDateFilter('')
    setSortByFilter('')
    setSortOrderFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
  }

  async function loadInvoices() {
    try {
      setLoading(true)
      const data = await getAdminInvoices(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setInvoices(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load invoices:', error)
      toast.error(t('admin.invoices.loadError', { defaultValue: 'Failed to load invoices' }))
    } finally {
      setLoading(false)
    }
  }

  function statusBadgeClass(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'paid' || v === 'completed' || v === 'confirmed') return 'badge bg-label-success'
    if (v === 'pending' || v === 'detecting') return 'badge bg-label-warning'
    if (v === 'confirming' || v === 'processing') return 'badge bg-label-info'
    if (v === 'expired' || v === 'cancelled' || v === 'canceled') return 'badge bg-label-secondary'
    if (v === 'failed' || v === 'unconfirmed') return 'badge bg-label-danger'
    return 'badge bg-label-secondary'
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (loading && invoices.length === 0) {
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
                    <i className="bx bx-receipt me-2"></i>
                    {t('admin.invoices.title', { defaultValue: 'Invoices' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.invoices.description', { defaultValue: 'View all invoices and their status' })}
                  </p>
                </div>
                <RefreshButton onClick={loadInvoices} loading={loading} />
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.status', { defaultValue: 'Status' })}</label>
                  <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    <option value="pending">{t('status.pending', { defaultValue: 'Pending' })}</option>
                    <option value="paid">{t('status.paid', { defaultValue: 'Paid' })}</option>
                    <option value="expired">{t('status.expired', { defaultValue: 'Expired' })}</option>
                    <option value="cancelled">{t('status.cancelled', { defaultValue: 'Cancelled' })}</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.userId', { defaultValue: 'User ID' })}</label>
                  <input type="number" className="form-control" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.merchantId', { defaultValue: 'Merchant ID' })}</label>
                  <input type="number" className="form-control" placeholder={t('filter.merchantId', { defaultValue: 'Merchant ID' })} value={merchantIdFilter} onChange={(e) => setMerchantIdFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.dateRange', { defaultValue: 'Date Range' })}</label>
                  <LocaleDateRangePicker
                    startDate={fromDateFilter}
                    endDate={toDateFilter}
                    onChangeStart={setFromDateFilter}
                    onChangeEnd={setToDateFilter}
                    locale={locale}
                    placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
                    t={t}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.sortBy', { defaultValue: 'Sort By' })}</label>
                  <select className="form-select" value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="created_at">{t('filter.createdAt', { defaultValue: 'Created At' })}</option>
                    <option value="amount">{t('filter.amount', { defaultValue: 'Amount' })}</option>
                    <option value="expiry_at">{t('filter.expiryAt', { defaultValue: 'Expiry At' })}</option>
                    <option value="paid_at">{t('filter.paidAt', { defaultValue: 'Paid At' })}</option>
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
                      <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
                      <th>{t('table.code', { defaultValue: 'Code' })}</th>
                      <th>{t('table.coin', { defaultValue: 'Coin' })}</th>
                      <th className="text-end">{t('table.amount', { defaultValue: 'Amount' })}</th>
                      <th className="text-end">{t('table.usd', { defaultValue: 'USD' })}</th>
                      <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                      <th>{t('table.paymentAddress', { defaultValue: 'Payment Address' })}</th>
                      <th>{t('table.created', { defaultValue: 'Created' })}</th>
                      <th>{t('table.expires', { defaultValue: 'Expires' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="text-center text-muted py-4">
                          {t('admin.invoices.noInvoices', { defaultValue: 'No invoices found' })}
                        </td>
                      </tr>
                    ) : (
                      invoices.map((invoice) => {
                        const coinSymbol = (invoice.coin?.symbol || invoice.coinSymbol || '').toUpperCase()
                        const networkSymbol = (invoice.network?.symbol || invoice.networkSymbol || '').toUpperCase()
                        const networkName = invoice.network?.name || invoice.networkName || ''

                        return (
                          <tr key={invoice.id}>
                            <td>
                              <span className="fw-semibold text-primary">{invoice.id}</span>
                            </td>
                            <td className="text-center">
                              <span className="fw-medium">{invoice.userId || '-'}</span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span className="fw-medium">{invoice.invoiceNumber || invoice.publicCode || invoice.code || '-'}</span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div className="d-flex align-items-center">
                                <CoinImg
                                  symbol={coinSymbol}
                                  networkSymbol={networkSymbol}
                                  size={24}
                                  className="me-2"
                                />
                                <div>
                                  <div className="fw-medium" style={{ lineHeight: 1.2 }}>{coinSymbol || '-'}</div>
                                  {networkName && (
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{networkName}</small>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-end text-nowrap">
                              <span className="fw-medium">
                                {formatAmount(invoice.amount)} {coinSymbol}
                              </span>
                            </td>
                            <td className="text-end text-nowrap">
                              {invoice.amountUsd ? (
                                <span className="fw-medium">${formatAmount(invoice.amountUsd)}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-nowrap text-center">
                              <span className={statusBadgeClass(invoice.status)}>
                                {String(invoice.status || '').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              {invoice.paymentAddress ? (
                                <div className="d-flex align-items-center">
                                  <span className="me-2" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                    {invoice.paymentAddress}
                                  </span>
                                  <button
                                    className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                                    onClick={() => handleCopy(invoice.paymentAddress)}
                                    title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                                  >
                                    <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              <span style={{ whiteSpace: 'nowrap' }}>{formatDate(invoice.createdAt || invoice.created_at)}</span>
                            </td>
                            <td>
                              <span style={{ whiteSpace: 'nowrap' }}>{formatDate(invoice.expiryAt || invoice.expiry_at)}</span>
                            </td>
                            <td>
                              <Link
                                href={`/admin/invoices/${invoice.id}`}
                                className="btn btn-sm btn-icon btn-text-secondary"
                                title={t('admin.detail.viewDetail', { defaultValue: 'View detail' })}
                              >
                                <i className="bx bx-show" style={{ fontSize: '1.25rem' }}></i>
                              </Link>
                            </td>
                          </tr>
                        )
                      })
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
                      onClick={() => setCurrentPage(p => p - 1)}
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
                      onClick={() => setCurrentPage(p => p + 1)}
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
