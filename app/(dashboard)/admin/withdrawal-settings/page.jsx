'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, useToast } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { getSettingByKey, upsertSetting, getCoinNetworks, updateCoinNetwork } from '@/lib/api/admin';
import { logger } from '@/lib/utils/logger';
import AutoApproveForm from '@/components/admin/withdrawal-policy/AutoApproveForm';
import CoinImg from '@/components/CoinImg';
import CardEmptyState from '@/components/CardEmptyState';
import { AvatarInitial, Badge, bgLabelClass, Button, Card, Input, Label, Spinner } from '../../../../components/ui';

const TABS = [
{ key: 'policy', icon: 'bx-shield-quarter', labelKey: 'admin.withdrawalSettings.tabPolicy', defaultLabel: 'Policy' },
{ key: 'basefee', icon: 'bx-gas-pump', labelKey: 'admin.withdrawalSettings.tabBaseFee', defaultLabel: 'Base Fee' },
{ key: 'feeLimits', icon: 'bx-table', labelKey: 'admin.withdrawalSettings.tabFeeLimits', defaultLabel: 'Fee & Limits' }];


const SETTINGS_DB_KEYS = [
'withdrawal.security.max_pending_per_user',
'withdrawal.base_fee.auto_update',
'withdrawal.base_fee.buffer_multiplier',
'withdrawal.base_fee.alert_threshold',
'withdrawal.auto_approve.enabled',
'withdrawal.auto_approve.threshold_usd'];


export default function WithdrawalSettingsPage() {
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('policy');
  const [loading, setLoading] = useState(true);

  // DB settings (from settings API)
  const [dbSettings, setDbSettings] = useState({});
  // Auto-approve (derived from dbSettings)
  const [autoApprove, setAutoApprove] = useState({});

  // Coin-networks for fee table
  const [coinNetworks, setCoinNetworks] = useState([]);
  const [cnLoading, setCnLoading] = useState(false);
  const [cnLoaded, setCnLoaded] = useState(false);
  const [cnSearch, setCnSearch] = useState('');
  const [cnPagination, setCnPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  // Edit modals
  const [showMaxPendingModal, setShowMaxPendingModal] = useState(false);
  const [maxPendingForm, setMaxPendingForm] = useState('');
  const [savingMaxPending, setSavingMaxPending] = useState(false);

  const [showBufferModal, setShowBufferModal] = useState(false);
  const [bufferForm, setBufferForm] = useState('');
  const [savingBuffer, setSavingBuffer] = useState(false);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertForm, setAlertForm] = useState('');
  const [savingAlert, setSavingAlert] = useState(false);

  // Auto-update toggle loading
  const [savingAutoUpdate, setSavingAutoUpdate] = useState(false);

  // Coin-network edit modal
  const [editCn, setEditCn] = useState(null);
  const [cnForm, setCnForm] = useState({});
  const [savingCn, setSavingCn] = useState(false);

  const loadDbSettings = useCallback(async () => {
    if (!token) return;
    try {
      const results = await Promise.all(
        SETTINGS_DB_KEYS.map(async (key) => {
          try {
            const setting = await getSettingByKey(token, key);
            return { key, value: setting?.value ?? setting?.defaultValue ?? '' };
          } catch {
            return { key, value: '' };
          }
        })
      );
      const map = {};
      for (const { key, value } of results) {
        map[key] = value;
      }
      setDbSettings(map);
      // Derive auto-approve state
      setAutoApprove({
        enabled: map['withdrawal.auto_approve.enabled'] === 'true',
        thresholdUsd: parseFloat(map['withdrawal.auto_approve.threshold_usd']) || 0
      });
    } catch (error) {
      logger.error('Failed to load DB settings:', error);
    }
  }, [token]);

  const loadCoinNetworks = useCallback(async (page = 1, search = '') => {
    if (!token) return;
    setCnLoading(true);
    try {
      const response = await getCoinNetworks(token, page, 20, search);
      setCoinNetworks(response?.items || []);
      setCnLoaded(true);
      const pag = response?.pagination || {};
      setCnPagination({
        page: pag.page || page,
        limit: pag.limit || 20,
        total: pag.total || 0,
        totalPages: pag.totalPages || 0
      });
    } catch (error) {
      logger.error('Failed to load coin networks:', error);
    } finally {
      setCnLoading(false);
    }
  }, [token]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadDbSettings();
      setLoading(false);
    }
    init();
  }, [loadDbSettings]);

  // Load coin-networks when switching to fee tab
  useEffect(() => {
    if (activeTab === 'feeLimits' && !cnLoaded) {
      loadCoinNetworks(1, '');
    }
  }, [activeTab, cnLoaded, loadCoinNetworks]);

  // Save helpers
  async function saveSetting(keyName, value) {
    await upsertSetting(token, { keyName, value: String(value) });
  }

  async function handleSaveMaxPending() {
    try {
      setSavingMaxPending(true);
      const val = parseInt(maxPendingForm) || 5;
      await saveSetting('withdrawal.security.max_pending_per_user', val);
      setDbSettings((prev) => ({ ...prev, 'withdrawal.security.max_pending_per_user': String(val) }));
      setShowMaxPendingModal(false);
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }));
    } catch (error) {
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }));
    } finally {
      setSavingMaxPending(false);
    }
  }

  async function handleToggleAutoUpdate() {
    const current = dbSettings['withdrawal.base_fee.auto_update'] === 'true';
    const newVal = !current;
    try {
      setSavingAutoUpdate(true);
      await saveSetting('withdrawal.base_fee.auto_update', newVal);
      setDbSettings((prev) => ({ ...prev, 'withdrawal.base_fee.auto_update': String(newVal) }));
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }));
    } catch (error) {
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }));
    } finally {
      setSavingAutoUpdate(false);
    }
  }

  async function handleSaveBuffer() {
    try {
      setSavingBuffer(true);
      const parsed = parseFloat(bufferForm);
      const val = isNaN(parsed) ? 1.2 : parsed;
      await saveSetting('withdrawal.base_fee.buffer_multiplier', val);
      setDbSettings((prev) => ({ ...prev, 'withdrawal.base_fee.buffer_multiplier': String(val) }));
      setShowBufferModal(false);
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }));
    } catch (error) {
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }));
    } finally {
      setSavingBuffer(false);
    }
  }

  async function handleSaveAlert() {
    try {
      setSavingAlert(true);
      const parsed = parseFloat(alertForm);
      const val = isNaN(parsed) ? 0.2 : parsed;
      await saveSetting('withdrawal.base_fee.alert_threshold', val);
      setDbSettings((prev) => ({ ...prev, 'withdrawal.base_fee.alert_threshold': String(val) }));
      setShowAlertModal(false);
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }));
    } catch (error) {
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }));
    } finally {
      setSavingAlert(false);
    }
  }

  function openCnEditModal(cn) {
    setEditCn(cn);
    setCnForm({
      withdrawEnabled: cn.withdrawEnabled ?? false,
      minWithdrawAmount: cn.minWithdrawAmount ?? '',
      maxWithdrawAmount: cn.maxWithdrawAmount ?? '',
      withdrawFeePercent: cn.withdrawFeePercent ?? '',
      dailyWithdrawLimitUsd: cn.dailyWithdrawLimitUsd ?? ''
    });
  }

  async function handleSaveCn() {
    if (!editCn) return;

    // Submission-time validation — match backend regex
    const amountRegex = /^\d+(\.\d+)?$/;
    const usdRegex = /^\d+(\.\d{1,2})?$/;
    for (const field of ['minWithdrawAmount', 'maxWithdrawAmount', 'withdrawFeePercent']) {
      if (cnForm[field] !== '' && !amountRegex.test(cnForm[field])) {
        toast.error(t('admin.withdrawal.invalidFormat', { defaultValue: 'Invalid number format. Use digits with optional decimal (e.g. 1.5)' }));
        return;
      }
    }
    if (cnForm.dailyWithdrawLimitUsd !== '' && !usdRegex.test(cnForm.dailyWithdrawLimitUsd)) {
      toast.error(t('admin.withdrawal.invalidUsdFormat', { defaultValue: 'Invalid USD format. Max 2 decimal places (e.g. 100.50)' }));
      return;
    }

    try {
      setSavingCn(true);
      const payload = {
        withdrawEnabled: cnForm.withdrawEnabled,
        minWithdrawAmount: cnForm.minWithdrawAmount !== '' ? cnForm.minWithdrawAmount : undefined,
        maxWithdrawAmount: cnForm.maxWithdrawAmount !== '' ? cnForm.maxWithdrawAmount : undefined,
        withdrawFeePercent: cnForm.withdrawFeePercent !== '' ? cnForm.withdrawFeePercent : undefined,
        dailyWithdrawLimitUsd: cnForm.dailyWithdrawLimitUsd !== '' ? cnForm.dailyWithdrawLimitUsd : undefined
      };
      await updateCoinNetwork(token, editCn.id, payload);
      // Update local state — only overwrite fields that were sent, keep display-only fields intact
      setCoinNetworks((prev) => prev.map((cn) => {
        if (cn.id !== editCn.id) return cn;
        return {
          ...cn,
          withdrawEnabled: cnForm.withdrawEnabled,
          // Only update amount fields if the form has a value; otherwise keep old value
          // (backend ignores undefined fields, so old value persists on server)
          ...(cnForm.minWithdrawAmount !== '' ? { minWithdrawAmount: cnForm.minWithdrawAmount } : {}),
          ...(cnForm.maxWithdrawAmount !== '' ? { maxWithdrawAmount: cnForm.maxWithdrawAmount } : {}),
          ...(cnForm.withdrawFeePercent !== '' ? { withdrawFeePercent: cnForm.withdrawFeePercent } : {}),
          ...(cnForm.dailyWithdrawLimitUsd !== '' ? { dailyWithdrawLimitUsd: cnForm.dailyWithdrawLimitUsd } : {})
        };
      }));
      setEditCn(null);
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }));
    } catch (error) {
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }));
    } finally {
      setSavingCn(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner role="status" className="text-primary" />

        
      </div>);

  }

  const maxPending = dbSettings['withdrawal.security.max_pending_per_user'] || '5';
  const autoUpdateOn = dbSettings['withdrawal.base_fee.auto_update'] === 'true';
  const bufferMultiplier = dbSettings['withdrawal.base_fee.buffer_multiplier'] || '1.2';
  const alertThreshold = dbSettings['withdrawal.base_fee.alert_threshold'] || '0.2';

  return (
    <div className="grow py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bx bx-transfer mr-2 text-primary"></i>
            {t('admin.withdrawalSettings.title', { defaultValue: 'Withdrawal Settings' })}
          </h4>
          <p className="text-muted mb-0">
            {t('admin.withdrawalSettings.subtitle', { defaultValue: 'Global withdrawal policy, base fee configuration, and per-coin fee & limits' })}
          </p>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-12 gap-x-6 gap-3 mb-4">
        <StatusCard
          icon="bx-check-shield"
          color="success"
          label={t('admin.withdrawalSettings.autoApproveCard', { defaultValue: 'Auto-Approve' })}
          value={autoApprove.enabled ? 'ON' : 'OFF'}
          sub={autoApprove.enabled ? `≤ $${autoApprove.thresholdUsd || 0}` : null}
          active={autoApprove.enabled} />
        
        <StatusCard
          icon="bx-lock-alt"
          color="warning"
          label={t('admin.withdrawalSettings.maxPendingCard', { defaultValue: 'Max Pending / User' })}
          value={maxPending}
          sub={t('admin.withdrawalSettings.perUser', { defaultValue: 'per user' })} />
        
        <StatusCard
          icon="bx-gas-pump"
          color="info"
          label={t('admin.withdrawalSettings.gasBufferCard', { defaultValue: 'Gas Buffer' })}
          value={`${bufferMultiplier}x`}
          sub={autoUpdateOn ?
          t('admin.withdrawalSettings.autoUpdate', { defaultValue: 'Auto-update ON' }) :
          t('admin.withdrawalSettings.autoUpdateOff', { defaultValue: 'Auto-update OFF' })} />
        
        <StatusCard
          icon="bx-error-circle"
          color="primary"
          label={t('admin.withdrawalSettings.alertThresholdCard', { defaultValue: 'Alert Threshold' })}
          value={`${(parseFloat(alertThreshold) * 100).toFixed(0)}%`}
          sub={t('admin.withdrawalSettings.feeChangeAlert', { defaultValue: 'fee change alert' })} />
        
      </div>

      {/* Tab Navigation */}
      <div className="mb-4">
        <ul className="nav flex border-b border-surface-200 gap-1" role="tablist">
          {TABS.map((tab) =>
          <li key={tab.key} className="" role="presentation">
              <button
              className={`px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-700 border-b-2 border-transparent hover:border-surface-300 ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
              role="tab">
              
                <i className={`bx ${tab.icon} mr-1`}></i>
                {t(tab.labelKey, { defaultValue: tab.defaultLabel })}
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* ── Policy Tab ── */}
      {activeTab === 'policy' &&
      <div className="grid grid-cols-12 gap-x-6">
          <div className="lg:col-span-8">
            {/* Auto-Approve Section */}
            <Card className="mb-4">
              <div className="p-5">
                <AutoApproveForm autoApprove={autoApprove} setAutoApprove={setAutoApprove} />
              </div>
            </Card>

            {/* Max Pending Per User */}
            <Card className="mb-4">
              <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
                <h5 className="text-lg font-semibold text-surface-800 mb-0 mb-0">
                  <i className="bx bx-lock-alt mr-2 text-warning"></i>
                  {t('admin.withdrawalSettings.maxPendingTitle', { defaultValue: 'Max Pending Withdrawals' })}
                </h5>
                <Button
                type="button"

                onClick={() => {
                  setMaxPendingForm(maxPending);
                  setShowMaxPendingModal(true);
                }} variant="outline-primary" size="sm" className="bg-transparent hover:bg-primary-600 hover:text-white">
                
                  <i className="bx bx-edit mr-1"></i>
                  {t('actions.edit', { defaultValue: 'Edit' })}
                </Button>
              </div>
              <div className="p-5">
                <p className="text-muted mb-3 text-[0.875rem]">
                  {t('admin.withdrawalSettings.maxPendingDesc', { defaultValue: 'Maximum number of pending (unprocessed) withdrawal requests allowed per user at any time.' })}
                </p>
                <div className="flex items-center gap-3 p-3 rounded bg-surface-100">
                  <div>
                    <small className="text-muted block">{t('admin.withdrawalSettings.currentValue', { defaultValue: 'Current Value' })}</small>
                    <h4 className="mb-0 font-bold">{maxPending}</h4>
                  </div>
                  <div className="ml-auto">
                    <small className="text-muted">
                      withdrawal.security.max_pending_per_user
                    </small>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <Card className="mb-3">
              <div className="px-5 py-4 border-b border-surface-200">
                <h6 className="text-lg font-semibold text-surface-800 mb-0 mb-0">
                  <i className="bx bx-info-circle mr-1"></i>
                  {t('admin.withdrawalSettings.howItWorks', { defaultValue: 'How It Works' })}
                </h6>
              </div>
              <div className="p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-50 text-green-700 rounded-full mt-1">1</Badge>
                    <div>
                      <small className="font-semibold block">{t('admin.withdrawalSettings.howItWorksStep1', { defaultValue: 'User requests withdrawal' })}</small>
                      <small className="text-muted">{t('admin.withdrawalSettings.howItWorksStep1Desc', { defaultValue: 'System checks max pending limit per user' })}</small>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-50 text-green-700 rounded-full mt-1">2</Badge>
                    <div>
                      <small className="font-semibold block">{t('admin.withdrawalSettings.howItWorksStep2', { defaultValue: 'Auto-approve check' })}</small>
                      <small className="text-muted">{t('admin.withdrawalSettings.howItWorksStep2Desc', { defaultValue: 'If enabled and amount ≤ threshold → auto-approved' })}</small>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-amber-50 text-amber-700 rounded-full mt-1">3</Badge>
                    <div>
                      <small className="font-semibold block">{t('admin.withdrawalSettings.howItWorksStep3', { defaultValue: 'Manual review' })}</small>
                      <small className="text-muted">{t('admin.withdrawalSettings.howItWorksStep3Desc', { defaultValue: 'Large or flagged requests require admin approval' })}</small>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="px-5 py-4 border-b border-surface-200">
                <h6 className="text-lg font-semibold text-surface-800 mb-0 mb-0">
                  <i className="bx bx-bulb mr-1"></i>
                  {t('admin.withdrawalSettings.tips', { defaultValue: 'Tips' })}
                </h6>
              </div>
              <div className="p-5">
                <ul className="list-none mb-0 text-sm text-muted">
                  <li className="mb-2">
                    <i className="bx bx-right-arrow-alt mr-1"></i>
                    {t('admin.withdrawalSettings.tip1', { defaultValue: 'Auto-approve is great for small withdrawals to reduce admin workload.' })}
                  </li>
                  <li className="mb-2">
                    <i className="bx bx-right-arrow-alt mr-1"></i>
                    {t('admin.withdrawalSettings.tip3', { defaultValue: 'Keep max pending low (3–5) to prevent withdrawal queue abuse.' })}
                  </li>
                  <li>
                    <i className="bx bx-right-arrow-alt mr-1"></i>
                    {t('admin.withdrawalSettings.tip4', { defaultValue: 'Changes take effect immediately — no restart required.' })}
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      }

      {/* ── Base Fee Tab ── */}
      {activeTab === 'basefee' &&
      <div className="grid grid-cols-12 gap-x-6">
          <div className="lg:col-span-8">
            {/* Auto-Update Toggle */}
            <Card className="mb-4">
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="text-lg font-semibold text-surface-800 mb-0 mb-0">
                  <i className="bx bx-refresh mr-2 text-info"></i>
                  {t('admin.withdrawalSettings.baseFeeAutoUpdate', { defaultValue: 'Base Fee Auto-Update' })}
                </h5>
              </div>
              <div className="p-5">
                <p className="text-muted mb-3 text-[0.875rem]">
                  {t('admin.withdrawalSettings.baseFeeAutoUpdateDesc', { defaultValue: 'When enabled, base fees are automatically recalculated every minute based on current network gas prices.' })}
                </p>
                <div className="flex items-center justify-between p-3 rounded bg-surface-100">
                  <div className="flex items-center gap-2">
                    <Badge color={autoUpdateOn ? 'success' : 'secondary'} label>
                      {autoUpdateOn ? 'ON' : 'OFF'}
                    </Badge>
                    <span className="text-[0.875rem]">
                      {t('admin.withdrawalSettings.autoUpdateToggleLabel', { defaultValue: 'Auto-update base fees from gas prices' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 relative inline-flex items-center mb-0">
                    <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    checked={autoUpdateOn}
                    onChange={handleToggleAutoUpdate}
                    disabled={savingAutoUpdate}
                    style={{ cursor: savingAutoUpdate ? 'not-allowed' : 'pointer' }} />
                  
                  </div>
                </div>
              </div>
            </Card>

            {/* Buffer & Alert */}
            <Card className="mb-4">
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="text-lg font-semibold text-surface-800 mb-0 mb-0">
                  <i className="bx bx-slider-alt mr-2 text-primary"></i>
                  {t('admin.withdrawalSettings.baseFeeParams', { defaultValue: 'Base Fee Parameters' })}
                </h5>
              </div>
              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full mb-0">
                    <tbody>
                      <tr className="bg-surface-100">
                        <td className="py-3 pl-3 w-2/5">
                          <div>
                            <span className="font-semibold text-[0.875rem]">{t('admin.withdrawalSettings.bufferMultiplier', { defaultValue: 'Buffer Multiplier' })}</span>
                            <br />
                            <small className="text-muted">{t('admin.withdrawalSettings.bufferMultiplierDesc', { defaultValue: 'Multiplied on gas cost (1.2 = 20% safety margin)' })}</small>
                          </div>
                        </td>
                        <td className="py-3">
                          <code className="text-xl">{bufferMultiplier}x</code>
                        </td>
                        <td className="py-3 text-right pr-3">
                          <Button
                          type="button"

                          onClick={() => {setBufferForm(bufferMultiplier);setShowBufferModal(true);}} variant="outline-primary" size="sm" className="bg-transparent hover:bg-primary-600 hover:text-white">
                          
                            <i className="bx bx-edit"></i>
                          </Button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pl-3">
                          <div>
                            <span className="font-semibold text-[0.875rem]">{t('admin.withdrawalSettings.alertThreshold', { defaultValue: 'Alert Threshold' })}</span>
                            <br />
                            <small className="text-muted">{t('admin.withdrawalSettings.alertThresholdDesc', { defaultValue: 'Notify admin when base fee changes by more than this %' })}</small>
                          </div>
                        </td>
                        <td className="py-3">
                          <code className="text-xl">{(parseFloat(alertThreshold) * 100).toFixed(0)}%</code>
                        </td>
                        <td className="py-3 text-right pr-3">
                          <Button
                          type="button"

                          onClick={() => {setAlertForm(alertThreshold);setShowAlertModal(true);}} variant="outline-primary" size="sm" className="bg-transparent hover:bg-primary-600 hover:text-white">
                          
                            <i className="bx bx-edit"></i>
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Formula */}
            <Card className="mb-4">
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="text-lg font-semibold text-surface-800 mb-0 mb-0">
                  <i className="bx bx-math mr-2"></i>
                  {t('admin.withdrawalSettings.feeFormula', { defaultValue: 'Fee Calculation Formula' })}
                </h5>
              </div>
              <div className="p-5">
                <div className="p-3 rounded mb-3 bg-surface-100 font-mono text-[0.9rem]">
                  <div className="mb-2"><strong>Base Fee</strong> = {t('admin.withdrawalSettings.baseFeeFormula', { defaultValue: 'Gas Limit × Gas Price × Buffer Multiplier' })}</div>
                  <div className="mb-2"><strong>Platform Fee</strong> = {t('admin.withdrawalSettings.platformFeeFormula', { defaultValue: 'Amount × Fee Percent (%)' })}</div>
                  <div><strong>Total Fee</strong> = {t('admin.withdrawalSettings.totalFeeFormula', { defaultValue: 'Base Fee + Platform Fee' })}</div>
                </div>
                <small className="text-muted">
                  {t('admin.withdrawalSettings.feeFormulaNote', { defaultValue: 'Base fee covers on-chain gas costs. Platform fee (%) is your revenue margin. Both are configured per coin-network in the Fee & Limits tab.' })}
                </small>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <Card className="mb-3">
              <div className="px-5 py-4 border-b border-surface-200">
                <h6 className="text-lg font-semibold text-surface-800 mb-0 mb-0">
                  <i className="bx bx-dollar-circle mr-1"></i>
                  {t('admin.withdrawalSettings.feeModel', { defaultValue: 'Fee Model' })}
                </h6>
              </div>
              <div className="p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-primary-50 text-primary-600 rounded-full mt-1">1</Badge>
                    <div>
                      <small className="font-semibold block">{t('admin.withdrawalSettings.feeModelStep1', { defaultValue: 'Base Fee (gas cost)' })}</small>
                      <small className="text-muted">{t('admin.withdrawalSettings.feeModelStep1Desc', { defaultValue: 'Auto-calculated from on-chain gas price × buffer multiplier' })}</small>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-primary-50 text-primary-600 rounded-full mt-1">2</Badge>
                    <div>
                      <small className="font-semibold block">{t('admin.withdrawalSettings.feeModelStep2', { defaultValue: 'Platform Fee (%)' })}</small>
                      <small className="text-muted">{t('admin.withdrawalSettings.feeModelStep2Desc', { defaultValue: 'Percentage fee on withdrawal amount — your revenue margin' })}</small>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-green-50 text-green-700 rounded-full mt-1">3</Badge>
                    <div>
                      <small className="font-semibold block">{t('admin.withdrawalSettings.feeModelStep3', { defaultValue: 'Total = Base + Platform' })}</small>
                      <small className="text-muted">{t('admin.withdrawalSettings.feeModelStep3Desc', { defaultValue: 'Charged to user on each withdrawal. Edit per coin-network in Fee & Limits.' })}</small>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="px-5 py-4 border-b border-surface-200">
                <h6 className="text-lg font-semibold text-surface-800 mb-0 mb-0">
                  <i className="bx bx-bulb mr-1"></i>
                  {t('admin.withdrawalSettings.tips', { defaultValue: 'Tips' })}
                </h6>
              </div>
              <div className="p-5">
                <ul className="list-none mb-0 text-sm text-muted">
                  <li className="mb-2">
                    <i className="bx bx-right-arrow-alt mr-1"></i>
                    {t('admin.withdrawalSettings.tip2', { defaultValue: 'Gas buffer of 1.2–1.5x ensures transactions confirm without running out of gas.' })}
                  </li>
                  <li className="mb-2">
                    <i className="bx bx-right-arrow-alt mr-1"></i>
                    {t('admin.withdrawalSettings.tip5', { defaultValue: 'Set alert threshold to 20–30% to get notified of significant gas price spikes.' })}
                  </li>
                  <li>
                    <i className="bx bx-right-arrow-alt mr-1"></i>
                    {t('admin.withdrawalSettings.tip6', { defaultValue: 'Auto-update runs every minute. Disable only if you want to set base fees manually.' })}
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      }

      {/* ── Fee & Limits Tab ── */}
      {activeTab === 'feeLimits' &&
      <Card>
          <div className="px-5 py-4 border-b border-surface-200">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h5 className="text-lg font-semibold text-surface-800 mb-0 mb-1">
                  <i className="bx bx-table mr-2"></i>
                  {t('admin.withdrawalSettings.perCoinNetworkTitle', { defaultValue: 'Per Coin-Network Fee & Limits' })}
                </h5>
                <p className="text-muted mb-0 text-[0.85rem]">
                  {t('admin.withdrawalSettings.perCoinNetworkDesc', { defaultValue: 'Each row is a coin-network pair with its own withdrawal configuration. Click Edit to modify.' })}
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-stretch flex items-stretch text-sm w-[220px]">
                  <Input
                  type="text"

                  placeholder={t('admin.withdrawalSettings.searchPlaceholder', { defaultValue: 'Search coin/network...' })}
                  value={cnSearch}
                  onChange={(e) => setCnSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadCoinNetworks(1, cnSearch)} />
                
                  <Button

                  type="button"
                  onClick={() => loadCoinNetworks(1, cnSearch)} variant="outline-primary" className="bg-transparent hover:bg-primary-600 hover:text-white">
                  
                    <i className="bx bx-search"></i>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {cnLoading ?
          <div className="text-center py-5">
                <Spinner role="status" className="text-primary" />

            
              </div> :
          coinNetworks.length === 0 ?
          <CardEmptyState
            icon="bx-search-alt-2"
            message={t('admin.withdrawalSettings.noCoinNetworks', { defaultValue: 'No coin-networks found' })} /> :


          <table className="w-full mb-0">
                <thead className="">
                  <tr>
                    <th className="text-[0.8rem]">{t('admin.withdrawalSettings.colCoinNetwork', { defaultValue: 'Coin / Network' })}</th>
                    <th className="text-center text-[0.8rem]">{t('admin.withdrawalSettings.colEnabled', { defaultValue: 'Enabled' })}</th>
                    <th className="text-right text-[0.8rem]">{t('admin.withdrawalSettings.colMin', { defaultValue: 'Min' })}</th>
                    <th className="text-right text-[0.8rem]">{t('admin.withdrawalSettings.colMax', { defaultValue: 'Max' })}</th>
                    <th className="text-right text-[0.8rem]">{t('admin.withdrawalSettings.colFeeBase', { defaultValue: 'Fee Base' })}</th>
                    <th className="text-right text-[0.8rem]">{t('admin.withdrawalSettings.colFeePercent', { defaultValue: 'Fee %' })}</th>
                    <th className="text-right text-[0.8rem]">{t('admin.withdrawalSettings.colDailyLimit', { defaultValue: 'Daily Limit (USD)' })}</th>
                    <th className="text-center text-[0.8rem]">{t('admin.withdrawalSettings.colActions', { defaultValue: 'Actions' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {coinNetworks.map((cn) => {
                const coinSymbol = cn.coin?.symbol || '?';
                const networkSymbol = cn.network?.symbol || cn.network?.name || '?';
                return (
                  <tr key={cn.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <CoinImg symbol={coinSymbol} size={28} />
                            <div>
                              <span className="font-semibold">{coinSymbol}</span>
                              <small className="text-muted ml-1">/ {networkSymbol}</small>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <Badge color={cn.withdrawEnabled ? 'success' : 'secondary'} label>
                            {cn.withdrawEnabled ? 'ON' : 'OFF'}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <code className="text-body">{formatAmount(cn.minWithdrawAmount)}</code>
                        </td>
                        <td className="text-right">
                          <code className="text-body">{formatAmount(cn.maxWithdrawAmount)}</code>
                        </td>
                        <td className="text-right">
                          <code className="text-body">{formatAmount(cn.withdrawFeeBase)}</code>
                          {cn.withdrawFeeBase && cn.withdrawFeeBase !== '0' &&
                      <small className="text-muted block text-[0.7rem]">auto</small>
                      }
                        </td>
                        <td className="text-right">
                          <code className="text-body">{cn.withdrawFeePercent ? `${cn.withdrawFeePercent}%` : '-'}</code>
                        </td>
                        <td className="text-right">
                          <code className="text-body">{cn.dailyWithdrawLimitUsd ? `$${Number(cn.dailyWithdrawLimitUsd).toLocaleString()}` : '-'}</code>
                        </td>
                        <td className="text-center">
                          <Button
                        type="button"

                        title={t('actions.edit', { defaultValue: 'Edit' })}
                        onClick={() => openCnEditModal(cn)} variant="outline-primary" size="icon" className="bg-transparent hover:bg-primary-600 hover:text-white">
                        
                            <i className="bx bx-edit-alt"></i>
                          </Button>
                        </td>
                      </tr>);

              })}
                </tbody>
              </table>
          }
          </div>

          {/* Pagination */}
          {cnPagination.totalPages > 1 &&
        <div className="px-5 py-3 border-t border-surface-200 flex justify-between items-center">
              <small className="text-muted">
                {t('admin.withdrawalSettings.showing', { defaultValue: 'Showing {{from}}–{{to}} of {{total}}', from: (cnPagination.page - 1) * cnPagination.limit + 1, to: Math.min(cnPagination.page * cnPagination.limit, cnPagination.total), total: cnPagination.total })}
              </small>
              <nav>
                <ul className="pagination mb-0">
                  <li className={`inline-flex ${cnPagination.page <= 1 ? 'disabled' : ''}`}>
                    <button className="px-3 py-1.5 text-sm border border-surface-300 text-surface-600 hover:bg-surface-50 rounded" onClick={() => loadCoinNetworks(cnPagination.page - 1, cnSearch)}>
                      <i className="bx bx-chevron-left"></i>
                    </button>
                  </li>
                  {Array.from({ length: Math.min(cnPagination.totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(cnPagination.page - 2, cnPagination.totalPages - 4));
                const pageNum = start + i;
                if (pageNum > cnPagination.totalPages) return null;
                return (
                  <li key={pageNum} className={`inline-flex ${cnPagination.page === pageNum ? 'active' : ''}`}>
                        <button className="px-3 py-1.5 text-sm border border-surface-300 text-surface-600 hover:bg-surface-50 rounded" onClick={() => loadCoinNetworks(pageNum, cnSearch)}>
                          {pageNum}
                        </button>
                      </li>);

              })}
                  <li className={`inline-flex ${cnPagination.page >= cnPagination.totalPages ? 'disabled' : ''}`}>
                    <button className="px-3 py-1.5 text-sm border border-surface-300 text-surface-600 hover:bg-surface-50 rounded" onClick={() => loadCoinNetworks(cnPagination.page + 1, cnSearch)}>
                      <i className="bx bx-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
        }
        </Card>
      }

      {/* ── Modals ── */}
      {showMaxPendingModal &&
      <SettingModal
        title={t('admin.withdrawalSettings.editMaxPending', { defaultValue: 'Edit Max Pending' })}
        onClose={() => setShowMaxPendingModal(false)}
        onSave={handleSaveMaxPending}
        saving={savingMaxPending}
        t={t}>
        
          <Label>{t('admin.withdrawalSettings.editMaxPendingLabel', { defaultValue: 'Max pending withdrawals per user' })}</Label>
          <Input type="number" min="1" max="100" value={maxPendingForm} onChange={(e) => setMaxPendingForm(e.target.value)} />
          <small className="text-muted">{t('admin.withdrawalSettings.editMaxPendingHint', { defaultValue: 'Recommended: 3–10' })}</small>
        </SettingModal>
      }
      {showBufferModal &&
      <SettingModal
        title={t('admin.withdrawalSettings.editBuffer', { defaultValue: 'Edit Buffer Multiplier' })}
        onClose={() => setShowBufferModal(false)}
        onSave={handleSaveBuffer}
        saving={savingBuffer}
        t={t}>
        
          <Label>{t('admin.withdrawalSettings.editBufferLabel', { defaultValue: 'Buffer multiplier on gas cost' })}</Label>
          <Input type="number" min="1" max="5" step="0.1" value={bufferForm} onChange={(e) => setBufferForm(e.target.value)} />
          <small className="text-muted">{t('admin.withdrawalSettings.editBufferHint', { defaultValue: '1.0 = no buffer, 1.2 = 20% safety margin, 1.5 = 50% buffer' })}</small>
        </SettingModal>
      }
      {showAlertModal &&
      <SettingModal
        title={t('admin.withdrawalSettings.editAlert', { defaultValue: 'Edit Alert Threshold' })}
        onClose={() => setShowAlertModal(false)}
        onSave={handleSaveAlert}
        saving={savingAlert}
        t={t}>
        
          <Label>{t('admin.withdrawalSettings.editAlertLabel', { defaultValue: 'Alert when fee changes by more than (decimal)' })}</Label>
          <Input type="number" min="0.01" max="1" step="0.01" value={alertForm} onChange={(e) => setAlertForm(e.target.value)} />
          <small className="text-muted">{t('admin.withdrawalSettings.editAlertHint', { defaultValue: '0.1 = 10%, 0.2 = 20%, 0.5 = 50%' })}</small>
        </SettingModal>
      }

      {/* Coin-Network Edit Modal */}
      {editCn &&
      <CoinNetworkEditModal
        cn={editCn}
        form={cnForm}
        setForm={setCnForm}
        onClose={() => setEditCn(null)}
        onSave={handleSaveCn}
        saving={savingCn}
        t={t} />

      }
    </div>);

}

/* ── Helper Components ── */

function StatusCard({ icon, color, label, value, sub, active }) {
  return (
    <div className="sm:col-span-6 xl:col-span-3">
      <Card className="h-full">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="avatar avatar-sm shrink-0 w-10.5 h-[42px]">
              <AvatarInitial className={bgLabelClass(color)}>
                <i className={`bx ${icon} text-xl`}></i>
              </AvatarInitial>
            </div>
            <div className="flex flex-col">
              <small className="text-muted uppercase font-semibold text-[0.7rem] tracking-[0.5px]">
                {label}
              </small>
              <div className="flex items-center gap-2">
                <h5 className="mb-0 font-bold text-[1.1rem]">{value}</h5>
                {active !== undefined &&
                <Badge color={active ? 'success' : 'secondary'} label className="text-[0.65rem]">
                    {active ? 'ACTIVE' : 'OFF'}
                  </Badge>
                }
              </div>
              {sub && <small className="text-muted text-xs">{sub}</small>}
            </div>
          </div>
        </div>
      </Card>
    </div>);

}

function CoinNetworkEditModal({ cn, form, setForm, onClose, onSave, saving, t }) {
  const coinSymbol = cn.coin?.symbol || '?';
  const networkSymbol = cn.network?.symbol || cn.network?.name || '?';

  // Stable ref for onClose to avoid listener churn from inline arrow
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Escape key handler
  useEffect(() => {
    const handler = (e) => {if (e.key === 'Escape' && !saving) onCloseRef.current();};
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [saving]);

  // Filter: allow only digits and one decimal point
  function handleAmountChange(field, value) {
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  }

  // Filter: allow only digits, one decimal point, max 2 decimal places
  function handleUsdChange(field, value) {
    if (value === '' || /^[0-9]*\.?[0-9]{0,2}$/.test(value)) {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center block" tabIndex="-1">
        <div className="w-full max-w-lg mx-4 max-w-2xl">
          <div className="bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-200">
              <h5 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
                <CoinImg symbol={coinSymbol} size={24} />
                {t('admin.withdrawalSettings.editCnTitle', { defaultValue: 'Edit Withdrawal — {{coin}} / {{network}}', coin: coinSymbol, network: networkSymbol })}
              </h5>
              <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose} disabled={saving}></button>
            </div>
            <div className="p-5">
              {/* Withdraw Enabled Toggle */}
              <div className="flex items-center justify-between mb-4 p-3 rounded bg-surface-100">
                <div>
                  <span className="font-semibold">{t('admin.withdrawalSettings.withdrawEnabled', { defaultValue: 'Withdraw Enabled' })}</span>
                  <br />
                  <small className="text-muted">{t('admin.withdrawalSettings.withdrawEnabledDesc', { defaultValue: 'Allow users to withdraw this coin on this network' })}</small>
                </div>
                <div className="flex items-center gap-2 relative inline-flex items-center mb-0">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    checked={form.withdrawEnabled}
                    onChange={(e) => updateField('withdrawEnabled', e.target.checked)} />

                  
                </div>
              </div>

              <div className="grid grid-cols-12 gap-x-6 gap-3">
                {/* Min Withdraw */}
                <div className="md:col-span-6">
                  <Label>{t('admin.withdrawalSettings.minWithdraw', { defaultValue: 'Min Withdraw Amount' })}</Label>
                  <Input
                    type="text"

                    placeholder="0.001"
                    value={form.minWithdrawAmount}
                    onChange={(e) => handleAmountChange('minWithdrawAmount', e.target.value)} />
                  
                </div>

                {/* Max Withdraw */}
                <div className="md:col-span-6">
                  <Label>{t('admin.withdrawalSettings.maxWithdraw', { defaultValue: 'Max Withdraw Amount' })}</Label>
                  <Input
                    type="text"

                    placeholder="1000"
                    value={form.maxWithdrawAmount}
                    onChange={(e) => handleAmountChange('maxWithdrawAmount', e.target.value)} />
                  
                </div>

                {/* Fee Base (read-only) */}
                <div className="md:col-span-6">
                  <Label>
                    {t('admin.withdrawalSettings.feeBase', { defaultValue: 'Fee Base' })}
                    <Badge className="bg-cyan-50 text-cyan-700 ml-2 text-[0.65rem]">{t('admin.withdrawalSettings.autoCalculated', { defaultValue: 'Auto-calculated' })}</Badge>
                  </Label>
                  <Input
                    type="text"

                    value={cn.withdrawFeeBase || '-'}
                    disabled
                    readOnly />
                  
                  <small className="text-muted">{t('admin.withdrawalSettings.feeBaseHint', { defaultValue: 'Managed by Base Fee Auto-Update' })}</small>
                </div>

                {/* Fee Percent */}
                <div className="md:col-span-6">
                  <Label>{t('admin.withdrawalSettings.feePercent', { defaultValue: 'Fee Percent (%)' })}</Label>
                  <Input
                    type="text"

                    placeholder="1.5"
                    value={form.withdrawFeePercent}
                    onChange={(e) => handleAmountChange('withdrawFeePercent', e.target.value)} />
                  
                  <small className="text-muted">{t('admin.withdrawalSettings.feePercentHint', { defaultValue: 'Platform fee charged on withdrawal amount' })}</small>
                </div>

                {/* Daily Limit USD */}
                <div className="md:col-span-6">
                  <Label>{t('admin.withdrawalSettings.dailyLimitUsd', { defaultValue: 'Daily Withdraw Limit (USD)' })}</Label>
                  <Input
                    type="text"

                    placeholder="10000"
                    value={form.dailyWithdrawLimitUsd}
                    onChange={(e) => handleUsdChange('dailyWithdrawLimitUsd', e.target.value)} />
                  
                  <small className="text-muted">{t('admin.withdrawalSettings.dailyLimitHint', { defaultValue: 'Max USD value per user per day (empty = no limit)' })}</small>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
              <Button type="button" onClick={onClose} disabled={saving} className="bg-surface-200 text-surface-700 hover:bg-surface-300">
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button type="button" onClick={onSave} disabled={saving}>
                {saving ?
                <><Spinner className="w-4 h-4 mr-2" />{t('actions.saving', { defaultValue: 'Saving...' })}</> :

                <><i className="bx bx-save mr-1"></i>{t('actions.save', { defaultValue: 'Save' })}</>
                }
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>);

}

function SettingModal({ title, onClose, onSave, saving, children, t }) {
  // Stable ref for onClose to avoid listener churn from inline arrow
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Escape key handler
  useEffect(() => {
    const handler = (e) => {if (e.key === 'Escape' && !saving) onCloseRef.current();};
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [saving]);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center block" tabIndex="-1">
        <div className="w-full max-w-lg mx-4">
          <div className="bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-200">
              <h5 className="text-lg font-semibold text-surface-800">{title}</h5>
              <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose} disabled={saving}></button>
            </div>
            <div className="p-5">{children}</div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
              <Button type="button" onClick={onClose} disabled={saving} className="bg-surface-200 text-surface-700 hover:bg-surface-300">
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button type="button" onClick={onSave} disabled={saving}>
                {saving ?
                <><Spinner className="w-4 h-4 mr-2" />{t('actions.saving', { defaultValue: 'Saving...' })}</> :

                <><i className="bx bx-save mr-1"></i>{t('actions.save', { defaultValue: 'Save' })}</>
                }
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>);

}

function formatAmount(val) {
  if (val == null || val === '') return '-';
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  // Avoid scientific notation for very small numbers
  if (Math.abs(num) < 1e-6 && num !== 0) return val;
  return num.toLocaleString('en-US', { maximumFractionDigits: 18, useGrouping: false });
}