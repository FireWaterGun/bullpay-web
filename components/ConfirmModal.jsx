'use client'

import React, { useCallback, useRef } from 'react'
import { Button, Spinner } from './ui'
import { useEscapeKey } from '@/hooks/useEscapeKey'

/**
 * ConfirmModal – confirmation dialog.
 * API is kept identical so every existing consumer works unchanged.
 */
export default function ConfirmModal({
  show,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  busy = false,
  size, // 'sm' | 'lg' | 'xl' | undefined (default medium)
  centered = true,
  variant = 'basic', // 'basic' | 'simple'
  staticBackdrop = false,
  keyboard = true,
  confirmVariant = 'danger',
  cancelVariant = 'outline-secondary',
}) {
  const overlayRef = useRef(null)

  useEscapeKey(() => { if (keyboard && !busy && onCancel) onCancel() }, show)

  if (!show) return null

  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current && !staticBackdrop && !busy && onCancel) onCancel()
  }

  const maxWidthMap = { sm: '300px', lg: '600px', xl: '800px' }
  const maxW = maxWidthMap[size] || '500px'

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex ${centered ? 'items-center' : 'items-start pt-10'} justify-center bg-black/70`}
      onClick={handleBackdropClick}
    >
      <div className="bg-card rounded-xl shadow-xl mx-4 w-full" style={{ maxWidth: maxW }}>
        {variant === 'basic' ? (
          <>
            <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center">
              <h5 className="font-semibold text-lg">{title}</h5>
              <button
                type="button"
                className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"
                aria-label="Close"
                onClick={busy ? undefined : onCancel}
                disabled={busy}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className="p-6">{typeof message === 'string' ? <p className="mb-0">{message}</p> : message}</div>
            <div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-2">
              <Button type="button" variant={cancelVariant} onClick={onCancel} disabled={busy}>
                {cancelText}
              </Button>
              <Button type="button" variant={confirmVariant} onClick={onConfirm} disabled={busy}>
                {busy ? (
                  <Spinner role="status" aria-hidden="true" className="w-4 h-4 mr-2 inline-block align-middle" />
                ) : null}
                {confirmText}
              </Button>
            </div>
          </>
        ) : (
          <div className="p-6 relative">
            <button
              type="button"
              className="absolute top-4 right-4 cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"
              aria-label="Close"
              onClick={busy ? undefined : onCancel}
              disabled={busy}
            >
              <i className="bx bx-x"></i>
            </button>
            <div className="text-center mb-6">
              <h4 className="mb-2 font-semibold text-lg">{title}</h4>
              {typeof message === 'string' ? <p className="mb-0">{message}</p> : message}
            </div>
            <div className="flex justify-center gap-2">
              <Button type="button" variant={cancelVariant} onClick={onCancel} disabled={busy}>
                {cancelText}
              </Button>
              <Button type="button" variant={confirmVariant} onClick={onConfirm} disabled={busy}>
                {busy ? (
                  <Spinner role="status" aria-hidden="true" className="w-4 h-4 mr-2 inline-block align-middle" />
                ) : null}
                {confirmText}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
