import React, { useEffect, useRef } from 'react'

// ConfirmModal now relies on Bootstrap's Modal JS from the theme for show/hide/backdrop
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
  staticBackdrop = false, // use theme/Bootstrap backdrop behavior
  keyboard = true, // allow ESC to close when not busy
  confirmVariant = 'danger', // bootstrap color for confirm button
  cancelVariant = 'outline-secondary', // bootstrap color for cancel button
}) {
  const modalRef = useRef(null)
  const instanceRef = useRef(null)

  // Create bootstrap.Modal instance once and register events
  useEffect(() => {
    const el = modalRef.current
    const Modal = window?.bootstrap?.Modal
    if (!el || !Modal) return

    instanceRef.current = new Modal(el, {
      backdrop: staticBackdrop ? 'static' : true,
      keyboard: keyboard && !busy,
      focus: true,
    })

    const handleHidden = () => { onCancel && onCancel() }
    el.addEventListener('hidden.bs.modal', handleHidden)

    return () => {
      el.removeEventListener('hidden.bs.modal', handleHidden)
      try {
        // ensure hidden before dispose to clean backdrops
        instanceRef.current?.hide()
        instanceRef.current?.dispose()
      } catch {}
      instanceRef.current = null
    }
  // only run once on mount/unmount
  }, [])

  // Sync visibility with props without recreating instance (avoids leftover backdrop)
  useEffect(() => {
    const inst = instanceRef.current
    if (!inst) return
    if (show) inst.show(); else inst.hide()
  }, [show])

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : size === 'sm' ? 'modal-sm' : ''
  const dialogClasses = ['modal-dialog']
  if (centered) dialogClasses.push('modal-dialog-centered')
  if (variant === 'simple') dialogClasses.push('modal-simple')
  if (sizeClass) dialogClasses.push(sizeClass)
  const confirmBtnClass = `btn btn-${confirmVariant}`
  const cancelBtnClass = `btn btn-${cancelVariant}`

  return (
    <div
      ref={modalRef}
      className="modal fade"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop={staticBackdrop ? 'static' : undefined}
      data-bs-keyboard={keyboard && !busy ? 'true' : 'false'}
    >
      <div className={dialogClasses.join(' ')} role="document">
        <div className="modal-content">
          {variant === 'basic' ? (
            <>
              <div className="modal-header">
                <h5 className="modal-title">{title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={busy ? undefined : onCancel}
                  disabled={busy}
                ></button>
              </div>
              <div className="modal-body">
                {typeof message === 'string' ? <p className="mb-0">{message}</p> : message}
              </div>
              <div className="modal-footer">
                <button type="button" className={cancelBtnClass} onClick={onCancel} disabled={busy}>{cancelText}</button>
                <button type="button" className={confirmBtnClass} onClick={onConfirm} disabled={busy}>
                  {busy ? (<span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>) : null}
                  {confirmText}
                </button>
              </div>
            </>
          ) : (
            <div className="modal-body">
              <button type="button" className="btn-close" aria-label="Close" onClick={busy ? undefined : onCancel} disabled={busy}></button>
              <div className="text-center mb-6">
                <h4 className="mb-2">{title}</h4>
                {typeof message === 'string' ? <p className="mb-0">{message}</p> : message}
              </div>
              <div className="d-flex justify-content-center gap-2">
                <button type="button" className={cancelBtnClass} onClick={onCancel} disabled={busy}>{cancelText}</button>
                <button type="button" className={confirmBtnClass} onClick={onConfirm} disabled={busy}>
                  {busy ? (<span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>) : null}
                  {confirmText}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
