'use client'

import { useRouter } from 'next/navigation'
import CoinImg from '@/components/CoinImg'
import { useDateFormat } from '@/hooks/useDateFormat'
import { addressStatusBadgeClass } from './withdrawalHelpers'

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
      <div className="card-body">
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="table table-hover" style={{ minWidth: '1000px' }}>
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
                <th className="text-end">Usage</th>
                <th className="text-end">Withdrawn</th>
                <th className="text-center">Actions</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {addresses.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center text-muted py-4">
                    No withdrawal addresses found
                  </td>
                </tr>
              ) : (
                addresses.map((addr) => {
                  const coinSymbol = (addr.coinSymbol || '').toUpperCase()
                  const networkSymbol = (addr.networkSymbol || '').toUpperCase()
                  const isFlagged = !!addr.isFlagged
                  const isVerified = !!addr.isVerified

                  return (
                    <tr key={addr.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/admin/withdrawal-addresses/${addr.id}`)}>
                      <td>
                        <span className="fw-semibold text-primary">{addr.id}</span>
                      </td>
                      <td className="text-center">{addr.userId}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={28} className="me-2" />
                          <div>
                            <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{coinSymbol}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{networkSymbol}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>{addr.label || '-'}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1" style={{ whiteSpace: 'nowrap' }}>
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
                      <td className="text-center text-nowrap">
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
                          <span className="badge bg-label-warning"><i className="bx bx-flag me-1"></i>Flagged</span>
                        ) : (
                          <span className="text-muted">&mdash;</span>
                        )}
                      </td>
                      <td className="text-end">
                        <span className="fw-medium">{addr.usageCount ?? 0}</span>
                      </td>
                      <td className="text-end">
                        <span className="fw-medium">{addr.totalWithdrawn || '0'}</span>
                      </td>
                      <td className="text-center">
                        <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-sm btn-outline-secondary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                          >
                            <i className="bx bx-dots-vertical-rounded"></i>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end">
                            {!isFlagged ? (
                              <li>
                                <button className="dropdown-item" onClick={() => onOpenActionModal('flag', addr)}>
                                  <i className="bx bx-flag me-2 text-warning"></i>Flag
                                </button>
                              </li>
                            ) : (
                              <li>
                                <button className="dropdown-item" onClick={() => onOpenActionModal('unflag', addr)}>
                                  <i className="bx bx-check-circle me-2 text-success"></i>Unflag
                                </button>
                              </li>
                            )}
                            {!isVerified && (
                              <li>
                                <button className="dropdown-item" onClick={() => onOpenActionModal('forceVerify', addr)}>
                                  <i className="bx bx-shield-quarter me-2 text-info"></i>Force Verify
                                </button>
                              </li>
                            )}
                            {addr.status !== 'deleted' && (
                              <>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <button className="dropdown-item text-danger" onClick={() => onOpenActionModal('delete', addr)}>
                                    <i className="bx bx-trash me-2"></i>Delete Permanently
                                  </button>
                                </li>
                              </>
                            )}
                          </ul>
                        </div>
                      </td>
                      <td className="text-nowrap" style={{ fontSize: '0.85rem' }}>
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
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="text-muted small">
              {t('invoices.showingEntries', {
                start: pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0,
                end: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total,
                defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
              })}
            </div>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={!pagination.hasPrev || loading}
                onClick={() => { setCurrentPage(p => p - 1); syncSearchParams(appliedFilters, currentPage - 1) }}
              >
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled
              >
                {pagination.page} / {pagination.totalPages}
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
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
