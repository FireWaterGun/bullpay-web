'use client'

import { useTranslation } from 'react-i18next'
import { statusBadgeClass } from '@/components/admin/merchantListHelpers'

export default function MerchantConfirmModal({
  merchant,
  action,
  loading,
  onConfirm,
  onClose,
}) {
  const { t } = useTranslation()

  if (!merchant) return null

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !loading && onClose()}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={`bx ${action === 'activate' ? 'bx-check-circle text-primary' : 'bx-block text-danger'} me-2`}></i>
              {action === 'activate'
                ? t('admin.merchants.activateTitle', { defaultValue: 'Activate Merchant' })
                : t('admin.merchants.suspendTitle', { defaultValue: 'Suspend Merchant' })
              }
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body">
            <div className="rounded p-3 mb-3" style={{ backgroundColor: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}>
              <div className="row g-2">
                <div className="col-6">
                  <small className="text-muted d-block">Merchant ID</small>
                  <strong>{merchant.id}</strong>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">{t('admin.merchants.name', { defaultValue: 'Name' })}</small>
                  <strong>{merchant.name || '-'}</strong>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">{t('table.status', { defaultValue: 'Status' })}</small>
                  <span className={statusBadgeClass(merchant.status)}>
                    {String(merchant.status || '').toUpperCase()}
                  </span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">{t('admin.merchants.email', { defaultValue: 'Email' })}</small>
                  <span>{merchant.email || '-'}</span>
                </div>
              </div>
            </div>

            {action === 'activate' ? (
              <div className="alert alert-primary py-2 mb-0" role="alert">
                <i className="bx bx-check-circle me-1"></i>
                {t('admin.merchants.activateConfirm', { defaultValue: 'Are you sure you want to activate this merchant?' })}
              </div>
            ) : (
              <div className="alert alert-danger py-2 mb-0" role="alert">
                <i className="bx bx-error me-1"></i>
                {t('admin.merchants.suspendConfirm', { defaultValue: 'Are you sure you want to suspend this merchant? They will lose access to merchant features.' })}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="button"
              className={`btn ${action === 'activate' ? 'btn-primary' : 'btn-danger'}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  {t('invoices.loading', { defaultValue: 'Loading...' })}
                </>
              ) : (
                action === 'activate'
                  ? t('admin.merchants.activate', { defaultValue: 'Activate' })
                  : t('admin.merchants.suspend', { defaultValue: 'Suspend' })
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
