import Badge from '@/components/ui/Badge'
import Card from '@/components/ui/Card'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function AddressStatusCard({ address, t, statusLabel }) {
  const isVerified = !!address.isVerified
  const isFlagged = !!address.isFlagged

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-info-circle mr-2"></i>
          {t('admin.detail.status', { defaultValue: 'Status' })}
        </h5>
      </div>
      <div className="p-5">
        <div className="mb-3">
          <small className="text-surface-500 block mb-1">
            {t('admin.detail.status', { defaultValue: 'Status' })}
          </small>
          <span className={`${getStatusBadgeClass(address.status, 'withdrawalAddress')} text-[0.85rem]`}>
            {statusLabel(address.status)}
          </span>
        </div>
        <div className="mb-3">
          <small className="text-surface-500 block mb-1">
            {t('admin.detail.verified', { defaultValue: 'Verified' })}
          </small>
          {isVerified ? (
            <span className="text-success font-medium">
              <i className="bx bx-check-circle mr-1"></i>
              {t('admin.detail.verified', { defaultValue: 'Verified' })}
            </span>
          ) : (
            <span className="text-surface-500">
              <i className="bx bx-x-circle mr-1"></i>
              {t('admin.withdrawalAddress.notVerified', { defaultValue: 'Not Verified' })}
            </span>
          )}
        </div>
        <div className="mb-3">
          <small className="text-surface-500 block mb-1">
            {t('admin.detail.flagged', { defaultValue: 'Flagged' })}
          </small>
          {isFlagged ? (
            <span className="text-warning font-medium">
              <i className="bx bx-flag mr-1"></i>
              {t('admin.detail.flagged', { defaultValue: 'Flagged' })}
            </span>
          ) : (
            <span className="text-surface-500">
              {t('admin.withdrawalAddress.notFlagged', { defaultValue: 'Not Flagged' })}
            </span>
          )}
        </div>
        {address.flaggedReason && (
          <div className="mb-3">
            <small className="text-surface-500 block mb-1">
              {t('admin.withdrawalAddress.flagReason', { defaultValue: 'Flag Reason' })}
            </small>
            <span className="text-warning text-[0.85rem]">{address.flaggedReason}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
