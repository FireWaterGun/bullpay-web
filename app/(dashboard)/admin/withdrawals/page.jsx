'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth, useToast } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { getWithdrawals, approveWithdrawal, rejectWithdrawal } from '@/lib/api/admin'
import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import { formatCoinAmount } from '@/lib/utils/format'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { listCoins } from '@/lib/api/coins'
import WithdrawalTxFilters from '@/components/admin/WithdrawalTxFilters'
import WithdrawalTxTable from '@/components/admin/WithdrawalTxTable'
import WithdrawalTxModals from '@/components/admin/WithdrawalTxModals'
import { logger } from '@/lib/utils/logger'

export default function WithdrawalTransactions() {
  return <Suspense><WithdrawalTransactionsContent /></Suspense>
}

function WithdrawalTransactionsContent() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const searchParams = useSearchParams()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const initStatus = searchParams.get('status') || ''
  const initUserId = searchParams.get('userId') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initSearch = searchParams.get('search') || ''
  const initStartDate = searchParams.get('startDate') || ''
  const initEndDate = searchParams.get('endDate') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [withdrawals, setWithdrawals] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [coinNetworks, setCoinNetworks] = useState([])

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

  useEffect(() => {
    loadWithdrawals()
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

  async function loadWithdrawals() {
    try {
      setLoading(true)
      const data = await getWithdrawals(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setWithdrawals(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load withdrawal transactions:', error)
      toast.error(t('withdrawal.loadError', { defaultValue: 'Failed to load withdrawal transactions' }))
    } finally {
      setLoading(false)
    }
  }

  function formatAmount(amountRaw, decimals = 18) {
    if (!amountRaw) return '0'
    try {
      const value = AmountNormalizer.fromRawSimple(amountRaw.toString(), decimals)
      return formatCoinAmount(value)
    } catch (e) {
      return amountRaw.toString()
    }
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
      loadWithdrawals()
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
      toast.error(t('withdrawal.rejectReasonTooShort', { defaultValue: 'The reason field must have at least 10 characters' }))
      return
    }

    try {
      setRejecting(true)
      await rejectWithdrawal(token, selectedWithdrawal.id, rejectReason.trim())

      toast.success(t('withdrawal.rejectSuccess', { defaultValue: 'Withdrawal rejected successfully' }))
      setShowRejectModal(false)
      setSelectedWithdrawal(null)
      setRejectReason('')
      loadWithdrawals()
      window.dispatchEvent(new Event('withdrawal-status-changed'))
    } catch (error) {
      logger.error('Failed to reject withdrawal:', error)
      toast.error(t('withdrawal.rejectError', { defaultValue: 'Failed to reject withdrawal' }))
    } finally {
      setRejecting(false)
    }
  }

  function statusBadgeClass(s) {
    const v = String(s || '').toUpperCase()
    if (v === 'PENDING') return 'badge bg-label-warning'
    if (v === 'PROCESSING' || v === 'APPROVED') return 'badge bg-label-info'
    if (v === 'COMPLETED' || v === 'SUCCESS') return 'badge bg-label-success'
    if (v === 'FAILED' || v === 'REJECTED' || v === 'ERROR') return 'badge bg-label-danger'
    if (v === 'CANCELLED' || v === 'CANCELED') return 'badge bg-label-secondary'
    return 'badge bg-label-secondary'
  }

  if (loading && withdrawals.length === 0) {
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
          <WithdrawalTxFilters
            locale={locale}
            loading={loading}
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
            onRefresh={loadWithdrawals}
          />

          <WithdrawalTxTable
            withdrawals={withdrawals}
            pagination={pagination}
            loading={loading}
            currentPage={currentPage}
            approving={approving}
            rejecting={rejecting}
            appliedFilters={appliedFilters}
            formatAmount={formatAmount}
            statusBadgeClass={statusBadgeClass}
            onCopy={handleCopy}
            onApproveClick={handleApproveClick}
            onRejectClick={handleRejectClick}
            onPageChange={setCurrentPage}
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
