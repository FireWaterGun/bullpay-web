'use client'

import { formatDate } from '@/lib/utils/format'

export default function AddressAuditLog({ logs = [], t }) {
  if (!logs.length) {
    return (
      <div className="text-muted small py-2">
        {t?.('withdrawalAddresses.noAuditLogs', { defaultValue: 'No audit logs' }) || 'No audit logs'}
      </div>
    )
  }

  return (
    <ul className="list-unstyled mb-0">
      {logs.map((log, idx) => (
        <li key={log.id || idx} className="d-flex gap-2 mb-2 pb-2 border-bottom">
          <i className="bx bx-time-five text-muted mt-1"></i>
          <div>
            <div className="small">{log.action || log.event || '-'}</div>
            {log.user?.email && <div className="text-muted small">by {log.user.email}</div>}
            {log.reason && <div className="text-muted small">Reason: {log.reason}</div>}
            <div className="text-muted small">{formatDate(log.createdAt)}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}
