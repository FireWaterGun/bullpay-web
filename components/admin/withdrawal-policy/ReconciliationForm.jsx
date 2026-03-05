'use client';

import { useState } from 'react';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useAuth } from '@/app/providers';
import { updateSweepSetting } from '@/lib/api/admin';
import { useToast } from '@/app/providers';
import { logger } from '@/lib/utils/logger';
import { Button, Input, Label, Spinner } from '../../ui'

export default function ReconciliationForm({ reconciliation, setReconciliation }) {
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  function handleEdit() {
    setFormData({ staleMinutes: reconciliation.staleMinutes || '', maxPerRun: reconciliation.maxPerRun || '', jitterMsMin: reconciliation.jitterMs?.min || '', jitterMsMax: reconciliation.jitterMs?.max || '' });
    setShowModal(true);
  }

  async function handleSave() {
    try {
      setLoading(true);
      const settingValue = { staleMinutes: parseInt(formData.staleMinutes) || 0, maxPerRun: parseInt(formData.maxPerRun) || 0, jitterMs: { min: parseInt(formData.jitterMsMin) || 0, max: parseInt(formData.jitterMsMax) || 0 } };
      await updateSweepSetting(token, 'payment.withdraw.reconciliation', settingValue);
      setReconciliation(settingValue);
      setShowModal(false);
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }));
    } catch (error) {
      logger.error('Failed to save:', error);
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-4">
        <div className="mb-3">
          <h6 className="font-semibold mb-1 text-[1rem]">{t('admin.withdrawal.reconciliation', { defaultValue: 'Reconciliation' })}</h6>
          <p className="text-muted mb-0 text-[0.875rem]">{t('admin.withdrawal.reconciliationDesc', { defaultValue: 'Background scanner tuning' })}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full mb-0">
            <tbody>
              <tr className="bg-surface-100">
                <td width="35%" className="py-3 pl-3 text-[0.875rem]">{t('admin.withdrawal.staleMinutes', { defaultValue: 'Stale Minutes' })}</td>
                <td className="py-3"><code>{reconciliation.staleMinutes || '-'}</code></td>
              </tr>
              <tr>
                <td className="py-3 pl-3 text-[0.875rem]">{t('admin.withdrawal.maxPerRun', { defaultValue: 'Max Per Run' })}</td>
                <td className="py-3"><code>{reconciliation.maxPerRun || '-'}</code></td>
              </tr>
              <tr className="bg-surface-100">
                <td className="py-3 pl-3 text-[0.875rem]">{t('admin.withdrawal.jitterMs', { defaultValue: 'Jitter (ms)' })}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {reconciliation.jitterMs ?
                    <code>{reconciliation.jitterMs.min} - {reconciliation.jitterMs.max}</code> :

                    <span className="text-muted">-</span>
                    }
                    <Button type="button" onClick={handleEdit} size="icon" className="ml-auto">
                      <i className="bx bx-edit text-primary text-[1rem]"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showModal &&
      <>
          <div className="fixed inset-0 bg-black/50 z-40"></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center block" tabIndex="-1">
            <div className="w-full max-w-lg mx-4">
              <div className="bg-white rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-5 border-b border-surface-200">
                  <h5 className="text-lg font-semibold text-surface-800">
                    {t('admin.withdrawal.editReconciliation', { defaultValue: 'Edit Reconciliation' })}
                  </h5>
                  <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={() => setShowModal(false)} disabled={loading}></button>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-12 gap-x-6 gap-3">
                    <div className="md:col-span-6">
                      <Label>{t('admin.withdrawal.staleMinutes', { defaultValue: 'Stale Minutes' })}</Label>
                      <Input
                      type="text"

                      value={formData.staleMinutes || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*$/.test(value) && value.length <= 20) {
                          setFormData({ ...formData, staleMinutes: value });
                        }
                      }}
                      maxLength={20} />
                    
                    </div>
                    <div className="md:col-span-6">
                      <Label>{t('admin.withdrawal.maxPerRun', { defaultValue: 'Max Per Run' })}</Label>
                      <Input
                      type="text"

                      value={formData.maxPerRun || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*$/.test(value) && value.length <= 20) {
                          setFormData({ ...formData, maxPerRun: value });
                        }
                      }}
                      maxLength={20} />
                    
                    </div>
                    <div className="md:col-span-6">
                      <Label>{t('admin.withdrawal.jitterMsMin', { defaultValue: 'Jitter Min (ms)' })}</Label>
                      <Input
                      type="text"

                      value={formData.jitterMsMin || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*$/.test(value) && value.length <= 20) {
                          setFormData({ ...formData, jitterMsMin: value });
                        }
                      }}
                      maxLength={20} />
                    
                    </div>
                    <div className="md:col-span-6">
                      <Label>{t('admin.withdrawal.jitterMsMax', { defaultValue: 'Jitter Max (ms)' })}</Label>
                      <Input
                      type="text"

                      value={formData.jitterMsMax || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*$/.test(value) && value.length <= 20) {
                          setFormData({ ...formData, jitterMsMax: value });
                        }
                      }}
                      maxLength={20} />
                    
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
                  <Button
                  type="button"

                  onClick={() => setShowModal(false)}
                  disabled={loading} className="bg-surface-200 text-surface-700 hover:bg-surface-300">
                  
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </Button>
                  <Button
                  type="button"

                  onClick={handleSave}
                  disabled={loading}>
                  
                    {loading ?
                  <>
                        <Spinner className="w-4 h-4 mr-2" />
                        {t('actions.saving', { defaultValue: 'Saving...' })}
                      </> :

                  <>
                        <i className="bx bx-save mr-1"></i>
                        {t('actions.save', { defaultValue: 'Save' })}
                      </>
                  }
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      }
    </>);

}