import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import {
  getUsers,
  changeUserStatus,
  changeUserRole,
  resetUserPassword,
  disableUser2FA,
} from '../../api/admin.ts'
import { copyToClipboard } from '../../utils/clipboard'
import LocaleDateRangePicker from '../../components/LocaleDateRangePicker'

const STATUS_OPTIONS = ['active', 'inactive', 'suspended', 'pending']
const ROLE_OPTIONS = ['regular_user', 'business_user', 'support_agent', 'admin', 'super_admin']

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'active') return 'badge bg-label-success'
  if (s === 'inactive') return 'badge bg-label-secondary'
  if (s === 'suspended') return 'badge bg-label-danger'
  if (s === 'pending') return 'badge bg-label-warning'
  return 'badge bg-label-secondary'
}

function roleBadgeClass(role) {
  const r = String(role || '').toLowerCase()
  if (r === 'super_admin') return 'badge bg-label-danger'
  if (r === 'admin') return 'badge bg-label-primary'
  if (r === 'support_agent') return 'badge bg-label-info'
  if (r === 'business_user') return 'badge bg-label-warning'
  return 'badge bg-label-secondary'
}

function formatRoleLabel(role) {
  return String(role || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function UserList() {
  const { t, i18n } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    return map[i18n.language] || 'en-US'
  }, [i18n.language])

  const initStatus = searchParams.get('status') || ''
  const initRole = searchParams.get('role') || ''
  const initSearch = searchParams.get('search') || ''
  const initDateFrom = searchParams.get('dateFrom') || ''
  const initDateTo = searchParams.get('dateTo') || ''
  const initSortBy = searchParams.get('sortBy') || ''
  const initSortOrder = searchParams.get('sortOrder') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)

  // Filter states
  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [roleFilter, setRoleFilter] = useState(initRole)
  const [searchFilter, setSearchFilter] = useState(initSearch)
  const [dateFromFilter, setDateFromFilter] = useState(initDateFrom)
  const [dateToFilter, setDateToFilter] = useState(initDateTo)
  const [sortByFilter, setSortByFilter] = useState(initSortBy)
  const [sortOrderFilter, setSortOrderFilter] = useState(initSortOrder)

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initStatus) f.status = initStatus
    if (initRole) f.role = initRole
    if (initSearch) f.search = initSearch
    if (initDateFrom) f.dateFrom = initDateFrom
    if (initDateTo) f.dateTo = initDateTo
    if (initSortBy) f.sortBy = initSortBy
    if (initSortOrder) f.sortOrder = initSortOrder
    return f
  })

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // changeStatus, changeRole, resetPassword, disable2FA
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Modal form fields
  const [newStatus, setNewStatus] = useState('')
  const [statusReason, setStatusReason] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    loadUsers()
  }, [currentPage, appliedFilters])

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, v) })
    if (page > 1) params.set('page', page)
    setSearchParams(params, { replace: true })
  }

  function applyFilters() {
    const f = {
      status: statusFilter || undefined,
      role: roleFilter || undefined,
      search: searchFilter || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined,
    }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setRoleFilter('')
    setSearchFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setSortByFilter('')
    setSortOrderFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    syncSearchParams({}, 1)
  }

  async function loadUsers() {
    if (!token) return
    try {
      setLoading(true)
      const data = await getUsers(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters,
      })
      setUsers(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error(t('admin.users.loadError', { defaultValue: 'Failed to load users' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text) {
    const ok = await copyToClipboard(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }))
  }

  function openModal(type, user) {
    setModalType(type)
    setSelectedUser(user)
    setNewStatus(user.status || '')
    setStatusReason('')
    setNewRole(user.role || '')
    setNewPassword('')
    setShowModal(true)
  }

  function closeModal() {
    if (modalLoading) return
    setShowModal(false)
    setSelectedUser(null)
    setModalType('')
  }

  function getModalConfig() {
    switch (modalType) {
      case 'changeStatus':
        return { title: t('admin.users.changeStatus', { defaultValue: 'Change User Status' }), btnClass: 'btn-warning', btnLabel: t('admin.users.updateStatus', { defaultValue: 'Update Status' }), icon: 'bx-user-check' }
      case 'changeRole':
        return { title: t('admin.users.changeRole', { defaultValue: 'Change User Role' }), btnClass: 'btn-primary', btnLabel: t('admin.users.updateRole', { defaultValue: 'Update Role' }), icon: 'bx-shield' }
      case 'resetPassword':
        return { title: t('admin.users.resetPassword', { defaultValue: 'Reset Password' }), btnClass: 'btn-danger', btnLabel: t('admin.users.resetPasswordBtn', { defaultValue: 'Reset Password' }), icon: 'bx-lock-open' }
      case 'disable2FA':
        return { title: t('admin.users.disable2FA', { defaultValue: 'Disable 2FA' }), btnClass: 'btn-danger', btnLabel: t('admin.users.disable2FABtn', { defaultValue: 'Disable 2FA' }), icon: 'bx-shield-x' }
      default:
        return { title: '', btnClass: '', btnLabel: '', icon: '' }
    }
  }

  async function handleModalSubmit() {
    if (!selectedUser) return

    try {
      setModalLoading(true)

      switch (modalType) {
        case 'changeStatus':
          if (!newStatus) {
            toast.error(t('admin.users.selectStatus', { defaultValue: 'Please select a status' }))
            return
          }
          await changeUserStatus(token, selectedUser.id, newStatus, statusReason.trim() || undefined)
          toast.success(t('admin.users.statusSuccess', { defaultValue: 'User status updated successfully' }))
          break
        case 'changeRole':
          if (!newRole) {
            toast.error(t('admin.users.selectRole', { defaultValue: 'Please select a role' }))
            return
          }
          await changeUserRole(token, selectedUser.id, newRole)
          toast.success(t('admin.users.roleSuccess', { defaultValue: 'User role updated successfully' }))
          break
        case 'resetPassword':
          if (!newPassword || newPassword.length < 8) {
            toast.error(t('admin.users.passwordMinLength', { defaultValue: 'Password must be at least 8 characters' }))
            return
          }
          await resetUserPassword(token, selectedUser.id, newPassword)
          toast.success(t('admin.users.passwordSuccess', { defaultValue: 'Password reset successfully' }))
          break
        case 'disable2FA':
          await disableUser2FA(token, selectedUser.id)
          toast.success(t('admin.users.disable2FASuccess', { defaultValue: '2FA disabled successfully' }))
          break
      }

      closeModal()
      loadUsers()
    } catch (error) {
      console.error(`Failed to ${modalType}:`, error)
      toast.error(t('admin.users.actionError', { defaultValue: 'Action failed. Please try again.' }))
    } finally {
      setModalLoading(false)
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">{t('invoices.loading', { defaultValue: 'Loading...' })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-group me-2"></i>
                    {t('admin.users.title', { defaultValue: 'User Management' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.users.description', { defaultValue: 'Manage users, roles, and access' })}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={loadUsers} disabled={loading}>
                  <i className="bx bx-refresh me-1"></i>
                  {t('actions.refresh', { defaultValue: 'Refresh' })}
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.search', { defaultValue: 'Search' })}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('admin.users.searchPlaceholder', { defaultValue: 'Email, name...' })}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                </div>
                <div className="col-md-2 col-sm-6">
                  <label className="form-label">{t('filter.status', { defaultValue: 'Status' })}</label>
                  <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{formatRoleLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 col-sm-6">
                  <label className="form-label">{t('admin.users.role', { defaultValue: 'Role' })}</label>
                  <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">{t('admin.users.allRoles', { defaultValue: 'All Roles' })}</option>
                    {ROLE_OPTIONS.map(r => (
                      <option key={r} value={r}>{formatRoleLabel(r)}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('admin.users.createdDate', { defaultValue: 'Created Date' })}</label>
                  <LocaleDateRangePicker
                    startDate={dateFromFilter}
                    endDate={dateToFilter}
                    onChangeStart={setDateFromFilter}
                    onChangeEnd={setDateToFilter}
                    locale={locale}
                    placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
                    t={t}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="col-md-2 col-sm-6">
                  <label className="form-label">{t('filter.sortBy', { defaultValue: 'Sort By' })}</label>
                  <select className="form-select" value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="createdAt">{t('filter.createdAt', { defaultValue: 'Created At' })}</option>
                    <option value="lastLoginAt">{t('admin.users.lastLogin', { defaultValue: 'Last Login' })}</option>
                    <option value="status">{t('filter.status', { defaultValue: 'Status' })}</option>
                    <option value="role">{t('admin.users.role', { defaultValue: 'Role' })}</option>
                  </select>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary" onClick={applyFilters} disabled={loading}>
                  <i className="bx bx-filter-alt me-1"></i>
                  {t('filter.apply', { defaultValue: 'Apply Filters' })}
                </button>
                <button className="btn btn-outline-secondary" onClick={resetFilters} disabled={loading}>
                  <i className="bx bx-reset me-1"></i>
                  {t('filter.reset', { defaultValue: 'Reset' })}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
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
                                onClick={() => handleCopy(user.email)}
                                title="Copy email"
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
                                  <button className="dropdown-item" onClick={() => openModal('changeStatus', user)}>
                                    <i className="bx bx-user-check me-2 text-warning"></i>
                                    {t('admin.users.changeStatus', { defaultValue: 'Change Status' })}
                                  </button>
                                </li>
                                <li>
                                  <button className="dropdown-item" onClick={() => openModal('changeRole', user)}>
                                    <i className="bx bx-shield me-2 text-primary"></i>
                                    {t('admin.users.changeRole', { defaultValue: 'Change Role' })}
                                  </button>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <button className="dropdown-item" onClick={() => openModal('resetPassword', user)}>
                                    <i className="bx bx-lock-open me-2 text-danger"></i>
                                    {t('admin.users.resetPassword', { defaultValue: 'Reset Password' })}
                                  </button>
                                </li>
                                {(user.twoFactorEnabled || user.is2FAEnabled) && (
                                  <li>
                                    <button className="dropdown-item" onClick={() => openModal('disable2FA', user)}>
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
                      onClick={() => { setCurrentPage(currentPage - 1); syncSearchParams(appliedFilters, currentPage - 1) }}
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
                      onClick={() => { setCurrentPage(currentPage + 1); syncSearchParams(appliedFilters, currentPage + 1) }}
                    >
                      {t('actions.next', { defaultValue: 'Next' })}
                      <i className="bx bx-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showModal && selectedUser && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !modalLoading && closeModal()}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bx ${getModalConfig().icon} me-2`}></i>
                  {getModalConfig().title}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} disabled={modalLoading}></button>
              </div>
              <div className="modal-body">
                {/* User info */}
                <div className="rounded p-3 mb-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e3e3e3' }}>
                  <div className="row g-2">
                    <div className="col-6">
                      <small className="text-muted d-block">User ID</small>
                      <strong>{selectedUser.id}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Email</small>
                      <strong>{selectedUser.email}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">{t('admin.users.role', { defaultValue: 'Role' })}</small>
                      <span className={roleBadgeClass(selectedUser.role)}>{formatRoleLabel(selectedUser.role)}</span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">{t('table.status', { defaultValue: 'Status' })}</small>
                      <span className={statusBadgeClass(selectedUser.status)}>{String(selectedUser.status || '').toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Change Status */}
                {modalType === 'changeStatus' && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">{t('admin.users.newStatus', { defaultValue: 'New Status' })} <span className="text-danger">*</span></label>
                      <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} disabled={modalLoading}>
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{formatRoleLabel(s)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('admin.users.reason', { defaultValue: 'Reason' })}</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder={t('admin.users.reasonPlaceholder', { defaultValue: 'Enter reason (optional, max 500 characters)...' })}
                        value={statusReason}
                        onChange={(e) => setStatusReason(e.target.value)}
                        maxLength={500}
                        disabled={modalLoading}
                      />
                    </div>
                  </>
                )}

                {/* Change Role */}
                {modalType === 'changeRole' && (
                  <div className="mb-3">
                    <label className="form-label">{t('admin.users.newRole', { defaultValue: 'New Role' })} <span className="text-danger">*</span></label>
                    <select className="form-select" value={newRole} onChange={(e) => setNewRole(e.target.value)} disabled={modalLoading}>
                      {ROLE_OPTIONS.map(r => (
                        <option key={r} value={r}>{formatRoleLabel(r)}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Reset Password */}
                {modalType === 'resetPassword' && (
                  <>
                    <div className="alert alert-danger py-2 mb-3" role="alert">
                      <i className="bx bx-error me-1"></i>
                      {t('admin.users.resetPasswordWarning', { defaultValue: 'This will immediately change the user\'s password.' })}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('admin.users.newPassword', { defaultValue: 'New Password' })} <span className="text-danger">*</span></label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder={t('admin.users.newPasswordPlaceholder', { defaultValue: 'Enter new password (8-128 characters)...' })}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        maxLength={128}
                        disabled={modalLoading}
                      />
                    </div>
                  </>
                )}

                {/* Disable 2FA */}
                {modalType === 'disable2FA' && (
                  <div className="alert alert-danger py-2 mb-3" role="alert">
                    <i className="bx bx-error me-1"></i>
                    {t('admin.users.disable2FAWarning', { defaultValue: 'This will disable two-factor authentication for this user. They will need to set it up again.' })}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={modalLoading}>
                  {t('actions.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button
                  type="button"
                  className={`btn ${getModalConfig().btnClass}`}
                  onClick={handleModalSubmit}
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      {t('invoices.loading', { defaultValue: 'Loading...' })}
                    </>
                  ) : (
                    getModalConfig().btnLabel
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
