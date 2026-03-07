'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import {
  getWithdrawalAddresses,
  flagWithdrawalAddress,
  unflagWithdrawalAddress,
  approveWithdrawalAddress,
  suspendWithdrawalAddress,
} from '@/lib/api/admin'
import AddressFilters from '@/components/balance/AddressFilters'
import AddressTable from '@/components/balance/AddressTable'
import AddressActionModal from '@/components/balance/AddressActionModal'
import RefreshButton from '@/components/RefreshButton'

export default function WithdrawalAddressesPage() {
  return (
    <Suspense>
      <WithdrawalAddressesContent />
    </Suspense>
  )
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

  const loadAddresses = useCallback(async () => {
    if (!token) return
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
      toast.error(t('withdrawalAddresses.loadError', { defaultValue: 'Failed to load addresses' }))
    } finally {
      setLoading(false)
    }
  }, [token, page, filters.status, filters.q, toast, t])

  useEffect(() => {
    loadAddresses()
  }, [loadAddresses])

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
        toast.success(t('withdrawalAddresses.approved', { defaultValue: 'Address approved' }))
      } else if (actionType === 'suspend') {
        await suspendWithdrawalAddress(token, actionAddress.id, reason)
        toast.success(t('withdrawalAddresses.suspended', { defaultValue: 'Address suspended' }))
      }
      setActionAddress(null)
      setActionType('')
      loadAddresses()
    } catch (err) {
      toast.error(err?.message || t('withdrawalAddresses.actionError', { defaultValue: 'Action failed' }))
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = pagination?.totalPages || 1

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <h4 className="text-xl font-semibold text-surface-900">
          {t('withdrawalAddresses.title', { defaultValue: 'Withdrawal Addresses' })}
        </h4>
        <RefreshButton onClick={loadAddresses} loading={loading} />
      </div>

      <AddressFilters
        filters={filters}
        onFilterChange={(f) => {
          setFilters(f)
          setPage(1)
        }}
        onReset={() => {
          setFilters({ status: '', q: '' })
          setPage(1)
        }}
        t={t}
      />

      <div className="bg-card rounded-xl shadow-sm border border-surface-100">
        <div className="p-5">
          {loading && addresses.length === 0 ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <AddressTable addresses={addresses} onAction={handleAction} t={t} />
          )}

          {pagination && pagination.total > 20 && (
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-surface-400">
                {t('common.page', { defaultValue: 'Page' })} {page} / {totalPages}
              </span>
              <div className="flex">
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-8 h-8 border border-surface-200 rounded-l-lg text-surface-500 hover:bg-surface-50 disabled:opacity-40 transition-colors cursor-pointer"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <i className="bx bx-chevron-left"></i>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-8 h-8 border border-l-0 border-surface-200 rounded-r-lg text-surface-500 hover:bg-surface-50 disabled:opacity-40 transition-colors cursor-pointer"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
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
        onClose={() => {
          setActionAddress(null)
          setActionType('')
        }}
        t={t}
      />
    </>
  )
}
