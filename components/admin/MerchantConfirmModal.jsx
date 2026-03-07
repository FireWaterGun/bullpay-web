'use client';

import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { statusBadgeClass } from '@/components/admin/merchantListHelpers';
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

export default function MerchantConfirmModal({
  merchant,
  action,
  loading,
  onConfirm,
  onClose
}) {
  const { t } = useAdminTranslation();

  if (!merchant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !loading && onClose()}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              <i className={`bx ${action === 'activate' ? 'bx-check-circle text-primary' : 'bx-block text-danger'} mr-2`}></i>
              {action === 'activate' ?
              t('admin.merchants.activateTitle', { defaultValue: 'Activate Merchant' }) :
              t('admin.merchants.suspendTitle', { defaultValue: 'Suspend Merchant' })
              }
            </h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none" onClick={onClose} disabled={loading}><i className="bx bx-x"></i></button>
          </div>
          <div className="p-5">
            <div className="rounded p-3 mb-3 bg-surface-100 border border-surface-200">
              <div className="grid grid-cols-12 gap-x-6 gap-2">
                <div className="col-span-6">
                  <small className="text-surface-500 block">Merchant ID</small>
                  <strong>{merchant.id}</strong>
                </div>
                <div className="col-span-6">
                  <small className="text-surface-500 block">{t('admin.merchants.name', { defaultValue: 'Name' })}</small>
                  <strong>{merchant.name || '-'}</strong>
                </div>
                <div className="col-span-6">
                  <small className="text-surface-500 block">{t('table.status', { defaultValue: 'Status' })}</small>
                  <span className={statusBadgeClass(merchant.status)}>
                    {String(merchant.status || '').toUpperCase()}
                  </span>
                </div>
                <div className="col-span-6">
                  <small className="text-surface-500 block">{t('admin.merchants.email', { defaultValue: 'Email' })}</small>
                  <span>{merchant.email || '-'}</span>
                </div>
              </div>
            </div>

            {action === 'activate' ?
            <Alert variant="primary" className="py-2 mb-0">
                <i className="bx bx-check-circle mr-1"></i>
                {t('admin.merchants.activateConfirm', { defaultValue: 'Are you sure you want to activate this merchant?' })}
              </Alert> :

            <Alert role="alert" className="py-2 mb-0">
                <i className="bx bx-error mr-1"></i>
                {t('admin.merchants.suspendConfirm', { defaultValue: 'Are you sure you want to suspend this merchant? They will lose access to merchant features.' })}
              </Alert>
            }
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button type="button" onClick={onClose} disabled={loading} variant="outline-secondary">
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="button"

              onClick={onConfirm}
              disabled={loading}>
              
              {loading ?
              <>
                  <Spinner className="w-4 h-4 mr-1" />
                  {t('invoices.loading', { defaultValue: 'Loading...' })}
                </> :

              action === 'activate' ?
              t('admin.merchants.activate', { defaultValue: 'Activate' }) :
              t('admin.merchants.suspend', { defaultValue: 'Suspend' })
              }
            </Button>
          </div>
        </div>
      </div>
    </div>);

}