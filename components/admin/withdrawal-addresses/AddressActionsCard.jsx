import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function AddressActionsCard({ address, t, onAction }) {
  const isFlagged = !!address.isFlagged
  const isVerified = !!address.isVerified

  if (address.status === 'deleted') return null

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-cog mr-2"></i>
          {t('admin.detail.actions', { defaultValue: 'Actions' })}
        </h5>
      </div>
      <div className="p-5 grid gap-2">
        {!isFlagged ? (
          <Button
            onClick={() => onAction('flag')}
            className="border border-warning-500 text-warning-500 bg-transparent hover:bg-warning-500 hover:text-white"
          >
            <i className="bx bx-flag mr-2"></i>
            {t('admin.withdrawalAddress.flagAddress', { defaultValue: 'Flag Address' })}
          </Button>
        ) : (
          <Button
            onClick={() => onAction('unflag')}
            className="border border-success-500 text-success-500 bg-transparent hover:bg-success-500 hover:text-white"
          >
            <i className="bx bx-check-circle mr-2"></i>
            {t('admin.withdrawalAddress.removeFlag', { defaultValue: 'Remove Flag' })}
          </Button>
        )}
        {!isVerified && (
          <Button
            onClick={() => onAction('forceVerify')}
            className="border border-info-500 text-info-500 bg-transparent hover:bg-info-500 hover:text-white"
          >
            <i className="bx bx-shield-quarter mr-2"></i>
            {t('admin.withdrawalAddress.forceVerify', { defaultValue: 'Force Verify' })}
          </Button>
        )}
        <hr className="my-1" />
        <Button
          onClick={() => onAction('delete')}
          className="border border-danger-500 text-danger-500 bg-transparent hover:bg-danger-500 hover:text-white"
        >
          <i className="bx bx-trash mr-2"></i>
          {t('admin.withdrawalAddress.deletePermanently', { defaultValue: 'Delete Permanently' })}
        </Button>
      </div>
    </Card>
  )
}
