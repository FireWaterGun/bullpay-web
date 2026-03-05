'use client';

import { useRouter } from 'next/navigation';
import CoinImg from '@/components/CoinImg';
import { useDateFormat } from '@/hooks/useDateFormat';
import { addressStatusBadgeClass } from './withdrawalHelpers';
import TableEmptyState from '@/components/TableEmptyState';
import { Badge, Button, Card } from '../ui'

function statusLabel(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'active') return 'Active';
  if (v === 'pending_verification') return 'Pending Verification';
  if (v === 'suspended') return 'Suspended';
  if (v === 'deleted') return 'Deleted';
  return String(s || '').toUpperCase();
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
  t
}) {
  const router = useRouter();
  const { fmtDate } = useDateFormat();

  return (
    <Card>
      <div className="p-5">
        <div className="overflow-x-auto overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="whitespace-nowrap">
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
              {addresses.length === 0 ?
              <TableEmptyState
                colSpan={12}
                icon="bx-map-pin"
                message="No withdrawal addresses found" /> :


              addresses.map((addr) => {
                const coinSymbol = (addr.coinSymbol || '').toUpperCase();
                const networkSymbol = (addr.networkSymbol || '').toUpperCase();
                const isFlagged = !!addr.isFlagged;
                const isVerified = !!addr.isVerified;

                return (
                  <tr className="cursor-pointer" key={addr.id} onClick={() => router.push(`/admin/withdrawal-addresses/${addr.id}`)}>
                      <td>
                        <span className="font-semibold text-primary">{addr.id}</span>
                      </td>
                      <td className="text-center">{addr.userId}</td>
                      <td>
                        <div className="flex items-center">
                          <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={28} className="mr-2" />
                          <div>
                            <div className="font-semibold text-[0.85rem]">{coinSymbol}</div>
                            <div className="text-muted text-xs">{networkSymbol}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted text-[0.85rem]">{addr.label || '-'}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <span className="text-[0.8rem]">
                            {addr.address || 'N/A'}
                          </span>
                          {addr.address &&
                        <Button

                          onClick={(e) => {e.stopPropagation();onCopy(addr.address);}}
                          title="Copy address" size="sm" className="p-0 border-0 text-muted shrink-0">

                          
                              <i className="bx bx-copy text-[0.85rem]"></i>
                            </Button>
                        }
                        </div>
                      </td>
                      <td className="text-center whitespace-nowrap">
                        <span className={addressStatusBadgeClass(addr.status)}>
                          {statusLabel(addr.status)}
                        </span>
                      </td>
                      <td className="text-center">
                        {isVerified ?
                      <i className="bx bx-check-circle text-success text-[1.1rem]"></i> :

                      <i className="bx bx-x-circle text-muted text-[1.1rem]"></i>
                      }
                      </td>
                      <td className="text-center">
                        {isFlagged ?
                      <Badge className="bg-amber-50 text-amber-700"><i className="bx bx-flag mr-1"></i>Flagged</Badge> :

                      <span className="text-muted">&mdash;</span>
                      }
                      </td>
                      <td className="text-right">
                        <span className="font-medium">{addr.usageCount ?? 0}</span>
                      </td>
                      <td className="text-right">
                        <span className="font-medium">{addr.totalWithdrawn || '0'}</span>
                      </td>
                      <td className="text-center">
                        <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                          <Button

                          type="button"
                          aria-expanded="false" variant="outline-secondary" size="sm" className="cursor-pointer text-xs py-[2px] px-[8px]">

                          
                            <i className="bx bx-dots-vertical-rounded"></i>
                          </Button>
                          <ul className="absolute z-50 mt-1 min-w-[160px] bg-white border border-surface-200 rounded-lg shadow-lg py-1 right-0">
                            {!isFlagged ?
                          <li>
                                <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => onOpenActionModal('flag', addr)}>
                                  <i className="bx bx-flag mr-2 text-warning"></i>Flag
                                </button>
                              </li> :

                          <li>
                                <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => onOpenActionModal('unflag', addr)}>
                                  <i className="bx bx-check-circle mr-2 text-success"></i>Unflag
                                </button>
                              </li>
                          }
                            {!isVerified &&
                          <li>
                                <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => onOpenActionModal('forceVerify', addr)}>
                                  <i className="bx bx-shield-quarter mr-2 text-info"></i>Force Verify
                                </button>
                              </li>
                          }
                            {addr.status !== 'deleted' &&
                          <>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer text-danger" onClick={() => onOpenActionModal('delete', addr)}>
                                    <i className="bx bx-trash mr-2"></i>Delete Permanently
                                  </button>
                                </li>
                              </>
                          }
                          </ul>
                        </div>
                      </td>
                      <td className="whitespace-nowrap text-[0.85rem]">
                        {fmtDate(addr.createdAt)}
                      </td>
                    </tr>);

              })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total > 0 &&
        <div className="flex justify-between items-center mt-4">
            <div className="text-muted text-sm">
              {t('invoices.showingEntries', {
              start: pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
              defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
            })}
            </div>
            <div className="inline-flex rounded-lg shadow-sm">
              <Button

              disabled={!pagination.hasPrev || loading}
              onClick={() => {setCurrentPage((p) => p - 1);syncSearchParams(appliedFilters, currentPage - 1);}} variant="outline-secondary" size="sm">
              
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </Button>
              <Button

              disabled variant="outline-secondary" size="sm">
              
                {pagination.page} / {pagination.totalPages}
              </Button>
              <Button

              disabled={!pagination.hasNext || loading}
              onClick={() => {setCurrentPage((p) => p + 1);syncSearchParams(appliedFilters, currentPage + 1);}} variant="outline-secondary" size="sm">
              
                {t('actions.next', { defaultValue: 'Next' })}
                <i className="bx bx-chevron-right"></i>
              </Button>
            </div>
          </div>
        }
      </div>
    </Card>);

}