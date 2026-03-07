'use client';

import { formatRoleLabel } from '@/lib/utils/roles';
import { useDateFormat } from '@/hooks/useDateFormat';
import { statusBadgeClass, roleBadgeClass } from '@/components/admin/userListHelpers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import TableEmptyState from '@/components/TableEmptyState';
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import ActionMenu from '../ui/ActionMenu'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table';

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
        <Table>
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
                      title={t('admin.detail.copyEmail', { defaultValue: 'Copy email' })} size="icon-sm" variant="text-secondary">
                      
                          <i className="bx bx-copy"></i>
                        </Button>
                      </div>
                    </td>
                    <td>
                      {user.fullName || user.firstName || user.lastName ?
                  `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName :
                  <span className="text-surface-500">-</span>
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
                  <Badge color="success" label><i className="bx bx-check"></i></Badge> :

                  <Badge color="secondary"><i className="bx bx-x"></i></Badge>
                  }
                    </td>
                    <td className="whitespace-nowrap text-[0.85rem]">
                      {fmtDate(user.lastLoginAt)}
                    </td>
                    <td className="whitespace-nowrap text-[0.85rem]">
                      {fmtDate(user.createdAt)}
                    </td>
                    <td className="text-center">
                      <ActionMenu>
                        <ActionMenu.Item icon="bx-user-check" onClick={() => onOpenModal('changeStatus', user)}>
                          {t('admin.users.changeStatus', { defaultValue: 'Change Status' })}
                        </ActionMenu.Item>
                        <ActionMenu.Item icon="bx-shield" onClick={() => onOpenModal('changeRole', user)}>
                          {t('admin.users.changeRole', { defaultValue: 'Change Role' })}
                        </ActionMenu.Item>
                        <ActionMenu.Divider />
                        <ActionMenu.Item icon="bx-lock-open" onClick={() => onOpenModal('resetPassword', user)}>
                          {t('admin.users.resetPassword', { defaultValue: 'Reset Password' })}
                        </ActionMenu.Item>
                        {(user.twoFactorEnabled || user.is2FAEnabled) &&
                          <ActionMenu.Item icon="bx-shield-x" danger onClick={() => onOpenModal('disable2FA', user)}>
                            {t('admin.users.disable2FA', { defaultValue: 'Disable 2FA' })}
                          </ActionMenu.Item>
                        }
                      </ActionMenu>
                    </td>
                  </tr>
              )
              }
            </tbody>
          </Table>

        <div className="px-5 py-1.5">
          <Pagination pagination={pagination} onPageChange={onPageChange} loading={loading} />
        </div>
    </Card>);

}