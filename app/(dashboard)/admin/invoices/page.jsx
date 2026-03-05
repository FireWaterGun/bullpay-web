'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getAdminInvoices } from '@/lib/api/admin'
import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'

export default function AdminInvoiceList() {
  const { fmtDate } = useDateFormat()
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
    if (v === 'paid' || v === 'completed' || v === 'confirmed') return 'badge bg-green-50 text-green-700'
    if (v === 'pending' || v === 'detecting') return 'badge bg-amber-50 text-amber-700'
    if (v === 'confirming' || v === 'processing') return 'badge bg-cyan-50 text-cyan-700'
    if (v === 'expired' || v === 'cancelled' || v === 'canceled') return 'badge bg-surface-100 text-surface-600'
    if (v === 'failed' || v === 'unconfirmed') return 'badge bg-red-50 text-red-700'
    return 'badge bg-surface-100 text-surface-600'
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (loading && invoices.length === 0) {
    return <PageSpinner />
  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Header */}
          <div className="card mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-receipt mr-2"></i>
                    {t('admin.invoices.title', { defaultValue: 'Invoices' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.invoices.description', { defaultValue: 'View all invoices and their status' })}
                  </p>
                </div>
                <RefreshButton onClick={loadInvoices} loading={loading} />
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">{t('filter.status', { defaultValue: 'Status' })}</label>
                  <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    <option value="pending">{t('status.pending', { defaultValue: 'Pending' })}</option>
                    <option value="paid">{t('status.paid', { defaultValue: 'Paid' })}</option>
                    <option value="expired">{t('status.expired', { defaultValue: 'Expired' })}</option>
                    <option value="cancelled">{t('status.cancelled', { defaultValue: 'Cancelled' })}</option>
                  </select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">{t('filter.userId', { defaultValue: 'User ID' })}</label>
                  <input type="number" className="form-input" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">{t('filter.merchantId', { defaultValue: 'Merchant ID' })}</label>
                  <input type="number" className="form-input" placeholder={t('filter.merchantId', { defaultValue: 'Merchant ID' })} value={merchantIdFilter} onChange={(e) => setMerchantIdFilter(e.target.value)} />
                </div>
                <div className="md:col-span-3 sm:col-span-6">
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
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">{t('filter.sortBy', { defaultValue: 'Sort By' })}</label>
                  <select className="form-input" value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="created_at">{t('filter.createdAt', { defaultValue: 'Created At' })}</option>
                    <option value="amount">{t('filter.amount', { defaultValue: 'Amount' })}</option>
                    <option value="expiry_at">{t('filter.expiryAt', { defaultValue: 'Expiry At' })}</option>
                    <option value="paid_at">{t('filter.paidAt', { defaultValue: 'Paid At' })}</option>
                  </select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <label className="form-label">{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</label>
                  <select className="form-input" value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="asc">{t('filter.ascending', { defaultValue: t('admin.detail.ascending', { defaultValue: 'Ascending' }) })}</option>
                    <option value="desc">{t('filter.descending', { defaultValue: t('admin.detail.descending', { defaultValue: 'Descending' }) })}</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="btn btn-primary" onClick={applyFilters} disabled={loading}>
                  <i className="bx bx-filter-alt mr-1"></i>
                  {t('filter.apply', { defaultValue: 'Apply Filters' })}
                </button>
                <button className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100" onClick={resetFilters} disabled={loading}>
                  <i className="bx bx-reset mr-1"></i>
                  {t('filter.reset', { defaultValue: 'Reset' })}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="p-5">
              <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>{t('table.id', { defaultValue: 'ID' })}</th>
                      <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
                      <th>{t('table.code', { defaultValue: 'Code' })}</th>
                      <th>{t('table.coin', { defaultValue: 'Coin' })}</th>
                      <th className="text-right">{t('table.amount', { defaultValue: 'Amount' })}</th>
                      <th className="text-right">{t('table.usd', { defaultValue: 'USD' })}</th>
                      <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                      <th>{t('table.paymentAddress', { defaultValue: 'Payment Address' })}</th>
                      <th>{t('table.created', { defaultValue: 'Created' })}</th>
                      <th>{t('table.expires', { defaultValue: 'Expires' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ? (
                      <TableEmptyState
                        colSpan={11}
                        icon="bx-file"
                        message={t('admin.invoices.noInvoices', { defaultValue: 'No invoices found' })}
                        sub={t('admin.invoices.noInvoicesSub', { defaultValue: 'No invoices match the current filters' })}
                      />
                    ) : (
                      invoices.map((invoice) => {
                        const coinSymbol = (invoice.coin?.symbol || invoice.coinSymbol || '').toUpperCase()
                        const networkSymbol = (invoice.network?.symbol || invoice.networkSymbol || '').toUpperCase()
                        const networkName = invoice.network?.name || invoice.networkName || ''

                        return (
                          <tr key={invoice.id}>
                            <td>
                              <span className="font-semibold text-primary">{invoice.id}</span>
                            </td>
                            <td className="text-center">
                              <span className="font-medium">{invoice.userId || '-'}</span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span className="font-medium">{invoice.invoiceNumber || invoice.publicCode || invoice.code || '-'}</span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div className="flex items-center">
                                <CoinImg
                                  symbol={coinSymbol}
                                  networkSymbol={networkSymbol}
                                  size={24}
                                  className="mr-2"
                                />
                                <div>
                                  <div className="font-medium" style={{ lineHeight: 1.2 }}>{coinSymbol || '-'}</div>
                                  {networkName && (
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{networkName}</small>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-right whitespace-nowrap">
                              <span className="font-medium">
                                {formatAmount(invoice.amount)} {coinSymbol}
                              </span>
                            </td>
                            <td className="text-right whitespace-nowrap">
                              {invoice.amountUsd ? (
                                <span className="font-medium">${formatAmount(invoice.amountUsd)}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap text-center">
                              <span className={statusBadgeClass(invoice.status)}>
                                {String(invoice.status || '').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              {invoice.paymentAddress ? (
                                <div className="flex items-center">
                                  <span className="mr-2" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                    {invoice.paymentAddress}
                                  </span>
                                  <button
                                    className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full"
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
                              <span style={{ whiteSpace: 'nowrap' }}>{fmtDate(invoice.createdAt || invoice.created_at)}</span>
                            </td>
                            <td>
                              <span style={{ whiteSpace: 'nowrap' }}>{fmtDate(invoice.expiryAt || invoice.expiry_at)}</span>
                            </td>
                            <td>
                              <Link
                                href={`/admin/invoices/${invoice.id}`}
                                className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none"
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
                <div className="flex justify-between items-center mt-4">
                  <div className="text-muted text-sm">
                    {t('invoices.showingEntries', {
                      start: pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0,
                      end: Math.min(pagination.page * pagination.limit, pagination.total),
                      total: pagination.total,
                      defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
                    })}
                  </div>
                  <div className="inline-flex rounded-lg shadow-sm">
                    <button
                      className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm"
                      disabled={!pagination.hasPrev || loading}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <i className="bx bx-chevron-left"></i>
                      {t('actions.prev', { defaultValue: 'Previous' })}
                    </button>
                    <button
                      className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm"
                      disabled
                    >
                      {pagination.page} / {pagination.totalPages}
                    </button>
                    <button
                      className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm"
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
