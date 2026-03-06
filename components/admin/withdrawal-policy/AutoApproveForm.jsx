'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useAuth } from '@/app/providers';
import { upsertSetting } from '@/lib/api/admin';
import { useToast } from '@/app/providers';
import { logger } from '@/lib/utils/logger';
import { Button, Input, Label, Spinner } from '../../ui'
import Table from '@/components/ui/Table'

export default function AutoApproveForm({ autoApprove, setAutoApprove }) {
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  function handleEdit() {
    setFormData({ enabled: autoApprove.enabled || false, thresholdUsd: autoApprove.thresholdUsd || 0 });
    setShowModal(true);
  }

  async function saveAutoApproveFields(enabled, thresholdUsd) {
    await Promise.all([
    upsertSetting(token, { keyName: 'withdrawal.auto_approve.enabled', value: String(enabled) }),
    upsertSetting(token, { keyName: 'withdrawal.auto_approve.threshold_usd', value: String(thresholdUsd) })]
    );
  }

  async function handleSave() {
    try {
      setLoading(true);
      const enabled = formData.enabled;
      const thresholdUsd = parseFloat(formData.thresholdUsd) || 0;
      await saveAutoApproveFields(enabled, thresholdUsd);
      setAutoApprove({ enabled, thresholdUsd });
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
          <h6 className="font-semibold mb-1 text-[1rem]">{t('admin.withdrawal.autoApprove', { defaultValue: 'Auto Approve' })}</h6>
          <p className="text-surface-500 mb-0 text-[0.875rem]">{t('admin.withdrawal.autoApproveDesc', { defaultValue: 'Automatically approve small withdrawals' })}</p>
        </div>
        <div className="overflow-x-auto">
          <Table responsive={false} className="mb-0">
            <tbody>
              <tr className="bg-surface-100">
                <td width="35%" className="py-3 pl-3 text-[0.875rem]">{t('admin.withdrawal.enabled', { defaultValue: 'Enabled' })}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      checked={autoApprove.enabled || false}
                      disabled={toggling}
                      onChange={async (e) => {
                        const newEnabled = e.target.checked;
                        const prev = { ...autoApprove };
                        setToggling(true);
                        setAutoApprove({ ...autoApprove, enabled: newEnabled });
                        try {
                          await upsertSetting(token, { keyName: 'withdrawal.auto_approve.enabled', value: String(newEnabled) });
                          toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }));
                        } catch (err) {
                          setAutoApprove(prev);
                          toast.error(err?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }));
                        } finally {
                          setToggling(false);
                        }
                      }}
                      style={{ cursor: toggling ? 'not-allowed' : 'pointer' }} />
                    
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-3 pl-3 text-[0.875rem]">{t('admin.withdrawal.thresholdUsd', { defaultValue: 'Threshold (USD)' })}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <code>{autoApprove.thresholdUsd || 0}</code>
                    <Button type="button" onClick={handleEdit} disabled={toggling} size="icon" className="ml-auto">
                      <i className="bx bx-edit text-primary text-[1rem]"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>

      {showModal &&
      <AutoApproveModal
        formData={formData}
        setFormData={setFormData}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        loading={loading}
        t={t} />

      }
    </>);

}

function AutoApproveModal({ formData, setFormData, onClose, onSave, loading, t }) {
  // Stable ref for onClose to avoid listener churn
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Escape key handler
  useEffect(() => {
    const handler = (e) => {if (e.key === 'Escape' && !loading) onCloseRef.current();};
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [loading]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" tabIndex="-1" onClick={() => !loading && onClose()}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              {t('admin.withdrawal.editAutoApprove', { defaultValue: 'Edit Auto Approve' })}
            </h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none" onClick={onClose} disabled={loading}><i className="bx bx-x"></i></button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-12 gap-x-6 gap-3">
              <div className="col-span-12">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    checked={formData.enabled || false}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    style={{ cursor: 'pointer' }} />
                  <label className="text-sm text-surface-700">{t('admin.withdrawal.enabled', { defaultValue: 'Enabled' })}</label>
                </div>
              </div>
              <div className="col-span-12">
                <Label>{t('admin.withdrawal.thresholdUsd', { defaultValue: 'Threshold (USD)' })}</Label>
                <Input
                  type="text"
                  value={formData.thresholdUsd || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                      setFormData({ ...formData, thresholdUsd: value });
                    }
                  }}
                  maxLength={20} />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-surface-200 text-surface-700 hover:bg-surface-300">
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={loading}>
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
  );
}