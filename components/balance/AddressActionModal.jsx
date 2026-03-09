'use client'
import Button from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

export default function AddressActionModal({
  selectedAddress,
  actionType,
  actionConfig,
  actionReason,
  setActionReason,
  skipLockPeriod,
  setSkipLockPeriod,
  actionLoading,
  onAction,
  onClose,
  t,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={() => !actionLoading && onClose()}
    >
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <h5 className="font-semibold text-lg flex items-center">
            <i className={`bx ${actionConfig.icon} mr-2`}></i>
            {actionConfig.title}
          </h5>
          <button
            type="button"
            className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"
            onClick={onClose}
            disabled={actionLoading}
          >
            <i className="bx bx-x"></i>
          </button>
        </div>
        <div className="px-6 py-4">
          <div className="rounded-lg bg-surface-50 dark:bg-dark-elevated border border-surface-200 mb-3">
            <div className="py-2 px-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <small className="text-surface-500 block">
                    {t('admin.withdrawalAddress.addressId', { defaultValue: 'Address ID' })}
                  </small>
                  <strong>#{selectedAddress.id}</strong>
                </div>
                <div>
                  <small className="text-surface-500 block">
                    {t('admin.detail.userId', { defaultValue: 'User ID' })}
                  </small>
                  <strong>{selectedAddress.userId}</strong>
                </div>
                <div className="col-span-2">
                  <small className="text-surface-500 block">
                    {t('admin.detail.address', { defaultValue: 'Address' })}
                  </small>
                  <code className="text-[0.8rem] break-all">{selectedAddress.address}</code>
                </div>
              </div>
            </div>
          </div>

          {actionType === 'delete' && (
            <div
              className="rounded-lg bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400 p-3 flex items-center mb-3"
              role="alert"
            >
              <i className="bx bx-error-circle mr-2 text-xl"></i>
              <div>
                {t('admin.withdrawalAddress.deleteWarning', {
                  defaultValue: 'This action is irreversible. The address will be permanently deleted.',
                })}
              </div>
            </div>
          )}

          <div className="mb-3">
            <Label>
              {t('admin.withdrawalAddress.reason', { defaultValue: 'Reason' })}{' '}
              <span className="text-danger-500">*</span>
            </Label>
            <Input
              rows="3"
              placeholder={t('admin.withdrawalAddress.reasonPlaceholder', {
                defaultValue: 'Enter reason (minimum 10 characters)...',
              })}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              disabled={actionLoading}
              className="w-full"
            ></Input>
            <small className="text-surface-500">
              {actionReason.trim().length}/500 {t('admin.withdrawalAddress.characters', { defaultValue: 'characters' })}
            </small>
          </div>

          {actionType === 'forceVerify' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                className="rounded border-surface-300"
                type="checkbox"
                checked={skipLockPeriod}
                onChange={(e) => setSkipLockPeriod(e.target.checked)}
                disabled={actionLoading}
              />

              <span className="text-sm">
                {t('admin.withdrawalAddress.skipLockPeriod', { defaultValue: 'Skip lock period' })}
              </span>
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-surface-200">
          <Button type="button" onClick={onClose} disabled={actionLoading} variant="outline-secondary">
            {t('actions.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type="button"
            variant={actionConfig.btnVariant}
            onClick={onAction}
            disabled={actionLoading || actionReason.trim().length < 10}
          >
            {actionLoading ? (
              <>
                <Spinner className="w-4 h-4 mr-1" />
                {t('common.processing', { defaultValue: 'Processing...' })}
              </>
            ) : (
              <>
                <i className={`bx ${actionConfig.icon} mr-1`}></i>
                {actionConfig.btnLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
