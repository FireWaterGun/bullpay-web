import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'

export default function PaymentSettings() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card mb-6">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{t('admin.payment.title', { defaultValue: 'Payment Settings' })}</h5>
                <p className="text-muted small mb-0 mt-1">
                  {t('admin.payment.description', { defaultValue: 'Configure global payment processing settings' })}
                </p>
              </div>
              <span className="badge bg-label-info">Admin Only</span>
            </div>
            <div className="card-body">
              {/* Global Settings */}
              <div className="mb-5">
                <h6 className="mb-3">
                  <i className="bx bx-cog me-2"></i>
                  {t('admin.payment.globalSettings', { defaultValue: 'Global Settings' })}
                </h6>
                <div className="row g-4">
                  {/* Default Invoice Expiry */}
                  <div className="col-md-6">
                    <label htmlFor="invoiceExpiry" className="form-label">
                      {t('admin.payment.invoiceExpiry', { defaultValue: 'Default Invoice Expiry' })}
                    </label>
                    <div className="input-group">
                      <input 
                        type="number" 
                        className="form-control" 
                        id="invoiceExpiry"
                        placeholder="24"
                        min="1"
                      />
                      <span className="input-group-text">
                        {t('admin.payment.hours', { defaultValue: 'hours' })}
                      </span>
                    </div>
                    <small className="text-muted">
                      {t('admin.payment.invoiceExpiryHelp', { defaultValue: 'Default time before invoice expires' })}
                    </small>
                  </div>

                  {/* Min Confirmations */}
                  <div className="col-md-6">
                    <label htmlFor="minConfirmations" className="form-label">
                      {t('admin.payment.minConfirmations', { defaultValue: 'Minimum Confirmations' })}
                    </label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="minConfirmations"
                      placeholder="3"
                      min="1"
                    />
                    <small className="text-muted">
                      {t('admin.payment.minConfirmationsHelp', { defaultValue: 'Default confirmations required for payment' })}
                    </small>
                  </div>

                  {/* Enable Partial Payments */}
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="partialPayments"
                      />
                      <label className="form-check-label" htmlFor="partialPayments">
                        {t('admin.payment.allowPartial', { defaultValue: 'Allow Partial Payments' })}
                      </label>
                    </div>
                    <small className="text-muted">
                      {t('admin.payment.allowPartialHelp', { defaultValue: 'Accept payments less than invoice amount' })}
                    </small>
                  </div>

                  {/* Enable Overpayment */}
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="overpayment"
                      />
                      <label className="form-check-label" htmlFor="overpayment">
                        {t('admin.payment.allowOverpayment', { defaultValue: 'Allow Overpayment' })}
                      </label>
                    </div>
                    <small className="text-muted">
                      {t('admin.payment.allowOverpaymentHelp', { defaultValue: 'Accept payments more than invoice amount' })}
                    </small>
                  </div>

                  {/* Auto-cancel expired invoices */}
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="autoCancel"
                        defaultChecked
                      />
                      <label className="form-check-label" htmlFor="autoCancel">
                        {t('admin.payment.autoCancel', { defaultValue: 'Auto-cancel Expired Invoices' })}
                      </label>
                    </div>
                    <small className="text-muted">
                      {t('admin.payment.autoCancelHelp', { defaultValue: 'Automatically cancel invoices after expiry' })}
                    </small>
                  </div>
                </div>
              </div>

              {/* Fee Settings */}
              <hr />
              <div className="mb-5">
                <h6 className="mb-3">
                  <i className="bx bx-money me-2"></i>
                  {t('admin.payment.feeSettings', { defaultValue: 'Fee Settings' })}
                </h6>
                <div className="row g-4">
                  {/* Platform Fee Type */}
                  <div className="col-md-6">
                    <label htmlFor="feeType" className="form-label">
                      {t('admin.payment.feeType', { defaultValue: 'Platform Fee Type' })}
                    </label>
                    <select className="form-select" id="feeType">
                      <option value="percentage">{t('admin.payment.percentage', { defaultValue: 'Percentage (%)' })}</option>
                      <option value="fixed">{t('admin.payment.fixed', { defaultValue: 'Fixed Amount' })}</option>
                    </select>
                  </div>

                  {/* Platform Fee Rate */}
                  <div className="col-md-6">
                    <label htmlFor="feeRate" className="form-label">
                      {t('admin.payment.feeRate', { defaultValue: 'Platform Fee Rate' })}
                    </label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="feeRate"
                      placeholder="0.5"
                      step="0.01"
                      min="0"
                    />
                    <small className="text-muted">
                      {t('admin.payment.feeRateHelp', { defaultValue: 'Fee charged per transaction' })}
                    </small>
                  </div>

                  {/* Min Fee */}
                  <div className="col-md-6">
                    <label htmlFor="minFee" className="form-label">
                      {t('admin.payment.minFee', { defaultValue: 'Minimum Fee' })}
                    </label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="minFee"
                      placeholder="0.00001"
                      step="0.00001"
                      min="0"
                    />
                  </div>

                  {/* Max Fee */}
                  <div className="col-md-6">
                    <label htmlFor="maxFee" className="form-label">
                      {t('admin.payment.maxFee', { defaultValue: 'Maximum Fee' })}
                    </label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="maxFee"
                      placeholder="10"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <hr />
              <div className="mb-4">
                <h6 className="mb-3">
                  <i className="bx bx-bell me-2"></i>
                  {t('admin.payment.notificationSettings', { defaultValue: 'Notification Settings' })}
                </h6>
                <div className="row g-4">
                  {/* Email Notifications */}
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="emailNotif"
                        defaultChecked
                      />
                      <label className="form-check-label" htmlFor="emailNotif">
                        {t('admin.payment.emailNotifications', { defaultValue: 'Email Notifications' })}
                      </label>
                    </div>
                    <small className="text-muted">
                      {t('admin.payment.emailNotificationsHelp', { defaultValue: 'Send email on payment received' })}
                    </small>
                  </div>

                  {/* Webhook Notifications */}
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="webhookNotif"
                      />
                      <label className="form-check-label" htmlFor="webhookNotif">
                        {t('admin.payment.webhookNotifications', { defaultValue: 'Webhook Notifications' })}
                      </label>
                    </div>
                    <small className="text-muted">
                      {t('admin.payment.webhookNotificationsHelp', { defaultValue: 'Send webhook callbacks on payment events' })}
                    </small>
                  </div>

                  {/* Webhook URL */}
                  <div className="col-12">
                    <label htmlFor="webhookUrl" className="form-label">
                      {t('admin.payment.webhookUrl', { defaultValue: 'Webhook URL' })}
                    </label>
                    <input 
                      type="url" 
                      className="form-control" 
                      id="webhookUrl"
                      placeholder="https://your-domain.com/webhook"
                    />
                    <small className="text-muted">
                      {t('admin.payment.webhookUrlHelp', { defaultValue: 'Endpoint to receive payment notifications' })}
                    </small>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-outline-secondary">
                  <i className="bx bx-reset me-1"></i>
                  {t('actions.reset', { defaultValue: 'Reset' })}
                </button>
                <button type="button" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {t('actions.saving', { defaultValue: 'Saving...' })}
                    </>
                  ) : (
                    <>
                      <i className="bx bx-save me-1"></i>
                      {t('actions.save', { defaultValue: 'Save Settings' })}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
