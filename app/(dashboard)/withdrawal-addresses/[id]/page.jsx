'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getWithdrawalAddressById, approveWithdrawalAddress, suspendWithdrawalAddress } from '@/lib/api/admin'
import { formatDate } from '@/lib/utils/format'
import { copyToClipboard } from '@/lib/utils/clipboard'
import CoinImg from '@/components/CoinImg'
import { addressStatusBadgeClass, formatAddressStatus } from '@/components/balance/withdrawalHelpers'
import AddressActionModal from '@/components/balance/AddressActionModal'
import AddressAuditLog from '@/components/balance/AddressAuditLog'
import RefreshButton from '@/components/RefreshButton'

export default function WithdrawalAddressDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const addressId = params?.id
  const [address, setAddress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionType, setActionType] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (token && addressId) loadAddress()
  }, [token, addressId])

  async function loadAddress() {
    try {
      setLoading(true)
      const data = await getWithdrawalAddressById(token, addressId)
      setAddress(data)
    } catch (err) {
      toast.error( err?.message || t('withdrawalAddresses.loadError', { defaultValue: 'Failed to load address' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text) {
    const ok = await copyToClipboard(text)
    if (ok) toast.success( t('common.copied', { defaultValue: 'Copied!' }))
  }

  async function handleConfirmAction(reason) {
    if (!address) return
    try {
      setActionLoading(true)
      if (actionType === 'approve') {
        await approveWithdrawalAddress(token, address.id)
        toast.success( t('withdrawalAddresses.approved', { defaultValue: 'Address approved' }))
      } else if (actionType === 'suspend') {
        await suspendWithdrawalAddress(token, address.id, reason)
        toast.success( t('withdrawalAddresses.suspended', { defaultValue: 'Address suspended' }))
      }
      setActionType('')
      loadAddress()
    } catch (err) {
      toast.error( err?.message || t('withdrawalAddresses.actionError', { defaultValue: 'Action failed' }))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && !address) {
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

  if (!address) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-danger">{t('withdrawalAddresses.notFound', { defaultValue: 'Address not found' })}</div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="d-flex align-items-center mb-4">
        <button className="btn btn-text-secondary me-2" onClick={() => router.back()}>
          <i className="bx bx-arrow-back"></i>
        </button>
        <div>
          <h4 className="fw-bold mb-0">{t('withdrawalAddresses.detail', { defaultValue: 'Address Detail' })} #{address.id}</h4>
          <span className={addressStatusBadgeClass(address.status)}>
            {formatAddressStatus(address.status)}
          </span>
        </div>
        <RefreshButton onClick={loadAddress} loading={loading} />
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">{t('withdrawalAddresses.details', { defaultValue: 'Address Details' })}</h6>
            </div>
            <div className="card-body">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: 160 }}>{t('withdrawalAddresses.user', { defaultValue: 'User' })}</td>
                    <td>{address.user?.email || address.userId || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">{t('withdrawalAddresses.coin', { defaultValue: 'Coin' })}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <CoinImg symbol={address.coin?.symbol} networkSymbol={address.network?.symbol} size={20} />
                        <span>{address.coin?.symbol || '-'} ({address.network?.name || address.network?.symbol || ''})</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">{t('withdrawalAddresses.label', { defaultValue: 'Label' })}</td>
                    <td>{address.label || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">{t('withdrawalAddresses.address', { defaultValue: 'Address' })}</td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <span className="font-monospace small text-break">{address.address || '-'}</span>
                        {address.address && (
                          <button className="btn btn-sm btn-icon btn-text-secondary flex-shrink-0" onClick={() => handleCopy(address.address)}>
                            <i className="bx bx-copy"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {address.memo && (
                    <tr>
                      <td className="text-muted">{t('withdrawalAddresses.memo', { defaultValue: 'Memo' })}</td>
                      <td>{address.memo}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-muted">{t('withdrawalAddresses.created', { defaultValue: 'Created' })}</td>
                    <td>{formatDate(address.createdAt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="d-flex gap-2">
                {address.status !== 'active' && (
                  <button className="btn btn-success btn-sm" onClick={() => setActionType('approve')}>
                    <i className="bx bx-check me-1"></i>{t('common.approve', { defaultValue: 'Approve' })}
                  </button>
                )}
                {address.status !== 'suspended' && (
                  <button className="btn btn-danger btn-sm" onClick={() => setActionType('suspend')}>
                    <i className="bx bx-block me-1"></i>{t('common.suspend', { defaultValue: 'Suspend' })}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">{t('withdrawalAddresses.auditLog', { defaultValue: 'Audit Log' })}</h6>
            </div>
            <div className="card-body">
              <AddressAuditLog logs={address.auditLogs || []} t={t} />
            </div>
          </div>
        </div>
      </div>

      {actionType && (
        <AddressActionModal
          show
          address={address}
          action={actionType}
          loading={actionLoading}
          onConfirm={handleConfirmAction}
          onClose={() => setActionType('')}
          t={t}
        />
      )}
    </div>
  )
}
