import { useTranslation } from 'react-i18next'

function SettingsCard({ title, children }) {
  return (
    <div className="col-md-6">
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">{title}</h6>
        </div>
        <div className="card-body">
          <table className="table table-sm mb-0">
            <tbody>{children}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BooleanBadge({ value }) {
  return (
    <span className={`badge ${value ? 'bg-success' : 'bg-secondary'}`}>
      {value ? 'Yes' : 'No'}
    </span>
  )
}

function AutoApproveCard({ autoApprove }) {
  const { t } = useTranslation()
  return (
    <SettingsCard title={t('admin.withdrawal.autoApprove', { defaultValue: 'Auto Approve' })}>
      <tr>
        <td><strong>{t('admin.withdrawal.enabled', { defaultValue: 'Enabled' })}</strong></td>
        <td><BooleanBadge value={autoApprove.enabled} /></td>
      </tr>
      <tr>
        <td><strong>{t('admin.withdrawal.thresholdUsd', { defaultValue: 'Threshold (USD)' })}</strong></td>
        <td><code>{autoApprove.thresholdUsd || 0}</code></td>
      </tr>
    </SettingsCard>
  )
}

function GasSettingsCard({ gasSettings }) {
  const { t } = useTranslation()
  return (
    <SettingsCard title={t('admin.withdrawal.gasSettings', { defaultValue: 'Gas Settings' })}>
      <tr>
        <td><strong>{t('admin.withdrawal.bufferMultiplier', { defaultValue: 'Buffer Multiplier' })}</strong></td>
        <td><code>{gasSettings.bufferMultiplier || '-'}</code></td>
      </tr>
      <tr>
        <td><strong>{t('admin.withdrawal.minNativeByNetwork', { defaultValue: 'Min Native/Network' })}</strong></td>
        <td>
          <span className="badge rounded-pill bg-primary" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
            {Object.keys(gasSettings.minNativeByNetwork || {}).length}
          </span>
        </td>
      </tr>
    </SettingsCard>
  )
}

function PolicyCard({ policy }) {
  const { t } = useTranslation()
  return (
    <SettingsCard title={t('admin.withdrawal.policy', { defaultValue: 'Policy' })}>
      <tr>
        <td><strong>{t('admin.withdrawal.countPendingInUsage', { defaultValue: 'Count Pending' })}</strong></td>
        <td><BooleanBadge value={policy.countPendingInUsage} /></td>
      </tr>
    </SettingsCard>
  )
}

function ReservationCard({ reservation }) {
  const { t } = useTranslation()
  return (
    <SettingsCard title={t('admin.withdrawal.reservation', { defaultValue: 'Reservation' })}>
      <tr>
        <td><strong>{t('admin.withdrawal.reserveTtlSeconds', { defaultValue: 'Reserve TTL (s)' })}</strong></td>
        <td><code>{reservation.reserveTtlSeconds || '-'}</code></td>
      </tr>
      <tr>
        <td><strong>{t('admin.withdrawal.headroomPercent', { defaultValue: 'Headroom %' })}</strong></td>
        <td><code>{reservation.headroomPercent || '-'}</code></td>
      </tr>
    </SettingsCard>
  )
}

function ReconciliationCard({ reconciliation }) {
  const { t } = useTranslation()
  return (
    <SettingsCard title={t('admin.withdrawal.reconciliation', { defaultValue: 'Reconciliation' })}>
      <tr>
        <td><strong>{t('admin.withdrawal.staleMinutes', { defaultValue: 'Stale Minutes' })}</strong></td>
        <td><code>{reconciliation.staleMinutes || '-'}</code></td>
      </tr>
      <tr>
        <td><strong>{t('admin.withdrawal.maxPerRun', { defaultValue: 'Max Per Run' })}</strong></td>
        <td><code>{reconciliation.maxPerRun || '-'}</code></td>
      </tr>
      <tr>
        <td><strong>{t('admin.withdrawal.jitterMs', { defaultValue: 'Jitter (ms)' })}</strong></td>
        <td>
          {reconciliation.jitterMs ? (
            <code>{reconciliation.jitterMs.min} - {reconciliation.jitterMs.max}</code>
          ) : (
            <span className="text-muted">-</span>
          )}
        </td>
      </tr>
    </SettingsCard>
  )
}

export default function WithdrawalSettingsCards({
  autoApprove,
  gasSettings,
  policy,
  reservation,
  reconciliation,
}) {
  return (
    <div className="row g-4">
      <AutoApproveCard autoApprove={autoApprove} />
      <GasSettingsCard gasSettings={gasSettings} />
      <PolicyCard policy={policy} />
      <ReservationCard reservation={reservation} />
      <ReconciliationCard reconciliation={reconciliation} />
    </div>
  )
}
