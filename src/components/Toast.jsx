import { useEffect, useState } from 'react';

export function Toast({ message, type = 'success', duration = 5000, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Only auto-close if duration is provided
    if (duration === null || duration === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onClose?.();
      }, 400);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgClass: 'bg-label-success',
          borderClass: 'border-success',
          icon: 'bx-check-circle',
          iconColor: 'text-success'
        };
      case 'error':
        return {
          bgClass: 'bg-label-danger',
          borderClass: 'border-danger',
          icon: 'bx-error-circle',
          iconColor: 'text-danger'
        };
      case 'warning':
        return {
          bgClass: 'bg-label-warning',
          borderClass: 'border-warning',
          icon: 'bx-error',
          iconColor: 'text-warning'
        };
      case 'info':
        return {
          bgClass: 'bg-label-info',
          borderClass: 'border-info',
          icon: 'bx-info-circle',
          iconColor: 'text-info'
        };
      default:
        return {
          bgClass: 'bg-label-primary',
          borderClass: 'border-primary',
          icon: 'bx-bell',
          iconColor: 'text-primary'
        };
    }
  };

  const styles = getTypeStyles();

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 400);
  };

  return (
    <div
      className={`toast show toast-custom border-start border-3 ${styles.borderClass} ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      role="alert"
      style={{ backgroundColor: '#fff' }}
    >
      <div className="d-flex align-items-start p-3">
        <div className={`flex-shrink-0 me-3`}>
          <i className={`bx ${styles.icon} ${styles.iconColor} fs-3`}></i>
        </div>
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start mb-1">
            <strong className="toast-title">{message.title || 'Notification'}</strong>
            <button
              type="button"
              className="btn-close ms-2"
              onClick={handleClose}
              aria-label="Close"
              style={{ fontSize: '0.75rem' }}
            ></button>
          </div>
          {message.body && (
            <div className="text-muted small">
              {message.body}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      style={{ 
        position: 'fixed',
        top: 0,
        right: 0,
        padding: '1rem',
        zIndex: 99999,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.5rem'
      }}
    >
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
  );
}
