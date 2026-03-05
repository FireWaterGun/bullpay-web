'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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

function AddressAuditLogTable({ auditLogs }) {
  const { fmtDate } = useDateFormat()
  if (!auditLogs || auditLogs.length === 0) return null

  return (
    <div className="card mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0"><i className="bx bx-history mr-2"></i>Audit Log</h5>
      </div>
      <div className="p-5 p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm mb-0">
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
                  <td><span className="font-medium">{log.action}</span></td>
                  <td>{log.adminId || log.performedBy || '—'}</td>
                  <td className="text-muted" style={{ maxWidth: 300, whiteSpace: 'normal' }}>{log.reason || '—'}</td>
                  <td className="whitespace-nowrap">{fmtDate(log.createdAt || log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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

  useEffect(() => {
    loadAddress()
  }, [id])

  async function loadAddress() {
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
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('actions.copied', { defaultValue: 'Copied to clipboard!' }))
    else toast.error(t('actions.copyFailed', { defaultValue: 'Failed to copy' }))
  }

  function statusBadgeClass(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'active') return 'badge bg-green-50 text-green-700'
    if (v === 'pending_verification') return 'badge bg-amber-50 text-amber-700'
    if (v === 'suspended') return 'badge bg-red-50 text-red-700'
    if (v === 'deleted') return 'badge bg-surface-100 text-surface-600'
    return 'badge bg-surface-100 text-surface-600'
  }

  function statusLabel(s) {
    const v = String(s || '').toLowerCase()
    if (v === 'active') return 'Active'
    if (v === 'pending_verification') return 'Pending Verification'
    if (v === 'suspended') return 'Suspended'
    if (v === 'deleted') return 'Deleted'
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
    if (!actionReason.trim() || actionReason.trim().length < 10) {
      toast.error(t('admin.withdrawalAddress.reasonRequired', { defaultValue: 'Please provide a reason (minimum 10 characters)' }))
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
          toast.success(t('admin.withdrawalAddress.verifySuccess', { defaultValue: 'Address force verified successfully' }))
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
      <div className="grow py-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
          <h5 className="text-muted mt-3">{t('admin.withdrawalAddress.notFound', { defaultValue: 'Address not found' })}</h5>
          <Link href="/admin/withdrawal-addresses" className="btn btn-primary mt-3">
            <i className="bx bx-arrow-back mr-1"></i>Back to Addresses
          </Link>
        </div>
      </div>
    )
  }

  const coinSymbol = (address.coinSymbol || '').toUpperCase()
  const networkSymbol = (address.networkSymbol || '').toUpperCase()
  const isFlagged = !!address.isFlagged
  const isVerified = !!address.isVerified

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Link href="/admin/withdrawal-addresses" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 mb-3">
            <i className="bx bx-arrow-back mr-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </Link>

          <div className="card mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={40} className="mr-1" />
                  <div>
                    <h4 className="mb-0">
                      Withdrawal Address #{address.id}
                    </h4>
                    <span className="text-muted">{coinSymbol} on {networkSymbol}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <RefreshButton onClick={loadAddress} loading={loading} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-x-6">
            <div className="lg:col-span-8">
              <div className="card mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0"><i className="bx bx-detail mr-2"></i>Address Details</h5>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-12 gap-x-6 gap-3">
                    <div className="sm:col-span-6">
                      <small className="text-muted block mb-1">Address ID</small>
                      <span className="font-semibold">{address.id}</span>
                    </div>
                    <div className="sm:col-span-6">
                      <small className="text-muted block mb-1">{t('admin.detail.userId', { defaultValue: 'User ID' })}</small>
                      <span className="font-semibold">{address.userId}</span>
                    </div>
                    <div className="sm:col-span-6">
                      <small className="text-muted block mb-1">Label</small>
                      <span>{address.label ? address.label : <span className="text-muted">—</span>}</span>
                    </div>
                    <div className="sm:col-span-6">
                      <small className="text-muted block mb-1">{t('admin.detail.coinNetwork', { defaultValue: 'Coin / Network' })}</small>
                      <div className="flex items-center gap-2">
                        <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={20} className="mr-1" />
                        <span className="font-medium">{coinSymbol}</span>
                        <span className="text-muted">/ {networkSymbol}</span>
                      </div>
                    </div>
                    <div className="col-span-12">
                      <small className="text-muted block mb-1">{t('admin.detail.address', { defaultValue: 'Address' })}</small>
                      <div className="flex items-center gap-2">
                        <code className="text-primary" style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>
                          {address.address || 'N/A'}
                        </code>
                        {address.address && (
                          <button
                            className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full"
                            onClick={() => handleCopy(address.address)}
                            title={t('actions.copy', { defaultValue: 'Copy' })}
                          >
                            <i className="bx bx-copy" style={{ fontSize: '1rem' }}></i>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="sm:col-span-6">
                      <small className="text-muted block mb-1">{t('admin.detail.created', { defaultValue: 'Created' })}</small>
                      <span>{fmtDate(address.createdAt)}</span>
                    </div>
                    <div className="sm:col-span-6">
                      <small className="text-muted block mb-1">{t('admin.detail.updated', { defaultValue: 'Updated' })}</small>
                      <span>{fmtDate(address.updatedAt)}</span>
                    </div>
                    <div className="sm:col-span-6">
                      <small className="text-muted block mb-1">Usage Count</small>
                      <span className="font-semibold">{address.usageCount ?? 0}</span>
                    </div>
                    <div className="sm:col-span-6">
                      <small className="text-muted block mb-1">Total Withdrawn</small>
                      <span className="font-semibold">{address.totalWithdrawn || '0'}</span>
                    </div>
                    {address.lockUntil && (
                      <div className="sm:col-span-6">
                        <small className="text-muted block mb-1">Lock Until</small>
                        <span>{fmtDate(address.lockUntil)}</span>
                        {address.isLocked && <span className="badge bg-amber-50 text-amber-700 ml-2">Locked</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <AddressAuditLogTable auditLogs={address.auditLogs} />
            </div>

            <div className="lg:col-span-4">
              <div className="card mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0"><i className="bx bx-info-circle mr-2"></i>{t('admin.detail.status', { defaultValue: 'Status' })}</h5>
                </div>
                <div className="p-5">
                  <div className="mb-3">
                    <small className="text-muted block mb-1">{t('admin.detail.status', { defaultValue: 'Status' })}</small>
                    <span className={statusBadgeClass(address.status)} style={{ fontSize: '0.85rem' }}>
                      {statusLabel(address.status)}
                    </span>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted block mb-1">Verified</small>
                    {isVerified ? (
                      <span className="text-success font-medium"><i className="bx bx-check-circle mr-1"></i>Verified</span>
                    ) : (
                      <span className="text-muted"><i className="bx bx-x-circle mr-1"></i>Not Verified</span>
                    )}
                  </div>
                  <div className="mb-3">
                    <small className="text-muted block mb-1">Flagged</small>
                    {isFlagged ? (
                      <span className="text-warning font-medium"><i className="bx bx-flag mr-1"></i>Flagged</span>
                    ) : (
                      <span className="text-muted">Not Flagged</span>
                    )}
                  </div>
                  {address.flaggedReason && (
                    <div className="mb-3">
                      <small className="text-muted block mb-1">Flag Reason</small>
                      <span className="text-warning" style={{ fontSize: '0.85rem' }}>{address.flaggedReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {address.status !== 'deleted' && (
                <div className="card mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0"><i className="bx bx-cog mr-2"></i>{t('admin.detail.actions', { defaultValue: 'Actions' })}</h5>
                  </div>
                  <div className="p-5 grid gap-2">
                    {!isFlagged ? (
                      <button className="btn btn border border-warning-500 text-warning-500 bg-transparent hover:bg-warning-500 hover:text-white" onClick={() => openActionModal('flag')}>
                        <i className="bx bx-flag mr-2"></i>Flag Address
                      </button>
                    ) : (
                      <button className="btn btn border border-success-500 text-success-500 bg-transparent hover:bg-success-500 hover:text-white" onClick={() => openActionModal('unflag')}>
                        <i className="bx bx-check-circle mr-2"></i>Remove Flag
                      </button>
                    )}
                    {!isVerified && (
                      <button className="btn btn border border-info-500 text-info-500 bg-transparent hover:bg-info-500 hover:text-white" onClick={() => openActionModal('forceVerify')}>
                        <i className="bx bx-shield-quarter mr-2"></i>Force Verify
                      </button>
                    )}
                    <hr className="my-1" />
                    <button className="btn btn border border-danger-500 text-danger-500 bg-transparent hover:bg-danger-500 hover:text-white" onClick={() => openActionModal('delete')}>
                      <i className="bx bx-trash mr-2"></i>Delete Permanently
                    </button>
                  </div>
                </div>
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
        />
      )}
    </div>
  )
}
