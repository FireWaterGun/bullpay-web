import { formatDate } from '../../utils/format'

export default function AddressAuditLog({ auditLogs }) {
  if (!auditLogs || auditLogs.length === 0) return null

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0"><i className="bx bx-history me-2"></i>Audit Log</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Action</th>
                <th>Admin</th>
                <th>Reason</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id || `${log.action}-${log.createdAt || log.timestamp}`}>
                  <td><span className="fw-medium">{log.action}</span></td>
                  <td>{log.adminId || log.performedBy || '—'}</td>
                  <td className="text-muted" style={{ maxWidth: 300, whiteSpace: 'normal' }}>{log.reason || '—'}</td>
                  <td className="text-nowrap">{formatDate(log.createdAt || log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
