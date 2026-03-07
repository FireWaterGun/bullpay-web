'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getAuditLog } from '@/lib/api/auditLogs'
import { useDateFormat } from '@/hooks/useDateFormat'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'
import PageSpinner from '@/components/PageSpinner'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'

export default function AuditLogDetail() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const { id } = useParams()
  const { token } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState(null)

  const loadLog = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAuditLog(token, id)
      setLog(data)
    } catch (error) {
      logger.error('Failed to load audit log:', error)
      toast.error(t('admin.auditLog.loadError', { defaultValue: 'Failed to load audit log' }))
    } finally {
      setLoading(false)
    }
  }, [token, id, toast, t])

  useEffect(() => {
    loadLog()
  }, [loadLog])

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
    return (
      <Badge color={color} label>
        {action}
      </Badge>
    )
  }

  function resourceTypeBadge(type) {
    if (!type) return '-'
    const colorMap = {
      sweep: 'success',
      merchant_webhook_log: 'info',
      system_audit_log: 'warning',
    }
    const color = colorMap[type] || 'secondary'
    return (
      <Badge color={color} label>
        {type}
      </Badge>
    )
  }

  function formatJson(val) {
    if (!val) return null
    try {
      const obj = typeof val === 'string' ? JSON.parse(val) : val
      return JSON.stringify(obj, null, 2)
    } catch {
      return String(val)
    }
  }

  if (loading && !log) {
    return <PageSpinner />
  }

  if (!log) {
    return (
      <div className="grow py-6">
        <Alert variant="warning">{t('admin.auditLog.notFound', { defaultValue: 'Audit log not found' })}</Alert>
      </div>
    )
  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back button */}
          <div className="mb-4">
            <Button variant="label-secondary" href="/admin/audit-logs">
              <i className="bx bx-arrow-back mr-1"></i>
              Back to Audit Logs
            </Button>
          </div>

          {/* Header */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full flex items-center justify-center bg-primary-50 text-primary-600 w-12 h-12">
                    <i className="bx bx-history text-2xl"></i>
                  </div>
                  <div>
                    <h4 className="mb-0">Audit Log #{log.id}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {actionBadge(log.action)}
                      <span className="text-surface-500">•</span>
                      {resourceTypeBadge(log.resourceType)}
                    </div>
                  </div>
                </div>
                <RefreshButton onClick={loadLog} loading={loading} />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-x-6">
            {/* Left: Audit Info */}
            <div className="md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">Audit Info</h5>
                </div>
                <div className="p-5">
                  <Table responsive={false} className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{log.id}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
                        <td className="font-medium">{log.userId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.action', { defaultValue: 'Action' })}</td>
                        <td>{actionBadge(log.action)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                        <td>{fmtDate(log.createdAt)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Right: Resource & Request Info */}
            <div className="md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">Resource & Request Info</h5>
                </div>
                <div className="p-5">
                  <Table responsive={false} className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">
                          {t('admin.auditLog.resourceType', { defaultValue: 'Resource Type' })}
                        </td>
                        <td>{resourceTypeBadge(log.resourceType)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Resource ID</td>
                        <td className="font-medium">{log.resourceId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">IP Address</td>
                        <td>
                          {log.ipAddress ? (
                            <code className="text-surface-800 text-[0.85rem]">{log.ipAddress}</code>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                      {log.userAgent && (
                        <tr>
                          <td className="text-surface-500">User Agent</td>
                          <td>
                            <span className="text-[0.8rem] break-words">{log.userAgent}</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card>
            </div>
          </div>

          {/* Details JSON */}
          {log.details && (
            <Card className="mb-4">
              <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
                <h5 className="mb-0">
                  <i className="bx bx-code-alt mr-2 text-primary"></i>
                  Details
                </h5>
              </div>
              <div className="p-5">
                <pre className="bg-surface-900 text-surface-100 p-3 rounded mb-0 text-[0.8rem] max-h-[400px] overflow-auto whitespace-pre-wrap break-words">
                  {formatJson(log.details)}
                </pre>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
