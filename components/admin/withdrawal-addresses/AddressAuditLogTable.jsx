import { useDateFormat } from '@/hooks/useDateFormat'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

export default function AddressAuditLogTable({ auditLogs }) {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  if (!auditLogs || auditLogs.length === 0) return null

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-history mr-2"></i>
          {t('admin.withdrawalAddress.auditLog', { defaultValue: 'Audit Log' })}
        </h5>
      </div>
      <div className="p-0">
        <div className="overflow-x-auto">
          <Table responsive={false} className="text-sm mb-0">
            <thead>
              <tr>
                <th>{t('admin.detail.action', { defaultValue: 'Action' })}</th>
                <th>{t('admin.detail.admin', { defaultValue: 'Admin' })}</th>
                <th>{t('admin.detail.reason', { defaultValue: 'Reason' })}</th>
                <th>{t('admin.detail.date', { defaultValue: 'Date' })}</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id || `${log.action}-${log.createdAt || log.timestamp}`}>
                  <td>
                    <span className="font-medium">{log.action}</span>
                  </td>
                  <td>{log.adminId || log.performedBy || '—'}</td>
                  <td className="text-surface-500 max-w-[300px] whitespace-normal">{log.reason || '—'}</td>
                  <td className="whitespace-nowrap">{fmtDate(log.createdAt || log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </Card>
  )
}
