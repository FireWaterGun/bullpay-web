'use client'

import { useEffect, useState, useMemo } from 'react';

const TYPE_STYLES = {
  success: { bgLight: 'rgba(var(--bs-success-rgb), 0.15)', icon: 'bx-check-circle', iconColor: 'var(--bs-success)' },
  error:   { bgLight: 'rgba(var(--bs-danger-rgb), 0.15)',  icon: 'bx-error-circle', iconColor: 'var(--bs-danger)' },
  warning: { bgLight: 'rgba(var(--bs-warning-rgb), 0.15)', icon: 'bx-error',        iconColor: 'var(--bs-warning)' },
  info:    { bgLight: 'rgba(var(--bs-info-rgb), 0.15)',    icon: 'bx-info-circle',   iconColor: 'var(--bs-info)' },
};

const DEFAULT_TYPE_STYLE = { bgLight: 'rgba(var(--bs-primary-rgb), 0.15)', icon: 'bx-bell', iconColor: 'var(--bs-primary)' };

const toastStyle = {
  backgroundColor: 'var(--bs-body-bg)',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  minWidth: '320px',
  maxWidth: '420px',
  pointerEvents: 'auto',
  overflow: 'hidden',
};

const bodyPadding = { padding: '1rem' };

const iconBoxBase = {
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  flexShrink: 0,
};

const titleStyle = { fontSize: '0.95rem', fontWeight: 600, color: 'var(--bs-heading-color)' };
const closeStyle = { fontSize: '0.7rem', flexShrink: 0 };
const bodyTextStyle = { color: 'var(--bs-secondary-color)', fontSize: '0.875rem', lineHeight: '1.4' };

const containerStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  padding: '1rem',
  zIndex: 99999,
  pointerEvents: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '0.5rem',
};

const TYPE_LABELS = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

export function Toast({ message, type = 'success', duration = 5000, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration === null || duration === 0) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => { onClose?.(); }, 400);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = TYPE_STYLES[type] || DEFAULT_TYPE_STYLE;

  const iconBoxStyle = useMemo(
    () => ({ ...iconBoxBase, backgroundColor: styles.bgLight }),
    [styles.bgLight],
  );

  const iconStyle = useMemo(
    () => ({ fontSize: '1.5rem', color: styles.iconColor }),
    [styles.iconColor],
  );

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => { onClose?.(); }, 400);
  };

  // Support both string and object { title, body } messages
  const isString = typeof message === 'string';
  const title = isString ? (TYPE_LABELS[type] || 'Notification') : (message?.title || 'Notification');
  const body = isString ? message : message?.body;

  return (
    <div
      className={`toast show ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      role="alert"
      style={toastStyle}
    >
      <div className="d-flex align-items-start" style={bodyPadding}>
        <div
          className="flex-shrink-0 me-3 d-flex align-items-center justify-content-center"
          style={iconBoxStyle}
        >
          <i className={`bx ${styles.icon}`} style={iconStyle}></i>
        </div>
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex justify-content-between align-items-start mb-1">
            <strong className="toast-title" style={titleStyle}>
              {title}
            </strong>
            <button
              type="button"
              className="btn-close ms-2"
              onClick={handleClose}
              aria-label="Close"
              style={closeStyle}
            ></button>
          </div>
          {body && (
            <div className="small" style={bodyTextStyle}>
              {body}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const TOAST_CSS = `
@keyframes toastSlideIn {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes toastSlideOut {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(100%); }
}
.toast-enter { animation: toastSlideIn 0.3s ease-out forwards; }
.toast-exit { animation: toastSlideOut 0.3s ease-in forwards; }
`;

export function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{TOAST_CSS}</style>
      <div className="toast-container" style={containerStyle}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </div>
    </>
  );
}
