'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { getGasTopups, retryGasTopup } from '@/lib/api/admin'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { listCoins } from '@/lib/api/coins'
import GasTopupRow from '@/components/admin/GasTopupRow'
import GasTopupFilters from './GasTopupFilters'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'
import Card from '@/components/ui/Card'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import ConfirmModal from '@/components/ConfirmModal'

export default function GasTopups() {
  const { t } = useAdminTranslation()
  const toast = useToast()
  const searchParams = useNextSearchParams()
  const router = useRouter()

  const initPage = parseInt(searchParams.get('page')) || 1

  const [currentPage, setCurrentPage] = useState(initPage)
  const [retryingId, setRetryingId] = useState(null)
  const [confirmRetryId, setConfirmRetryId] = useState(null)

  const { data: coinNetworksData } = useApi(
    'admin-coin-networks-list',
    (token) => listCoins(token)
  )
  const coinNetworks = coinNetworksData || []

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    coinNetworkId: searchParams.get('coinNetworkId') || '',
    sweepId: searchParams.get('sweepId') || '',
    txHash: searchParams.get('txHash') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
  })

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (filters.status) f.status = filters.status
    if (filters.coinNetworkId) f.coinNetworkId = Number(filters.coinNetworkId)
    if (filters.sweepId) f.sweepId = Number(filters.sweepId)
    if (filters.txHash) f.txHash = filters.txHash
    if (filters.dateFrom) f.dateFrom = filters.dateFrom
    if (filters.dateTo) f.dateTo = filters.dateTo
    return f
  })

  const { data, isLoading, isValidating, mutate, token } = useApi(
    ['admin-gas-topups', currentPage, appliedFilters],
    (token) => getGasTopups(token, { page: currentPage, limit: 20, ...appliedFilters }),
    { onError: () => toast.error(t('gasTopup.loadError', { defaultValue: 'Failed to load gas topups' })), keepPreviousData: true }
  )
  const topups = data?.items || []
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
      status: filters.status || undefined,
      coinNetworkId: filters.coinNetworkId ? Number(filters.coinNetworkId) : undefined,
      sweepId: filters.sweepId ? Number(filters.sweepId) : undefined,
      txHash: filters.txHash || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setFilters({ status: '', coinNetworkId: '', sweepId: '', txHash: '', dateFrom: '', dateTo: '' })
    setAppliedFilters({})
    setCurrentPage(1)
    window.history.replaceState(null, '', window.location.pathname)
  }

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  async function handleRetry(topupId) {
    setConfirmRetryId(topupId)
  }

  async function confirmRetry() {
    const topupId = confirmRetryId
    setConfirmRetryId(null)
    try {
      setRetryingId(topupId)
      await retryGasTopup(token, topupId)
      toast.success(t('admin.gasTopup.retrySuccess', { defaultValue: 'Gas topup retry initiated successfully' }))
      mutate()
    } catch (error) {
      toast.error(error?.message || t('admin.gasTopup.retryError', { defaultValue: 'Failed to retry gas topup' }))
    } finally {
      setRetryingId(null)
    }
  }

  if (isLoading && topups.length === 0) {
    return <PageSpinner />
  }

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Header */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-gas-pump mr-2"></i>
                    {t('admin.gasTopup.listTitle', { defaultValue: 'Gas Topups' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.gasTopup.description', {
                      defaultValue: 'View all gas topup transactions and their status',
                    })}
                  </p>
                </div>
                <RefreshButton onClick={() => mutate()} loading={isValidating} />
              </div>
            </div>
            <GasTopupFilters
              coinNetworks={coinNetworks}
              filters={filters}
              onFiltersChange={setFilters}
              onApply={applyFilters}
              onReset={resetFilters}
              loading={isValidating}
            />
          </Card>

          {/* Table */}
          <Card>
            <Table>
              <thead>
                <tr className="whitespace-nowrap">
                  <th>{t('admin.gasTopup.id', { defaultValue: 'ID' })}</th>
                  <th>{t('admin.gasTopup.coin', { defaultValue: 'Coin' })}</th>
                  <th className="text-center">{t('admin.gasTopup.sweepId', { defaultValue: 'Sweep ID' })}</th>
                  <th className="text-right">{t('admin.gasTopup.topupGas', { defaultValue: 'Topup Gas' })}</th>
                  <th className="text-center">{t('admin.gasTopup.status', { defaultValue: 'Status' })}</th>
                  <th>{t('admin.gasTopup.txHash', { defaultValue: 'Tx Hash' })}</th>
                  <th>{t('admin.gasTopup.fromAddress', { defaultValue: 'From Address' })}</th>
                  <th>{t('admin.gasTopup.toAddress', { defaultValue: 'To Address' })}</th>
                  <th className="text-center">{t('admin.gasTopup.retry', { defaultValue: 'Retry' })}</th>
                  <th>{t('admin.gasTopup.created', { defaultValue: 'Created' })}</th>
                  <th>{t('admin.gasTopup.completedAt', { defaultValue: 'Completed' })}</th>
                </tr>
              </thead>
              <tbody>
                {topups.length === 0 ? (
                  <TableEmptyState
                    colSpan={11}
                    icon="bx-gas-pump"
                    message={t('admin.gasTopup.noTopups', { defaultValue: 'No gas topups found' })}
                    sub={t('admin.gasTopup.noTopupsSub', { defaultValue: 'No gas topups match the current filters' })}
                  />
                ) : (
                  topups.map((topup) => (
                    <GasTopupRow
                      key={topup.id}
                      topup={topup}
                      onCopy={handleCopy}
                      onNavigate={(id) => router.push(`/admin/wallet-gas-topups/${id}`)}
                      onRetry={handleRetry}
                      retryingId={retryingId}
                      t={t}
                    />
                  ))
                )}
              </tbody>
            </Table>

            <div className="px-5 py-1.5">
              <Pagination
                pagination={pagination}
                onPageChange={(p) => {
                  startTransition(() => setCurrentPage(p))
                  syncSearchParams(appliedFilters, p)
                }}
                loading={isValidating}
              />
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal
        show={confirmRetryId !== null}
        title={t('admin.gasTopup.retryConfirmTitle', { defaultValue: 'Retry Gas Topup' })}
        message={t('admin.gasTopup.retryConfirmMessage', { defaultValue: `Are you sure you want to retry gas topup #${confirmRetryId}? This will reset and re-process it.` })}
        confirmText={t('admin.gasTopup.retryConfirm', { defaultValue: 'Retry' })}
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        confirmVariant="warning"
        onConfirm={confirmRetry}
        onCancel={() => setConfirmRetryId(null)}
      />
    </div>
  )
}

