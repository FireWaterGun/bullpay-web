'use client'

import { useState, startTransition } from 'react'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAuth, useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { getPlatformLedgerEntries } from '@/lib/api/admin'
import { useCoins } from '@/hooks/useCoins'
import PlatformLedgerFilterPanel from '@/components/ledger/PlatformLedgerFilterPanel'
import PlatformLedgerTable from '@/components/ledger/PlatformLedgerTable'
import dynamic from 'next/dynamic'
const AdjustmentModal = dynamic(() => import('@/components/ledger/AdjustmentModal'), { ssr: false })
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function PlatformLedgerList() {
  const { t } = useAdminTranslation()
  const { navigation } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()

  const isSuperAdmin = navigation?.role === 'super_admin'
  const [showAdjustModal, setShowAdjustModal] = useState(false)

  const locale = useLocale()

  const initAccountType = searchParams.get('accountType') || ''
  const initEntryType = searchParams.get('entryType') || ''
  const initEntryCode = searchParams.get('entryCode') || ''
  const initState = searchParams.get('state') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initTxHash = searchParams.get('txHash') || ''
  const initStartDate = searchParams.get('startDate') || ''
  const initEndDate = searchParams.get('endDate') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [currentPage, setCurrentPage] = useState(initPage)
  const { coins: coinNetworks } = useCoins()

  const [accountTypeFilter, setAccountTypeFilter] = useState(initAccountType)
  const [entryTypeFilter, setEntryTypeFilter] = useState(initEntryType)
  const [entryCodeFilter, setEntryCodeFilter] = useState(initEntryCode)
  const [stateFilter, setStateFilter] = useState(initState)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [txHashFilter, setTxHashFilter] = useState(initTxHash)
  const [startDateFilter, setStartDateFilter] = useState(initStartDate)
  const [endDateFilter, setEndDateFilter] = useState(initEndDate)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initAccountType) f.accountType = initAccountType
    if (initEntryType) f.entryType = initEntryType
    if (initEntryCode) f.entryCode = initEntryCode
    if (initState) f.state = initState
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initTxHash) f.txHash = initTxHash
    if (initStartDate) f.startDate = initStartDate
    if (initEndDate) f.endDate = initEndDate
    return f
  })

  const { data, isLoading, isValidating, mutate } = useApi(
    ['admin-platform-ledger', currentPage, appliedFilters],
    (token) => getPlatformLedgerEntries(token, {
      page: currentPage,
      limit: 20,
      ...appliedFilters,
    }),
    { keepPreviousData: true, onError: () => toast.error(t('admin.platformLedger.loadError', { defaultValue: 'Failed to load platform ledger entries' })) }
  )

  const entries = data?.items || []
  const pagination = data?.pagination || null

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
      accountType: accountTypeFilter || undefined,
      entryType: entryTypeFilter || undefined,
      entryCode: entryCodeFilter || undefined,
      state: stateFilter || undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      txHash: txHashFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setAccountTypeFilter('')
    setEntryTypeFilter('')
    setEntryCodeFilter('')
    setStateFilter('')
    setCoinNetworkIdFilter('')
    setTxHashFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    window.history.replaceState(null, '', window.location.pathname)
  }

  if (isLoading) {
    return <PageSpinner />
  }

  function handleAdjustmentResult(result) {
    if (result === 'in') {
      toast.success(
        t('admin.adjustment.successIncrease', { defaultValue: 'Balance increased (XI) successfully' })
      )
      mutate()
    } else if (result === 'out') {
      toast.success(
        t('admin.adjustment.successDecrease', { defaultValue: 'Balance decreased (XO) successfully' })
      )
      mutate()
    } else if (result === 'error:insufficient') {
      toast.error(
        t('admin.adjustment.insufficientBalance', {
          defaultValue: 'Insufficient confirmed balance for this adjustment',
        })
      )
    } else if (result === 'error') {
      toast.error(t('admin.adjustment.error', { defaultValue: 'Failed to apply adjustment' }))
    }
  }

  return (
    <div className="grow pb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bx bx-book-open mr-2 text-primary"></i>
            {t('admin.platformLedger.title', { defaultValue: 'Revenue & Expenses' })}
          </h4>
          <p className="text-surface-500 mb-0">
            {t('admin.platformLedger.description', { defaultValue: 'View all revenue and expense entries' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Button onClick={() => setShowAdjustModal(true)}>
              <i className="bx bx-transfer-alt mr-1"></i>
              {t('admin.adjustment.button', { defaultValue: 'Adjustment (XI/XO)' })}
            </Button>
          )}
          <RefreshButton onClick={() => mutate()} loading={isValidating} />
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <PlatformLedgerFilterPanel
          accountTypeFilter={accountTypeFilter}
          setAccountTypeFilter={setAccountTypeFilter}
          entryTypeFilter={entryTypeFilter}
          setEntryTypeFilter={setEntryTypeFilter}
          entryCodeFilter={entryCodeFilter}
          setEntryCodeFilter={setEntryCodeFilter}
          stateFilter={stateFilter}
          setStateFilter={setStateFilter}
          coinNetworkIdFilter={coinNetworkIdFilter}
          setCoinNetworkIdFilter={setCoinNetworkIdFilter}
          txHashFilter={txHashFilter}
          setTxHashFilter={setTxHashFilter}
          startDateFilter={startDateFilter}
          setStartDateFilter={setStartDateFilter}
          endDateFilter={endDateFilter}
          setEndDateFilter={setEndDateFilter}
          coinNetworks={coinNetworks}
          locale={locale}
          loading={isValidating}
          onApply={applyFilters}
          onReset={resetFilters}
        />
      </Card>

      <PlatformLedgerTable
        entries={entries}
        pagination={pagination}
        loading={isValidating}
        currentPage={currentPage}
        setCurrentPage={(p) => startTransition(() => setCurrentPage(p))}
        syncSearchParams={syncSearchParams}
        appliedFilters={appliedFilters}
      />

      {showAdjustModal && (
        <AdjustmentModal t={t} onClose={() => setShowAdjustModal(false)} onSuccess={handleAdjustmentResult} />
      )}
    </div>
  )
}
