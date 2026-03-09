'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import { listInvoices } from '@/lib/api/invoices'
import { useCoins } from '@/hooks/useCoins'
import { useUserInvoiceEvents } from '@/hooks/useInvoiceEvents'
import InvoiceFilterPanel from '@/components/invoices/InvoiceFilterPanel'
import InvoiceTable from '@/components/invoices/InvoiceTable'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function InvoiceList() {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const { coins: coinNetworks } = useCoins()
  const [appliedFilters, setAppliedFilters] = useState({
    q: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    coinNetworkId: '',
    dateFrom: '',
    dateTo: '',
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const { token, user } = useAuth()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const totalPages = useMemo(() => (limit ? Math.ceil((total || 0) / limit) : 1), [total, limit])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listInvoices(
        {
          page,
          limit,
          sortBy: appliedFilters.sortBy,
          sortOrder: appliedFilters.sortOrder,
          q: appliedFilters.q || undefined,
          status: appliedFilters.status || undefined,
          coinNetworkId: appliedFilters.coinNetworkId || undefined,
          dateFrom: appliedFilters.dateFrom || undefined,
          dateTo: appliedFilters.dateTo || undefined,
        },
        token
      )
      setItems(res.items)
      setTotal(res.total || 0)
    } catch (e) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [page, limit, appliedFilters, token])

  useEffect(() => {
    load()
  }, [load])

  const userIdentifier = user?.id || user?.userId || user?.email
  useUserInvoiceEvents(userIdentifier, {
    onInvoiceCreated: () => load(),
    onInvoiceUpdated: () => load(),
    onStatusChanged: () => load(),
    onPaymentReceived: () => load(),
    onPaymentCompleted: () => load(),
    onWithdrawalCompleted: () => load(),
  })

  function applyFilters() {
    setPage(1)
    setAppliedFilters({
      q: searchQuery,
      status,
      sortBy,
      sortOrder,
      coinNetworkId: coinNetworkIdFilter,
      dateFrom: startDateFilter,
      dateTo: endDateFilter,
    })
  }
  function resetFilters() {
    setSearchQuery('')
    setStatus('')
    setSortBy('created_at')
    setSortOrder('desc')
    setCoinNetworkIdFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setPage(1)
    setAppliedFilters({
      q: '',
      status: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      coinNetworkId: '',
      dateFrom: '',
      dateTo: '',
    })
  }

  if (loading && items.length === 0) {
    return <PageSpinner />
  }

  return (
    <>
      {/* Header + Filters */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h4 className="font-semibold text-surface-900 mb-1">
              <i className="bx bx-receipt mr-2 text-primary-500"></i>
              {t('invoices.title', { defaultValue: 'Invoices' })}
            </h4>
            <p className="text-surface-500 text-sm mb-0">
              {t('invoices.description', { defaultValue: 'Manage your payment invoices' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton onClick={load} loading={loading} />
            <Button href="/invoices/create">
              <i className="bx bx-plus mr-1"></i>
              {t('invoices.create', { defaultValue: 'Create Invoice' })}
            </Button>
          </div>
        </div>

        <InvoiceFilterPanel
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={status}
          setStatusFilter={setStatus}
          coinNetworkIdFilter={coinNetworkIdFilter}
          setCoinNetworkIdFilter={setCoinNetworkIdFilter}
          coinNetworks={coinNetworks}
          startDateFilter={startDateFilter}
          setStartDateFilter={setStartDateFilter}
          endDateFilter={endDateFilter}
          setEndDateFilter={setEndDateFilter}
          locale={locale}
          loading={loading}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400 px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      <InvoiceTable
        items={items}
        pagination={{
          page,
          totalPages,
          total,
          limit,
          hasPrev: page > 1,
          hasNext: page < totalPages,
        }}
        loading={loading}
        onPageChange={setPage}
        sortBy={appliedFilters.sortBy}
        sortOrder={appliedFilters.sortOrder}
        onSort={(field, order) => {
          setSortBy(field)
          setSortOrder(order)
          setPage(1)
          setAppliedFilters((prev) => ({ ...prev, sortBy: field, sortOrder: order }))
        }}
      />
    </>
  )
}
