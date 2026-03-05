'use client';

import { formatRoleLabel } from '@/lib/utils/roles';
import { useDateFormat } from '@/hooks/useDateFormat';
import { statusBadgeClass, roleBadgeClass } from '@/components/admin/userListHelpers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import TableEmptyState from '@/components/TableEmptyState';
import { Badge, Button, Card } from '../ui'

export default function UserListTable({
  t,
  users,
  loading,
  pagination,
  currentPage,
  appliedFilters,
  onCopy,
  onOpenModal,
  onPageChange,
  onSyncSearchParams
}) {
  const { fmtDate } = useDateFormat();
  return (
    <Card>
      <div className="p-5">
        <div className="overflow-x-auto overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="whitespace-nowrap">
                <th>{t('table.id', { defaultValue: 'ID' })}</th>
                <th>{t('admin.users.email', { defaultValue: 'Email' })}</th>
                <th>{t('admin.users.fullName', { defaultValue: 'Full Name' })}</th>
                <th className="text-center">{t('admin.users.role', { defaultValue: 'Role' })}</th>
                <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                <th className="text-center">{t('admin.users.twoFA', { defaultValue: '2FA' })}</th>
                <th>{t('admin.users.lastLogin', { defaultValue: 'Last Login' })}</th>
                <th>{t('table.created', { defaultValue: 'Created' })}</th>
                <th className="text-center">{t('actions.actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ?
              <TableEmptyState
                colSpan={9}
                icon="bx-user"
                message={t('admin.users.noUsers', { defaultValue: 'No users found' })} /> :


              users.map((user) =>
              <tr key={user.id}>
                    <td>
                      <span className="font-semibold text-primary">{user.id}</span>
                    </td>
                    <td>
                      <div className="flex items-center">
                        <span className="mr-2">{user.email}</span>
                        <Button

                      onClick={() => onCopy(user.email)}
                      title={t('admin.detail.copyEmail', { defaultValue: 'Copy email' })} size="icon" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full">
                      
                          <i className="bx bx-copy text-xl"></i>
                        </Button>
                      </div>
                    </td>
                    <td>
                      {user.fullName || user.firstName || user.lastName ?
                  `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName :
                  <span className="text-muted">-</span>
                  }
                    </td>
                    <td className="text-center whitespace-nowrap">
                      <span className={roleBadgeClass(user.role)}>
                        {formatRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="text-center whitespace-nowrap">
                      <span className={statusBadgeClass(user.status)}>
                        {String(user.status || '').toUpperCase()}
                      </span>
                    </td>
                    <td className="text-center">
                      {user.twoFactorEnabled || user.is2FAEnabled ?
                  <Badge className="bg-green-50 text-green-700"><i className="bx bx-check"></i></Badge> :

                  <Badge className="bg-surface-100 text-surface-600"><i className="bx bx-x"></i></Badge>
                  }
                    </td>
                    <td className="whitespace-nowrap text-[0.85rem]">
                      {fmtDate(user.lastLoginAt)}
                    </td>
                    <td className="whitespace-nowrap text-[0.85rem]">
                      {fmtDate(user.createdAt)}
                    </td>
                    <td className="text-center">
                      <div className="dropdown">
                        <Button size="icon" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full cursor-pointer hide-arrow">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </Button>
                        <ul className="absolute z-50 mt-1 min-w-[160px] bg-white border border-surface-200 rounded-lg shadow-lg py-1 right-0">
                          <li>
                            <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => onOpenModal('changeStatus', user)}>
                              <i className="bx bx-user-check mr-2 text-warning"></i>
                              {t('admin.users.changeStatus', { defaultValue: 'Change Status' })}
                            </button>
                          </li>
                          <li>
                            <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => onOpenModal('changeRole', user)}>
                              <i className="bx bx-shield mr-2 text-primary"></i>
                              {t('admin.users.changeRole', { defaultValue: 'Change Role' })}
                            </button>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => onOpenModal('resetPassword', user)}>
                              <i className="bx bx-lock-open mr-2 text-danger"></i>
                              {t('admin.users.resetPassword', { defaultValue: 'Reset Password' })}
                            </button>
                          </li>
                          {(user.twoFactorEnabled || user.is2FAEnabled) &&
                      <li>
                              <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => onOpenModal('disable2FA', user)}>
                                <i className="bx bx-shield-x mr-2 text-danger"></i>
                                {t('admin.users.disable2FA', { defaultValue: 'Disable 2FA' })}
                              </button>
                            </li>
                      }
                        </ul>
                      </div>
                    </td>
                  </tr>
              )
              }
            </tbody>
          </table>
        </div>

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
              onClick={() => {onPageChange(currentPage - 1);onSyncSearchParams(appliedFilters, currentPage - 1);}} variant="outline-secondary" size="sm">
              
                <i className="bx bx-chevron-left"></i>
                {t('actions.prev', { defaultValue: 'Previous' })}
              </Button>
              <Button

              disabled variant="outline-secondary" size="sm">
              
                {pagination.page} / {pagination.totalPages}
              </Button>
              <Button

              disabled={!pagination.hasNext || loading}
              onClick={() => {onPageChange(currentPage + 1);onSyncSearchParams(appliedFilters, currentPage + 1);}} variant="outline-secondary" size="sm">
              
                {t('actions.next', { defaultValue: 'Next' })}
                <i className="bx bx-chevron-right"></i>
              </Button>
            </div>
          </div>
        }
      </div>
    </Card>);

}