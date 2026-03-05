'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useToast } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { getSettings, upsertSetting } from '@/lib/api/admin';
import { logger } from '@/lib/utils/logger';
import { Alert, Badge, Button, Card, Input, Label, Select, Spinner } from '../../../../components/ui';

// ─── Constants ───────────────────────────────────────────────

const TABS = [
{ key: 'global', icon: 'bx-globe', labelKey: 'admin.rbfSettings.tabGlobal', defaultLabel: 'Global' },
{ key: 'network', icon: 'bx-network-chart', labelKey: 'admin.rbfSettings.tabNetwork', defaultLabel: 'Per-Network' }];


const NETWORKS = [
{ key: 'eth', name: 'Ethereum', symbol: 'ETH' },
{ key: 'bsc', name: 'BNB Smart Chain', symbol: 'BSC' },
{ key: 'pol', name: 'Polygon', symbol: 'POL' },
{ key: 'arbitrum', name: 'Arbitrum', symbol: 'ARBITRUM' },
{ key: 'optimism', name: 'Optimism', symbol: 'OPTIMISM' },
{ key: 'base', name: 'Base', symbol: 'BASE' },
{ key: 'avax', name: 'Avalanche', symbol: 'AVAX' }];


// ─── Formatting Helpers ──────────────────────────────────────

function formatMs(v) {
  const ms = Number(v);
  if (isNaN(ms) || v === '' || v === null || v === undefined || v === '—') return '—';
  if (ms >= 3600_000) {
    const h = ms / 3600_000;
    return h % 1 === 0 ? `${h}h` : `${(ms / 60_000).toFixed(0)}m`;
  }
  return `${(ms / 60_000).toFixed(0)}m`;
}

function formatPercent(v) {
  if (v === undefined || v === '' || v === null || v === '—') return '—';
  return `${v}%`;
}

function formatRatio(v) {
  const n = Number(v);
  if (isNaN(n) || v === '' || v === null || v === undefined) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function formatUsd(v) {
  if (v === undefined || v === '' || v === null || v === '—') return '—';
  return `$${v}`;
}

// ─── Component ───────────────────────────────────────────────

export default function RbfSettingsPage() {
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('global');
  const [loading, setLoading] = useState(true);
  const [settingsMap, setSettingsMap] = useState({});
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Escape key to close modal (blocked during save)
  useEffect(() => {
    if (!editModal) return;
    const handler = (e) => {if (e.key === 'Escape' && !saving) setEditModal(null);};
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [editModal, saving]);

  // ─── Data Loading ────────────────────────────────────────

  const loadSettings = useCallback(async () => {
    if (!token) return;
    try {
      const rbfRes = await getSettings(token, { category: 'rbf', limit: 100 });
      const map = {};
      for (const item of rbfRes?.items || []) {
        const key = item.keyName || item.key_name;
        map[key] = item.value ?? item.defaultValue ?? item.default_value ?? '';
      }
      setSettingsMap(map);
    } catch (error) {
      logger.error('Failed to load RBF settings:', error);
      toast.error(t('admin.rbfSettings.loadError', { defaultValue: 'Failed to load RBF settings' }));
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadSettings();
      setLoading(false);
    }
    init();
  }, [loadSettings]);

  // ─── Helpers ─────────────────────────────────────────────

  function getVal(key, fallback = '—') {
    const v = settingsMap[key];
    return v !== undefined && v !== '' ? v : fallback;
  }

  function updateField(field, value) {
    setEditForm((f) => ({ ...f, [field]: value }));
    setFormErrors((e) => {
      if (!e[field]) return e;
      const next = { ...e };
      delete next[field];
      return next;
    });
  }

  function validateNumber(value, { min, max, integer, fieldLabel } = {}) {
    if (value === '' || value === undefined) return null;
    const n = Number(value);
    if (isNaN(n) || value.toString().trim() === '') return t('admin.rbfSettings.errNotANumber', { defaultValue: '{{field}} must be a valid number', field: fieldLabel || 'Value' });
    if (integer && !Number.isInteger(n)) return t('admin.rbfSettings.errMustBeInteger', { defaultValue: '{{field}} must be an integer', field: fieldLabel || 'Value' });
    if (min !== undefined && n < min) return t('admin.rbfSettings.errMin', { defaultValue: '{{field}} must be at least {{min}}', field: fieldLabel || 'Value', min });
    if (max !== undefined && n > max) return t('admin.rbfSettings.errMax', { defaultValue: '{{field}} cannot exceed {{max}}', field: fieldLabel || 'Value', max });
    return null;
  }

  // ─── Open Edit Modals ───────────────────────────────────

  function openGlobalEdit(group) {
    let form = {};
    if (group === 'droppedDetection') {
      form = {
        minNotFoundCount: getVal('rbf.dropped_detection.min_not_found_count', ''),
        minNotFoundDuration: getVal('rbf.dropped_detection.min_not_found_duration', '')
      };
    } else if (group === 'rateLimiting') {
      form = {
        maxRbfPerHour: getVal('rbf.rate_limiting.max_rbf_per_hour', ''),
        maxRbfPerAddress: getVal('rbf.rate_limiting.max_rbf_per_address', '')
      };
    } else if (group === 'safety') {
      form = {
        maxReplacementsPerTx: getVal('rbf.safety.max_replacements_per_tx', '')
      };
    }
    setEditForm(form);
    setFormErrors({});
    setEditModal({ tab: 'global', group });
  }

  function openNetworkEdit(network) {
    const net = network.key;
    setEditForm({
      enabled: getVal(`rbf.${net}.enabled`, ''),
      minPendingDuration: getVal(`rbf.${net}.min_pending_duration`, ''),
      maxPendingDuration: getVal(`rbf.${net}.max_pending_duration`, ''),
      gasBumpPercent: getVal(`rbf.${net}.gas_bump_percent`, ''),
      minTimeBetweenReplaces: getVal(`rbf.${net}.min_time_between_replaces`, ''),
      minAmountUsd: getVal(`rbf.${net}.min_amount_usd`, ''),
      maxCostRatio: getVal(`rbf.${net}.max_cost_ratio`, ''),
      maxCostUsd: getVal(`rbf.${net}.max_cost_usd`, '')
    });
    setFormErrors({});
    setEditModal({ tab: 'network', network });
  }

  // ─── Save Handlers ──────────────────────────────────────

  async function saveSetting(keyName, value) {
    await upsertSetting(token, { keyName, value: String(value) });
  }

  async function handleSaveGlobal() {
    const { group } = editModal;

    // Validate
    const errors = {};
    if (group === 'droppedDetection') {
      const e1 = validateNumber(editForm.minNotFoundCount, { min: 1, integer: true, fieldLabel: 'Min Not-Found Checks' });
      if (e1) errors.minNotFoundCount = e1;
      const e2 = validateNumber(editForm.minNotFoundDuration, { min: 0, integer: true, fieldLabel: 'Min Not-Found Duration' });
      if (e2) errors.minNotFoundDuration = e2;
    } else if (group === 'rateLimiting') {
      const e1 = validateNumber(editForm.maxRbfPerHour, { min: 1, integer: true, fieldLabel: 'Max RBF Per Hour' });
      if (e1) errors.maxRbfPerHour = e1;
      const e2 = validateNumber(editForm.maxRbfPerAddress, { min: 1, integer: true, fieldLabel: 'Max RBF Per Address' });
      if (e2) errors.maxRbfPerAddress = e2;
    } else if (group === 'safety') {
      const e1 = validateNumber(editForm.maxReplacementsPerTx, { min: 1, integer: true, fieldLabel: 'Max Replacements' });
      if (e1) errors.maxReplacementsPerTx = e1;
    }
    if (Object.keys(errors).length > 0) {setFormErrors(errors);return;}

    try {
      setSaving(true);
      const updates = [];
      const mapUpdates = {};

      if (group === 'droppedDetection') {
        const keyMap = {
          minNotFoundCount: 'rbf.dropped_detection.min_not_found_count',
          minNotFoundDuration: 'rbf.dropped_detection.min_not_found_duration'
        };
        for (const [formKey, dbKey] of Object.entries(keyMap)) {
          const val = editForm[formKey];
          if (val !== '') {
            updates.push(saveSetting(dbKey, val));
            mapUpdates[dbKey] = String(val);
          }
        }
      } else if (group === 'rateLimiting') {
        const keyMap = {
          maxRbfPerHour: 'rbf.rate_limiting.max_rbf_per_hour',
          maxRbfPerAddress: 'rbf.rate_limiting.max_rbf_per_address'
        };
        for (const [formKey, dbKey] of Object.entries(keyMap)) {
          const val = editForm[formKey];
          if (val !== '') {
            updates.push(saveSetting(dbKey, val));
            mapUpdates[dbKey] = String(val);
          }
        }
      } else if (group === 'safety') {
        const val = editForm.maxReplacementsPerTx;
        if (val !== '') {
          const dbKey = 'rbf.safety.max_replacements_per_tx';
          updates.push(saveSetting(dbKey, val));
          mapUpdates[dbKey] = String(val);
        }
      }

      if (updates.length === 0) return;
      await Promise.all(updates);
      setSettingsMap((prev) => ({ ...prev, ...mapUpdates }));
      setEditModal(null);
      toast.success(t('admin.rbfSettings.saveSuccess', { defaultValue: 'Settings saved successfully' }));
    } catch (error) {
      toast.error(error?.message || t('admin.rbfSettings.saveError', { defaultValue: 'Failed to save settings' }));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNetwork() {
    const net = editModal.network.key;

    // Validate
    const errors = {};
    const e1 = validateNumber(editForm.gasBumpPercent, { min: 1, integer: true, fieldLabel: 'Gas Bump %' });
    if (e1) errors.gasBumpPercent = e1;
    const e2 = validateNumber(editForm.minPendingDuration, { min: 0, integer: true, fieldLabel: 'Min Pending' });
    if (e2) errors.minPendingDuration = e2;
    const e3 = validateNumber(editForm.maxPendingDuration, { min: 0, integer: true, fieldLabel: 'Max Pending' });
    if (e3) errors.maxPendingDuration = e3;
    const e4 = validateNumber(editForm.minTimeBetweenReplaces, { min: 0, integer: true, fieldLabel: 'Replace Interval' });
    if (e4) errors.minTimeBetweenReplaces = e4;
    const e5 = validateNumber(editForm.minAmountUsd, { min: 0, fieldLabel: 'Min Amount' });
    if (e5) errors.minAmountUsd = e5;
    const e6 = validateNumber(editForm.maxCostRatio, { min: 0, max: 1, fieldLabel: 'Max Cost Ratio' });
    if (e6) errors.maxCostRatio = e6;
    const e7 = validateNumber(editForm.maxCostUsd, { min: 0, fieldLabel: 'Max Cost' });
    if (e7) errors.maxCostUsd = e7;
    if (Object.keys(errors).length > 0) {setFormErrors(errors);return;}

    try {
      setSaving(true);
      const updates = [];
      const mapUpdates = {};

      const keyMap = {
        enabled: `rbf.${net}.enabled`,
        minPendingDuration: `rbf.${net}.min_pending_duration`,
        maxPendingDuration: `rbf.${net}.max_pending_duration`,
        gasBumpPercent: `rbf.${net}.gas_bump_percent`,
        minTimeBetweenReplaces: `rbf.${net}.min_time_between_replaces`,
        minAmountUsd: `rbf.${net}.min_amount_usd`,
        maxCostRatio: `rbf.${net}.max_cost_ratio`,
        maxCostUsd: `rbf.${net}.max_cost_usd`
      };

      for (const [formKey, dbKey] of Object.entries(keyMap)) {
        const val = editForm[formKey];
        if (val !== '') {
          updates.push(saveSetting(dbKey, val));
          mapUpdates[dbKey] = String(val);
        }
      }

      if (updates.length === 0) return;
      await Promise.all(updates);
      setSettingsMap((prev) => ({ ...prev, ...mapUpdates }));
      setEditModal(null);
      toast.success(t('admin.rbfSettings.saveSuccess', { defaultValue: 'Settings saved successfully' }));
    } catch (error) {
      toast.error(error?.message || t('admin.rbfSettings.saveError', { defaultValue: 'Failed to save settings' }));
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (!editModal) return;
    if (editModal.tab === 'global') return handleSaveGlobal();
    if (editModal.tab === 'network') return handleSaveNetwork();
  }

  // ─── Render: Loading ─────────────────────────────────────

  if (loading) {
    return (
      <div className="grow py-6">
        <div className="flex justify-center items-center py-5">
          <Spinner role="status" className="text-primary" />

          
        </div>
      </div>);

  }

  // ─── Render: Page ────────────────────────────────────────

  return (
    <div className="grow py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bx bx-refresh mr-2 text-primary"></i>
            {t('admin.rbfSettings.title', { defaultValue: 'RBF Settings' })}
          </h4>
          <p className="text-muted mb-0">
            {t('admin.rbfSettings.subtitle', { defaultValue: 'Configure Replace-by-Fee behavior for stuck transactions across all EVM networks' })}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="">
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

        <div className="border border-t-0 rounded-b p-4">
          {activeTab === 'global' && renderGlobalTab()}
          {activeTab === 'network' && renderNetworkTab()}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && renderEditModal()}
    </div>);


  // ─── Tab: Global ─────────────────────────────────────────

  function renderGlobalTab() {
    return (
      <>
        <Alert variant="primary" className="mb-4">
          <i className="bx bx-info-circle mr-1"></i>
          {t('admin.rbfSettings.globalInfo', {
            defaultValue: 'Global RBF settings apply across all networks. These control dropped transaction detection, system-wide rate limiting, and safety limits.'
          })}
        </Alert>

        {/* Dropped Detection */}
        <Card className="mb-3">
          <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
            <div>
              <h6 className="mb-0">
                <i className="bx bx-search-alt mr-1 text-warning"></i>
                {t('admin.rbfSettings.droppedDetection', { defaultValue: 'Dropped Transaction Detection' })}
              </h6>
              <small className="text-muted">
                {t('admin.rbfSettings.droppedDetectionDesc', { defaultValue: 'When a transaction disappears from the mempool for too long, it is considered dropped' })}
              </small>
            </div>
            <Button

              onClick={() => openGlobalEdit('droppedDetection')}
              title={t('admin.rbfSettings.edit', { defaultValue: 'Edit' })} size="sm" className="text-secondary">
              
              <i className="bx bx-edit text-[1rem]"></i>
            </Button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-12 gap-x-6 gap-4">
              <div className="md:col-span-6">
                <div className="text-muted text-sm">{t('admin.rbfSettings.minNotFoundCount', { defaultValue: 'Min Not-Found Checks' })}</div>
                {(() => {
                  const val = getVal('rbf.dropped_detection.min_not_found_count');
                  return (
                    <>
                      <div className="font-semibold text-xl">{val}</div>
                      {val !== '—' && <div className="text-muted text-sm">{t('admin.rbfSettings.consecutiveChecks', { defaultValue: 'consecutive checks' })}</div>}
                    </>);

                })()}
              </div>
              <div className="md:col-span-6">
                <div className="text-muted text-sm">{t('admin.rbfSettings.minNotFoundDuration', { defaultValue: 'Min Not-Found Duration' })}</div>
                {(() => {
                  const raw = getVal('rbf.dropped_detection.min_not_found_duration', '');
                  const formatted = formatMs(raw);
                  return (
                    <>
                      <div className="font-semibold text-xl">{formatted}</div>
                      {formatted !== '—' && <div className="text-muted text-sm">{raw} ms</div>}
                    </>);

                })()}
              </div>
            </div>
          </div>
        </Card>

        {/* Rate Limiting */}
        <Card className="mb-3">
          <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
            <div>
              <h6 className="mb-0">
                <i className="bx bx-shield mr-1 text-info"></i>
                {t('admin.rbfSettings.rateLimiting', { defaultValue: 'Rate Limiting' })}
              </h6>
              <small className="text-muted">
                {t('admin.rbfSettings.rateLimitingDesc', { defaultValue: 'Prevents excessive RBF replacements that could waste gas fees' })}
              </small>
            </div>
            <Button

              onClick={() => openGlobalEdit('rateLimiting')}
              title={t('admin.rbfSettings.edit', { defaultValue: 'Edit' })} size="sm" className="text-secondary">
              
              <i className="bx bx-edit text-[1rem]"></i>
            </Button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-12 gap-x-6 gap-4">
              <div className="md:col-span-6">
                <div className="text-muted text-sm">{t('admin.rbfSettings.maxRbfPerHour', { defaultValue: 'Max RBF Per Hour' })}</div>
                {(() => {
                  const val = getVal('rbf.rate_limiting.max_rbf_per_hour');
                  return (
                    <>
                      <div className="font-semibold text-xl">{val}</div>
                      {val !== '—' && <div className="text-muted text-sm">{t('admin.rbfSettings.systemWide', { defaultValue: 'system-wide' })}</div>}
                    </>);

                })()}
              </div>
              <div className="md:col-span-6">
                <div className="text-muted text-sm">{t('admin.rbfSettings.maxRbfPerAddress', { defaultValue: 'Max RBF Per Address' })}</div>
                {(() => {
                  const val = getVal('rbf.rate_limiting.max_rbf_per_address');
                  return (
                    <>
                      <div className="font-semibold text-xl">{val}</div>
                      {val !== '—' && <div className="text-muted text-sm">{t('admin.rbfSettings.perAddress', { defaultValue: 'per address' })}</div>}
                    </>);

                })()}
              </div>
            </div>
          </div>
        </Card>

        {/* Safety */}
        <Card className="mb-3">
          <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
            <div>
              <h6 className="mb-0">
                <i className="bx bx-lock-alt mr-1 text-danger"></i>
                {t('admin.rbfSettings.safety', { defaultValue: 'Safety Limits' })}
              </h6>
              <small className="text-muted">
                {t('admin.rbfSettings.safetyDesc', { defaultValue: 'Hard limits to prevent runaway replacement loops' })}
              </small>
            </div>
            <Button

              onClick={() => openGlobalEdit('safety')}
              title={t('admin.rbfSettings.edit', { defaultValue: 'Edit' })} size="sm" className="text-secondary">
              
              <i className="bx bx-edit text-[1rem]"></i>
            </Button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-12 gap-x-6 gap-4">
              <div className="md:col-span-6">
                <div className="text-muted text-sm">{t('admin.rbfSettings.maxReplacementsPerTx', { defaultValue: 'Max Replacements Per Tx' })}</div>
                {(() => {
                  const val = getVal('rbf.safety.max_replacements_per_tx');
                  return (
                    <>
                      <div className="font-semibold text-xl">{val}</div>
                      {val !== '—' && <div className="text-muted text-sm">{t('admin.rbfSettings.perTransaction', { defaultValue: 'per transaction' })}</div>}
                    </>);

                })()}
              </div>
            </div>
          </div>
        </Card>
      </>);

  }

  // ─── Tab: Per-Network ────────────────────────────────────

  function renderNetworkTab() {
    return (
      <>
        <Alert variant="primary" className="mb-4">
          <i className="bx bx-info-circle mr-1"></i>
          {t('admin.rbfSettings.networkInfo', {
            defaultValue: 'Per-network RBF settings control gas bump percentages, timing thresholds, and cost limits. Each network has different optimal values based on block times and gas price volatility.'
          })}
        </Alert>

        <div className="overflow-x-auto">
          <table className="w-full border-t">
            <thead>
              <tr>
                <th>{t('admin.rbfSettings.colNetwork', { defaultValue: 'Network' })}</th>
                <th className="text-center">{t('admin.rbfSettings.colStatus', { defaultValue: 'Status' })}</th>
                <th className="text-center">{t('admin.rbfSettings.colGasBump', { defaultValue: 'Gas Bump' })}</th>
                <th className="text-center">{t('admin.rbfSettings.colMinPending', { defaultValue: 'Min Pending' })}</th>
                <th className="text-center">{t('admin.rbfSettings.colReplaceInterval', { defaultValue: 'Replace Interval' })}</th>
                <th className="text-center">{t('admin.rbfSettings.colMinAmount', { defaultValue: 'Min Amount' })}</th>
                <th className="text-center">{t('admin.rbfSettings.colMaxCost', { defaultValue: 'Max Cost' })}</th>
                <th className="text-right">{t('admin.rbfSettings.colActions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody>
              {NETWORKS.map((net) => {
                const enabled = getVal(`rbf.${net.key}.enabled`, '');
                const gasBump = getVal(`rbf.${net.key}.gas_bump_percent`, '');
                const minPending = getVal(`rbf.${net.key}.min_pending_duration`, '');
                const replaceInterval = getVal(`rbf.${net.key}.min_time_between_replaces`, '');
                const minAmount = getVal(`rbf.${net.key}.min_amount_usd`, '');
                const maxCost = getVal(`rbf.${net.key}.max_cost_usd`, '');

                return (
                  <tr key={net.key}>
                    <td>
                      <strong>{net.name}</strong>
                      <div className="text-muted text-sm">{net.symbol}</div>
                    </td>
                    <td className="text-center">
                      <Badge className={`rounded-full${enabled === 'true' ? 'bg-green-50 text-green-700' :
                      enabled === 'false' ? 'bg-red-50 text-red-700' :
                      'bg-surface-100 text-surface-600'}`}>
                        
                        {enabled === 'true' ?
                        t('admin.rbfSettings.enabled', { defaultValue: 'Enabled' }) :
                        enabled === 'false' ?
                        t('admin.rbfSettings.disabled', { defaultValue: 'Disabled' }) :
                        '—'}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <span className="font-semibold">{formatPercent(gasBump)}</span>
                    </td>
                    <td className="text-center">
                      <span className="font-semibold">{formatMs(minPending)}</span>
                    </td>
                    <td className="text-center">
                      <span className="font-semibold">{formatMs(replaceInterval)}</span>
                    </td>
                    <td className="text-center">
                      <span className="font-semibold">{formatUsd(minAmount)}</span>
                    </td>
                    <td className="text-center">
                      <span className="font-semibold">{formatUsd(maxCost)}</span>
                    </td>
                    <td className="text-right">
                      <Button

                        title={t('admin.rbfSettings.edit', { defaultValue: 'Edit' })}
                        onClick={() => openNetworkEdit(net)} size="sm" className="text-secondary">
                        
                        <i className="bx bx-edit text-[1rem]"></i>
                      </Button>
                    </td>
                  </tr>);

              })}
            </tbody>
          </table>
        </div>

        {/* Info card */}
        <Card className="bg-lighter mt-3">
          <div className="p-5 py-3">
            <h6 className="mb-2">
              <i className="bx bx-info-circle mr-1"></i>
              {t('admin.rbfSettings.howRbfWorks', { defaultValue: 'How RBF Works' })}
            </h6>
            <div className="text-muted text-sm">
              {t('admin.rbfSettings.howRbfWorksDesc', {
                defaultValue: 'When a transaction is stuck pending longer than Min Pending duration, the system bumps the gas price by the Gas Bump percentage and resubmits. Replacements are spaced by the Replace Interval. Cost guards (Min Amount, Max Cost Ratio, Max Cost USD) prevent uneconomical replacements.'
              })}
            </div>
          </div>
        </Card>
      </>);

  }

  // ─── Edit Modal ──────────────────────────────────────────

  function renderEditModal() {
    const { tab } = editModal;

    let modalTitle = '';
    let modalIcon = 'bx-cog';
    let modalSize = '';

    if (tab === 'global') {
      const groupTitles = {
        droppedDetection: t('admin.rbfSettings.editDroppedDetection', { defaultValue: 'Edit Dropped Detection' }),
        rateLimiting: t('admin.rbfSettings.editRateLimiting', { defaultValue: 'Edit Rate Limiting' }),
        safety: t('admin.rbfSettings.editSafety', { defaultValue: 'Edit Safety Limits' })
      };
      const groupIcons = {
        droppedDetection: 'bx-search-alt',
        rateLimiting: 'bx-shield',
        safety: 'bx-lock-alt'
      };
      modalTitle = groupTitles[editModal.group];
      modalIcon = groupIcons[editModal.group];
    } else {
      modalTitle = t('admin.rbfSettings.editNetwork', { defaultValue: 'Edit RBF — {{network}}', network: editModal.network.name });
      modalIcon = 'bx-network-chart';
      modalSize = 'max-w-[800px]';
    }

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center block bg-black/50"
        tabIndex="-1"

        onClick={(e) => {if (e.target === e.currentTarget && !saving) setEditModal(null);}}>
        
        <div className={`w-full max-w-lg mx-4 ${modalSize}`}>
          <div className="bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-200">
              <h5 className="text-lg font-semibold text-surface-800">
                <i className={`bx ${modalIcon} mr-2`}></i>
                {modalTitle}
              </h5>
              <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={() => setEditModal(null)} disabled={saving}></button>
            </div>
            <div className="p-5">
              {tab === 'global' && renderGlobalForm()}
              {tab === 'network' && renderNetworkForm()}
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
              <Button onClick={() => setEditModal(null)} disabled={saving} variant="outline-secondary">
                {t('admin.rbfSettings.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Spinner role="status" className="w-4 h-4 mr-1" />}
                {t('admin.rbfSettings.save', { defaultValue: 'Save Changes' })}
              </Button>
            </div>
          </div>
        </div>
      </div>);

  }

  // ─── Modal Forms ─────────────────────────────────────────

  function renderGlobalForm() {
    const { group } = editModal;

    if (group === 'droppedDetection') {
      return (
        <>
          <div className="mb-3">
            <Label className="font-semibold">
              {t('admin.rbfSettings.minNotFoundCount', { defaultValue: 'Min Not-Found Checks' })}
            </Label>
            <Input
              type="text"
              inputMode="numeric"

              value={editForm.minNotFoundCount ?? ''}
              onChange={(e) => updateField('minNotFoundCount', e.target.value)} error={formErrors.minNotFoundCount} />
            
            {formErrors.minNotFoundCount && <div className="text-xs text-danger-500 mt-1">{formErrors.minNotFoundCount}</div>}
            <div className="text-xs text-surface-500 mt-1">
              {t('admin.rbfSettings.minNotFoundCountDesc', {
                defaultValue: 'Number of consecutive checks where transaction is not found before considering it dropped.'
              })}
            </div>
          </div>
          <div className="mb-3">
            <Label className="font-semibold">
              {t('admin.rbfSettings.minNotFoundDuration', { defaultValue: 'Min Not-Found Duration' })}
            </Label>
            <div className="flex items-stretch">
              <Input
                type="text"
                inputMode="numeric"

                value={editForm.minNotFoundDuration ?? ''}
                onChange={(e) => updateField('minNotFoundDuration', e.target.value)} error={formErrors.minNotFoundDuration} />
              
              <span className="flex items-center px-3 bg-surface-100 border border-surface-300 text-surface-600 text-sm rounded-l-lg">ms</span>
            </div>
            {formErrors.minNotFoundDuration && <div className="text-xs text-danger-500 mt-1 block">{formErrors.minNotFoundDuration}</div>}
            <div className="text-xs text-surface-500 mt-1">
              {t('admin.rbfSettings.minNotFoundDurationDesc', {
                defaultValue: 'Minimum time (milliseconds) a transaction must be missing before considering it dropped.'
              })}
            </div>
            {editForm.minNotFoundDuration && !isNaN(Number(editForm.minNotFoundDuration)) &&
            <Alert variant="info" className="mt-2 mb-0 py-2">
                <i className="bx bx-time mr-1"></i>
                ≈ {formatMs(editForm.minNotFoundDuration)}
              </Alert>
            }
          </div>
        </>);

    }

    if (group === 'rateLimiting') {
      return (
        <>
          <div className="mb-3">
            <Label className="font-semibold">
              {t('admin.rbfSettings.maxRbfPerHour', { defaultValue: 'Max RBF Per Hour' })}
            </Label>
            <Input
              type="text"
              inputMode="numeric"

              value={editForm.maxRbfPerHour ?? ''}
              onChange={(e) => updateField('maxRbfPerHour', e.target.value)} error={formErrors.maxRbfPerHour} />
            
            {formErrors.maxRbfPerHour && <div className="text-xs text-danger-500 mt-1">{formErrors.maxRbfPerHour}</div>}
            <div className="text-xs text-surface-500 mt-1">
              {t('admin.rbfSettings.maxRbfPerHourDesc', {
                defaultValue: 'Maximum number of RBF replacement transactions the system can submit per hour (global).'
              })}
            </div>
          </div>
          <div className="mb-3">
            <Label className="font-semibold">
              {t('admin.rbfSettings.maxRbfPerAddress', { defaultValue: 'Max RBF Per Address' })}
            </Label>
            <Input
              type="text"
              inputMode="numeric"

              value={editForm.maxRbfPerAddress ?? ''}
              onChange={(e) => updateField('maxRbfPerAddress', e.target.value)} error={formErrors.maxRbfPerAddress} />
            
            {formErrors.maxRbfPerAddress && <div className="text-xs text-danger-500 mt-1">{formErrors.maxRbfPerAddress}</div>}
            <div className="text-xs text-surface-500 mt-1">
              {t('admin.rbfSettings.maxRbfPerAddressDesc', {
                defaultValue: 'Maximum number of RBF replacement transactions per wallet address.'
              })}
            </div>
          </div>
        </>);

    }

    if (group === 'safety') {
      return (
        <div className="mb-3">
          <Label className="font-semibold">
            {t('admin.rbfSettings.maxReplacementsPerTx', { defaultValue: 'Max Replacements Per Tx' })}
          </Label>
          <Input
            type="text"
            inputMode="numeric"

            value={editForm.maxReplacementsPerTx ?? ''}
            onChange={(e) => updateField('maxReplacementsPerTx', e.target.value)} error={formErrors.maxReplacementsPerTx} />
          
          {formErrors.maxReplacementsPerTx && <div className="text-xs text-danger-500 mt-1">{formErrors.maxReplacementsPerTx}</div>}
          <div className="text-xs text-surface-500 mt-1">
            {t('admin.rbfSettings.maxReplacementsPerTxDesc', {
              defaultValue: 'Maximum number of times a single transaction can be replaced. Prevents infinite replacement loops.'
            })}
          </div>
        </div>);

    }

    return null;
  }

  function renderNetworkForm() {
    const { network } = editModal;

    return (
      <>
        {/* Network badge */}
        <div className="mb-4">
          <span className="text-muted">{network.symbol}</span>
        </div>

        {/* Enabled toggle */}
        <div className="mb-4">
          <Label className="font-semibold">
            {t('admin.rbfSettings.enabledLabel', { defaultValue: 'RBF Enabled' })}
          </Label>
          <Select

            value={editForm.enabled ?? ''}
            onChange={(e) => setEditForm((f) => ({ ...f, enabled: e.target.value }))}>
            
            {editForm.enabled === '' && <option value="" disabled>—</option>}
            <option value="true">{t('admin.rbfSettings.enabled', { defaultValue: 'Enabled' })}</option>
            <option value="false">{t('admin.rbfSettings.disabled', { defaultValue: 'Disabled' })}</option>
          </Select>
          <div className="text-xs text-surface-500 mt-1">
            {t('admin.rbfSettings.enabledDesc', { defaultValue: 'Enable or disable RBF for this network.' })}
          </div>
        </div>

        {/* Gas Bump */}
        <Card

          style={{ borderLeft: '3px solid var(--color-amber-500)' }} className="mb-3">
          
          <div className="p-5 py-3">
            <h6 className="mb-3 flex items-center text-warning">
              <i className="bx bx-trending-up mr-2"></i>
              {t('admin.rbfSettings.gasBumpSection', { defaultValue: 'Gas Price Bump' })}
            </h6>
            <Label className="text-sm text-muted mb-1">
              {t('admin.rbfSettings.gasBumpPercent', { defaultValue: 'Gas Bump Percent' })}
            </Label>
            <div className="flex items-stretch">
              <Input
                type="text"
                inputMode="numeric"

                value={editForm.gasBumpPercent ?? ''}
                onChange={(e) => updateField('gasBumpPercent', e.target.value)} error={formErrors.gasBumpPercent} />
              
              <span className="flex items-center px-3 bg-surface-100 border border-surface-300 text-surface-600 text-sm rounded-l-lg">%</span>
            </div>
            {formErrors.gasBumpPercent && <div className="text-xs text-danger-500 mt-1 block">{formErrors.gasBumpPercent}</div>}
            <div className="text-xs text-surface-500 mt-1">
              {t('admin.rbfSettings.gasBumpPercentDesc', { defaultValue: 'Percentage to increase gas price when submitting RBF replacement.' })}
            </div>
          </div>
        </Card>

        {/* Timing */}
        <Card

          style={{ borderLeft: '3px solid var(--color-cyan-500)' }} className="mb-3">
          
          <div className="p-5 py-3">
            <h6 className="mb-3 flex items-center text-info">
              <i className="bx bx-time mr-2"></i>
              {t('admin.rbfSettings.timingSection', { defaultValue: 'Timing Thresholds' })}
            </h6>
            <div className="grid grid-cols-12 gap-x-6 gap-3">
              <div className="md:col-span-4">
                <Label className="text-sm text-muted mb-1">
                  {t('admin.rbfSettings.minPendingDuration', { defaultValue: 'Min Pending Duration' })}
                </Label>
                <div className="flex items-stretch">
                  <Input
                    type="text"
                    inputMode="numeric"

                    value={editForm.minPendingDuration ?? ''}
                    onChange={(e) => updateField('minPendingDuration', e.target.value)} error={formErrors.minPendingDuration} />
                  
                  <span className="flex items-center px-3 bg-surface-100 border border-surface-300 text-surface-600 text-sm rounded-l-lg">ms</span>
                </div>
                {formErrors.minPendingDuration && <div className="text-xs text-danger-500 mt-1 block">{formErrors.minPendingDuration}</div>}
                {editForm.minPendingDuration && !isNaN(Number(editForm.minPendingDuration)) &&
                <small className="text-muted">≈ {formatMs(editForm.minPendingDuration)}</small>
                }
              </div>
              <div className="md:col-span-4">
                <Label className="text-sm text-muted mb-1">
                  {t('admin.rbfSettings.maxPendingDuration', { defaultValue: 'Max Pending Duration' })}
                </Label>
                <div className="flex items-stretch">
                  <Input
                    type="text"
                    inputMode="numeric"

                    value={editForm.maxPendingDuration ?? ''}
                    onChange={(e) => updateField('maxPendingDuration', e.target.value)} error={formErrors.maxPendingDuration} />
                  
                  <span className="flex items-center px-3 bg-surface-100 border border-surface-300 text-surface-600 text-sm rounded-l-lg">ms</span>
                </div>
                {formErrors.maxPendingDuration && <div className="text-xs text-danger-500 mt-1 block">{formErrors.maxPendingDuration}</div>}
                {editForm.maxPendingDuration && !isNaN(Number(editForm.maxPendingDuration)) &&
                <small className="text-muted">≈ {formatMs(editForm.maxPendingDuration)}</small>
                }
              </div>
              <div className="md:col-span-4">
                <Label className="text-sm text-muted mb-1">
                  {t('admin.rbfSettings.minTimeBetweenReplaces', { defaultValue: 'Min Replace Interval' })}
                </Label>
                <div className="flex items-stretch">
                  <Input
                    type="text"
                    inputMode="numeric"

                    value={editForm.minTimeBetweenReplaces ?? ''}
                    onChange={(e) => updateField('minTimeBetweenReplaces', e.target.value)} error={formErrors.minTimeBetweenReplaces} />
                  
                  <span className="flex items-center px-3 bg-surface-100 border border-surface-300 text-surface-600 text-sm rounded-l-lg">ms</span>
                </div>
                {formErrors.minTimeBetweenReplaces && <div className="text-xs text-danger-500 mt-1 block">{formErrors.minTimeBetweenReplaces}</div>}
                {editForm.minTimeBetweenReplaces && !isNaN(Number(editForm.minTimeBetweenReplaces)) &&
                <small className="text-muted">≈ {formatMs(editForm.minTimeBetweenReplaces)}</small>
                }
              </div>
            </div>
          </div>
        </Card>

        {/* Cost Limits */}
        <Card

          style={{ borderLeft: '3px solid var(--color-green-500)' }} className="mb-0">
          
          <div className="p-5 py-3">
            <h6 className="mb-3 flex items-center text-success">
              <i className="bx bx-dollar mr-2"></i>
              {t('admin.rbfSettings.costSection', { defaultValue: 'Cost Limits' })}
            </h6>
            <div className="grid grid-cols-12 gap-x-6 gap-3">
              <div className="md:col-span-4">
                <Label className="text-sm text-muted mb-1">
                  {t('admin.rbfSettings.minAmountUsd', { defaultValue: 'Min Amount (USD)' })}
                </Label>
                <div className="flex items-stretch">
                  <span className="flex items-center px-3 bg-surface-100 border border-surface-300 text-surface-600 text-sm rounded-l-lg">$</span>
                  <Input
                    type="text"
                    inputMode="decimal"

                    value={editForm.minAmountUsd ?? ''}
                    onChange={(e) => updateField('minAmountUsd', e.target.value)} error={formErrors.minAmountUsd} />
                  
                </div>
                {formErrors.minAmountUsd && <div className="text-xs text-danger-500 mt-1 block">{formErrors.minAmountUsd}</div>}
                <div className="text-xs text-surface-500 mt-1">
                  {t('admin.rbfSettings.minAmountUsdDesc', { defaultValue: 'Minimum transaction USD value to allow RBF.' })}
                </div>
              </div>
              <div className="md:col-span-4">
                <Label className="text-sm text-muted mb-1">
                  {t('admin.rbfSettings.maxCostRatio', { defaultValue: 'Max Cost Ratio' })}
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"

                  value={editForm.maxCostRatio ?? ''}
                  onChange={(e) => updateField('maxCostRatio', e.target.value)} error={formErrors.maxCostRatio} />
                
                {formErrors.maxCostRatio && <div className="text-xs text-danger-500 mt-1">{formErrors.maxCostRatio}</div>}
                <div className="text-xs text-surface-500 mt-1">
                  {t('admin.rbfSettings.maxCostRatioDesc', { defaultValue: 'Max gas cost as fraction of tx value (0.05 = 5%).' })}
                </div>
                {editForm.maxCostRatio && !isNaN(Number(editForm.maxCostRatio)) &&
                <small className="text-info">= {formatRatio(editForm.maxCostRatio)}</small>
                }
              </div>
              <div className="md:col-span-4">
                <Label className="text-sm text-muted mb-1">
                  {t('admin.rbfSettings.maxCostUsd', { defaultValue: 'Max Cost (USD)' })}
                </Label>
                <div className="flex items-stretch">
                  <span className="flex items-center px-3 bg-surface-100 border border-surface-300 text-surface-600 text-sm rounded-l-lg">$</span>
                  <Input
                    type="text"
                    inputMode="decimal"

                    value={editForm.maxCostUsd ?? ''}
                    onChange={(e) => updateField('maxCostUsd', e.target.value)} error={formErrors.maxCostUsd} />
                  
                </div>
                {formErrors.maxCostUsd && <div className="text-xs text-danger-500 mt-1 block">{formErrors.maxCostUsd}</div>}
                <div className="text-xs text-surface-500 mt-1">
                  {t('admin.rbfSettings.maxCostUsdDesc', { defaultValue: 'Maximum USD gas cost for a single RBF replacement.' })}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </>);

  }
}