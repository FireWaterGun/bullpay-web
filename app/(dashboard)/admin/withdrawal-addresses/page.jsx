'use client'

import { useState, startTransition } from 'react'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import useApi from '@/hooks/useApi'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import {
  getWithdrawalAddresses,
  flagWithdrawalAddress,
  unflagWithdrawalAddress,
  forceVerifyWithdrawalAddress,
  deleteWithdrawalAddress,
} from '@/lib/api/admin'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { useCoins } from '@/hooks/useCoins'
import AddressFilters from '@/components/balance/AddressFilters'
import AddressTable from '@/components/balance/AddressTable'
import dynamic from 'next/dynamic'
const AddressActionModal = dynamic(() => import('@/components/balance/AddressActionModal'), { ssr: false })
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'

export default function WithdrawalAddresses() {
  const { t } = useAdminTranslation()
  const toast = useToast()
  const searchParams = useNextSearchParams()

  const initStatus = searchParams.get('status') || ''
  const initUserId = searchParams.get('userId') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initIsFlagged = searchParams.get('isFlagged') || ''
  const initIsVerified = searchParams.get('isVerified') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [currentPage, setCurrentPage] = useState(initPage)
  const { coins: coinNetworks } = useCoins()

  // Filter states
  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [userIdFilter, setUserIdFilter] = useState(initUserId)
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId)
  const [isFlaggedFilter, setIsFlaggedFilter] = useState(initIsFlagged)
  const [isVerifiedFilter, setIsVerifiedFilter] = useState(initIsVerified)

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initUserId) f.userId = initUserId
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId)
    if (initIsFlagged) f.isFlagged = initIsFlagged === 'true'
    if (initIsVerified) f.isVerified = initIsVerified === 'true'
    return f
  })

  // Modal states
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState('') // flag, unflag, forceVerify, delete
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [actionReason, setActionReason] = useState('')
  const [skipLockPeriod, setSkipLockPeriod] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const { data, isLoading, isValidating, mutate, token } = useApi(
    ['admin-withdrawal-addresses', currentPage, appliedFilters],
    (token) => getWithdrawalAddresses(token, {
      page: currentPage,
      limit: 20,
      ...appliedFilters,
    }),
    { keepPreviousData: true, onError: () => toast.error(t('withdrawal.addressLoadError', { defaultValue: 'Failed to load withdrawal addresses' })) }
  )

  const addresses = data?.items || []
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
      isFlagged: isFlaggedFilter ? isFlaggedFilter === 'true' : undefined,
      isVerified: isVerifiedFilter ? isVerifiedFilter === 'true' : undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setUserIdFilter('')
    setCoinNetworkIdFilter('')
    setIsFlaggedFilter('')
    setIsVerifiedFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    window.history.replaceState(null, '', window.location.pathname)
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
    else toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }))
  }

  function openActionModal(type, addr) {
    setActionType(type)
    setSelectedAddress(addr)
    setActionReason('')
    setSkipLockPeriod(false)
    setShowActionModal(true)
  }

  function getActionConfig() {
    switch (actionType) {
      case 'flag':
        return {
          title: t('admin.withdrawalAddress.flagTitle', { defaultValue: 'Flag Address' }),
          btnVariant: 'warning',
          btnLabel: t('admin.withdrawalAddress.flag', { defaultValue: 'Flag' }),
          icon: 'bx-flag',
        }
      case 'unflag':
        return {
          title: t('admin.withdrawalAddress.unflagTitle', { defaultValue: 'Remove Flag' }),
          btnVariant: 'success',
          btnLabel: t('admin.withdrawalAddress.unflag', { defaultValue: 'Unflag' }),
          icon: 'bx-check-circle',
        }
      case 'forceVerify':
        return {
          title: t('admin.withdrawalAddress.forceVerifyTitle', { defaultValue: 'Force Verify' }),
          btnVariant: 'info',
          btnLabel: t('admin.withdrawalAddress.verify', { defaultValue: 'Verify' }),
          icon: 'bx-shield-quarter',
        }
      case 'delete':
        return {
          title: t('admin.withdrawalAddress.deleteTitle', { defaultValue: 'Permanent Delete' }),
          btnVariant: 'danger',
          btnLabel: t('admin.withdrawalAddress.deletePermanently', { defaultValue: 'Delete Permanently' }),
          icon: 'bx-trash',
        }
      default:
        return { title: '', btnVariant: 'primary', btnLabel: '', icon: '' }
    }
  }

  async function handleAction() {
    if (!selectedAddress || !actionReason.trim()) {
      toast.error(
        t('admin.withdrawalAddress.reasonRequired', { defaultValue: 'Please provide a reason (minimum 10 characters)' })
      )
      return
    }
    if (actionReason.trim().length < 10) {
      toast.error(
        t('admin.withdrawalAddress.reasonTooShort', { defaultValue: 'Reason must be at least 10 characters' })
      )
      return
    }

    try {
      setActionLoading(true)

      switch (actionType) {
        case 'flag':
          await flagWithdrawalAddress(token, selectedAddress.id, actionReason.trim())
          toast.success(t('admin.withdrawalAddress.flagSuccess', { defaultValue: 'Address flagged successfully' }))
          break
        case 'unflag':
          await unflagWithdrawalAddress(token, selectedAddress.id, actionReason.trim())
          toast.success(t('admin.withdrawalAddress.unflagSuccess', { defaultValue: 'Address unflagged successfully' }))
          break
        case 'forceVerify':
          await forceVerifyWithdrawalAddress(token, selectedAddress.id, actionReason.trim(), skipLockPeriod)
          toast.success(
            t('admin.withdrawalAddress.verifySuccess', { defaultValue: 'Address force verified successfully' })
          )
          break
        case 'delete':
          await deleteWithdrawalAddress(token, selectedAddress.id, actionReason.trim())
          toast.success(t('admin.withdrawalAddress.deleteSuccess', { defaultValue: 'Address permanently deleted' }))
          break
      }

      setShowActionModal(false)
      setSelectedAddress(null)
      setActionReason('')
      mutate()
    } catch (error) {
      logger.error(`Failed to ${actionType} address:`, error)
      toast.error(t('admin.withdrawalAddress.actionFailed', { defaultValue: `Failed to ${actionType} address` }))
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return <PageSpinner />
  }

  const actionConfig = getActionConfig()

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <AddressFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            userIdFilter={userIdFilter}
            setUserIdFilter={setUserIdFilter}
            coinNetworkIdFilter={coinNetworkIdFilter}
            setCoinNetworkIdFilter={setCoinNetworkIdFilter}
            isFlaggedFilter={isFlaggedFilter}
            setIsFlaggedFilter={setIsFlaggedFilter}
            isVerifiedFilter={isVerifiedFilter}
            setIsVerifiedFilter={setIsVerifiedFilter}
            coinNetworks={coinNetworks}
            loading={isValidating}
            onApply={applyFilters}
            onReset={resetFilters}
            onRefresh={() => mutate()}
            t={t}
          />

          <AddressTable
            addresses={addresses}
            loading={isValidating}
            pagination={pagination}
            currentPage={currentPage}
            setCurrentPage={(p) => startTransition(() => setCurrentPage(p))}
            syncSearchParams={syncSearchParams}
            appliedFilters={appliedFilters}
            onCopy={handleCopy}
            onOpenActionModal={openActionModal}
            t={t}
          />
        </div>
      </div>

      {showActionModal && selectedAddress && (
        <AddressActionModal
          selectedAddress={selectedAddress}
          actionType={actionType}
          actionConfig={actionConfig}
          actionReason={actionReason}
          setActionReason={setActionReason}
          skipLockPeriod={skipLockPeriod}
          setSkipLockPeriod={setSkipLockPeriod}
          actionLoading={actionLoading}
          onAction={handleAction}
          onClose={() => setShowActionModal(false)}
          t={t}
        />
      )}
    </div>
  )
}
