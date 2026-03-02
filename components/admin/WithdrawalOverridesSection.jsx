'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

function FeeConfigCell({ config }) {
  if (config.fee?.type === 'fixed') {
    return <code>Fixed: {config.fee.fixed}</code>
  }
  if (config.fee?.type === 'percentage') {
    return (
      <code>
        {config.fee.percentage}% (min: {config.fee.min}
        {config.fee.max ? `, max: ${config.fee.max}` : ''})
      </code>
    )
  }
  return <span className="text-muted">-</span>
}

function OverrideRow({ label, config, showMaximum }) {
  return (
    <tr>
      <td><strong>{label}</strong></td>
      <td>
        {config.minimum ? (
          <code>{config.minimum}</code>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      {showMaximum && (
        <td>
          {config.maximum ? (
            <code>{config.maximum}</code>
          ) : (
            <span className="text-muted">-</span>
          )}
        </td>
      )}
      <td>
        {config.fee?.type ? (
          <span className="badge bg-label-info">{config.fee.type}</span>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        <FeeConfigCell config={config} />
      </td>
    </tr>
  )
}

export default function WithdrawalOverridesSection({
  title,
  badgeColor,
  overrides,
  emptyMessageKey,
  emptyMessageDefault,
  labelColumnKey,
  labelColumnDefault,
  showMaximum = false,
}) {
  const { t } = useAdminTranslation()
  const entries = Object.entries(overrides)

  return (
    <div className="mb-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">
          {title}
          <span
            className={`badge rounded-pill ${badgeColor} ms-2`}
            style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}
          >
            {entries.length}
          </span>
        </h6>
      </div>

      {entries.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>{t(labelColumnKey, { defaultValue: labelColumnDefault })}</th>
                <th>{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</th>
                {showMaximum && (
                  <th>{t('admin.withdrawal.maximum', { defaultValue: 'Maximum' })}</th>
                )}
                <th>{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</th>
                <th>{t('admin.withdrawal.feeConfig', { defaultValue: 'Fee Config' })}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, config]) => (
                <OverrideRow
                  key={key}
                  label={key}
                  config={config}
                  showMaximum={showMaximum}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-muted py-4">
          <p>{t(emptyMessageKey, { defaultValue: emptyMessageDefault })}</p>
        </div>
      )}
    </div>
  )
}
