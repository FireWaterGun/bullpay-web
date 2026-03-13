'use client'

import { useState, Suspense, startTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { getWithdrawals, approveWithdrawal, rejectWithdrawal } from '@/lib/api/admin'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { useCoins } from '@/hooks/useCoins'
import WithdrawalTxFilters from '@/components/admin/WithdrawalTxFilters'
import WithdrawalTxTable from '@/components/admin/WithdrawalTxTable'
import WithdrawalTxModals from '@/components/admin/WithdrawalTxModals'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'
import { formatAmount as formatAmountHelper } from '@/components/balance/withdrawalHelpers'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function WithdrawalTransactions() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <WithdrawalTransactionsContent />
    </Suspense>
  )
}

function WithdrawalTransactionsContent() {
  const { t } = useAdminTranslation()
  const toast = useToast()
  const searchParams = useSearchParams()

  const locale = useLocale()

  const initStatus = searchParams.get('status') || ''
  const initUserId = searchParams.get('userId') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initSearch = searchParams.get('search') || ''
  const initStartDate = searchParams.get('startDate') || ''
  const initEndDate = searchParams.get('endDate') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [currentPage, setCurrentPage] = useState(initPage)
  const { coins: coinNetworks } = useCoins()

  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [userIdFilter, setUserIdFilter] = useState(initUserId)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [searchFilter, setSearchFilter] = useState(initSearch)
  const [startDateFilter, setStartDateFilter] = useState(initStartDate)
  const [endDateFilter, setEndDateFilter] = useState(initEndDate)

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initUserId) f.userId = initUserId
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initSearch) f.search = initSearch
    if (initStartDate) f.startDate = initStartDate
    if (initEndDate) f.endDate = initEndDate
    return f
  })

  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading, isValidating, mutate, token } = useApi(
    ['admin-withdrawals', currentPage, appliedFilters],
    (token) => getWithdrawals(token, { page: currentPage, limit: 20, ...appliedFilters }),
    { onError: () => toast.error(t('withdrawal.loadError', { defaultValue: 'Failed to load withdrawal transactions' })), keepPreviousData: true }
  )
  const withdrawals = data?.items || []
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
      status: statusFilter || undefined,
      userId: userIdFilter || undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      search: searchFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setUserIdFilter('')
    setCoinNetworkIdFilter('')
    setSearchFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    window.history.replaceState(null, '', window.location.pathname)
  }

  function formatAmount(amountRaw, decimals = 18) {
    return formatAmountHelper(amountRaw, decimals)
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
    else toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
  }

  function handleApproveClick(withdrawal) {
    setSelectedWithdrawal(withdrawal)
    setShowApproveModal(true)
  }

  function handleRejectClick(withdrawal) {
    setSelectedWithdrawal(withdrawal)
    setRejectReason('')
    setShowRejectModal(true)
  }

  async function handleApprove() {
    if (!selectedWithdrawal) return

    try {
      setApproving(true)
      await approveWithdrawal(token, selectedWithdrawal.id, 'Withdrawal approved after verification')

      toast.success(t('withdrawal.approveSuccess', { defaultValue: 'Withdrawal approved successfully' }))
      setShowApproveModal(false)
      setSelectedWithdrawal(null)
      mutate()
      window.dispatchEvent(new Event('withdrawal-status-changed'))
    } catch (error) {
      logger.error('Failed to approve withdrawal:', error)
      toast.error(t('withdrawal.approveError', { defaultValue: 'Failed to approve withdrawal' }))
    } finally {
      setApproving(false)
    }
  }

  async function handleReject() {
    if (!selectedWithdrawal || !rejectReason.trim()) {
      toast.error(t('withdrawal.rejectReasonRequired', { defaultValue: 'Please provide a reason for rejection' }))
      return
    }

    if (rejectReason.trim().length < 10) {
      toast.error(
        t('withdrawal.rejectReasonTooShort', { defaultValue: 'The reason field must have at least 10 characters' })
      )
      return
    }

    try {
      setRejecting(true)
      await rejectWithdrawal(token, selectedWithdrawal.id, rejectReason.trim())

      toast.success(t('withdrawal.rejectSuccess', { defaultValue: 'Withdrawal rejected successfully' }))
      setShowRejectModal(false)
      setSelectedWithdrawal(null)
      setRejectReason('')
      mutate()
      window.dispatchEvent(new Event('withdrawal-status-changed'))
    } catch (error) {
      logger.error('Failed to reject withdrawal:', error)
      toast.error(t('withdrawal.rejectError', { defaultValue: 'Failed to reject withdrawal' }))
    } finally {
      setRejecting(false)
    }
  }

  if (isLoading) {
    return <PageSpinner />
  }

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <WithdrawalTxFilters
            locale={locale}
            loading={isValidating}
            coinNetworks={coinNetworks}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            userIdFilter={userIdFilter}
            setUserIdFilter={setUserIdFilter}
            coinNetworkIdFilter={coinNetworkIdFilter}
            setCoinNetworkIdFilter={setCoinNetworkIdFilter}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            startDateFilter={startDateFilter}
            setStartDateFilter={setStartDateFilter}
            endDateFilter={endDateFilter}
            setEndDateFilter={setEndDateFilter}
            onApply={applyFilters}
            onReset={resetFilters}
            onRefresh={() => mutate()}
          />

          <WithdrawalTxTable
            withdrawals={withdrawals}
            pagination={pagination}
            loading={isValidating}
            currentPage={currentPage}
            approving={approving}
            rejecting={rejecting}
            appliedFilters={appliedFilters}
            formatAmount={formatAmount}
            statusBadgeClass={(s) => getStatusBadgeClass(s, 'withdrawal')}
            onCopy={handleCopy}
            onApproveClick={handleApproveClick}
            onRejectClick={handleRejectClick}
            onPageChange={(p) => startTransition(() => setCurrentPage(p))}
            syncSearchParams={syncSearchParams}
          />
        </div>
      </div>

      <WithdrawalTxModals
        showApproveModal={showApproveModal}
        setShowApproveModal={setShowApproveModal}
        showRejectModal={showRejectModal}
        setShowRejectModal={setShowRejectModal}
        selectedWithdrawal={selectedWithdrawal}
        approving={approving}
        rejecting={rejecting}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        formatAmount={formatAmount}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}
