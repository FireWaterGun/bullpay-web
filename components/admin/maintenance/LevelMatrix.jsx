import Table from '@/components/ui/Table'
import { LEVEL_MATRIX } from './maintenanceHelpers'

function StatusIcon({ ok }) {
  return ok ? <i className="bx bx-check text-success-500" /> : <i className="bx bx-x text-danger-500" />
}

export default function LevelMatrix({ t }) {
  return (
    <Table responsive={false} className="text-sm mb-0">
      <thead>
        <tr>
          <th>{t('admin.maintenance.component', { defaultValue: 'Component' })}</th>
          <th className="text-center">None</th>
          <th className="text-center">Partial</th>
          <th className="text-center">Full</th>
        </tr>
      </thead>
      <tbody>
        {LEVEL_MATRIX.map((row) => (
          <tr key={row.label}>
            <td>
              <small>{row.label}</small>
            </td>
            <td className="text-center">
              <StatusIcon ok={row.none} />
            </td>
            <td className="text-center">
              <StatusIcon ok={row.partial} />
            </td>
            <td className="text-center">
              <StatusIcon ok={row.full} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
