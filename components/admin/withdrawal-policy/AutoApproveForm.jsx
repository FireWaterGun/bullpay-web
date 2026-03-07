'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useAuth } from '@/app/providers';
import { upsertSetting } from '@/lib/api/admin';
import { useToast } from '@/app/providers';
import { logger } from '@/lib/utils/logger';
import Button from '../../ui/Button'
import { Input, Label } from '../../ui/Input'
import Spinner from '../../ui/Spinner'
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
          <h6 className="font-semibold mb-1 text-base">{t('admin.withdrawal.autoApprove', { defaultValue: 'Auto Approve' })}</h6>
          <p className="text-surface-500 mb-0 text-sm">{t('admin.withdrawal.autoApproveDesc', { defaultValue: 'Automatically approve small withdrawals' })}</p>
        </div>
        <div className="overflow-x-auto">
          <Table responsive={false} className="mb-0">
            <tbody>
              <tr className="bg-surface-100 dark:bg-white/[0.03]">
                <td width="35%" className="py-3 pl-3 text-sm">{t('admin.withdrawal.enabled', { defaultValue: 'Enabled' })}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <ToggleSwitch
                      checked={autoApprove.enabled || false}
                      disabled={toggling}
                      onChange={async (newEnabled) => {
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
                      }} />
                    <span className={`text-xs font-semibold ${autoApprove.enabled ? 'text-success' : 'text-surface-400'}`}>
                      {autoApprove.enabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-3 pl-3 text-sm">{t('admin.withdrawal.thresholdUsd', { defaultValue: 'Threshold (USD)' })}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <code>{autoApprove.thresholdUsd || 0}</code>
                    <Button type="button" onClick={handleEdit} disabled={toggling} variant="text-secondary" size="icon-sm" className="ml-auto">
                      <i className="bx bx-edit text-[1rem]"></i>
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
                <div className="flex items-center gap-3">
                  <ToggleSwitch
                    checked={formData.enabled || false}
                    onChange={(val) => setFormData({ ...formData, enabled: val })} />
                  <label className="text-sm text-surface-700">{t('admin.withdrawal.enabled', { defaultValue: 'Enabled' })}</label>
                  <span className={`text-xs font-semibold ${formData.enabled ? 'text-success' : 'text-surface-400'}`}>
                    {formData.enabled ? 'ON' : 'OFF'}
                  </span>
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
              variant="outline-secondary">
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

/* ── Toggle Switch ── */
function ToggleSwitch({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        checked ? 'bg-primary-600' : 'bg-surface-300',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}>
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')} />
    </button>
  );
}