'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import { getAuditLog } from '@/lib/api/auditLogs'
import { formatDate } from '@/lib/utils/format'
import { logger } from '@/lib/utils/logger'

export default function AuditLogDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { token } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState(null)

  useEffect(() => {
    loadLog()
  }, [id])

  async function loadLog() {
    try {
      setLoading(true)
      const data = await getAuditLog(token, id)
      setLog(data)
    } catch (error) {
      logger.error('Failed to load audit log:', error)
      toast.error('Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }

  function actionBadge(action) {
    if (!action) return '-'
    const colorMap = {
      'retry_sweep': 'warning',
      'retry_webhook': 'warning',
      'list_sweeps': 'info',
      'list_webhook_logs': 'info',
      'list_audit_logs': 'info',
      'view_webhook_log': 'secondary',
      'view_audit_log': 'secondary',
    }
    const color = colorMap[action] || 'primary'
    return <span className={`badge bg-label-${color}`}>{action}</span>
  }

  function resourceTypeBadge(type) {
    if (!type) return '-'
    const colorMap = {
      'sweep': 'success',
      'merchant_webhook_log': 'info',
      'system_audit_log': 'warning',
    }
    const color = colorMap[type] || 'secondary'
    return <span className={`badge bg-label-${color}`}>{type}</span>
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
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!log) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-warning">Audit log not found</div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          {/* Back button */}
          <div className="mb-4">
            <Link href="/admin/audit-logs" className="btn btn-label-secondary">
              <i className="bx bx-arrow-back me-1"></i>
              Back to Audit Logs
            </Link>
          </div>

          {/* Header */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center bg-label-primary"
                    style={{ width: 48, height: 48 }}
                  >
                    <i className="bx bx-history fs-4"></i>
                  </div>
                  <div>
                    <h4 className="mb-0">Audit Log #{log.id}</h4>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      {actionBadge(log.action)}
                      <span className="text-muted">•</span>
                      {resourceTypeBadge(log.resourceType)}
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={loadLog} disabled={loading}>
                  <i className="bx bx-refresh me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Left: Audit Info */}
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Audit Info</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>ID</td>
                        <td className="fw-medium">{log.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">User ID</td>
                        <td className="fw-medium">{log.userId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Action</td>
                        <td>{actionBadge(log.action)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Created</td>
                        <td>{formatDate(log.createdAt)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Resource & Request Info */}
            <div className="col-md-6">
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Resource & Request Info</h5>
                </div>
                <div className="card-body">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>Resource Type</td>
                        <td>{resourceTypeBadge(log.resourceType)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Resource ID</td>
                        <td className="fw-medium">{log.resourceId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">IP Address</td>
                        <td>
                          {log.ipAddress ? (
                            <code className="text-body" style={{ fontSize: '0.85rem' }}>{log.ipAddress}</code>
                          ) : '-'}
                        </td>
                      </tr>
                      {log.userAgent && (
                        <tr>
                          <td className="text-muted">User Agent</td>
                          <td>
                            <span style={{ fontSize: '0.8rem', wordBreak: 'break-word' }}>
                              {log.userAgent}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Details JSON */}
          {log.details && (
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bx bx-code-alt me-2 text-primary"></i>
                  Details
                </h5>
              </div>
              <div className="card-body">
                <pre
                  className="bg-dark text-light p-3 rounded mb-0"
                  style={{ fontSize: '0.8rem', maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {formatJson(log.details)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
