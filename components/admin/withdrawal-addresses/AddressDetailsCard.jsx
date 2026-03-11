import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

export default function AddressDetailsCard({ address, t, onCopy }) {
  const { fmtDate } = useDateFormat()
  const coinSymbol = (address.coinSymbol || '').toUpperCase()
  const networkSymbol = (address.networkSymbol || '').toUpperCase()

  return (
    <div className="p-5">
      <div className="grid grid-cols-12 gap-x-6 gap-3">
        <div className="col-span-12 sm:col-span-6">
          <small className="text-surface-500 block mb-1">
            {t('admin.withdrawalAddress.addressId', { defaultValue: 'Address ID' })}
          </small>
          <span className="font-semibold">{address.id}</span>
        </div>
        <div className="col-span-12 sm:col-span-6">
          <small className="text-surface-500 block mb-1">
            {t('admin.detail.userId', { defaultValue: 'User ID' })}
          </small>
          <span className="font-semibold">{address.userId}</span>
        </div>
        <div className="col-span-12 sm:col-span-6">
          <small className="text-surface-500 block mb-1">
            {t('admin.detail.label', { defaultValue: 'Label' })}
          </small>
          <span>{address.label ? address.label : <span className="text-surface-500">—</span>}</span>
        </div>
        <div className="col-span-12 sm:col-span-6">
          <small className="text-surface-500 block mb-1">
            {t('admin.detail.coinNetwork', { defaultValue: 'Coin / Network' })}
          </small>
          <div className="flex items-center gap-2">
            <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={20} className="mr-1" />
            <span className="font-medium">{coinSymbol}</span>
            <span className="text-surface-500">/ {networkSymbol}</span>
          </div>
        </div>
        <div className="col-span-12">
          <small className="text-surface-500 block mb-1">
            {t('admin.detail.address', { defaultValue: 'Address' })}
          </small>
          <div className="flex items-center gap-2">
            <code className="text-primary text-[0.875rem] break-all">{address.address || 'N/A'}</code>
            {address.address && (
              <Button
                onClick={() => onCopy(address.address)}
                title={t('actions.copy', { defaultValue: 'Copy' })}
                size="icon-sm"
                variant="text-secondary"
              >
                <i className="bx bx-copy text-[1rem]"></i>
              </Button>
            )}
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6">
          <small className="text-surface-500 block mb-1">
            {t('admin.detail.created', { defaultValue: 'Created' })}
          </small>
          <span>{fmtDate(address.createdAt)}</span>
        </div>
        <div className="col-span-12 sm:col-span-6">
          <small className="text-surface-500 block mb-1">
            {t('admin.detail.updated', { defaultValue: 'Updated' })}
          </small>
          <span>{fmtDate(address.updatedAt)}</span>
        </div>
        <div className="col-span-12 sm:col-span-6">
          <small className="text-surface-500 block mb-1">
            {t('admin.detail.usageCount', { defaultValue: 'Usage Count' })}
          </small>
          <span className="font-semibold">{address.usageCount ?? 0}</span>
        </div>
        <div className="col-span-12 sm:col-span-6">
          <small className="text-surface-500 block mb-1">
            {t('admin.detail.totalWithdrawn', { defaultValue: 'Total Withdrawn' })}
          </small>
          <span className="font-semibold">{address.totalWithdrawn || '0'}</span>
        </div>
        {address.lockUntil && (
          <div className="col-span-12 sm:col-span-6">
            <small className="text-surface-500 block mb-1">
              {t('admin.withdrawalAddress.lockUntil', { defaultValue: 'Lock Until' })}
            </small>
            <span>{fmtDate(address.lockUntil)}</span>
            {address.isLocked && (
              <Badge color="warning" label className="ml-2">
                {t('admin.withdrawalAddress.locked', { defaultValue: 'Locked' })}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
