'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

export default function ChainSettingsTable({ data, type, label, valueHeader, keyPrefix, emptyMessage, onEdit, loading }) {
  const { t } = useAdminTranslation()
  const entries = Object.entries(data || {})

  return (
    <div className="col-12 mt-4">
      <div className="mb-3">
        <div className="d-flex align-items-center">
          <div className="flex-grow-1">
            <span className="text-dark">{label}</span>
            <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
              {entries.length}
            </span>
          </div>
          {/* Hidden: Add button */}
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>{t('admin.detail.chainId', { defaultValue: 'Chain ID' })}</th>
                <th>{valueHeader}</th>
                <th className="text-end">{t('admin.detail.actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([chainId, value]) => (
                <tr key={`${keyPrefix}-${chainId}`}>
                  <td><strong>{chainId}</strong></td>
                  <td><code>{value}</code></td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-icon me-1"
                      onClick={() => onEdit(type, chainId, value)}
                      disabled={loading}
                    >
                      <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-muted py-5">
          <i className="bx bx-data" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
          <p className="mt-3 mb-0">{emptyMessage}</p>
        </div>
      )}
    </div>
  )
}
