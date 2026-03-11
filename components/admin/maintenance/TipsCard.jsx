import Card, { CardHeader, CardBody } from '@/components/ui/Card'

export default function TipsCard({ t }) {
  const tips = [
    t('admin.maintenance.tip1', {
      defaultValue: 'Use Partial for UI/frontend updates \u2014 merchants can still check payment status.',
    }),
    t('admin.maintenance.tip2', {
      defaultValue: 'Use Full only for database migrations or critical infrastructure changes.',
    }),
    t('admin.maintenance.tip3', {
      defaultValue: 'Background jobs (watchers, sweeps, webhooks) continue running in both modes.',
    }),
    t('admin.maintenance.tip4', { defaultValue: 'Changes take effect immediately via Redis cache invalidation.' }),
  ]

  return (
    <Card>
      <CardHeader>
        <h6 className="text-lg font-semibold text-surface-800 mb-0">
          <i className="bx bx-bulb mr-1 text-warning-500" />
          {t('admin.maintenance.tips', { defaultValue: 'Tips' })}
        </h6>
      </CardHeader>
      <CardBody>
        <ul className="list-none mb-0 text-sm text-surface-600 space-y-2">
          {tips.map((tip, i) => (
            <li key={i}>
              <i className="bx bx-right-arrow-alt mr-1 text-primary-500" />
              {tip}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}
