'use client'

import { useEffect, useState } from 'react';

const TOAST_TYPES = {
  success: {
    card: 'bg-success-50 border-success-200/60 dark:bg-raised dark:border-success-500/30',
    iconBg: 'bg-success-500',
    title: 'text-success-800 dark:text-success-300',
    body: 'text-success-700/80 dark:text-success-400/90',
    close: 'text-success-300 hover:text-success-500 dark:text-success-700 dark:hover:text-success-400',
    progress: 'bg-success-500',
    icon: 'bx-check-circle',
  },
  error: {
    card: 'bg-danger-50 border-danger-200/60 dark:bg-raised dark:border-danger-500/30',
    iconBg: 'bg-danger-500',
    title: 'text-danger-800 dark:text-danger-300',
    body: 'text-danger-700/80 dark:text-danger-400/90',
    close: 'text-danger-300 hover:text-danger-500 dark:text-danger-700 dark:hover:text-danger-400',
    progress: 'bg-danger-500',
    icon: 'bx-error-circle',
  },
  warning: {
    card: 'bg-warning-50 border-warning-200/60 dark:bg-raised dark:border-warning-500/30',
    iconBg: 'bg-warning-500',
    title: 'text-warning-800 dark:text-warning-300',
    body: 'text-warning-700/80 dark:text-warning-400/90',
    close: 'text-warning-300 hover:text-warning-500 dark:text-warning-700 dark:hover:text-warning-400',
    progress: 'bg-warning-500',
    icon: 'bx-error',
  },
  info: {
    card: 'bg-info-50 border-info-200/60 dark:bg-raised dark:border-info-500/30',
    iconBg: 'bg-info-500',
    title: 'text-info-800 dark:text-info-300',
    body: 'text-info-700/80 dark:text-info-400/90',
    close: 'text-info-300 hover:text-info-500 dark:text-info-700 dark:hover:text-info-400',
    progress: 'bg-info-500',
    icon: 'bx-info-circle',
  },
};

const DEFAULT_TYPE = {
  card: 'bg-primary-50 border-primary-200/60 dark:bg-raised dark:border-primary-500/30',
  iconBg: 'bg-primary-500',
  title: 'text-primary-800 dark:text-primary-300',
  body: 'text-primary-700/80 dark:text-primary-400/90',
  close: 'text-primary-300 hover:text-primary-500 dark:text-primary-700 dark:hover:text-primary-400',
  progress: 'bg-primary-500',
  icon: 'bx-bell',
};

const TYPE_LABELS = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

export function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [isExiting, setIsExiting] = useState(false);
  const s = TOAST_TYPES[type] || DEFAULT_TYPE;

  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose?.(), 400);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose?.(), 400);
  };

  const isString = typeof message === 'string';
  const title = isString ? (TYPE_LABELS[type] || 'Notification') : (message?.title || 'Notification');
  const body = isString ? message : message?.body;

  return (
    <div
      className={`rounded-xl border shadow-sm dark:shadow-md pointer-events-auto overflow-hidden min-w-[min(320px,calc(100vw-2rem))] max-w-[min(420px,calc(100vw-2rem))] ${s.card} ${isExiting ? 'toast-exit' : 'toast-enter'}`}
      role="alert"
    >
      <div className="flex items-start p-4">
        <div className={`shrink-0 mr-3 flex items-center justify-center w-9 h-9 rounded-lg ${s.iconBg}`}>
          <i className={`bx ${s.icon} text-xl text-white`}></i>
        </div>
        <div className="grow min-w-0">
          <div className="flex justify-between items-start mb-0.5">
            <strong className={`text-sm font-semibold ${s.title}`}>{title}</strong>
            <button
              type="button"
              className={`ml-2 cursor-pointer leading-none shrink-0 transition-colors ${s.close}`}
              onClick={handleClose}
              aria-label="Close"
            >
              <i className="bx bx-x text-lg"></i>
            </button>
          </div>
          {body && <div className={`text-[0.8125rem] leading-snug ${s.body}`}>{body}</div>}
        </div>
      </div>
      {/* Progress bar */}
      {duration > 0 && (
        <div className="h-[3px] w-full opacity-40">
          <div
            className={`h-full ${s.progress} ${isExiting ? '' : 'toast-progress'}`}
            style={!isExiting ? { animationDuration: `${duration}ms` } : { width: 0 }}
          />
        </div>
      )}
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
@keyframes toastProgress {
  from { width: 100%; }
  to { width: 0%; }
}
.toast-enter { animation: toastSlideIn 0.3s ease-out forwards; }
.toast-exit { animation: toastSlideOut 0.3s ease-in forwards; }
.toast-progress { animation: toastProgress linear forwards; }
`;

export function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{TOAST_CSS}</style>
      <div className="fixed top-0 right-0 p-4 z-[99999] pointer-events-none flex flex-col items-end gap-3">
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
