'use client'

import { useDateFormat } from '@/hooks/useDateFormat'

const EMPTY_LOGS = []

export default function AddressAuditLog({ logs = EMPTY_LOGS, t }) {
  const { fmtDate } = useDateFormat()
  if (!logs.length) {
    return (
      <div className="text-surface-500 text-sm py-2">
        {t?.('withdrawalAddresses.noAuditLogs', { defaultValue: 'No audit logs' }) || 'No audit logs'}
      </div>
    )
  }

  return (
    <ul className="list-none mb-0">
      {logs.map((log, idx) => (
        <li key={log.id || idx} className="flex gap-2 mb-2 pb-2 border-b border-surface-200">
          <i className="bx bx-time-five text-surface-400 mt-1"></i>
          <div>
            <div className="text-sm">{log.action || log.event || '-'}</div>
            {log.user?.email && <div className="text-surface-500 text-sm">by {log.user.email}</div>}
            {log.reason && <div className="text-surface-500 text-sm">Reason: {log.reason}</div>}
            <div className="text-surface-500 text-sm">{fmtDate(log.createdAt)}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}
