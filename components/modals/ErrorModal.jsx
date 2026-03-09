'use client'

import { useTranslation } from 'react-i18next'
import Button from '../ui/Button'

export default function ErrorModal({ show, onClose, title, message }) {
  const { t } = useTranslation()

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              {title || t('crypto.operationFailed', { defaultValue: 'Operation Failed' })}
            </h5>
            <button
              type="button"
              className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"
              onClick={onClose}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>
          <div className="p-5">
            <p className="mb-0">{message}</p>
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button type="button" onClick={onClose}>
              {t('actions.close', { defaultValue: 'Close' })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
