import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

export default function TempWalletFlagsCard({ wallet, t }) {
  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-flag mr-2"></i>
          {t('admin.tempWallet.flags', { defaultValue: 'Flags' })}
        </h5>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {wallet.isReusable != null &&
            (wallet.isReusable ? (
              <Badge color="success" label>
                {t('admin.tempWallet.reusable', { defaultValue: 'Reusable' })}
              </Badge>
            ) : (
              <Badge color="secondary">
                {t('admin.tempWallet.notReusable', { defaultValue: 'Not Reusable' })}
              </Badge>
            ))}
          {wallet.isAssigned && (
            <Badge color="info" label>
              {t('admin.tempWallet.assigned', { defaultValue: 'Assigned' })}
            </Badge>
          )}
          {wallet.isAvailable && (
            <Badge color="success" label>
              {t('admin.tempWallet.available', { defaultValue: 'Available' })}
            </Badge>
          )}
          {wallet.isExpired && (
            <Badge color="danger" label>
              {t('status.expired', { defaultValue: 'Expired' })}
            </Badge>
          )}
          {wallet.hasBeenUsed && (
            <Badge color="warning" label>
              {t('admin.tempWallet.hasBeenUsed', { defaultValue: 'Has Been Used' })}
            </Badge>
          )}
          {wallet.needsSweeping && (
            <Badge color="primary" label>
              {t('admin.tempWallet.needsSweeping', { defaultValue: 'Needs Sweeping' })}
            </Badge>
          )}
          {wallet.timeToExpiry != null && (
            <Badge color="warning" label>
              {t('admin.tempWallet.expiresIn', {
                defaultValue: 'Expires in {{minutes}}m',
                minutes: Math.floor(wallet.timeToExpiry / 60000),
              })}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}
