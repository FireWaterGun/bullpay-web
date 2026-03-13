'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
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
import AddressActionModal from '@/components/balance/AddressActionModal'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import AddressAuditLogTable from '@/components/admin/withdrawal-addresses/AddressAuditLogTable'
import AddressDetailsCard from '@/components/admin/withdrawal-addresses/AddressDetailsCard'
import AddressStatusCard from '@/components/admin/withdrawal-addresses/AddressStatusCard'
import AddressActionsCard from '@/components/admin/withdrawal-addresses/AddressActionsCard'

export default function WithdrawalAddressDetail() {
  const { t } = useAdminTranslation()
  const toast = useToast()
  const router = useRouter()
  const { id } = useParams()

  const { data: addressRaw, isLoading, isValidating, mutate, token } = useApi(
    id ? `admin-withdrawal-address-${id}` : null,
    (token) => getWithdrawalAddressById(token, parseInt(id)),
    { onError: () => toast.error(t('admin.withdrawalAddress.loadDetailError', { defaultValue: 'Failed to load withdrawal address' })) }
  )
  const address = addressRaw?.address && typeof addressRaw.address === 'object' ? addressRaw.address : addressRaw

  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState('')
  const [actionReason, setActionReason] = useState('')
  const [skipLockPeriod, setSkipLockPeriod] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

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
                  <RefreshButton onClick={() => mutate()} loading={isValidating} />
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
                <AddressDetailsCard address={address} t={t} onCopy={handleCopy} />
              </Card>

              <AddressAuditLogTable auditLogs={address.auditLogs} />
            </div>

            <div className="col-span-12 lg:col-span-4">
              <AddressStatusCard address={address} t={t} statusLabel={statusLabel} />
              <AddressActionsCard address={address} t={t} onAction={openActionModal} />
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
