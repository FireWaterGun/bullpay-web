'use client'

import { useState, startTransition } from 'react'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { getAdminPayments } from '@/lib/api/admin'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import AdminPaymentFilters from '@/components/admin/AdminPaymentFilters'
import AdminPaymentRow from '@/components/admin/AdminPaymentRow'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'
import Card from '@/components/ui/Card'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import SortableHeader from '@/components/ui/SortableHeader'

export default function AdminPaymentList() {
  const { t } = useAdminTranslation()
  const toast = useToast()

  const locale = useLocale()
  const [currentPage, setCurrentPage] = useState(1)

  // Filter states (draft — applied on "Apply")
  const [statusFilter, setStatusFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [invoiceIdFilter, setInvoiceIdFilter] = useState('')
  const [txHashFilter, setTxHashFilter] = useState('')
  const [fromDateFilter, setFromDateFilter] = useState('')
  const [toDateFilter, setToDateFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState('')

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({})

  function handleSort(field, order) {
    setSortBy(field)
    setSortOrder(order)
    setAppliedFilters((prev) => ({ ...prev, sortBy: field, sortOrder: order }))
    setCurrentPage(1)
  }

  const { data, isLoading, isValidating, mutate } = useApi(
    ['admin-payments', currentPage, appliedFilters],
    (token) => getAdminPayments(token, { page: currentPage, limit: 20, ...appliedFilters }),
    { onError: () => toast.error(t('admin.payments.loadError', { defaultValue: 'Failed to load payments' })), keepPreviousData: true }
  )
  const payments = data?.items || []
  const pagination = data?.pagination || null

  function applyFilters() {
    setAppliedFilters({
      status: statusFilter || undefined,
      userId: userIdFilter ? Number(userIdFilter) : undefined,
      invoiceId: invoiceIdFilter ? Number(invoiceIdFilter) : undefined,
      txHash: txHashFilter || undefined,
      fromDate: fromDateFilter || undefined,
      toDate: toDateFilter || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
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
    setSortBy('')
    setSortOrder('')
    setAppliedFilters({})
    setCurrentPage(1)
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (isLoading && payments.length === 0) {
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
                    <i className="bx bx-transfer mr-2"></i>
                    {t('admin.payments.title', { defaultValue: 'Payments' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.payments.description', { defaultValue: 'View all blockchain payment transactions' })}
                  </p>
                </div>
                <RefreshButton onClick={() => mutate()} loading={isValidating} />
              </div>
            </div>
            <AdminPaymentFilters
              locale={locale}
              loading={isValidating}
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
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </Card>

          {/* Table */}
          <Card>
            <Table>
              <thead>
                <tr className="whitespace-nowrap">
                  <th>{t('table.id', { defaultValue: 'ID' })}</th>
                  <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
                  <th className="text-center">{t('table.invoiceId', { defaultValue: 'Invoice ID' })}</th>
                  <th>{t('table.coin', { defaultValue: 'Coin' })}</th>
                  <SortableHeader field="amount_raw" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} className="text-right">{t('table.amount', { defaultValue: 'Amount' })}</SortableHeader>
                  <th className="text-right">{t('table.usd', { defaultValue: 'USD' })}</th>
                  <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                  <SortableHeader field="confirmations" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>{t('table.confirmations', { defaultValue: 'Confirmations' })}</SortableHeader>
                  <th>{t('table.txHash', { defaultValue: 'Tx Hash' })}</th>
                  <th>{t('table.fromAddress', { defaultValue: 'From Address' })}</th>
                  <th>{t('table.toAddress', { defaultValue: 'To Address' })}</th>
                  <SortableHeader field="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>{t('table.created', { defaultValue: 'Created' })}</SortableHeader>
                  <th>{t('table.confirmed', { defaultValue: 'Confirmed' })}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <TableEmptyState
                    colSpan={14}
                    icon="bx-credit-card"
                    message={t('admin.payments.noPayments', { defaultValue: 'No payments found' })}
                    sub={t('admin.payments.noPaymentsSub', { defaultValue: 'No payments match the current filters' })}
                  />
                ) : (
                  payments.map((payment) => <AdminPaymentRow key={payment.id} payment={payment} onCopy={handleCopy} />)
                )}
              </tbody>
            </Table>

            <div className="px-5 py-1.5">
              <Pagination pagination={pagination} onPageChange={(p) => startTransition(() => setCurrentPage(p))} loading={isValidating} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
