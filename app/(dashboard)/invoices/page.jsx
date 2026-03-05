'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import { listInvoices } from '@/lib/api/invoices'
import { listCoins } from '@/lib/api/coins'
import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useUserInvoiceEvents } from '@/hooks/useInvoiceEvents'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard } from '@/lib/utils/clipboard'
import InvoiceFilterPanel from '@/components/invoices/InvoiceFilterPanel'
import RefreshButton from '@/components/RefreshButton'
import TableEmptyState from '@/components/TableEmptyState'

const statusBadge = {
  paid: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  expired: 'bg-surface-100 text-surface-600',
  cancelled: 'bg-red-100 text-red-600',
}

export default function InvoiceList() {
  const { t, i18n } = useTranslation()
  const { fmtDateTime } = useDateFormat()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [coinNetworks, setCoinNetworks] = useState([])
  const [appliedFilters, setAppliedFilters] = useState({
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

  const [copiedId, setCopiedId] = useState(null)

  const totalPages = useMemo(() => (limit ? Math.ceil((total || 0) / limit) : 1), [total, limit])
  const rangeStart = useMemo(() => (total === 0 ? 0 : (page - 1) * limit + 1), [total, page, limit])
  const rangeEnd = useMemo(() => Math.min(page * limit, total), [total, page, limit])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await listInvoices(
        {
          page,
          limit,
          sortBy: appliedFilters.sortBy,
          sortOrder: appliedFilters.sortOrder,
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
  }

  useEffect(() => {
    load()
  }, [page, limit, appliedFilters])

  useEffect(() => {
    listCoins(token).then(setCoinNetworks).catch(() => {})
  }, [])

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
      status,
      sortBy,
      sortOrder,
      coinNetworkId: coinNetworkIdFilter,
      dateFrom: startDateFilter,
      dateTo: endDateFilter,
    })
  }
  function resetFilters() {
    setStatus('')
    setSortBy('created_at')
    setSortOrder('desc')
    setCoinNetworkIdFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setPage(1)
    setAppliedFilters({ status: '', sortBy: 'created_at', sortOrder: 'desc', coinNetworkId: '', dateFrom: '', dateTo: '' })
  }

  async function handleCopy(addr, id) {
    if (!addr) return
    try {
      await copyToClipboard(addr)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch (e) {
      // ignore
    }
  }

  return (
    <>
      <div className="card">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h5 className="text-lg font-semibold text-surface-900 mb-0">
              {t('invoices.title', { defaultValue: 'Invoices' })}
            </h5>
            <RefreshButton onClick={load} loading={loading} />
          </div>
          <Link href="/invoices/create" className="btn btn-primary">
            <i className="bx bx-plus mr-1"></i>
            {t('invoices.create', { defaultValue: 'Create Invoice' })}
          </Link>
        </div>

        <InvoiceFilterPanel
          statusFilter={status}
          setStatusFilter={setStatus}
          coinNetworkIdFilter={coinNetworkIdFilter}
          setCoinNetworkIdFilter={setCoinNetworkIdFilter}
          coinNetworks={coinNetworks}
          startDateFilter={startDateFilter}
          setStartDateFilter={setStartDateFilter}
          endDateFilter={endDateFilter}
          setEndDateFilter={setEndDateFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          locale={locale}
          loading={loading}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        <div className="px-6 pb-6">
          {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm mb-4">{error}</div>}

          {loading ? (
            <div className="text-surface-500 py-4">{t('invoices.loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full w-full">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap">{t('invoices.invoice') || 'Invoice'}</th>
                    <th className="min-w-[420px]">{t('invoices.paymentAddress') || 'Payment Address'}</th>
                    <th>{t('invoices.chain') || 'Chain'}</th>
                    <th>{t('invoices.coin') || 'Coin'}</th>
                    <th className="text-right">{t('invoices.amount')}</th>
                    <th>{t('invoices.statusCol')}</th>
                    <th>{t('invoices.date')}</th>
                    <th className="text-right">{t('invoices.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <TableEmptyState
                      colSpan={8}
                      icon="bx-file"
                      message={t('invoices.none', { defaultValue: 'No invoices found' })}
                      sub={t('invoices.noneSub', { defaultValue: 'Create your first invoice to get started' })}
                    />
                  )}
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="whitespace-nowrap">
                        <Link href={`/invoices/${it.id}`} className="text-surface-900 hover:text-primary-600">
                          {it.publicCode || it.code || it.id}
                        </Link>
                      </td>
                      <td className="max-w-[420px]">
                        <div className="flex items-center gap-2">
                          <code className="text-surface-800 font-mono text-xs break-all">
                            {it.paymentAddress || 'N/A'}
                          </code>
                          {it.paymentAddress && (
                            <button
                              type="button"
                              className="shrink-0 p-1 text-surface-400 hover:text-primary-600 transition-colors cursor-pointer"
                              title={t('actions.copyAddress') || t('actions.copy') || 'Copy'}
                              onClick={() => handleCopy(it.paymentAddress, it.id)}
                            >
                              <i className={`bx ${copiedId === it.id ?'bx-check text-green-500' : 'bx-copy'} text-base`}></i>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="text-surface-500">
                          {(it.network?.symbol || '').toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex items-center">
                          <CoinImg
                            coin={it.coin}
                            symbol={(it.coin?.symbol || '').toUpperCase()}
                            networkSymbol={(it.network?.symbol || '').toUpperCase()}
                            className="mr-3"
                          />
                          <div>
                            <div className="text-surface-900">{(it.coin?.symbol || '').toUpperCase()}</div>
                            <small className="text-surface-500">{it.network?.name || ''}</small>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <div>{formatAmount(it.amount)} {(it.coin?.symbol || '').toUpperCase()}</div>
                      </td>
                      <td>
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full capitalize ${ statusBadge[it.status?.toLowerCase()] ||'bg-surface-100 text-surface-600'
                          }`}
                        >
                          {it.status ? t(`invoices.${it.status.toLowerCase()}`, { defaultValue: it.status }) : '-'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">{fmtDateTime(it.createdAt || it.created_at)}</td>
                      <td className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Link
                            href={`/invoices/${it.id}`}
                            className="p-1.5 text-surface-400 hover:text-primary-600 transition-colors"
                            title={t('actions.view') || 'View'}
                          >
                            <i className="bx bx-show text-base"></i>
                          </Link>
                          {it.publicCode && (
                            <Link
                              href={`/pay/${it.publicCode}`}
                              className="p-1.5 text-surface-400 hover:text-primary-600 transition-colors"
                              title={t('actions.viewPayment') || 'View Payment Page'}
                            >
                              <i className="bx bx-qr text-base"></i>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-surface-500 text-sm">
              {t('invoices.showingEntries', { start: rangeStart, end: rangeEnd, total })}
            </div>
            <div className="flex">
              <button
                className="px-3 py-1.5 text-sm border border-surface-200 rounded-l-lg text-surface-600 hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('actions.prev')}
              </button>
              <button
                className="px-3 py-1.5 text-sm border border-l-0 border-surface-200 rounded-r-lg text-surface-600 hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('actions.next')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
