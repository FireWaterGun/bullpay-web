'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getGasTopups } from '@/lib/api/admin'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { listCoins } from '@/lib/api/coins'
import GasTopupRow from '@/components/admin/GasTopupRow'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'

export default function GasTopups() {
  const { t, i18n } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()
  const router = useRouter()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const initStatus = searchParams.get('status') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initSweepId = searchParams.get('sweepId') || ''
  const initTxHash = searchParams.get('txHash') || ''
  const initDateFrom = searchParams.get('dateFrom') || ''
  const initDateTo = searchParams.get('dateTo') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [topups, setTopups] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [coinNetworks, setCoinNetworks] = useState([])

  // Filter states
  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [sweepIdFilter, setSweepIdFilter] = useState(initSweepId)
  const [txHashFilter, setTxHashFilter] = useState(initTxHash)
  const [dateFromFilter, setDateFromFilter] = useState(initDateFrom)
  const [dateToFilter, setDateToFilter] = useState(initDateTo)

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initSweepId) f.sweepId = Number(initSweepId)
    if (initTxHash) f.txHash = initTxHash
    if (initDateFrom) f.dateFrom = initDateFrom
    if (initDateTo) f.dateTo = initDateTo
    return f
  })

  useEffect(() => {
    loadTopups()
  }, [currentPage, appliedFilters])

  useEffect(() => {
    listCoins(token).then(setCoinNetworks).catch(() => {})
  }, [])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, v) })
    if (page > 1) params.set('page', page)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  function applyFilters() {
    const f = {
      status: statusFilter || undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      sweepId: sweepIdFilter ? Number(sweepIdFilter) : undefined,
      txHash: txHashFilter || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setCoinNetworkIdFilter('')
    setSweepIdFilter('')
    setTxHashFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    window.history.replaceState(null, '', window.location.pathname)
  }

  async function loadTopups() {
    try {
      setLoading(true)
      const data = await getGasTopups(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setTopups(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load gas topups:', error)
      toast.error(t('gasTopup.loadError', { defaultValue: 'Failed to load gas topups' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  if (loading && topups.length === 0) {
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
                    <i className="bx bx-gas-pump me-2"></i>
                    {t('admin.gasTopup.listTitle', { defaultValue: 'Gas Topups' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.gasTopup.description', { defaultValue: 'View all gas topup transactions and their status' })}
                  </p>
                </div>
                <RefreshButton onClick={loadTopups} loading={loading} />
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-2 col-sm-6">
                  <label className="form-label">{t('common.status', { defaultValue: 'Status' })}</label>
                  <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('common.all', { defaultValue: 'All' })}</option>
                    <option value="pending">{t('status.pending', { defaultValue: 'Pending' })}</option>
                    <option value="processing">{t('status.processing', { defaultValue: 'Processing' })}</option>
                    <option value="completed">{t('status.completed', { defaultValue: 'Completed' })}</option>
                    <option value="failed">{t('status.failed', { defaultValue: 'Failed' })}</option>
                    <option value="skipped">{t('admin.gasTopup.skipped', { defaultValue: 'Skipped' })}</option>
                  </select>
                </div>
                <div className="col-md-2 col-sm-6">
                  <label className="form-label">{t('admin.gasTopup.coinNetwork', { defaultValue: 'Coin / Network' })}</label>
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
                        if (!cn) return t('common.all', { defaultValue: 'All' })
                        const sym = (cn.coin?.symbol || '').toUpperCase()
                        const net = (cn.network?.symbol || '').toUpperCase()
                        return (
                          <span className="d-flex align-items-center gap-2">
                            <CoinImg symbol={sym} networkSymbol={net} size={22} />
                            <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{sym}</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{net}</span>
                          </span>
                        )
                      })() : <span className="text-muted">{t('common.all', { defaultValue: 'All' })}</span>}
                    </button>
                    <ul className="dropdown-menu w-100" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      <li>
                        <button className="dropdown-item" onClick={() => setCoinNetworkIdFilter('')}>
                          <span className="text-muted">{t('common.all', { defaultValue: 'All' })}</span>
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
                <div className="col-md-2 col-sm-6">
                  <label className="form-label">{t('admin.gasTopup.sweepId', { defaultValue: 'Sweep ID' })}</label>
                  <input type="number" className="form-control" placeholder={t('admin.gasTopup.sweepId', { defaultValue: 'Sweep ID' })} value={sweepIdFilter} onChange={(e) => setSweepIdFilter(e.target.value)} />
                </div>
                <div className="col-md-2 col-sm-6">
                  <label className="form-label">{t('admin.gasTopup.txHash', { defaultValue: 'Tx Hash' })}</label>
                  <input type="text" className="form-control" placeholder="0x..." value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.dateRange', { defaultValue: 'Date Range' })}</label>
                  <LocaleDateRangePicker
                    startDate={dateFromFilter}
                    endDate={dateToFilter}
                    onChangeStart={setDateFromFilter}
                    onChangeEnd={setDateToFilter}
                    locale={locale}
                    placeholder={t('admin.detail.selectDateRange', { defaultValue: 'Select date range' })}
                    t={t}
                    style={{ width: '100%' }}
                  />
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
                      <th>{t('admin.gasTopup.id', { defaultValue: 'ID' })}</th>
                      <th>{t('admin.gasTopup.coin', { defaultValue: 'Coin' })}</th>
                      <th className="text-center">{t('admin.gasTopup.sweepId', { defaultValue: 'Sweep ID' })}</th>
                      <th className="text-end">{t('admin.gasTopup.topupGas', { defaultValue: 'Topup Gas' })}</th>
                      <th className="text-end">{t('admin.gasTopup.requiredGas', { defaultValue: 'Required Gas' })}</th>
                      <th className="text-center">{t('admin.gasTopup.status', { defaultValue: 'Status' })}</th>
                      <th>{t('admin.gasTopup.txHash', { defaultValue: 'Tx Hash' })}</th>
                      <th>{t('admin.gasTopup.fromAddress', { defaultValue: 'From Address' })}</th>
                      <th>{t('admin.gasTopup.toAddress', { defaultValue: 'To Address' })}</th>
                      <th className="text-center">{t('admin.gasTopup.retry', { defaultValue: 'Retry' })}</th>
                      <th>{t('admin.gasTopup.created', { defaultValue: 'Created' })}</th>
                      <th>{t('admin.gasTopup.completedAt', { defaultValue: 'Completed' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topups.length === 0 ? (
                      <TableEmptyState
                        colSpan={12}
                        icon="bx-gas-pump"
                        message={t('admin.gasTopup.noTopups', { defaultValue: 'No gas topups found' })}
                        sub={t('admin.gasTopup.noTopupsSub', { defaultValue: 'No gas topups match the current filters' })}
                      />
                    ) : (
                      topups.map((topup) => (
                        <GasTopupRow
                          key={topup.id}
                          topup={topup}
                          onCopy={handleCopy}
                          onNavigate={(id) => router.push(`/admin/wallet-gas-topups/${id}`)}
                          t={t}
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
