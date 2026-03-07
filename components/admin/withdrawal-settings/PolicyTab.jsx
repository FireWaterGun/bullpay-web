import AutoApproveForm from '@/components/admin/withdrawal-policy/AutoApproveForm'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function PolicyTab({ t, autoApprove, setAutoApprove, maxPending, onEditMaxPending }) {
  return (
    <div className="grid grid-cols-12 gap-x-6">
      <div className="col-span-12 lg:col-span-8">
        {/* Auto-Approve Section */}
        <Card className="mb-4">
          <div className="p-5">
            <AutoApproveForm autoApprove={autoApprove} setAutoApprove={setAutoApprove} />
          </div>
        </Card>

        {/* Max Pending Per User */}
        <Card className="mb-4">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300 flex items-center justify-between">
            <h5 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-lock-alt mr-2 text-warning"></i>
              {t('admin.withdrawalSettings.maxPendingTitle', { defaultValue: 'Max Pending Withdrawals' })}
            </h5>
            <Button type="button" onClick={onEditMaxPending} variant="text-secondary" size="icon-sm">
              <i className="bx bx-edit text-[1rem]"></i>
            </Button>
          </div>
          <div className="p-5">
            <p className="text-surface-500 mb-3 text-sm">
              {t('admin.withdrawalSettings.maxPendingDesc', {
                defaultValue:
                  'Maximum number of pending (unprocessed) withdrawal requests allowed per user at any time.',
              })}
            </p>
            <div className="flex items-center gap-3 p-3 rounded bg-surface-100 dark:bg-white/[0.03]">
              <div>
                <small className="text-surface-500 block">
                  {t('admin.withdrawalSettings.currentValue', { defaultValue: 'Current Value' })}
                </small>
                <h4 className="mb-0 font-bold">{maxPending}</h4>
              </div>
              <div className="ml-auto">
                <small className="text-surface-500">withdrawal.security.max_pending_per_user</small>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="col-span-12 lg:col-span-4">
        <Card className="mb-3">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300">
            <h6 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-info-circle mr-1"></i>
              {t('admin.withdrawalSettings.howItWorks', { defaultValue: 'How It Works' })}
            </h6>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Badge color="success" label className="rounded-full mt-1">
                  1
                </Badge>
                <div>
                  <small className="font-semibold block">
                    {t('admin.withdrawalSettings.howItWorksStep1', { defaultValue: 'User requests withdrawal' })}
                  </small>
                  <small className="text-surface-500">
                    {t('admin.withdrawalSettings.howItWorksStep1Desc', {
                      defaultValue: 'System checks max pending limit per user',
                    })}
                  </small>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge color="success" label className="rounded-full mt-1">
                  2
                </Badge>
                <div>
                  <small className="font-semibold block">
                    {t('admin.withdrawalSettings.howItWorksStep2', { defaultValue: 'Auto-approve check' })}
                  </small>
                  <small className="text-surface-500">
                    {t('admin.withdrawalSettings.howItWorksStep2Desc', {
                      defaultValue: 'If enabled and amount ≤ threshold → auto-approved',
                    })}
                  </small>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge color="warning" label className="rounded-full mt-1">
                  3
                </Badge>
                <div>
                  <small className="font-semibold block">
                    {t('admin.withdrawalSettings.howItWorksStep3', { defaultValue: 'Manual review' })}
                  </small>
                  <small className="text-surface-500">
                    {t('admin.withdrawalSettings.howItWorksStep3Desc', {
                      defaultValue: 'Large or flagged requests require admin approval',
                    })}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-300">
            <h6 className="text-lg font-semibold text-surface-800 mb-0">
              <i className="bx bx-bulb mr-1"></i>
              {t('admin.withdrawalSettings.tips', { defaultValue: 'Tips' })}
            </h6>
          </div>
          <div className="p-5">
            <ul className="list-none mb-0 text-sm text-surface-500">
              <li className="mb-2">
                <i className="bx bx-right-arrow-alt mr-1"></i>
                {t('admin.withdrawalSettings.tip1', {
                  defaultValue: 'Auto-approve is great for small withdrawals to reduce admin workload.',
                })}
              </li>
              <li className="mb-2">
                <i className="bx bx-right-arrow-alt mr-1"></i>
                {t('admin.withdrawalSettings.tip3', {
                  defaultValue: 'Keep max pending low (3–5) to prevent withdrawal queue abuse.',
                })}
              </li>
              <li>
                <i className="bx bx-right-arrow-alt mr-1"></i>
                {t('admin.withdrawalSettings.tip4', {
                  defaultValue: 'Changes take effect immediately — no restart required.',
                })}
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
