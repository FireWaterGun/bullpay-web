'use client'

import { formatRoleLabel } from '@/lib/utils/roles'
import { formatDate } from '@/lib/utils/format'
import { statusBadgeClass, roleBadgeClass } from '@/components/admin/userListHelpers'
import { useTranslation } from 'react-i18next'

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
  onSyncSearchParams,
}) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="table table-hover">
            <thead>
              <tr style={{ whiteSpace: 'nowrap' }}>
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    {t('admin.users.noUsers', { defaultValue: 'No users found' })}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="fw-semibold text-primary">{user.id}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-2">{user.email}</span>
                        <button
                          className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                          onClick={() => onCopy(user.email)}
                          title={t('admin.detail.copyEmail', { defaultValue: 'Copy email' })}
                        >
                          <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
                        </button>
                      </div>
                    </td>
                    <td>
                      {user.fullName || user.firstName || user.lastName
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName
                        : <span className="text-muted">-</span>
                      }
                    </td>
                    <td className="text-center text-nowrap">
                      <span className={roleBadgeClass(user.role)}>
                        {formatRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="text-center text-nowrap">
                      <span className={statusBadgeClass(user.status)}>
                        {String(user.status || '').toUpperCase()}
                      </span>
                    </td>
                    <td className="text-center">
                      {user.twoFactorEnabled || user.is2FAEnabled ? (
                        <span className="badge bg-label-success"><i className="bx bx-check"></i></span>
                      ) : (
                        <span className="badge bg-label-secondary"><i className="bx bx-x"></i></span>
                      )}
                    </td>
                    <td className="text-nowrap" style={{ fontSize: '0.85rem' }}>
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="text-nowrap" style={{ fontSize: '0.85rem' }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="text-center">
                      <div className="dropdown">
                        <button className="btn btn-sm btn-icon btn-text-secondary rounded-pill dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                          <i className="bx bx-dots-vertical-rounded"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button className="dropdown-item" onClick={() => onOpenModal('changeStatus', user)}>
                              <i className="bx bx-user-check me-2 text-warning"></i>
                              {t('admin.users.changeStatus', { defaultValue: 'Change Status' })}
                            </button>
                          </li>
                          <li>
                            <button className="dropdown-item" onClick={() => onOpenModal('changeRole', user)}>
                              <i className="bx bx-shield me-2 text-primary"></i>
                              {t('admin.users.changeRole', { defaultValue: 'Change Role' })}
                            </button>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <button className="dropdown-item" onClick={() => onOpenModal('resetPassword', user)}>
                              <i className="bx bx-lock-open me-2 text-danger"></i>
                              {t('admin.users.resetPassword', { defaultValue: 'Reset Password' })}
                            </button>
                          </li>
                          {(user.twoFactorEnabled || user.is2FAEnabled) && (
                            <li>
                              <button className="dropdown-item" onClick={() => onOpenModal('disable2FA', user)}>
                                <i className="bx bx-shield-x me-2 text-danger"></i>
                                {t('admin.users.disable2FA', { defaultValue: 'Disable 2FA' })}
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
                onClick={() => { onPageChange(currentPage - 1); onSyncSearchParams(appliedFilters, currentPage - 1) }}
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
                onClick={() => { onPageChange(currentPage + 1); onSyncSearchParams(appliedFilters, currentPage + 1) }}
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
