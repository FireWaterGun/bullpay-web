'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import { getAdminPayments } from '@/lib/api/admin'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import AdminPaymentFilters from '@/components/admin/AdminPaymentFilters'
import AdminPaymentRow from '@/components/admin/AdminPaymentRow'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'

export default function AdminPaymentList() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter states (draft — applied on "Apply")
  const [statusFilter, setStatusFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [invoiceIdFilter, setInvoiceIdFilter] = useState('')
  const [txHashFilter, setTxHashFilter] = useState('')
  const [fromDateFilter, setFromDateFilter] = useState('')
  const [toDateFilter, setToDateFilter] = useState('')
  const [sortByFilter, setSortByFilter] = useState('')
  const [sortOrderFilter, setSortOrderFilter] = useState('')

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({})

  useEffect(() => {
    loadPayments()
  }, [currentPage, appliedFilters])

  function applyFilters() {
    setAppliedFilters({
      status: statusFilter || undefined,
      userId: userIdFilter ? Number(userIdFilter) : undefined,
      invoiceId: invoiceIdFilter ? Number(invoiceIdFilter) : undefined,
      txHash: txHashFilter || undefined,
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
    setInvoiceIdFilter('')
    setTxHashFilter('')
    setFromDateFilter('')
    setToDateFilter('')
    setSortByFilter('')
    setSortOrderFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
  }

  async function loadPayments() {
    try {
      setLoading(true)
      const data = await getAdminPayments(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setPayments(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load payments:', error)
      toast.error(t('admin.payments.loadError', { defaultValue: 'Failed to load payments' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (loading && payments.length === 0) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
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
                    <i className="bx bx-transfer me-2"></i>
                    {t('admin.payments.title', { defaultValue: 'Payments' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.payments.description', { defaultValue: 'View all blockchain payment transactions' })}
                  </p>
                </div>
                <RefreshButton onClick={loadPayments} loading={loading} />
              </div>
            </div>
            <AdminPaymentFilters
              locale={locale}
              loading={loading}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              userIdFilter={userIdFilter}
              setUserIdFilter={setUserIdFilter}
              invoiceIdFilter={invoiceIdFilter}
              setInvoiceIdFilter={setInvoiceIdFilter}
              txHashFilter={txHashFilter}
              setTxHashFilter={setTxHashFilter}
              fromDateFilter={fromDateFilter}
              setFromDateFilter={setFromDateFilter}
              toDateFilter={toDateFilter}
              setToDateFilter={setToDateFilter}
              sortByFilter={sortByFilter}
              setSortByFilter={setSortByFilter}
              sortOrderFilter={sortOrderFilter}
              setSortOrderFilter={setSortOrderFilter}
              onApply={applyFilters}
              onReset={resetFilters}
            />
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
                      <th className="text-center">{t('table.invoiceId', { defaultValue: 'Invoice ID' })}</th>
                      <th>{t('table.coin', { defaultValue: 'Coin' })}</th>
                      <th className="text-end">{t('table.amount', { defaultValue: 'Amount' })}</th>
                      <th className="text-end">{t('table.usd', { defaultValue: 'USD' })}</th>
                      <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                      <th>{t('table.confirmations', { defaultValue: 'Confirmations' })}</th>
                      <th>{t('table.txHash', { defaultValue: 'Tx Hash' })}</th>
                      <th>{t('table.fromAddress', { defaultValue: 'From Address' })}</th>
                      <th>{t('table.toAddress', { defaultValue: 'To Address' })}</th>
                      <th>{t('table.created', { defaultValue: 'Created' })}</th>
                      <th>{t('table.confirmed', { defaultValue: 'Confirmed' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan="14" className="text-center text-muted py-4">
                          {t('admin.payments.noPayments', { defaultValue: 'No payments found' })}
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <AdminPaymentRow
                          key={payment.id}
                          payment={payment}
                          onCopy={handleCopy}
                        />
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
                      onClick={() => setCurrentPage(currentPage - 1)}
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
                      onClick={() => setCurrentPage(currentPage + 1)}
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
