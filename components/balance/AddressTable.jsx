'use client'

import { useRouter } from 'next/navigation'
import CoinImg from '@/components/CoinImg'
import { useDateFormat } from '@/hooks/useDateFormat'
import { addressStatusBadgeClass } from './withdrawalHelpers'
import TableEmptyState from '@/components/TableEmptyState'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import ActionMenu from '@/components/ui/ActionMenu'

function statusLabel(s, t) {
  const v = String(s || '').toLowerCase()
  if (t) {
    if (v === 'active') return t('wallet.status.active', { defaultValue: 'Active' })
    if (v === 'pending_verification') {
      return t('wallet.status.pendingVerification', { defaultValue: 'Pending Verification' })
    }
    if (v === 'suspended') return t('wallet.status.suspended', { defaultValue: 'Suspended' })
    if (v === 'deleted') return t('wallet.status.deleted', { defaultValue: 'Deleted' })
  }
  return String(s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export default function AddressTable({
  addresses,
  loading,
  pagination,
  currentPage,
  setCurrentPage,
  syncSearchParams,
  appliedFilters,
  onCopy,
  onOpenActionModal,
  t,
}) {
  const router = useRouter()
  const { fmtDate } = useDateFormat()

  return (
    <Card>
      <Table>
        <thead>
          <tr className="whitespace-nowrap">
            <th>{t('admin.detail.id', { defaultValue: 'ID' })}</th>
            <th className="text-center">{t('admin.detail.userId', { defaultValue: 'User ID' })}</th>
            <th>{t('admin.detail.coin', { defaultValue: 'Coin' })}</th>
            <th>{t('admin.withdrawalAddress.label', { defaultValue: 'Label' })}</th>
            <th>{t('admin.detail.address', { defaultValue: 'Address' })}</th>
            <th className="text-center">{t('admin.detail.status', { defaultValue: 'Status' })}</th>
            <th className="text-center">{t('admin.withdrawalAddress.verified', { defaultValue: 'Verified' })}</th>
            <th className="text-center">{t('admin.withdrawalAddress.flagged', { defaultValue: 'Flagged' })}</th>
            <th className="text-right">{t('admin.withdrawalAddress.usage', { defaultValue: 'Usage' })}</th>
            <th className="text-right">{t('admin.withdrawalAddress.withdrawn', { defaultValue: 'Withdrawn' })}</th>
            <th className="text-center">{t('admin.detail.actions', { defaultValue: 'Actions' })}</th>
            <th>{t('admin.detail.created', { defaultValue: 'Created' })}</th>
          </tr>
        </thead>
        <tbody>
          {addresses.length === 0 ? (
            <TableEmptyState
              colSpan={12}
              icon="bx-map-pin"
              message={t('admin.withdrawalAddress.noAddresses', { defaultValue: 'No withdrawal addresses found' })}
            />
          ) : (
            addresses.map((addr) => {
              const coinSymbol = (addr.coinSymbol || '').toUpperCase()
              const networkSymbol = (addr.networkSymbol || '').toUpperCase()
              const isFlagged = !!addr.isFlagged
              const isVerified = !!addr.isVerified

              return (
                <tr
                  className="cursor-pointer"
                  key={addr.id}
                  onClick={() => router.push(`/admin/withdrawal-addresses/${addr.id}`)}
                >
                  <td>
                    <span className="font-semibold text-primary">{addr.id}</span>
                  </td>
                  <td className="text-center">{addr.userId}</td>
                  <td>
                    <div className="flex items-center">
                      <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={28} className="mr-2" />
                      <div>
                        <div className="font-semibold text-[0.85rem]">{coinSymbol}</div>
                        <div className="text-surface-500 text-xs">{networkSymbol}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-surface-500 text-[0.85rem]">{addr.label || '-'}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <span className="text-[0.8rem]">{addr.address || '-'}</span>
                      {addr.address && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onCopy(addr.address)
                          }}
                          title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                          className="inline-flex items-center justify-center w-6 h-6 rounded text-surface-500 hover:text-primary transition-colors shrink-0"
                        >
                          <i className="bx bx-copy text-[0.85rem]"></i>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="text-center whitespace-nowrap">
                    <span className={addressStatusBadgeClass(addr.status)}>{statusLabel(addr.status, t)}</span>
                  </td>
                  <td className="text-center">
                    {isVerified ? (
                      <i className="bx bx-check-circle text-success text-[1.1rem]"></i>
                    ) : (
                      <i className="bx bx-x-circle text-surface-500 text-[1.1rem]"></i>
                    )}
                  </td>
                  <td className="text-center">
                    {isFlagged ? (
                      <Badge color="warning" label>
                        <i className="bx bx-flag mr-1"></i>
                        {t('admin.withdrawalAddress.flagged', { defaultValue: 'Flagged' })}
                      </Badge>
                    ) : (
                      <span className="text-surface-500">&mdash;</span>
                    )}
                  </td>
                  <td className="text-right">
                    <span className="font-medium">{addr.usageCount ?? 0}</span>
                  </td>
                  <td className="text-right">
                    <span className="font-medium">{addr.totalWithdrawn || '0'}</span>
                  </td>
                  <td className="text-center">
                    <ActionMenu>
                      {!isFlagged ? (
                        <ActionMenu.Item icon="bx-flag" onClick={() => onOpenActionModal('flag', addr)}>
                          {t('admin.withdrawalAddress.flag', { defaultValue: 'Flag' })}
                        </ActionMenu.Item>
                      ) : (
                        <ActionMenu.Item icon="bx-check-circle" onClick={() => onOpenActionModal('unflag', addr)}>
                          {t('admin.withdrawalAddress.unflag', { defaultValue: 'Unflag' })}
                        </ActionMenu.Item>
                      )}
                      {!isVerified && (
                        <ActionMenu.Item
                          icon="bx-shield-quarter"
                          onClick={() => onOpenActionModal('forceVerify', addr)}
                        >
                          {t('admin.withdrawalAddress.forceVerify', { defaultValue: 'Force Verify' })}
                        </ActionMenu.Item>
                      )}
                    </ActionMenu>
                  </td>
                  <td className="whitespace-nowrap text-[0.85rem]">{fmtDate(addr.createdAt)}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </Table>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="px-5 py-1.5">
          <Pagination
            pagination={pagination}
            loading={loading}
            onPageChange={(p) => {
              setCurrentPage(p)
              syncSearchParams(appliedFilters, p)
            }}
          />
        </div>
      )}
    </Card>
  )
}
