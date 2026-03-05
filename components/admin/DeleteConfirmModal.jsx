'use client';

import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { Button, Spinner } from '../ui'

export default function DeleteConfirmModal({ target, loading, onConfirm, onClose }) {
  const { t } = useAdminTranslation();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center block" tabIndex="-1">
        <div className="w-full max-w-lg mx-4">
          <div className="bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-200">
              <h5 className="text-lg font-semibold text-surface-800">
                {t('admin.network.confirmDelete', { defaultValue: 'Confirm Delete' })}
              </h5>
              <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="p-5">
              <p className="mb-0">
                {target.type === 'baseFee' ?
                t('admin.network.deleteBaseFeeConfirm', { defaultValue: `Are you sure you want to delete base fee for ${target.network}?`, network: target.network }) :
                t('admin.network.deleteSlippageConfirm', { defaultValue: `Are you sure you want to delete slippage for ${target.network}?`, network: target.network })
                }
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
              <Button
                type="button"

                onClick={onClose}
                disabled={loading} className="bg-surface-200 text-surface-700 hover:bg-surface-300">
                
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="button"

                onClick={onConfirm}
                disabled={loading} variant="danger">
                
                {loading ?
                <>
                    <Spinner className="w-4 h-4 mr-2" />
                    {t('actions.deleting', { defaultValue: 'Deleting...' })}
                  </> :

                <>
                    <i className="bx bx-trash mr-1"></i>
                    {t('actions.delete', { defaultValue: 'Delete' })}
                  </>
                }
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>);

}