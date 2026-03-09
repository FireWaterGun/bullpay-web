'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import {
  getWithdrawalAddressById,
  flagWithdrawalAddress,
  unflagWithdrawalAddress,
  forceVerifyWithdrawalAddress,
  deleteWithdrawalAddress,
} from '@/lib/api/admin'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { useDateFormat } from '@/hooks/useDateFormat'
import AddressActionModal from '@/components/balance/AddressActionModal'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

function AddressAuditLogTable({ auditLogs }) {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  if (!auditLogs || auditLogs.length === 0) return null

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-history mr-2"></i>
          {t('admin.withdrawalAddress.auditLog', { defaultValue: 'Audit Log' })}
        </h5>
      </div>
      <div className="p-0">
        <div className="overflow-x-auto">
          <Table responsive={false} className="text-sm mb-0">
            <thead>
              <tr>
                <th>{t('admin.detail.action', { defaultValue: 'Action' })}</th>
                <th>{t('admin.detail.admin', { defaultValue: 'Admin' })}</th>
                <th>{t('admin.detail.reason', { defaultValue: 'Reason' })}</th>
                <th>{t('admin.detail.date', { defaultValue: 'Date' })}</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id || `${log.action}-${log.createdAt || log.timestamp}`}>
                  <td>
                    <span className="font-medium">{log.action}</span>
                  </td>
                  <td>{log.adminId || log.performedBy || '—'}</td>
                  <td className="text-surface-500 max-w-[300px] whitespace-normal">{log.reason || '—'}</td>
                  <td className="whitespace-nowrap">{fmtDate(log.createdAt || log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </Card>
  )
}

export default function WithdrawalAddressDetail() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const router = useRouter()
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [address, setAddress] = useState(null)

  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState('')
  const [actionReason, setActionReason] = useState('')
  const [skipLockPeriod, setSkipLockPeriod] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const loadAddress = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getWithdrawalAddressById(token, parseInt(id))
      const addr = res?.address && typeof res.address === 'object' ? res.address : res
      setAddress(addr)
    } catch (error) {
      logger.error('Failed to load withdrawal address:', error)
      toast.error(t('admin.withdrawalAddress.loadDetailError', { defaultValue: 'Failed to load withdrawal address' }))
    } finally {
      setLoading(false)
    }
  }, [token, id, toast, t])

  useEffect(() => {
    loadAddress()
  }, [loadAddress])

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) {
      toast.success(t('actions.copied', { defaultValue: 'Copied to clipboard!' }))
    } else {
      toast.error(t('actions.copyFailed', { defaultValue: 'Failed to copy' }))
    }
  }

  function statusLabel(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'active') return t('admin.detail.active', { defaultValue: 'Active' })
    if (v === 'pending_verification') {
      return t('admin.withdrawalAddress.pendingVerification', { defaultValue: 'Pending Verification' })
    }
    if (v === 'suspended') return t('admin.withdrawalAddress.suspended', { defaultValue: 'Suspended' })
    if (v === 'deleted') return t('admin.withdrawalAddress.deleted', { defaultValue: 'Deleted' })
    return String(s || 'N/A')
  }

  function openActionModal(type) {
    setActionType(type)
    setActionReason('')
    setSkipLockPeriod(false)
    setShowActionModal(true)
  }

  function getActionConfig() {
    switch (actionType) {
      case 'flag':
        return {
          title: t('admin.withdrawalAddress.flagAddress', { defaultValue: 'Flag Address' }),
          btnVariant: 'warning',
          btnLabel: t('admin.withdrawalAddress.flag', { defaultValue: 'Flag' }),
          icon: 'bx-flag',
        }
      case 'unflag':
        return {
          title: t('admin.withdrawalAddress.removeFlag', { defaultValue: 'Remove Flag' }),
          btnVariant: 'success',
          btnLabel: t('admin.withdrawalAddress.unflag', { defaultValue: 'Unflag' }),
          icon: 'bx-check-circle',
        }
      case 'forceVerify':
        return {
          title: t('admin.withdrawalAddress.forceVerify', { defaultValue: 'Force Verify' }),
          btnVariant: 'info',
          btnLabel: t('admin.withdrawalAddress.verify', { defaultValue: 'Verify' }),
          icon: 'bx-shield-quarter',
        }
      case 'delete':
        return {
          title: t('admin.withdrawalAddress.permanentDelete', { defaultValue: 'Permanent Delete' }),
          btnVariant: 'danger',
          btnLabel: t('admin.withdrawalAddress.deletePermanently', { defaultValue: 'Delete Permanently' }),
          icon: 'bx-trash',
        }
      default:
        return { title: '', btnVariant: 'primary', btnLabel: '', icon: '' }
    }
  }

  async function handleAction() {
    if (!actionReason.trim() || actionReason.trim().length < 10) {
      toast.error(
        t('admin.withdrawalAddress.reasonRequired', { defaultValue: 'Please provide a reason (minimum 10 characters)' })
      )
      return
    }

    try {
      setActionLoading(true)
      const addrId = parseInt(id)

      switch (actionType) {
        case 'flag':
          await flagWithdrawalAddress(token, addrId, actionReason.trim())
          toast.success(t('admin.withdrawalAddress.flagSuccess', { defaultValue: 'Address flagged successfully' }))
          break
        case 'unflag':
          await unflagWithdrawalAddress(token, addrId, actionReason.trim())
          toast.success(t('admin.withdrawalAddress.unflagSuccess', { defaultValue: 'Address unflagged successfully' }))
          break
        case 'forceVerify':
          await forceVerifyWithdrawalAddress(token, addrId, actionReason.trim(), skipLockPeriod)
          toast.success(
            t('admin.withdrawalAddress.verifySuccess', { defaultValue: 'Address force verified successfully' })
          )
          break
        case 'delete':
          await deleteWithdrawalAddress(token, addrId, actionReason.trim())
          toast.success(t('admin.withdrawalAddress.deleteSuccess', { defaultValue: 'Address permanently deleted' }))
          router.replace('/admin/withdrawal-addresses')
          return
      }

      setShowActionModal(false)
      setActionReason('')
      loadAddress()
    } catch (error) {
      logger.error(`Failed to ${actionType} address:`, error)
      toast.error(t('admin.withdrawalAddress.actionFailed', { defaultValue: `Failed to ${actionType} address` }))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!address) {
    return (
      <div className="grow pb-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[4rem] opacity-30"></i>
          <h5 className="text-surface-500 mt-3">
            {t('admin.withdrawalAddress.notFound', { defaultValue: 'Address not found' })}
          </h5>
          <Button className="mt-3" href="/admin/withdrawal-addresses">
            {t('admin.withdrawalAddress.backToAddresses', { defaultValue: 'Back to Addresses' })}
          </Button>
        </div>
      </div>
    )
  }

  const coinSymbol = (address.coinSymbol || '').toUpperCase()
  const networkSymbol = (address.networkSymbol || '').toUpperCase()
  const isFlagged = !!address.isFlagged
  const isVerified = !!address.isVerified

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back button */}
          <div className="mb-4">
            <Button variant="outline-secondary" className="gap-1" href="/admin/withdrawal-addresses">
              <i className="bx bx-arrow-back"></i>
              {t('admin.withdrawalAddress.backToAddresses', { defaultValue: 'Back to Withdrawal Addresses' })}
            </Button>
          </div>

          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={40} className="mr-1" />
                  <div>
                    <h4 className="mb-0">
                      {t('admin.withdrawalAddress.title', { defaultValue: 'Withdrawal Address' })} #{address.id}
                    </h4>
                    <span className="text-surface-500">
                      {coinSymbol} · {networkSymbol}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <RefreshButton onClick={loadAddress} loading={loading} />
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-x-6">
            <div className="col-span-12 lg:col-span-8">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    <i className="bx bx-detail mr-2"></i>
                    {t('admin.withdrawalAddress.addressDetails', { defaultValue: 'Address Details' })}
                  </h5>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-12 gap-x-6 gap-3">
                    <div className="col-span-12 sm:col-span-6">
                      <small className="text-surface-500 block mb-1">
                        {t('admin.withdrawalAddress.addressId', { defaultValue: 'Address ID' })}
                      </small>
                      <span className="font-semibold">{address.id}</span>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                      <small className="text-surface-500 block mb-1">
                        {t('admin.detail.userId', { defaultValue: 'User ID' })}
                      </small>
                      <span className="font-semibold">{address.userId}</span>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                      <small className="text-surface-500 block mb-1">
                        {t('admin.detail.label', { defaultValue: 'Label' })}
                      </small>
                      <span>{address.label ? address.label : <span className="text-surface-500">—</span>}</span>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                      <small className="text-surface-500 block mb-1">
                        {t('admin.detail.coinNetwork', { defaultValue: 'Coin / Network' })}
                      </small>
                      <div className="flex items-center gap-2">
                        <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={20} className="mr-1" />
                        <span className="font-medium">{coinSymbol}</span>
                        <span className="text-surface-500">/ {networkSymbol}</span>
                      </div>
                    </div>
                    <div className="col-span-12">
                      <small className="text-surface-500 block mb-1">
                        {t('admin.detail.address', { defaultValue: 'Address' })}
                      </small>
                      <div className="flex items-center gap-2">
                        <code className="text-primary text-[0.875rem] break-all">{address.address || 'N/A'}</code>
                        {address.address && (
                          <Button
                            onClick={() => handleCopy(address.address)}
                            title={t('actions.copy', { defaultValue: 'Copy' })}
                            size="icon-sm"
                            variant="text-secondary"
                          >
                            <i className="bx bx-copy text-[1rem]"></i>
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                      <small className="text-surface-500 block mb-1">
                        {t('admin.detail.created', { defaultValue: 'Created' })}
                      </small>
                      <span>{fmtDate(address.createdAt)}</span>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                      <small className="text-surface-500 block mb-1">
                        {t('admin.detail.updated', { defaultValue: 'Updated' })}
                      </small>
                      <span>{fmtDate(address.updatedAt)}</span>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                      <small className="text-surface-500 block mb-1">
                        {t('admin.detail.usageCount', { defaultValue: 'Usage Count' })}
                      </small>
                      <span className="font-semibold">{address.usageCount ?? 0}</span>
                    </div>
                    <div className="col-span-12 sm:col-span-6">
                      <small className="text-surface-500 block mb-1">
                        {t('admin.detail.totalWithdrawn', { defaultValue: 'Total Withdrawn' })}
                      </small>
                      <span className="font-semibold">{address.totalWithdrawn || '0'}</span>
                    </div>
                    {address.lockUntil && (
                      <div className="col-span-12 sm:col-span-6">
                        <small className="text-surface-500 block mb-1">
                          {t('admin.withdrawalAddress.lockUntil', { defaultValue: 'Lock Until' })}
                        </small>
                        <span>{fmtDate(address.lockUntil)}</span>
                        {address.isLocked && (
                          <Badge color="warning" label className="ml-2">
                            {t('admin.withdrawalAddress.locked', { defaultValue: 'Locked' })}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <AddressAuditLogTable auditLogs={address.auditLogs} />
            </div>

            <div className="col-span-12 lg:col-span-4">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    <i className="bx bx-info-circle mr-2"></i>
                    {t('admin.detail.status', { defaultValue: 'Status' })}
                  </h5>
                </div>
                <div className="p-5">
                  <div className="mb-3">
                    <small className="text-surface-500 block mb-1">
                      {t('admin.detail.status', { defaultValue: 'Status' })}
                    </small>
                    <span className={`${getStatusBadgeClass(address.status, 'withdrawalAddress')} text-[0.85rem]`}>
                      {statusLabel(address.status)}
                    </span>
                  </div>
                  <div className="mb-3">
                    <small className="text-surface-500 block mb-1">
                      {t('admin.detail.verified', { defaultValue: 'Verified' })}
                    </small>
                    {isVerified ? (
                      <span className="text-success font-medium">
                        <i className="bx bx-check-circle mr-1"></i>
                        {t('admin.detail.verified', { defaultValue: 'Verified' })}
                      </span>
                    ) : (
                      <span className="text-surface-500">
                        <i className="bx bx-x-circle mr-1"></i>
                        {t('admin.withdrawalAddress.notVerified', { defaultValue: 'Not Verified' })}
                      </span>
                    )}
                  </div>
                  <div className="mb-3">
                    <small className="text-surface-500 block mb-1">
                      {t('admin.detail.flagged', { defaultValue: 'Flagged' })}
                    </small>
                    {isFlagged ? (
                      <span className="text-warning font-medium">
                        <i className="bx bx-flag mr-1"></i>
                        {t('admin.detail.flagged', { defaultValue: 'Flagged' })}
                      </span>
                    ) : (
                      <span className="text-surface-500">
                        {t('admin.withdrawalAddress.notFlagged', { defaultValue: 'Not Flagged' })}
                      </span>
                    )}
                  </div>
                  {address.flaggedReason && (
                    <div className="mb-3">
                      <small className="text-surface-500 block mb-1">
                        {t('admin.withdrawalAddress.flagReason', { defaultValue: 'Flag Reason' })}
                      </small>
                      <span className="text-warning text-[0.85rem]">{address.flaggedReason}</span>
                    </div>
                  )}
                </div>
              </Card>

              {address.status !== 'deleted' && (
                <Card className="mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0">
                      <i className="bx bx-cog mr-2"></i>
                      {t('admin.detail.actions', { defaultValue: 'Actions' })}
                    </h5>
                  </div>
                  <div className="p-5 grid gap-2">
                    {!isFlagged ? (
                      <Button
                        onClick={() => openActionModal('flag')}
                        className="border border-warning-500 text-warning-500 bg-transparent hover:bg-warning-500 hover:text-white"
                      >
                        <i className="bx bx-flag mr-2"></i>
                        {t('admin.withdrawalAddress.flagAddress', { defaultValue: 'Flag Address' })}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => openActionModal('unflag')}
                        className="border border-success-500 text-success-500 bg-transparent hover:bg-success-500 hover:text-white"
                      >
                        <i className="bx bx-check-circle mr-2"></i>
                        {t('admin.withdrawalAddress.removeFlag', { defaultValue: 'Remove Flag' })}
                      </Button>
                    )}
                    {!isVerified && (
                      <Button
                        onClick={() => openActionModal('forceVerify')}
                        className="border border-info-500 text-info-500 bg-transparent hover:bg-info-500 hover:text-white"
                      >
                        <i className="bx bx-shield-quarter mr-2"></i>
                        {t('admin.withdrawalAddress.forceVerify', { defaultValue: 'Force Verify' })}
                      </Button>
                    )}
                    <hr className="my-1" />
                    <Button
                      onClick={() => openActionModal('delete')}
                      className="border border-danger-500 text-danger-500 bg-transparent hover:bg-danger-500 hover:text-white"
                    >
                      <i className="bx bx-trash mr-2"></i>
                      {t('admin.withdrawalAddress.deletePermanently', { defaultValue: 'Delete Permanently' })}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {showActionModal && (
        <AddressActionModal
          selectedAddress={address}
          actionType={actionType}
          actionConfig={getActionConfig()}
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
