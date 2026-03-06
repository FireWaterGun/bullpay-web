'use client';

import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Input, Label, Select } from '../ui'

export default function ConfigurationForm({ formData, handleChange, handleSubmit, loading, isEdit, onCancel }) {
  const { t } = useTranslation();

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <Badge className="bg-primary rounded-full mr-2">3</Badge>
          {t('crypto.configuration', { defaultValue: 'Configuration' })}
        </h5>
      </div>
      <div className="p-5">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-12 gap-x-6 gap-4">

              <div className="md:col-span-6">
                <Label>
                  {t('crypto.contractAddress', { defaultValue: 'Contract Address' })}
                </Label>
                <Input
                type="text"

                id="contractAddress"
                name="contractAddress"
                value={formData.contractAddress}
                onChange={handleChange}
                disabled={loading}
                placeholder="0x..." />
              
                <small className="text-surface-500">
                  {t('crypto.contractAddressHelp', { defaultValue: 'Leave empty for native coins' })}
                </small>
              </div>

              {/* Decimals */}
              <div className="md:col-span-6">
                <Label>
                  {t('crypto.decimals', { defaultValue: 'Decimals' })}
                </Label>
                <Input
                type="number"

                id="decimals"
                name="decimals"
                value={formData.decimals}
                onChange={handleChange}
                disabled={loading || isEdit}
                min="0"
                max="18"
                placeholder="18" />
              
                <small className="text-surface-500">
                  {isEdit ?
                t('crypto.decimalsReadOnly', { defaultValue: 'Decimals cannot be changed after creation' }) :
                t('crypto.coinNetworkDecimalsHelp', { defaultValue: 'Override coin decimals if needed' })
                }
                </small>
              </div>

              <div className="md:col-span-6">
                <Label>
                  {t('crypto.status', { defaultValue: 'Status' })} <span className="text-danger">*</span>
                </Label>
                <Select

                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                disabled={loading}>
                
                  <option value="active">{t('crypto.statusActive', { defaultValue: 'Active' })}</option>
                  <option value="inactive">{t('crypto.statusInactive', { defaultValue: 'Inactive' })}</option>
                  <option value="maintenance">{t('crypto.statusMaintenance', { defaultValue: 'Maintenance' })}</option>
                </Select>
                <small className="text-surface-500">
                  {t('crypto.statusHelp', { defaultValue: 'Current status of this coin-network pair' })}
                </small>
              </div>

              {/* Withdraw Toggle */}
              <div className="md:col-span-6">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h6 className="mb-1">{t('crypto.withdrawEnabled', { defaultValue: 'Withdraw Enabled' })}</h6>
                    <small className="text-surface-500">{t('crypto.allowWithdrawals', { defaultValue: 'Allow users to withdraw' })}</small>
                  </div>
                  <div className="flex items-center gap-2 scale-125 m-0">
                    <input
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    type="checkbox"
                    name="withdrawEnabled"
                    id="withdrawEnabled"
                    checked={formData.withdrawEnabled}
                    onChange={handleChange}
                    disabled={loading} />
                  
                    <label className="text-sm text-surface-700" htmlFor="withdrawEnabled"></label>
                  </div>
                </div>
              </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end mt-5">
            <Button
              type="button"

              onClick={onCancel}
              disabled={loading} variant="outline-secondary">
              
              <i className="bx bx-x mr-1"></i>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="submit"

              disabled={loading || !formData.coinId || !formData.networkId}>
              
              <i className={`bx ${loading ? 'bx-loader-alt bx-spin' : 'bx-save'} mr-1`}></i>
              {loading ?
              t('common.saving', { defaultValue: 'Saving...' }) :
              isEdit ?
              t('actions.update', { defaultValue: 'Update' }) :
              t('actions.create', { defaultValue: 'Create' })
              }
            </Button>
          </div>
        </form>
      </div>
    </Card>);

}