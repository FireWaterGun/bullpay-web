'use client';

import { useState } from 'react';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useAuth } from '@/app/providers';
import { Badge, Button, Card, Input, Label, Select, Spinner } from '../ui'

export default function PaymentSettings() {
  const { t } = useAdminTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Card className="mb-6">
            <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
              <div>
                <h5 className="mb-0">{t('admin.payment.title', { defaultValue: 'Payment Settings' })}</h5>
                <p className="text-muted text-sm mb-0 mt-1">
                  {t('admin.payment.description', { defaultValue: 'Configure global payment processing settings' })}
                </p>
              </div>
              <Badge className="bg-cyan-50 text-cyan-700">Admin Only</Badge>
            </div>
            <div className="p-5">
              {/* Global Settings */}
              <div className="mb-5">
                <h6 className="mb-3">
                  <i className="bx bx-cog mr-2"></i>
                  {t('admin.payment.globalSettings', { defaultValue: 'Global Settings' })}
                </h6>
                <div className="grid grid-cols-12 gap-x-6 gap-4">
                  {/* Default Invoice Expiry */}
                  <div className="md:col-span-6">
                    <Label htmlFor="invoiceExpiry">
                      {t('admin.payment.invoiceExpiry', { defaultValue: 'Default Invoice Expiry' })}
                    </Label>
                    <div className="flex items-stretch">
                      <Input
                        type="number"

                        id="invoiceExpiry"
                        placeholder="24"
                        min="1" />
                      
                      <span className="flex items-center px-3 bg-surface-100 border border-surface-300 text-surface-600 text-sm rounded-l-lg">
                        {t('admin.payment.hours', { defaultValue: 'hours' })}
                      </span>
                    </div>
                    <small className="text-muted">
                      {t('admin.payment.invoiceExpiryHelp', { defaultValue: 'Default time before invoice expires' })}
                    </small>
                  </div>

                  {/* Min Confirmations */}
                  <div className="md:col-span-6">
                    <Label htmlFor="minConfirmations">
                      {t('admin.payment.minConfirmations', { defaultValue: 'Minimum Confirmations' })}
                    </Label>
                    <Input
                      type="number"

                      id="minConfirmations"
                      placeholder="3"
                      min="1" />
                    
                    <small className="text-muted">
                      {t('admin.payment.minConfirmationsHelp', { defaultValue: 'Default confirmations required for payment' })}
                    </small>
                  </div>

                  {/* Enable Partial Payments */}
                  <div className="col-span-12">
                    <div className="flex items-center gap-2 relative inline-flex items-center">
                      <input
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        type="checkbox"
                        id="partialPayments" />
                      
                      <label className="text-sm text-surface-700" htmlFor="partialPayments">
                        {t('admin.payment.allowPartial', { defaultValue: 'Allow Partial Payments' })}
                      </label>
                    </div>
                    <small className="text-muted">
                      {t('admin.payment.allowPartialHelp', { defaultValue: 'Accept payments less than invoice amount' })}
                    </small>
                  </div>

                  {/* Enable Overpayment */}
                  <div className="col-span-12">
                    <div className="flex items-center gap-2 relative inline-flex items-center">
                      <input
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        type="checkbox"
                        id="overpayment" />
                      
                      <label className="text-sm text-surface-700" htmlFor="overpayment">
                        {t('admin.payment.allowOverpayment', { defaultValue: 'Allow Overpayment' })}
                      </label>
                    </div>
                    <small className="text-muted">
                      {t('admin.payment.allowOverpaymentHelp', { defaultValue: 'Accept payments more than invoice amount' })}
                    </small>
                  </div>

                  {/* Auto-cancel expired invoices */}
                  <div className="col-span-12">
                    <div className="flex items-center gap-2 relative inline-flex items-center">
                      <input
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        type="checkbox"
                        id="autoCancel"
                        defaultChecked />
                      
                      <label className="text-sm text-surface-700" htmlFor="autoCancel">
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
                  <i className="bx bx-money mr-2"></i>
                  {t('admin.payment.feeSettings', { defaultValue: 'Fee Settings' })}
                </h6>
                <div className="grid grid-cols-12 gap-x-6 gap-4">
                  {/* Platform Fee Type */}
                  <div className="md:col-span-6">
                    <Label htmlFor="feeType">
                      {t('admin.payment.feeType', { defaultValue: 'Platform Fee Type' })}
                    </Label>
                    <Select id="feeType">
                      <option value="percentage">{t('admin.payment.percentage', { defaultValue: 'Percentage (%)' })}</option>
                      <option value="fixed">{t('admin.payment.fixed', { defaultValue: 'Fixed Amount' })}</option>
                    </Select>
                  </div>

                  {/* Platform Fee Rate */}
                  <div className="md:col-span-6">
                    <Label htmlFor="feeRate">
                      {t('admin.payment.feeRate', { defaultValue: 'Platform Fee Rate' })}
                    </Label>
                    <Input
                      type="number"

                      id="feeRate"
                      placeholder="0.5"
                      step="0.01"
                      min="0" />
                    
                    <small className="text-muted">
                      {t('admin.payment.feeRateHelp', { defaultValue: 'Fee charged per transaction' })}
                    </small>
                  </div>

                  {/* Min Fee */}
                  <div className="md:col-span-6">
                    <Label htmlFor="minFee">
                      {t('admin.payment.minFee', { defaultValue: 'Minimum Fee' })}
                    </Label>
                    <Input
                      type="number"

                      id="minFee"
                      placeholder="0.00001"
                      step="0.00001"
                      min="0" />
                    
                  </div>

                  {/* Max Fee */}
                  <div className="md:col-span-6">
                    <Label htmlFor="maxFee">
                      {t('admin.payment.maxFee', { defaultValue: 'Maximum Fee' })}
                    </Label>
                    <Input
                      type="number"

                      id="maxFee"
                      placeholder="10"
                      step="0.01"
                      min="0" />
                    
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <hr />
              <div className="mb-4">
                <h6 className="mb-3">
                  <i className="bx bx-bell mr-2"></i>
                  {t('admin.payment.notificationSettings', { defaultValue: 'Notification Settings' })}
                </h6>
                <div className="grid grid-cols-12 gap-x-6 gap-4">
                  {/* Email Notifications */}
                  <div className="col-span-12">
                    <div className="flex items-center gap-2 relative inline-flex items-center">
                      <input
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        type="checkbox"
                        id="emailNotif"
                        defaultChecked />
                      
                      <label className="text-sm text-surface-700" htmlFor="emailNotif">
                        {t('admin.payment.emailNotifications', { defaultValue: 'Email Notifications' })}
                      </label>
                    </div>
                    <small className="text-muted">
                      {t('admin.payment.emailNotificationsHelp', { defaultValue: 'Send email on payment received' })}
                    </small>
                  </div>

                  {/* Webhook Notifications */}
                  <div className="col-span-12">
                    <div className="flex items-center gap-2 relative inline-flex items-center">
                      <input
                        className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        type="checkbox"
                        id="webhookNotif" />
                      
                      <label className="text-sm text-surface-700" htmlFor="webhookNotif">
                        {t('admin.payment.webhookNotifications', { defaultValue: 'Webhook Notifications' })}
                      </label>
                    </div>
                    <small className="text-muted">
                      {t('admin.payment.webhookNotificationsHelp', { defaultValue: 'Send webhook callbacks on payment events' })}
                    </small>
                  </div>

                  {/* Webhook URL */}
                  <div className="col-span-12">
                    <Label htmlFor="webhookUrl">
                      {t('admin.payment.webhookUrl', { defaultValue: 'Webhook URL' })}
                    </Label>
                    <Input
                      type="url"

                      id="webhookUrl"
                      placeholder="https://your-domain.com/webhook" />
                    
                    <small className="text-muted">
                      {t('admin.payment.webhookUrlHelp', { defaultValue: 'Endpoint to receive payment notifications' })}
                    </small>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end mt-4">
                <Button type="button" variant="outline-secondary">
                  <i className="bx bx-reset mr-1"></i>
                  {t('actions.reset', { defaultValue: 'Reset' })}
                </Button>
                <Button type="button" disabled={loading}>
                  {loading ?
                  <>
                      <Spinner role="status" aria-hidden="true" className="w-4 h-4 mr-2" />
                      {t('actions.saving', { defaultValue: 'Saving...' })}
                    </> :

                  <>
                      <i className="bx bx-save mr-1"></i>
                      {t('actions.save', { defaultValue: 'Save Settings' })}
                    </>
                  }
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>);

}