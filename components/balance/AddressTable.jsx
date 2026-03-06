'use client';

import { useRouter } from 'next/navigation';
import CoinImg from '@/components/CoinImg';
import { useDateFormat } from '@/hooks/useDateFormat';
import { addressStatusBadgeClass } from './withdrawalHelpers';
import TableEmptyState from '@/components/TableEmptyState';
import Pagination from '@/components/ui/Pagination';
import Table from '@/components/ui/Table';
import { Badge, Button, Card } from '@/components/ui'
import ActionMenu from '@/components/ui/ActionMenu'

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
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="whitespace-nowrap border-b border-surface-200">
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-center">User ID</th>
                <th className="px-3 py-2 text-left">Coin</th>
                <th className="px-3 py-2 text-left">Label</th>
                <th className="px-3 py-2 text-left">Address</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Verified</th>
                <th className="px-3 py-2 text-center">Flagged</th>
                <th className="px-3 py-2 text-right">Usage</th>
                <th className="px-3 py-2 text-right">Withdrawn</th>
                <th className="px-3 py-2 text-center">Actions</th>
                <th className="px-3 py-2 text-left">Created</th>
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
                  <tr className="cursor-pointer border-b border-surface-200 hover:bg-surface-50 dark:hover:bg-white/4 transition-colors" key={addr.id} onClick={() => router.push(`/admin/withdrawal-addresses/${addr.id}`)}>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-primary">{addr.id}</span>
                      </td>
                      <td className="px-3 py-2 text-center">{addr.userId}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={28} className="mr-2" />
                          <div>
                            <div className="font-semibold text-[0.85rem]">{coinSymbol}</div>
                            <div className="text-surface-500 text-xs">{networkSymbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-surface-500 text-[0.85rem]">{addr.label || '-'}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <span className="text-[0.8rem]">
                            {addr.address || 'N/A'}
                          </span>
                          {addr.address &&
                        <Button

                          onClick={(e) => {e.stopPropagation();onCopy(addr.address);}}
                          title="Copy address" size="sm" className="p-0 border-0 text-surface-500 shrink-0">

                          
                              <i className="bx bx-copy text-[0.85rem]"></i>
                            </Button>
                        }
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span className={addressStatusBadgeClass(addr.status)}>
                          {statusLabel(addr.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {isVerified ?
                      <i className="bx bx-check-circle text-success text-[1.1rem]"></i> :

                      <i className="bx bx-x-circle text-surface-500 text-[1.1rem]"></i>
                      }
                      </td>
                      <td className="px-3 py-2 text-center">
                        {isFlagged ?
                      <Badge className="bg-amber-50 text-amber-700"><i className="bx bx-flag mr-1"></i>Flagged</Badge> :

                      <span className="text-surface-500">&mdash;</span>
                      }
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="font-medium">{addr.usageCount ?? 0}</span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="font-medium">{addr.totalWithdrawn || '0'}</span>
                      </td>
                      <td className="text-center">
                        <ActionMenu>
                          {!isFlagged ?
                            <ActionMenu.Item icon="bx-flag" onClick={() => onOpenActionModal('flag', addr)}>Flag</ActionMenu.Item> :
                            <ActionMenu.Item icon="bx-check-circle" onClick={() => onOpenActionModal('unflag', addr)}>Unflag</ActionMenu.Item>
                          }
                          {!isVerified &&
                            <ActionMenu.Item icon="bx-shield-quarter" onClick={() => onOpenActionModal('forceVerify', addr)}>Force Verify</ActionMenu.Item>
                          }
                          {addr.status !== 'deleted' &&
                            <>
                              <ActionMenu.Divider />
                              <ActionMenu.Item icon="bx-trash" danger onClick={() => onOpenActionModal('delete', addr)}>Delete Permanently</ActionMenu.Item>
                            </>
                          }
                        </ActionMenu>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[0.85rem]">
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
        <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            hasPrev={pagination.hasPrev}
            hasNext={pagination.hasNext}
            loading={loading}
            onPageChange={(p) => { setCurrentPage(p); syncSearchParams(appliedFilters, p); }}
            t={t}
          />
        }
      </div>
    </Card>);

}