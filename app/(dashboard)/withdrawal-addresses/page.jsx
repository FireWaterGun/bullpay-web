'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getWithdrawalAddresses, flagWithdrawalAddress, unflagWithdrawalAddress, approveWithdrawalAddress, suspendWithdrawalAddress } from '@/lib/api/admin'
import AddressFilters from '@/components/balance/AddressFilters'
import AddressTable from '@/components/balance/AddressTable'
import AddressActionModal from '@/components/balance/AddressActionModal'

export default function WithdrawalAddressesPage() {
  return <Suspense><WithdrawalAddressesContent /></Suspense>
}

function WithdrawalAddressesContent() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const [addresses, setAddresses] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(Number(searchParams?.get('page')) || 1)
  const [filters, setFilters] = useState({
    status: searchParams?.get('status') || '',
    q: searchParams?.get('q') || '',
  })

  const [actionAddress, setActionAddress] = useState(null)
  const [actionType, setActionType] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (token) loadAddresses()
  }, [token, page, filters.status, filters.q])

  async function loadAddresses() {
    try {
      setLoading(true)
      const data = await getWithdrawalAddresses(token, {
        page,
        limit: 20,
        status: filters.status || undefined,
        search: filters.q || undefined,
      })
      setAddresses(data.items || [])
      setPagination(data.pagination || null)
    } catch (err) {
      toast.error( t('withdrawalAddresses.loadError', { defaultValue: 'Failed to load addresses' }))
    } finally {
      setLoading(false)
    }
  }

  function handleAction(addr, action) {
    setActionAddress(addr)
    setActionType(action)
  }

  async function handleConfirmAction(reason) {
    if (!actionAddress) return
    try {
      setActionLoading(true)
      if (actionType === 'approve') {
        await approveWithdrawalAddress(token, actionAddress.id)
        toast.success( t('withdrawalAddresses.approved', { defaultValue: 'Address approved' }))
      } else if (actionType === 'suspend') {
        await suspendWithdrawalAddress(token, actionAddress.id, reason)
        toast.success( t('withdrawalAddresses.suspended', { defaultValue: 'Address suspended' }))
      }
      setActionAddress(null)
      setActionType('')
      loadAddresses()
    } catch (err) {
      toast.error( err?.message || t('withdrawalAddresses.actionError', { defaultValue: 'Action failed' }))
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = pagination?.totalPages || 1

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <h4 className="fw-bold mb-4">{t('withdrawalAddresses.title', { defaultValue: 'Withdrawal Addresses' })}</h4>

      <AddressFilters
        filters={filters}
        onFilterChange={(f) => { setFilters(f); setPage(1) }}
        onReset={() => { setFilters({ status: '', q: '' }); setPage(1) }}
        t={t}
      />

      <div className="card">
        <div className="card-body">
          {loading && addresses.length === 0 ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <AddressTable
              addresses={addresses}
              onAction={handleAction}
              t={t}
            />
          )}

          {pagination && pagination.total > 20 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">{t('common.page', { defaultValue: 'Page' })} {page} / {totalPages}</small>
              <div className="btn-group">
                <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <i className="bx bx-chevron-left"></i>
                </button>
                <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <i className="bx bx-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddressActionModal
        show={!!actionAddress}
        address={actionAddress}
        action={actionType}
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onClose={() => { setActionAddress(null); setActionType('') }}
        t={t}
      />
    </div>
  )
}
