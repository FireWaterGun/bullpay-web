'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import Button from '../../ui/Button'
import { Input, Label, Select } from '../../ui/Input'
import Spinner from '../../ui/Spinner'

export default function OverrideFormModal({ modalType, editingKey, formData, setFormData, loading, onSave, onClose }) {
  const { t } = useAdminTranslation()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      tabIndex="-1"
      onClick={() => !loading && onClose()}
    >
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              {editingKey
                ? t('admin.withdrawal.editOverride', { defaultValue: 'Edit Override' })
                : t('admin.withdrawal.addOverride', { defaultValue: 'Add Override' })}
            </h5>
            <button
              type="button"
              className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"
              onClick={onClose}
              disabled={loading}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-12 gap-x-6 gap-3">
              <div className="col-span-12">
                <Label>
                  {modalType === 'coin' && t('admin.withdrawal.coinSymbol', { defaultValue: 'Coin Symbol' })}
                  {modalType === 'network' && t('admin.withdrawal.networkName', { defaultValue: 'Network Name' })}
                  {modalType === 'coinNetwork' &&
                    t('admin.withdrawal.coinNetworkId', { defaultValue: 'CoinNetwork ID' })}
                  *
                </Label>
                <Input
                  type="text"
                  value={formData.key}
                  onChange={(e) => {
                    const value = e.target.value
                    if (modalType === 'coinNetwork') {
                      if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                        setFormData({ ...formData, key: value })
                      }
                    } else {
                      if (value === '' || (/^[a-zA-Z0-9]*$/.test(value) && value.length <= 20)) {
                        setFormData({ ...formData, key: value })
                      }
                    }
                  }}
                  disabled={!!editingKey}
                  placeholder={modalType === 'coinNetwork' ? '999999' : 'BTC, ETH, etc.'}
                  maxLength={20}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <Label>{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</Label>
                <Input
                  type="text"
                  value={formData.minimum}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                      setFormData({ ...formData, minimum: value })
                    }
                  }}
                  maxLength={20}
                />
              </div>
              {modalType === 'coinNetwork' && (
                <div className="col-span-12 md:col-span-6">
                  <Label>{t('admin.withdrawal.maximum', { defaultValue: 'Maximum' })}</Label>
                  <Input
                    type="text"
                    value={formData.maximum}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                        setFormData({ ...formData, maximum: value })
                      }
                    }}
                    maxLength={20}
                  />
                </div>
              )}
              <div className="col-span-12">
                <Label>{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</Label>
                <Select
                  value={formData.feeType}
                  onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </Select>
              </div>
              {formData.feeType === 'percentage' && (
                <>
                  <div className="col-span-12 md:col-span-4">
                    <Label>{t('admin.withdrawal.feePercentage', { defaultValue: 'Fee %' })}</Label>
                    <Input
                      type="text"
                      value={formData.feePercentage}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                          setFormData({ ...formData, feePercentage: value })
                        }
                      }}
                      maxLength={20}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Label>{t('admin.withdrawal.feeMin', { defaultValue: 'Min Fee' })}</Label>
                    <Input
                      type="text"
                      value={formData.feeMin}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                          setFormData({ ...formData, feeMin: value })
                        }
                      }}
                      maxLength={20}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4">
                    <Label>{t('admin.withdrawal.feeMax', { defaultValue: 'Max Fee' })}</Label>
                    <Input
                      type="text"
                      value={formData.feeMax}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                          setFormData({ ...formData, feeMax: value })
                        }
                      }}
                      maxLength={20}
                    />
                  </div>
                </>
              )}
              {formData.feeType === 'fixed' && (
                <div className="col-span-12">
                  <Label>{t('admin.withdrawal.feeFixed', { defaultValue: 'Fixed Fee' })}</Label>
                  <Input
                    type="text"
                    value={formData.feeFixed}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                        setFormData({ ...formData, feeFixed: value })
                      }
                    }}
                    maxLength={20}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-surface-200 text-surface-700 hover:bg-surface-300"
            >
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="button" onClick={onSave} disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  {t('actions.saving', { defaultValue: 'Saving...' })}
                </>
              ) : (
                <>
                  <i className="bx bx-save mr-1"></i>
                  {t('actions.save', { defaultValue: 'Save' })}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
