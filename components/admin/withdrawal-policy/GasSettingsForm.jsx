'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useAuth } from '@/app/providers';
import { updateSweepSetting } from '@/lib/api/admin';
import { useToast } from '@/app/providers';
const ConfirmResetModal = dynamic(() => import('@/components/ConfirmResetModal'), { ssr: false });
import { logger } from '@/lib/utils/logger';
import CardEmptyState from '@/components/CardEmptyState';
import { Button, Input, Label, Spinner } from '../../ui'

export default function GasSettingsForm({ gasSettings, setGasSettings }) {
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  const [deleteConfirmNetwork, setDeleteConfirmNetwork] = useState(null);
  const [showGasNetworkForm, setShowGasNetworkForm] = useState(false);
  const [editingGasNetwork, setEditingGasNetwork] = useState(null);
  const [gasNetworkFormData, setGasNetworkFormData] = useState({ network: '', minNative: '' });

  function handleEdit() {
    setFormData({ bufferMultiplier: gasSettings.bufferMultiplier ?? 1.5 });
    setShowModal(true);
  }

  async function handleSave() {
    try {
      setLoading(true);
      const settingValue = {
        bufferMultiplier: parseFloat(formData.bufferMultiplier) || 1.5,
        minNativeByNetwork: gasSettings.minNativeByNetwork || {}
      };
      await updateSweepSetting(token, 'payment.withdraw.gas', settingValue);
      setGasSettings(settingValue);
      setShowModal(false);
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }));
    } catch (error) {
      logger.error('Failed to save:', error);
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }));
    } finally {
      setLoading(false);
    }
  }

  function handleAddGasNetwork() {
    setEditingGasNetwork(null);
    setGasNetworkFormData({ network: '', minNative: '' });
    setShowGasNetworkForm(true);
  }

  function handleEditGasNetwork(network, minNative) {
    setEditingGasNetwork(network);
    setGasNetworkFormData({ network, minNative });
    setShowGasNetworkForm(true);
  }

  async function handleSaveGasNetwork() {
    try {
      setLoading(true);
      const minNativeByNetwork = { ...(gasSettings.minNativeByNetwork || {}) };

      if (editingGasNetwork && editingGasNetwork !== gasNetworkFormData.network) {
        delete minNativeByNetwork[editingGasNetwork];
      }

      minNativeByNetwork[gasNetworkFormData.network] = gasNetworkFormData.minNative;

      const newSettings = { ...gasSettings, minNativeByNetwork };
      await updateSweepSetting(token, 'payment.withdraw.gas', newSettings);
      setGasSettings(newSettings);
      setShowGasNetworkForm(false);
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }));
    } catch (error) {
      logger.error('Failed to save:', error);
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGasNetwork(network) {
    setDeleteConfirmNetwork(network);
  }

  async function confirmDeleteGasNetwork() {
    const network = deleteConfirmNetwork;
    setDeleteConfirmNetwork(null);
    if (!network) return;

    try {
      setLoading(true);
      const minNativeByNetwork = { ...(gasSettings.minNativeByNetwork || {}) };
      delete minNativeByNetwork[network];

      const newSettings = { ...gasSettings, minNativeByNetwork };
      await updateSweepSetting(token, 'payment.withdraw.gas', newSettings);
      setGasSettings(newSettings);
      toast.success(t('admin.withdrawal.deleteSuccess', { defaultValue: 'Deleted successfully' }));
    } catch (error) {
      logger.error('Failed to delete:', error);
      toast.error(error?.message || t('admin.withdrawal.deleteError', { defaultValue: 'Failed to delete' }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-4">
        <div className="mb-3">
          <h6 className="font-semibold mb-1 text-[1rem]">{t('admin.withdrawal.gasSettings', { defaultValue: 'Gas Settings' })}</h6>
          <p className="text-muted mb-0 text-[0.875rem]">{t('admin.withdrawal.gasSettingsDesc', { defaultValue: 'Native gas guard configuration' })}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full mb-0">
            <tbody>
              <tr className="bg-surface-100">
                <td width="35%" className="py-3 pl-3 text-[0.875rem]">{t('admin.withdrawal.bufferMultiplier', { defaultValue: 'Buffer Multiplier' })}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {gasSettings.bufferMultiplier !== undefined && gasSettings.bufferMultiplier !== null ?
                    <code>{gasSettings.bufferMultiplier}</code> :

                    <span className="text-muted">Not set</span>
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

      <hr className="my-4" />

      <div className="mb-4">
        <div className="mb-3">
          <div className="flex items-center">
            <div className="grow">
              <h6 className="font-semibold mb-1 text-[1rem]">{t('admin.withdrawal.minNativeByNetwork', { defaultValue: 'Min Native by Network' })}</h6>
              <p className="text-muted mb-0 text-[0.875rem]">{t('admin.withdrawal.minNativeByNetworkDesc', { defaultValue: 'Minimum native balance required per network' })}</p>
            </div>
            <div className="flex justify-end w-[120px] pr-[12px]">
              <Button type="button" onClick={handleAddGasNetwork} size="sm">
                <i className="bx bx-plus mr-1"></i>
                {t('actions.add', { defaultValue: 'Add' })}
              </Button>
            </div>
          </div>
        </div>

        {Object.keys(gasSettings.minNativeByNetwork || {}).length > 0 ?
        <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>{t('admin.withdrawal.network', { defaultValue: 'Network' })}</th>
                  <th>{t('admin.withdrawal.minNative', { defaultValue: 'Min Native' })}</th>
                  <th className="text-right">{t('actions.actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(gasSettings.minNativeByNetwork || {}).map(([network, minNative]) =>
              <tr key={network}>
                    <td><strong>{network}</strong></td>
                    <td><code>{minNative}</code></td>
                    <td className="text-right">
                      <Button
                    type="button"

                    onClick={() => handleEditGasNetwork(network, minNative)}
                    disabled={loading} size="icon" className="mr-1">
                    
                        <i className="bx bx-edit text-primary text-xl"></i>
                      </Button>
                      <Button
                    type="button"

                    onClick={() => handleDeleteGasNetwork(network)}
                    disabled={loading} size="icon">
                    
                        <i className="bx bx-trash text-danger text-xl"></i>
                      </Button>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div> :

        <CardEmptyState
          icon="bx-data"
          message={t('admin.withdrawal.noNetworks', { defaultValue: 'No networks configured' })} />

        }
      </div>

      {showModal &&
      <>
          <div className="fixed inset-0 bg-black/50 z-40"></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center block" tabIndex="-1">
            <div className="w-full max-w-lg mx-4">
              <div className="bg-white rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-5 border-b border-surface-200">
                  <h5 className="text-lg font-semibold text-surface-800">
                    {t('admin.withdrawal.editGasSettings', { defaultValue: 'Edit Gas Settings' })}
                  </h5>
                  <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={() => setShowModal(false)} disabled={loading}></button>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-12 gap-x-6 gap-3">
                    <div className="col-span-12">
                      <Label>{t('admin.withdrawal.bufferMultiplier', { defaultValue: 'Buffer Multiplier' })}</Label>
                      <Input
                      type="text"

                      value={formData.bufferMultiplier || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20) {
                          setFormData({ ...formData, bufferMultiplier: value });
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

      {showGasNetworkForm &&
      <>
          <div className="fixed inset-0 bg-black/50 z-40"></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center block" tabIndex="-1">
            <div className="w-full max-w-lg mx-4">
              <div className="bg-white rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-5 border-b border-surface-200">
                  <h5 className="text-lg font-semibold text-surface-800">
                    {editingGasNetwork ?
                  t('admin.withdrawal.editNetwork', { defaultValue: 'Edit Network' }) :
                  t('admin.withdrawal.addNetwork', { defaultValue: 'Add Network' })
                  }
                  </h5>
                  <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={() => setShowGasNetworkForm(false)} disabled={loading}></button>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-12 gap-x-6 gap-3">
                    <div className="col-span-12">
                      <Label>{t('admin.withdrawal.network', { defaultValue: 'Network' })}*</Label>
                      <Input
                      type="text"

                      value={gasNetworkFormData.network}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^[a-zA-Z0-9]*$/.test(value) && value.length <= 20) {
                          setGasNetworkFormData({ ...gasNetworkFormData, network: value });
                        }
                      }}
                      disabled={!!editingGasNetwork}
                      placeholder="ETH, BSC, etc."
                      maxLength={20} />
                    
                    </div>
                    <div className="col-span-12">
                      <Label>{t('admin.withdrawal.minNative', { defaultValue: 'Min Native' })}*</Label>
                      <Input
                      type="text"

                      value={gasNetworkFormData.minNative}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20) {
                          setGasNetworkFormData({ ...gasNetworkFormData, minNative: value });
                        }
                      }}
                      placeholder="0.001"
                      maxLength={20} />
                    
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
                  <Button
                  type="button"

                  onClick={() => setShowGasNetworkForm(false)}
                  disabled={loading} className="bg-surface-200 text-surface-700 hover:bg-surface-300">
                  
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </Button>
                  <Button
                  type="button"

                  onClick={handleSaveGasNetwork}
                  disabled={loading || !gasNetworkFormData.network || !gasNetworkFormData.minNative}>
                  
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

      {deleteConfirmNetwork &&
      <ConfirmResetModal
        title={t('actions.confirm', { defaultValue: 'Confirm Delete' })}
        message={t('admin.withdrawal.confirmDelete', { defaultValue: 'Are you sure you want to delete this?' })}
        confirmLabel={t('actions.delete', { defaultValue: 'Delete' })}
        onConfirm={confirmDeleteGasNetwork}
        onClose={() => setDeleteConfirmNetwork(null)} />

      }
    </>);

}