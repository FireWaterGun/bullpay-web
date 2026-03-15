'use client'

import { useState, startTransition } from 'react'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAuth, useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { VALID_SORT_ORDERS } from '@/lib/constants'
import {
  getUsers,
  changeUserStatus,
  changeUserRole,
  resetUserPassword,
  disableUser2FA,
  forceVerifyEmail,
  createUser,
} from '@/lib/api/admin'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import { formatRoleLabel } from '@/lib/utils/roles'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import UserListTable from '@/components/admin/UserListTable'
import UserActionModal from '@/components/admin/UserActionModal'
import CreateUserModal from '@/components/admin/CreateUserModal'
import { STATUS_OPTIONS, ROLE_OPTIONS } from '@/components/admin/userListHelpers'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, Label, Select } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

export default function AdminUsersPage() {
  const { t } = useAdminTranslation()
  const { navigation } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()

  const locale = useLocale()

  const initStatus = searchParams.get('status') || ''
  const initRole = searchParams.get('role') || ''
  const initSearch = searchParams.get('search') || ''
  const initDateFrom = searchParams.get('dateFrom') || ''
  const initDateTo = searchParams.get('dateTo') || ''
  const initSortBy = searchParams.get('sortBy') || ''
  const rawSortOrder = searchParams.get('sortOrder') || ''
  const initSortOrder = VALID_SORT_ORDERS.has(rawSortOrder) ? rawSortOrder : ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [currentPage, setCurrentPage] = useState(initPage)

  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [roleFilter, setRoleFilter] = useState(initRole)
  const [searchFilter, setSearchFilter] = useState(initSearch)
  const [dateFromFilter, setDateFromFilter] = useState(initDateFrom)
  const [dateToFilter, setDateToFilter] = useState(initDateTo)
  const [sortBy, setSortBy] = useState(initSortBy)
  const [sortOrder, setSortOrder] = useState(initSortOrder)

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

  function handleSort(field, order) {
    setSortBy(field)
    setSortOrder(order)
    const f = { ...appliedFilters, sortBy: field, sortOrder: order }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  const [newStatus, setNewStatus] = useState('')
  const [statusReason, setStatusReason] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  const { data, isLoading, isValidating, mutate, token } = useApi(
    ['admin-users', currentPage, appliedFilters],
    (token) => getUsers(token, { page: currentPage, limit: 20, ...appliedFilters }),
    { onError: () => toast.error(t('admin.users.loadError', { defaultValue: 'Failed to load users' })), keepPreviousData: true }
  )
  const users = data?.items || []
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
      status: statusFilter || undefined,
      role: roleFilter || undefined,
      search: searchFilter || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
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
    setSortBy('')
    setSortOrder('')
    setAppliedFilters({})
    setCurrentPage(1)
    syncSearchParams({}, 1)
  }

  const { copiedId, handleCopy } = useCopyFeedback()

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

  async function handleCreateUser(data) {
    try {
      setCreateLoading(true)
      await createUser(token, data)
      toast.success(t('admin.users.createSuccess', { defaultValue: 'User created successfully' }))
      setShowCreateModal(false)
      mutate()
    } catch (error) {
      logger.error('Failed to create user:', error)
      const code = error?.code || ''
      const msg = error?.message || ''
      if (code === 'EMAIL_EXISTS' || msg.includes('Email already registered')) {
        toast.error(t('admin.users.emailExists', { defaultValue: 'Email already registered' }))
      } else if (code === 'ROLE_ESCALATION' || msg.includes('exceeds your permission')) {
        toast.error(t('admin.users.roleEscalation', { defaultValue: 'Cannot create user with this role' }))
      } else {
        toast.error(t('admin.users.createError', { defaultValue: 'Failed to create user. Please try again.' }))
      }
    } finally {
      setCreateLoading(false)
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
        case 'forceVerifyEmail':
          await forceVerifyEmail(token, selectedUser.id)
          toast.success(t('admin.users.verifyEmailSuccess', { defaultValue: 'Email verified successfully' }))
          break
      }

      closeModal()
      mutate()
    } catch (error) {
      logger.error(`Failed to ${modalType}:`, error)
      toast.error(t('admin.users.actionError', { defaultValue: 'Action failed. Please try again.' }))
    } finally {
      setModalLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grow pb-6">
        <div className="text-center py-5">
          <Spinner role="status" className="text-primary" />

          <p className="mt-3 text-surface-500">{t('invoices.loading', { defaultValue: 'Loading...' })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-group mr-2"></i>
                    {t('admin.users.title', { defaultValue: 'User Management' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.users.description', { defaultValue: 'Manage users, roles, and access' })}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <Button onClick={() => setShowCreateModal(true)}>
                    <i className="bx bx-user-plus mr-1"></i>
                    {t('admin.users.createUser', { defaultValue: 'Create User' })}
                  </Button>
                  <RefreshButton onClick={() => mutate()} loading={isValidating} />
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('filter.search', { defaultValue: 'Search' })}</Label>
                  <Input
                    type="text"
                    placeholder={t('admin.users.searchPlaceholder', { defaultValue: 'Email, name...' })}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-2">
                  <Label>{t('filter.status', { defaultValue: 'Status' })}</Label>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {formatRoleLabel(s)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-2">
                  <Label>{t('admin.users.role', { defaultValue: 'Role' })}</Label>
                  <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">{t('admin.users.allRoles', { defaultValue: 'All Roles' })}</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {formatRoleLabel(r)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.users.createdDate', { defaultValue: 'Created Date' })}</Label>
                  <LocaleDateRangePicker
                    className="w-full"
                    startDate={dateFromFilter}
                    endDate={dateToFilter}
                    onChangeStart={setDateFromFilter}
                    onChangeEnd={setDateToFilter}
                    locale={locale}
                    placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
                    t={t}
                  />
                </div>

              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={applyFilters} disabled={isValidating}>
                  <i className="bx bx-filter-alt mr-1"></i>
                  {t('filter.apply', { defaultValue: 'Apply Filters' })}
                </Button>
                <Button onClick={resetFilters} disabled={isValidating} variant="outline-secondary">
                  <i className="bx bx-reset mr-1"></i>
                  {t('filter.reset', { defaultValue: 'Reset' })}
                </Button>
              </div>
            </div>
          </Card>

          <UserListTable
            t={t}
            users={users}
            loading={isValidating}
            pagination={pagination}
            currentPage={currentPage}
            appliedFilters={appliedFilters}
            onCopy={handleCopy}
            copiedId={copiedId}
            onOpenModal={openModal}
            onPageChange={(p) => startTransition(() => setCurrentPage(p))}
            onSyncSearchParams={syncSearchParams}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </div>
      </div>

      {showModal && selectedUser && (
        <UserActionModal
          t={t}
          modalType={modalType}
          selectedUser={selectedUser}
          modalLoading={modalLoading}
          newStatus={newStatus}
          setNewStatus={setNewStatus}
          statusReason={statusReason}
          setStatusReason={setStatusReason}
          newRole={newRole}
          setNewRole={setNewRole}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          currentUserRole={navigation?.role}
        />
      )}

      {showCreateModal && (
        <CreateUserModal
          t={t}
          loading={createLoading}
          onClose={() => !createLoading && setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          callerRole={navigation?.role}
        />
      )}
    </div>
  )
}
