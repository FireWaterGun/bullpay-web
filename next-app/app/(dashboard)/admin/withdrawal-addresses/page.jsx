'use client'

import { useState, useEffect } from 'react'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import {
  getWithdrawalAddresses,
  flagWithdrawalAddress,
  unflagWithdrawalAddress,
  forceVerifyWithdrawalAddress,
  deleteWithdrawalAddress,
} from '@/lib/api/admin'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { listCoins } from '@/lib/api/coins'
import AddressFilters from '@/components/balance/AddressFilters'
import AddressTable from '@/components/balance/AddressTable'
import AddressActionModal from '@/components/balance/AddressActionModal'
import { logger } from '@/lib/utils/logger'

export default function WithdrawalAddresses() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()

  const initStatus = searchParams.get('status') || ''
  const initUserId = searchParams.get('userId') || ''
  const initCoinNetworkId = searchParams.get('coinNetworkId') || ''
  const initIsFlagged = searchParams.get('isFlagged') || ''
  const initIsVerified = searchParams.get('isVerified') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)
  const [coinNetworks, setCoinNetworks] = useState([])

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

  useEffect(() => {
    loadAddresses()
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

  async function loadAddresses() {
    try {
      setLoading(true)
      const data = await getWithdrawalAddresses(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setAddresses(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load withdrawal addresses:', error)
      toast.error(t('withdrawal.addressLoadError', { defaultValue: 'Failed to load withdrawal addresses' }))
    } finally {
      setLoading(false)
    }
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
        return { title: 'Flag Address', btnClass: 'btn-warning', btnLabel: 'Flag', icon: 'bx-flag' }
      case 'unflag':
        return { title: 'Remove Flag', btnClass: 'btn-success', btnLabel: 'Unflag', icon: 'bx-check-circle' }
      case 'forceVerify':
        return { title: 'Force Verify', btnClass: 'btn-info', btnLabel: 'Verify', icon: 'bx-shield-quarter' }
      case 'delete':
        return { title: 'Permanent Delete', btnClass: 'btn-danger', btnLabel: 'Delete Permanently', icon: 'bx-trash' }
      default:
        return { title: '', btnClass: '', btnLabel: '', icon: '' }
    }
  }

  async function handleAction() {
    if (!selectedAddress || !actionReason.trim()) {
      toast.error('Please provide a reason (minimum 10 characters)')
      return
    }
    if (actionReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters')
      return
    }

    try {
      setActionLoading(true)

      switch (actionType) {
        case 'flag':
          await flagWithdrawalAddress(token, selectedAddress.id, actionReason.trim())
          toast.success('Address flagged successfully')
          break
        case 'unflag':
          await unflagWithdrawalAddress(token, selectedAddress.id, actionReason.trim())
          toast.success('Address unflagged successfully')
          break
        case 'forceVerify':
          await forceVerifyWithdrawalAddress(token, selectedAddress.id, actionReason.trim(), skipLockPeriod)
          toast.success('Address force verified successfully')
          break
        case 'delete':
          await deleteWithdrawalAddress(token, selectedAddress.id, actionReason.trim())
          toast.success('Address permanently deleted')
          break
      }

      setShowActionModal(false)
      setSelectedAddress(null)
      setActionReason('')
      loadAddresses()
    } catch (error) {
      logger.error(`Failed to ${actionType} address:`, error)
      toast.error(`Failed to ${actionType} address`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && addresses.length === 0) {
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

  const actionConfig = getActionConfig()

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
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
            loading={loading}
            onApply={applyFilters}
            onReset={resetFilters}
            onRefresh={loadAddresses}
            t={t}
          />

          <AddressTable
            addresses={addresses}
            loading={loading}
            pagination={pagination}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
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
        />
      )}
    </div>
  )
}
