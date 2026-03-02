'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import { getSystemLedgerEntries } from '@/lib/api/admin'
import { listCoins } from '@/lib/api/coins'
import SystemLedgerFilters from '@/components/ledger/SystemLedgerFilters'
import SystemLedgerTable from '@/components/ledger/SystemLedgerTable'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'

export default function SystemLedgerList() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const initType = searchParams.get('type') || ''
  const initWalletId = searchParams.get('walletId') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initEntryCode = searchParams.get('entryCode') || ''
  const initState = searchParams.get('state') || ''
  const initTxHash = searchParams.get('txHash') || ''
  const initStartDate = searchParams.get('startDate') || ''
  const initEndDate = searchParams.get('endDate') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [coinNetworks, setCoinNetworks] = useState([])

  const [typeFilter, setTypeFilter] = useState(initType)
  const [walletIdFilter, setWalletIdFilter] = useState(initWalletId)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [entryCodeFilter, setEntryCodeFilter] = useState(initEntryCode)
  const [stateFilter, setStateFilter] = useState(initState)
  const [txHashFilter, setTxHashFilter] = useState(initTxHash)
  const [startDateFilter, setStartDateFilter] = useState(initStartDate)
  const [endDateFilter, setEndDateFilter] = useState(initEndDate)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initType) f.type = initType
    if (initWalletId) f.walletId = Number(initWalletId)
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initEntryCode) f.entryCode = initEntryCode
    if (initState) f.state = initState
    if (initTxHash) f.txHash = initTxHash
    if (initStartDate) f.startDate = initStartDate
    if (initEndDate) f.endDate = initEndDate
    return f
  })

  useEffect(() => {
    loadEntries()
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
      type: typeFilter || undefined,
      walletId: walletIdFilter ? Number(walletIdFilter) : undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      entryCode: entryCodeFilter || undefined,
      state: stateFilter || undefined,
      txHash: txHashFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setTypeFilter('')
    setWalletIdFilter('')
    setCoinNetworkIdFilter('')
    setEntryCodeFilter('')
    setStateFilter('')
    setTxHashFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    window.history.replaceState(null, '', window.location.pathname)
  }

  async function loadEntries() {
    try {
      setLoading(true)
      const data = await getSystemLedgerEntries(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setEntries(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load system ledger entries:', error)
      toast.error(t('admin.ledger.loadError', { defaultValue: 'Failed to load ledger entries' }))
    } finally {
      setLoading(false)
    }
  }

  if (loading && entries.length === 0) {
    return <PageSpinner />
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-server me-2"></i>
                    {t('admin.ledger.systemLedger', { defaultValue: 'System Ledger' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.ledger.systemLedgerDesc', { defaultValue: 'View all system ledger entries' })}
                  </p>
                </div>
                <RefreshButton onClick={loadEntries} loading={loading} />
              </div>
            </div>
            <div className="card-body">
              <SystemLedgerFilters
                locale={locale}
                loading={loading}
                coinNetworks={coinNetworks}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                entryCodeFilter={entryCodeFilter}
                setEntryCodeFilter={setEntryCodeFilter}
                stateFilter={stateFilter}
                setStateFilter={setStateFilter}
                walletIdFilter={walletIdFilter}
                setWalletIdFilter={setWalletIdFilter}
                coinNetworkIdFilter={coinNetworkIdFilter}
                setCoinNetworkIdFilter={setCoinNetworkIdFilter}
                txHashFilter={txHashFilter}
                setTxHashFilter={setTxHashFilter}
                startDateFilter={startDateFilter}
                setStartDateFilter={setStartDateFilter}
                endDateFilter={endDateFilter}
                setEndDateFilter={setEndDateFilter}
                onApply={applyFilters}
                onReset={resetFilters}
              />
            </div>
          </div>

          <SystemLedgerTable
            entries={entries}
            loading={loading}
            pagination={pagination}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            syncSearchParams={syncSearchParams}
            appliedFilters={appliedFilters}
          />
        </div>
      </div>
    </div>
  )
}
