'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { getAuditLogs } from '@/lib/api/auditLogs'
import { useDateFormat } from '@/hooks/useDateFormat'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import TableEmptyState from '@/components/TableEmptyState'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, Label, Select } from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import SortableHeader from '@/components/ui/SortableHeader'

const ACTION_VALUES = [
  // Invoice
  { value: 'cancel_invoice', key: 'cancelInvoice', defaultLabel: 'Cancel Invoice' },
  { value: 'expire_invoice', key: 'expireInvoice', defaultLabel: 'Expire Invoice' },
  // Sweep
  { value: 'retry_sweep', key: 'retrySweep', defaultLabel: 'Retry Sweep' },
  // Withdrawal
  { value: 'WITHDRAWAL_APPROVE', key: 'withdrawalApprove', defaultLabel: 'Withdrawal Approve' },
  { value: 'WITHDRAWAL_REJECT', key: 'withdrawalReject', defaultLabel: 'Withdrawal Reject' },
  { value: 'WITHDRAWAL_RECHECK', key: 'withdrawalRecheck', defaultLabel: 'Withdrawal Recheck' },
  // Withdrawal Address
  { value: 'WITHDRAWAL_ADDRESS_FLAG', key: 'withdrawalAddressFlag', defaultLabel: 'Flag Address' },
  { value: 'WITHDRAWAL_ADDRESS_UNFLAG', key: 'withdrawalAddressUnflag', defaultLabel: 'Unflag Address' },
  {
    value: 'WITHDRAWAL_ADDRESS_FORCE_VERIFY',
    key: 'withdrawalAddressForceVerify',
    defaultLabel: 'Force Verify Address',
  },
  { value: 'WITHDRAWAL_ADDRESS_PERMANENT_DELETE', key: 'withdrawalAddressDelete', defaultLabel: 'Delete Address' },
  // User
  { value: 'USER_CREATED', key: 'userCreated', defaultLabel: 'User Created' },
  { value: 'USER_STATUS_CHANGE', key: 'userStatusChange', defaultLabel: 'User Status Change' },
  { value: 'USER_ROLE_CHANGE', key: 'userRoleChange', defaultLabel: 'User Role Change' },
  { value: 'USER_PASSWORD_RESET', key: 'userPasswordReset', defaultLabel: 'User Password Reset' },
  { value: 'USER_2FA_DISABLED', key: 'user2faDisabled', defaultLabel: 'User 2FA Disabled' },
  // Merchant
  { value: 'MERCHANT_ACTIVATE', key: 'merchantActivate', defaultLabel: 'Merchant Activate' },
  { value: 'MERCHANT_SUSPEND', key: 'merchantSuspend', defaultLabel: 'Merchant Suspend' },
  { value: 'retry_webhook', key: 'retryWebhook', defaultLabel: 'Retry Webhook' },
  // Coin / Network
  { value: 'COIN_CREATE', key: 'coinCreate', defaultLabel: 'Coin Create' },
  { value: 'COIN_UPDATE', key: 'coinUpdate', defaultLabel: 'Coin Update' },
  { value: 'NETWORK_CREATE', key: 'networkCreate', defaultLabel: 'Network Create' },
  { value: 'NETWORK_UPDATE', key: 'networkUpdate', defaultLabel: 'Network Update' },
  { value: 'COIN_NETWORK_CREATE', key: 'coinNetworkCreate', defaultLabel: 'Coin Network Create' },
  { value: 'COIN_NETWORK_UPDATE', key: 'coinNetworkUpdate', defaultLabel: 'Coin Network Update' },
  // Settings / Permissions
  { value: 'SETTING_UPDATE', key: 'settingUpdate', defaultLabel: 'Setting Update' },
  { value: 'ROLE_PERMISSION_GRANT', key: 'rolePermGrant', defaultLabel: 'Permission Grant' },
  { value: 'ROLE_PERMISSION_DENY', key: 'rolePermDeny', defaultLabel: 'Permission Deny' },
  { value: 'ROLE_PERMISSION_REVERT', key: 'rolePermRevert', defaultLabel: 'Permission Revert' },
  { value: 'ROLE_PERMISSIONS_RESET', key: 'rolePermReset', defaultLabel: 'Permissions Reset' },
  // Balance
  { value: 'SYSTEM_BALANCE_ADJUST', key: 'sysBalanceAdjust', defaultLabel: 'Balance Adjustment' },
]

const RESOURCE_TYPE_VALUES = [
  { value: 'invoice', key: 'invoice', defaultLabel: 'Invoice' },
  { value: 'sweep', key: 'sweep', defaultLabel: 'Sweep' },
  { value: 'withdrawal', key: 'withdrawal', defaultLabel: 'Withdrawal' },
  { value: 'withdrawal_address', key: 'withdrawalAddress', defaultLabel: 'Withdrawal Address' },
  { value: 'user', key: 'user', defaultLabel: 'User' },
  { value: 'merchant', key: 'merchant', defaultLabel: 'Merchant' },
  { value: 'merchant_payment', key: 'merchantPayment', defaultLabel: 'Merchant Payment' },
  { value: 'coin', key: 'coin', defaultLabel: 'Coin' },
  { value: 'network', key: 'network', defaultLabel: 'Network' },
  { value: 'coin_network', key: 'coinNetwork', defaultLabel: 'Coin Network' },
  { value: 'setting', key: 'setting', defaultLabel: 'Setting' },
  { value: 'role_permissions', key: 'rolePermissions', defaultLabel: 'Role Permissions' },
  { value: 'system_wallet', key: 'systemWallet', defaultLabel: 'System Wallet' },
]

export default function AuditLogList() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const router = useRouter()

  const toast = useToast()

  const locale = useLocale()

  const [currentPage, setCurrentPage] = useState(1)

  // Filter states (draft)
  const [userIdFilter, setUserIdFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [resourceTypeFilter, setResourceTypeFilter] = useState('')
  const [resourceIdFilter, setResourceIdFilter] = useState('')
  const [fromDateFilter, setFromDateFilter] = useState('')
  const [toDateFilter, setToDateFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState('')

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({})

  function handleSort(field, order) {
    setSortBy(field)
    setSortOrder(order)
    setAppliedFilters((prev) => ({ ...prev, sortBy: field, sortOrder: order }))
    setCurrentPage(1)
  }

  const { data, isLoading, isValidating, mutate } = useApi(
    ['admin-audit-logs', currentPage, appliedFilters],
    (token) => getAuditLogs(token, { page: currentPage, limit: 20, ...appliedFilters }),
    { onError: () => toast.error(t('admin.auditLog.loadError', { defaultValue: 'Failed to load audit logs' })), keepPreviousData: true }
  )
  const logs = data?.items || []
  const pagination = data?.pagination || null

  function applyFilters() {
    setAppliedFilters({
      userId: userIdFilter ? Number(userIdFilter) : undefined,
      action: actionFilter || undefined,
      resourceType: resourceTypeFilter || undefined,
      resourceId: resourceIdFilter || undefined,
      fromDate: fromDateFilter || undefined,
      toDate: toDateFilter || undefined,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    })
    setCurrentPage(1)
  }

  function resetFilters() {
    setUserIdFilter('')
    setActionFilter('')
    setResourceTypeFilter('')
    setResourceIdFilter('')
    setFromDateFilter('')
    setToDateFilter('')
    setSortBy('')
    setSortOrder('')
    setAppliedFilters({})
    setCurrentPage(1)
  }

  function actionBadge(action) {
    if (!action) return '-'
    const colorMap = {
      retry_sweep: 'warning',
      retry_webhook: 'warning',
      list_sweeps: 'info',
      list_webhook_logs: 'info',
      list_audit_logs: 'info',
      view_webhook_log: 'secondary',
      view_audit_log: 'secondary',
    }
    const color = colorMap[action] || 'primary'
    const label = ACTION_VALUES.find((o) => o.value === action)
    return (
      <Badge color={color} label>
        {label ? t(`admin.auditLog.${label.key}`, { defaultValue: label.defaultLabel }) : action}
      </Badge>
    )
  }

  function resourceTypeText(type) {
    if (!type) return '-'
    const match = RESOURCE_TYPE_VALUES.find((o) => o.value === type)
    return match ? t(`admin.auditLog.${match.key}`, { defaultValue: match.defaultLabel }) : type
  }

  if (isLoading && logs.length === 0) {
    return <PageSpinner />
  }

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Header */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-history mr-2"></i>
                    {t('admin.auditLog.title', { defaultValue: 'Audit Logs' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.auditLog.description', { defaultValue: 'Track admin actions and system events' })}
                  </p>
                </div>
                <RefreshButton onClick={() => mutate()} loading={isValidating} />
              </div>
            </div>

            {/* Filters */}
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.detail.userId', { defaultValue: 'User ID' })}</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder={t('admin.detail.userId', { defaultValue: 'User ID' })}
                    value={userIdFilter}
                    onChange={(e) => setUserIdFilter(e.target.value)}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.detail.action', { defaultValue: 'Action' })}</Label>
                  <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                    <option value="">{t('filter.allActions', { defaultValue: 'All Actions' })}</option>
                    {ACTION_VALUES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {t(`admin.auditLog.${o.key}`, { defaultValue: o.defaultLabel })}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.auditLog.resourceType', { defaultValue: 'Resource Type' })}</Label>
                  <Select value={resourceTypeFilter} onChange={(e) => setResourceTypeFilter(e.target.value)}>
                    <option value="">{t('filter.allTypes', { defaultValue: 'All Types' })}</option>
                    {RESOURCE_TYPE_VALUES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {t(`admin.auditLog.${o.key}`, { defaultValue: o.defaultLabel })}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('admin.auditLog.resourceId', { defaultValue: 'Resource ID' })}</Label>
                  <Input
                    type="text"
                    placeholder={t('admin.auditLog.resourceId', { defaultValue: 'Resource ID' })}
                    value={resourceIdFilter}
                    onChange={(e) => setResourceIdFilter(e.target.value)}
                  />
                </div>
                <div className="col-span-12 sm:col-span-6 md:col-span-3">
                  <Label>{t('filter.dateRange', { defaultValue: 'Date Range' })}</Label>
                  <LocaleDateRangePicker
                    className="w-full"
                    startDate={fromDateFilter}
                    endDate={toDateFilter}
                    onChangeStart={setFromDateFilter}
                    onChangeEnd={setToDateFilter}
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

          {/* Table */}
          <Card>
            <Table>
              <thead>
                <tr className="whitespace-nowrap">
                  <th>{t('admin.detail.id', { defaultValue: 'ID' })}</th>
                  <th className="text-center">{t('admin.auditLog.user', { defaultValue: 'User' })}</th>
                  <th>{t('admin.detail.action', { defaultValue: 'Action' })}</th>
                  <th>{t('admin.auditLog.resourceType', { defaultValue: 'Resource Type' })}</th>
                  <th className="text-center">{t('admin.auditLog.resourceId', { defaultValue: 'Resource ID' })}</th>
                  <th>{t('admin.auditLog.ipAddress', { defaultValue: 'IP Address' })}</th>
                  <SortableHeader field="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>{t('admin.detail.created', { defaultValue: 'Created' })}</SortableHeader>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <TableEmptyState
                    colSpan={8}
                    icon="bx-shield"
                    message={t('admin.auditLogs.noLogs', { defaultValue: 'No audit logs found' })}
                    sub={t('admin.auditLogs.noLogsSub', { defaultValue: 'No audit logs match the current filters' })}
                  />
                ) : (
                  logs.map((log) => (
                    <tr className="whitespace-nowrap cursor-pointer hover:bg-surface-50 transition-colors" key={log.id} onClick={() => router.push(`/admin/audit-logs/${log.id}`)}>
                      <td className="font-medium">{log.id}</td>
                      <td className="text-center">{log.userId || '-'}</td>
                      <td>{actionBadge(log.action)}</td>
                      <td>{resourceTypeText(log.resourceType)}</td>
                      <td className="text-center">{log.resourceId || '-'}</td>
                      <td>
                        {log.ipAddress ? <code className="text-surface-800 text-[0.8rem]">{log.ipAddress}</code> : '-'}
                      </td>
                      <td>{fmtDate(log.createdAt)}</td>
                      <td>
                        <Button
                          variant="text-secondary"
                          size="icon-sm"
                          href={`/admin/audit-logs/${log.id}`}
                          title={t('admin.detail.viewDetails', { defaultValue: 'View details' })}
                        >
                          <i className="bx bx-chevron-right"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            <div className="px-5 py-1.5">
              <Pagination pagination={pagination} onPageChange={(p) => startTransition(() => setCurrentPage(p))} loading={isValidating} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
