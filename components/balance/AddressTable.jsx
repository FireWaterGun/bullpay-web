'use client'

import { useRouter } from 'next/navigation'
import CoinImg from '@/components/CoinImg'
import { useDateFormat } from '@/hooks/useDateFormat'
import { addressStatusBadgeClass } from './withdrawalHelpers'
import TableEmptyState from '@/components/TableEmptyState'

function statusLabel(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'active') return 'Active'
  if (v === 'pending_verification') return 'Pending Verification'
  if (v === 'suspended') return 'Suspended'
  if (v === 'deleted') return 'Deleted'
  return String(s || '').toUpperCase()
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
    <div className="card">
      <div className="p-5">
        <div className="overflow-x-auto" style={{ overflowX: 'auto' }}>
          <table className="w-full" style={{ minWidth: '1000px' }}>
            <thead>
              <tr style={{ whiteSpace: 'nowrap' }}>
                <th>ID</th>
                <th className="text-center">User ID</th>
                <th>Coin</th>
                <th>Label</th>
                <th>Address</th>
                <th className="text-center">Status</th>
                <th className="text-center">Verified</th>
                <th className="text-center">Flagged</th>
                <th className="text-right">Usage</th>
                <th className="text-right">Withdrawn</th>
                <th className="text-center">Actions</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {addresses.length === 0 ? (
                <TableEmptyState
                  colSpan={12}
                  icon="bx-map-pin"
                  message="No withdrawal addresses found"
                />
              ) : (
                addresses.map((addr) => {
                  const coinSymbol = (addr.coinSymbol || '').toUpperCase()
                  const networkSymbol = (addr.networkSymbol || '').toUpperCase()
                  const isFlagged = !!addr.isFlagged
                  const isVerified = !!addr.isVerified

                  return (
                    <tr key={addr.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/withdrawal-addresses/${addr.id}`)}>
                      <td>
                        <span className="font-semibold text-primary">{addr.id}</span>
                      </td>
                      <td className="text-center">{addr.userId}</td>
                      <td>
                        <div className="flex items-center">
                          <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={28} className="mr-2" />
                          <div>
                            <div className="font-semibold" style={{ fontSize: '0.85rem' }}>{coinSymbol}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{networkSymbol}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>{addr.label || '-'}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1" style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.8rem' }}>
                            {addr.address || 'N/A'}
                          </span>
                          {addr.address && (
                            <button
                              className="btn btn-sm p-0 border-0 text-muted"
                              onClick={(e) => { e.stopPropagation(); onCopy(addr.address) }}
                              title="Copy address"
                              style={{ flexShrink: 0 }}
                            >
                              <i className="bx bx-copy" style={{ fontSize: '0.85rem' }}></i>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-center whitespace-nowrap">
                        <span className={addressStatusBadgeClass(addr.status)}>
                          {statusLabel(addr.status)}
                        </span>
                      </td>
                      <td className="text-center">
                        {isVerified ? (
                          <i className="bx bx-check-circle text-success" style={{ fontSize: '1.1rem' }}></i>
                        ) : (
                          <i className="bx bx-x-circle text-muted" style={{ fontSize: '1.1rem' }}></i>
                        )}
                      </td>
                      <td className="text-center">
                        {isFlagged ? (
                          <span className="badge bg-amber-50 text-amber-700"><i className="bx bx-flag mr-1"></i>Flagged</span>
                        ) : (
                          <span className="text-muted">&mdash;</span>
                        )}
                      </td>
                      <td className="text-right">
                        <span className="font-medium">{addr.usageCount ?? 0}</span>
                      </td>
                      <td className="text-right">
                        <span className="font-medium">{addr.totalWithdrawn || '0'}</span>
                      </td>
                      <td className="text-center">
                        <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 cursor-pointer"
                            type="button"
                            aria-expanded="false"
                            style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                          >
                            <i className="bx bx-dots-vertical-rounded"></i>
                          </button>
                          <ul className="absolute z-50 mt-1 min-w-[160px] bg-white border border-surface-200 rounded-lg shadow-lg py-1 right-0">
                            {!isFlagged ? (
                              <li>
                                <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => onOpenActionModal('flag', addr)}>
                                  <i className="bx bx-flag mr-2 text-warning"></i>Flag
                                </button>
                              </li>
                            ) : (
                              <li>
                                <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => onOpenActionModal('unflag', addr)}>
                                  <i className="bx bx-check-circle mr-2 text-success"></i>Unflag
                                </button>
                              </li>
                            )}
                            {!isVerified && (
                              <li>
                                <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => onOpenActionModal('forceVerify', addr)}>
                                  <i className="bx bx-shield-quarter mr-2 text-info"></i>Force Verify
                                </button>
                              </li>
                            )}
                            {addr.status !== 'deleted' && (
                              <>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer text-danger" onClick={() => onOpenActionModal('delete', addr)}>
                                    <i className="bx bx-trash mr-2"></i>Delete Permanently
                                  </button>
                                </li>
                              </>
                            )}
                          </ul>
                        </div>
                      </td>
                      <td className="whitespace-nowrap" style={{ fontSize: '0.85rem' }}>
                        {fmtDate(addr.createdAt)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-muted text-sm">
              {t('invoices.showingEntries', {
                start: pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0,
                end: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total,
                defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
              })}
            </div>
            <div className="inline-flex rounded-lg shadow-sm">
              <button
                className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm"
                disabled={!pagination.hasPrev || loading}
                onClick={() => { setCurrentPage(p => p - 1); syncSearchParams(appliedFilters, currentPage - 1) }}
              >
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </button>
              <button
                className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm"
                disabled
              >
                {pagination.page} / {pagination.totalPages}
              </button>
              <button
                className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100 btn-sm"
                disabled={!pagination.hasNext || loading}
                onClick={() => { setCurrentPage(p => p + 1); syncSearchParams(appliedFilters, currentPage + 1) }}
              >
                {t('actions.next', { defaultValue: 'Next' })}
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
