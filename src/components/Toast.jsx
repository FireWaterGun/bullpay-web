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
          bg: '#10b981',
          bgLight: '#d1fae5',
          icon: 'bx-check-circle',
          iconBg: '#10b981'
        };
      case 'error':
        return {
          bg: '#ef4444',
          bgLight: '#fee2e2',
          icon: 'bx-error-circle',
          iconBg: '#ef4444'
        };
      case 'warning':
        return {
          bg: '#f59e0b',
          bgLight: '#fef3c7',
          icon: 'bx-error',
          iconBg: '#f59e0b'
        };
      case 'info':
        return {
          bg: '#3b82f6',
          bgLight: '#dbeafe',
          icon: 'bx-info-circle',
          iconBg: '#3b82f6'
        };
      default:
        return {
          bg: '#6366f1',
          bgLight: '#e0e7ff',
          icon: 'bx-bell',
          iconBg: '#6366f1'
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
      className={`toast show ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      role="alert"
      style={{ 
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: '320px',
        maxWidth: '420px',
        pointerEvents: 'auto',
        overflow: 'hidden'
      }}
    >
      <div className="d-flex align-items-start" style={{ padding: '1rem' }}>
        <div 
          className="flex-shrink-0 me-3 d-flex align-items-center justify-content-center"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: styles.bgLight,
            flexShrink: 0
          }}
        >
          <i 
            className={`bx ${styles.icon}`}
            style={{ 
              fontSize: '1.5rem',
              color: styles.iconBg
            }}
          ></i>
        </div>
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex justify-content-between align-items-start mb-1">
            <strong 
              className="toast-title" 
              style={{ 
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#1f2937'
              }}
            >
              {message.title || 'Notification'}
            </strong>
            <button
              type="button"
              className="btn-close ms-2"
              onClick={handleClose}
              aria-label="Close"
              style={{ 
                fontSize: '0.7rem',
                flexShrink: 0
              }}
            ></button>
          </div>
          {message.body && (
            <div 
              className="small"
              style={{ 
                color: '#6b7280',
                fontSize: '0.875rem',
                lineHeight: '1.4'
              }}
            >
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
