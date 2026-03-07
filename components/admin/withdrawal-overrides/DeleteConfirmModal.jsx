'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import Button from '../../ui/Button'
import Spinner from '../../ui/Spinner'

export default function DeleteConfirmModal({ loading, onConfirm, onClose }) {
  const { t } = useAdminTranslation()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      tabIndex="-1"
      onClick={() => !loading && onClose()}
    >
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              {t('admin.withdrawal.confirmDelete', { defaultValue: 'Confirm Delete' })}
            </h5>
            <button
              type="button"
              className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"
              onClick={onClose}
              disabled={loading}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>
          <div className="p-5">
            <p className="mb-0">
              {t('admin.withdrawal.deleteConfirm', {
                defaultValue: `Are you sure you want to delete this override?`,
              })}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-surface-200 text-surface-700 hover:bg-surface-300"
            >
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="button" onClick={onConfirm} disabled={loading} variant="danger">
              {loading ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  {t('actions.deleting', { defaultValue: 'Deleting...' })}
                </>
              ) : (
                <>
                  <i className="bx bx-trash mr-1"></i>
                  {t('actions.delete', { defaultValue: 'Delete' })}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
