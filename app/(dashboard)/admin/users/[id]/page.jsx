'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useDateFormat } from '@/hooks/useDateFormat'
import {
  getUserById,
  changeUserStatus,
  changeUserRole,
  resetUserPassword,
  disableUser2FA,
  forceVerifyEmail,
  getUserActivities,
} from '@/lib/api/admin'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { formatRoleLabel } from '@/lib/utils/roles'
import { statusBadgeClass, roleBadgeClass } from '@/components/admin/userListHelpers'
import UserActionModal from '@/components/admin/UserActionModal'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

export default function AdminUserDetail() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const { id } = useParams()
  const { fmtDate } = useDateFormat()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [activities, setActivities] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusReason, setStatusReason] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const loadUser = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await getUserById(token, parseInt(id))
      setUser(data)
    } catch (error) {
      logger.error('Failed to load user:', error)
      toast.error(t('admin.userDetail.loadError', { defaultValue: 'Failed to load user' }))
    } finally {
      setLoading(false)
    }
  }, [token, id, toast, t])

  const loadActivities = useCallback(async () => {
    if (!token) return
    try {
      setActivityLoading(true)
      const data = await getUserActivities(token, {
        userId: parseInt(id),
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
      setActivities(data?.items || [])
    } catch (error) {
      logger.error('Failed to load activities:', error)
    } finally {
      setActivityLoading(false)
    }
  }, [token, id])

  useEffect(() => {
    loadUser()
    loadActivities()
  }, [loadUser, loadActivities])

  async function handleCopy(text) {
    const ok = await copyText(text)
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }))
  }

  function openModal(type) {
    setModalType(type)
    setNewStatus(user?.status || '')
    setStatusReason('')
    setNewRole(user?.role || '')
    setNewPassword('')
    setShowModal(true)
  }

  function closeModal() {
    if (modalLoading) return
    setShowModal(false)
    setModalType('')
  }

  async function handleModalSubmit() {
    if (!user) return
    try {
      setModalLoading(true)
      switch (modalType) {
        case 'changeStatus':
          if (!newStatus) {
            toast.error(t('admin.users.selectStatus', { defaultValue: 'Please select a status' }))
            return
          }
          await changeUserStatus(token, user.id, newStatus, statusReason.trim() || undefined)
          toast.success(t('admin.users.statusSuccess', { defaultValue: 'User status updated successfully' }))
          break
        case 'changeRole':
          if (!newRole) {
            toast.error(t('admin.users.selectRole', { defaultValue: 'Please select a role' }))
            return
          }
          await changeUserRole(token, user.id, newRole)
          toast.success(t('admin.users.roleSuccess', { defaultValue: 'User role updated successfully' }))
          break
        case 'resetPassword':
          if (!newPassword || newPassword.length < 8) {
            toast.error(t('admin.users.passwordMinLength', { defaultValue: 'Password must be at least 8 characters' }))
            return
          }
          await resetUserPassword(token, user.id, newPassword)
          toast.success(t('admin.users.passwordSuccess', { defaultValue: 'Password reset successfully' }))
          break
        case 'disable2FA':
          await disableUser2FA(token, user.id)
          toast.success(t('admin.users.disable2FASuccess', { defaultValue: '2FA disabled successfully' }))
          break
        case 'forceVerifyEmail':
          await forceVerifyEmail(token, user.id)
          toast.success(t('admin.users.verifyEmailSuccess', { defaultValue: 'Email verified successfully' }))
          break
      }
      closeModal()
      loadUser()
      loadActivities()
    } catch (error) {
      logger.error(`Failed to ${modalType}:`, error)
      toast.error(t('admin.users.actionError', { defaultValue: 'Action failed. Please try again.' }))
    } finally {
      setModalLoading(false)
    }
  }

  if (loading) {
    return <PageSpinner />
  }

  if (!user) {
    return (
      <div className="grow pb-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[3rem] text-surface-500"></i>
          <p className="text-surface-500 mt-2">
            {t('admin.userDetail.notFound', { defaultValue: 'User not found' })}
          </p>
          <Button variant="label-secondary" href="/admin/users">
            {t('admin.userDetail.backToList', { defaultValue: 'Back to Users' })}
          </Button>
        </div>
      </div>
    )
  }

  const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back button */}
          <div className="mb-4">
            <Button variant="outline-secondary" className="gap-1" href="/admin/users">
              <i className="bx bx-arrow-back"></i>
              {t('admin.users.backToList', { defaultValue: 'Back to Users' })}
            </Button>
          </div>

          {/* User Header */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <i className="bx bx-user text-2xl text-primary"></i>
                  </div>
                  <div>
                    <h4 className="mb-0 flex items-center gap-2 flex-wrap">
                      {fullName || user.email}
                      <span className={roleBadgeClass(user.role)}>{formatRoleLabel(user.role)}</span>
                      <span className={statusBadgeClass(user.status)}>{String(user.status || '').toUpperCase()}</span>
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-surface-500 text-sm">
                      <span>{user.email}</span>
                      <Button
                        onClick={() => handleCopy(user.email)}
                        size="icon-sm"
                        variant="text-secondary"
                        title="Copy email"
                      >
                        <i className="bx bx-copy text-xs"></i>
                      </Button>
                      <span className="text-surface-300">|</span>
                      <span>ID: {user.id}</span>
                      <Button
                        onClick={() => handleCopy(String(user.id))}
                        size="icon-sm"
                        variant="text-secondary"
                        title="Copy ID"
                      >
                        <i className="bx bx-copy text-xs"></i>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <RefreshButton onClick={() => { loadUser(); loadActivities() }} loading={loading || activityLoading} />
                </div>
              </div>
            </div>
          </Card>

          {/* Info Cards Row */}
          <div className="grid grid-cols-12 gap-x-6 gap-4 mb-4">
            {/* Account Info */}
            <div className="col-span-12 lg:col-span-6">
              <Card className="h-full">
                <div className="px-5 py-3 border-b border-surface-200">
                  <h6 className="mb-0">
                    <i className="bx bx-id-card mr-2"></i>
                    {t('admin.userDetail.accountInfo', { defaultValue: 'Account Information' })}
                  </h6>
                </div>
                <div className="p-0">
                  <Table>
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">{t('table.id', { defaultValue: 'ID' })}</td>
                        <td className="font-semibold">{user.id}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.users.email', { defaultValue: 'Email' })}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span>{user.email}</span>
                            <Button onClick={() => handleCopy(user.email)} size="icon-sm" variant="text-secondary">
                              <i className="bx bx-copy"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.users.fullName', { defaultValue: 'Full Name' })}</td>
                        <td>{fullName || <span className="text-surface-400">-</span>}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.users.role', { defaultValue: 'Role' })}</td>
                        <td>
                          <span className={roleBadgeClass(user.role)}>{formatRoleLabel(user.role)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('table.status', { defaultValue: 'Status' })}</td>
                        <td>
                          <span className={statusBadgeClass(user.status)}>{String(user.status || '').toUpperCase()}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.userDetail.timezone', { defaultValue: 'Timezone' })}</td>
                        <td>{user.timezone || 'UTC'}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Security Info */}
            <div className="col-span-12 lg:col-span-6">
              <Card className="h-full">
                <div className="px-5 py-3 border-b border-surface-200">
                  <h6 className="mb-0">
                    <i className="bx bx-shield mr-2"></i>
                    {t('admin.userDetail.securityInfo', { defaultValue: 'Security & Verification' })}
                  </h6>
                </div>
                <div className="p-0">
                  <Table>
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">{t('admin.users.emailVerified', { defaultValue: 'Email Verified' })}</td>
                        <td>
                          {user.emailVerifiedAt ? (
                            <div className="flex items-center gap-2">
                              <Badge color="success" label><i className="bx bx-check"></i></Badge>
                              <span className="text-xs text-surface-500">{fmtDate(user.emailVerifiedAt)}</span>
                            </div>
                          ) : (
                            <Badge color="warning"><i className="bx bx-x mr-1"></i> Not Verified</Badge>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.users.twoFA', { defaultValue: '2FA' })}</td>
                        <td>
                          {user.twoFactorEnabled || user.is2FAEnabled ? (
                            <div className="flex items-center gap-2">
                              <Badge color="success" label><i className="bx bx-check"></i></Badge>
                              {user.twoFactorVerifiedAt && (
                                <span className="text-xs text-surface-500">{fmtDate(user.twoFactorVerifiedAt)}</span>
                              )}
                            </div>
                          ) : user.twoFactorSetupAt ? (
                            <Badge color="warning">Setup Pending</Badge>
                          ) : (
                            <Badge color="secondary"><i className="bx bx-x mr-1"></i> Disabled</Badge>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.users.lastLogin', { defaultValue: 'Last Login' })}</td>
                        <td>
                          {user.lastLoginAt ? (
                            <span className="text-sm">{fmtDate(user.lastLoginAt)}</span>
                          ) : (
                            <span className="text-surface-400">-</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('table.created', { defaultValue: 'Created' })}</td>
                        <td><span className="text-sm">{fmtDate(user.createdAt)}</span></td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.userDetail.updated', { defaultValue: 'Updated' })}</td>
                        <td><span className="text-sm">{fmtDate(user.updatedAt)}</span></td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="mb-4">
            <div className="px-5 py-3 border-b border-surface-200">
              <h6 className="mb-0">
                <i className="bx bx-cog mr-2"></i>
                {t('admin.userDetail.quickActions', { defaultValue: 'Quick Actions' })}
              </h6>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline-primary" size="sm" onClick={() => openModal('changeStatus')}>
                  <i className="bx bx-user-check mr-1"></i>
                  {t('admin.users.changeStatus', { defaultValue: 'Change Status' })}
                </Button>
                <Button variant="outline-primary" size="sm" onClick={() => openModal('changeRole')}>
                  <i className="bx bx-shield mr-1"></i>
                  {t('admin.users.changeRole', { defaultValue: 'Change Role' })}
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => openModal('resetPassword')}>
                  <i className="bx bx-lock-open mr-1"></i>
                  {t('admin.users.resetPassword', { defaultValue: 'Reset Password' })}
                </Button>
                {(user.twoFactorEnabled || user.is2FAEnabled) && (
                  <Button variant="outline-danger" size="sm" onClick={() => openModal('disable2FA')}>
                    <i className="bx bx-shield-x mr-1"></i>
                    {t('admin.users.disable2FA', { defaultValue: 'Disable 2FA' })}
                  </Button>
                )}
                {!user.emailVerifiedAt && (
                  <Button variant="outline-warning" size="sm" onClick={() => openModal('forceVerifyEmail')}>
                    <i className="bx bx-envelope mr-1"></i>
                    {t('admin.users.forceVerifyEmail', { defaultValue: 'Verify Email' })}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Recent Activities */}
          <Card>
            <div className="px-5 py-3 border-b border-surface-200">
              <div className="flex justify-between items-center">
                <h6 className="mb-0">
                  <i className="bx bx-history mr-2"></i>
                  {t('admin.userDetail.recentActivities', { defaultValue: 'Recent Activities' })}
                </h6>
              </div>
            </div>
            {activityLoading ? (
              <div className="p-5 text-center text-surface-500">
                <i className="bx bx-loader-alt bx-spin mr-1"></i>
                {t('invoices.loading', { defaultValue: 'Loading...' })}
              </div>
            ) : activities.length === 0 ? (
              <div className="p-5 text-center text-surface-500">
                <i className="bx bx-info-circle mr-1"></i>
                {t('admin.userDetail.noActivities', { defaultValue: 'No recent activities' })}
              </div>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>{t('admin.userDetail.eventType', { defaultValue: 'Event' })}</th>
                    <th>{t('admin.userDetail.ipAddress', { defaultValue: 'IP Address' })}</th>
                    <th>{t('table.created', { defaultValue: 'Date' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <span className="badge bg-label-info text-xs">
                          {formatEventType(a.eventType)}
                        </span>
                      </td>
                      <td className="text-sm font-mono">{a.ipAddress || '-'}</td>
                      <td className="text-sm whitespace-nowrap">{fmtDate(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      </div>

      {/* Action Modal (reuse existing) */}
      {showModal && user && (
        <UserActionModal
          t={t}
          modalType={modalType}
          selectedUser={user}
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
        />
      )}
    </div>
  )
}

/**
 * Format event_type like "LOGIN_SUCCESS" → "Login Success"
 */
function formatEventType(type) {
  if (!type) return '-'
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
