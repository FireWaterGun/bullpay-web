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

export default function InvoiceList() {
  const { t, i18n } = useTranslation()
  const { fmtDateTime } = useDateFormat()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Draft filter states (user changes these, applied on "Apply")
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  // Coin networks for the dropdown
  const [coinNetworks, setCoinNetworks] = useState([])
  // Applied filters (actually sent to API)
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

  const totalPages = useMemo(
    () => (limit ? Math.ceil((total || 0) / limit) : 1),
    [total, limit]
  )
  const rangeStart = useMemo(
    () => (total === 0 ? 0 : (page - 1) * limit + 1),
    [total, page, limit]
  )
  const rangeEnd = useMemo(
    () => Math.min(page * limit, total),
    [total, page, limit]
  )

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
      setError(
        typeof e?.message === 'string' ? e.message : 'Failed to load invoices'
      )
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

  // Subscribe to Pusher events for real-time invoice updates
  const userIdentifier = user?.id || user?.userId || user?.email
  useUserInvoiceEvents(userIdentifier, {
    onInvoiceCreated: () => {
      load()
    },
    onInvoiceUpdated: () => {
      load()
    },
    onStatusChanged: () => {
      load()
    },
    onPaymentReceived: () => {
      load()
    },
    onPaymentCompleted: () => {
      load()
    },
    onWithdrawalCompleted: () => {
      load()
    },
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

  function shortAddr(addr) {
    if (!addr) return '-'
    const s = String(addr)
    if (s.length <= 14) return s
    return `${s.slice(0, 6)}...${s.slice(-6)}`
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
    <div className="content-wrapper">
      <div className="container-xxl flex-grow-1 container-p-y">
        {/* List */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0">{t("invoices.title", { defaultValue: "Invoices" })}</h5>
              <RefreshButton onClick={load} loading={loading} />
            </div>
            <Link href="/invoices/create" className="btn btn-primary">
              <i className="bx bx-plus me-1"></i>
              {t("invoices.create", { defaultValue: "Create Invoice" })}
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
          <div className="card-body pt-0">

            {error && <div className="alert alert-danger">{error}</div>}
            {loading ? (
              <div className="text-muted">{t("invoices.loading")}</div>
            ) : (
              <div className="card-datatable table-responsive">
                <table className="invoice-list-table table border-top">
                  <thead>
                    <tr>
                      <th className="cell-fit">{t("invoices.invoice") || "Invoice"}</th>
                      <th style={{ minWidth: '420px' }}>{t("invoices.paymentAddress") || "Payment Address"}</th>
                      <th>{t("invoices.chain") || "Chain"}</th>
                      <th>{t("invoices.coin") || "Coin"}</th>
                      <th className="text-end">{t("invoices.amount")}</th>
                      <th>{t("invoices.statusCol")}</th>
                      <th>{t("invoices.date")}</th>
                      <th className="text-end">{t("invoices.actions")}</th>
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
                        <td className="text-nowrap cell-fit">
                          <Link href={`/invoices/${it.id}`} className="text-dark">
                            {it.publicCode || it.code || it.id}
                          </Link>
                        </td>
                        <td style={{ maxWidth: 420 }}>
                          <div className="d-flex align-items-center gap-2">
                            <code className="text-dark font-monospace" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                              {it.paymentAddress || 'N/A'}
                            </code>
                            {it.paymentAddress && (
                              <button
                                type="button"
                                className="btn btn-icon btn-sm flex-shrink-0"
                                style={{ padding: '0.25rem' }}
                                title={t("actions.copyAddress") || t("actions.copy") || "Copy"}
                                onClick={() => handleCopy(it.paymentAddress, it.id)}
                              >
                                <i className={`bx ${copiedId === it.id ? "bx-check text-success" : "bx-copy text-secondary"}`} style={{ fontSize: '1rem' }}></i>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="text-nowrap">
                          <span className="text-muted">
                            {(it.network?.symbol || "").toUpperCase() || 'N/A'}
                          </span>
                        </td>
                        <td className="text-nowrap">
                          <div className="d-flex align-items-center">
                            <CoinImg coin={it.coin} symbol={(it.coin?.symbol || "").toUpperCase()} networkSymbol={(it.network?.symbol || "").toUpperCase()} className="me-3" />
                            <div>
                              <div>{(it.coin?.symbol || "").toUpperCase()}</div>
                              <small className="text-muted">{it.network?.name || ""}</small>
                            </div>
                          </div>
                        </td>
                        <td className="text-nowrap text-end">
                          <div>{formatAmount(it.amount)} {(it.coin?.symbol || "").toUpperCase()}</div>
                        </td>
                        <td>
                          <span
                            className={`badge rounded-pill text-capitalize ${
                              it.status === "paid"
                                ? "bg-label-success"
                                : it.status === "pending"
                                ? "bg-label-warning"
                                : "bg-label-secondary"
                            }`}
                          >
                            {it.status ? t(`invoices.${it.status.toLowerCase()}`, { defaultValue: it.status }) : "-"}
                          </span>
                        </td>
                        <td className="text-nowrap">{fmtDateTime(it.createdAt || it.created_at)}</td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            <Link
                              href={`/invoices/${it.id}`}
                              className="btn btn-icon btn-sm text-secondary"
                              title={t("actions.view") || "View"}
                            >
                              <i className="bx bx-show" style={{ fontSize: '1rem' }}></i>
                            </Link>
                            {it.publicCode && (
                              <Link
                                href={`/pay/${it.publicCode}`}
                                className="btn btn-icon btn-sm text-secondary"
                                title={t("actions.viewPayment") || "View Payment Page"}
                              >
                                <i className="bx bx-qr" style={{ fontSize: '1rem' }}></i>
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
            {/* Simple pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">
                {t("invoices.showingEntries", { start: rangeStart, end: rangeEnd, total })}
              </div>
              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t("actions.prev")}
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("actions.next")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
