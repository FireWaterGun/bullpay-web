'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/app/providers'
import { getSystemLedgerEntries } from '@/lib/api/admin'
import { useCoins } from '@/hooks/useCoins'
import SystemLedgerFilters from '@/components/ledger/SystemLedgerFilters'
import SystemLedgerTable from '@/components/ledger/SystemLedgerTable'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Card from '@/components/ui/Card'

export default function SystemLedgerList() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()

  const locale = useLocale()

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
  const { coins: coinNetworks } = useCoins()

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

  const loadEntries = useCallback(async () => {
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
  }, [token, currentPage, appliedFilters, toast, t])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, v)
    })
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

  if (loading && entries.length === 0) {
    return <PageSpinner />
  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-server mr-2"></i>
                    {t('admin.ledger.systemLedger', { defaultValue: 'System Ledger' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.ledger.systemLedgerDesc', { defaultValue: 'View all system ledger entries' })}
                  </p>
                </div>
                <RefreshButton onClick={loadEntries} loading={loading} />
              </div>
            </div>
            <div className="p-5">
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
          </Card>

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
