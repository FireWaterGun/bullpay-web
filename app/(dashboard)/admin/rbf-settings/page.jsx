'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useToast } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { getSettings, upsertSetting } from '@/lib/api/admin';
import { logger } from '@/lib/utils/logger';
import { Spinner } from '@/components/ui'
import RbfGlobalTab from '@/components/admin/rbf-settings/RbfGlobalTab';
import RbfNetworkTab from '@/components/admin/rbf-settings/RbfNetworkTab';
import RbfEditModal from '@/components/admin/rbf-settings/RbfEditModal';

// ─── Constants ───────────────────────────────────────────────

const TABS = [
{ key: 'global', icon: 'bx-globe', labelKey: 'admin.rbfSettings.tabGlobal', defaultLabel: 'Global' },
{ key: 'network', icon: 'bx-network-chart', labelKey: 'admin.rbfSettings.tabNetwork', defaultLabel: 'Per-Network' }];

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
  }, [token, t, toast]);

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
          <p className="text-surface-500 mb-0">
            {t('admin.rbfSettings.subtitle', { defaultValue: 'Configure Replace-by-Fee behavior for stuck transactions across all EVM networks' })}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <ul className="flex border-b border-surface-200 gap-1" role="tablist">
          {TABS.map((tab) =>
          <li key={tab.key} role="presentation">
              <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === tab.key ? 'text-primary-600 border-primary-600' : 'text-surface-500 hover:text-surface-700 border-transparent hover:border-surface-300'}`}
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
          {activeTab === 'global' && <RbfGlobalTab t={t} getVal={getVal} openGlobalEdit={openGlobalEdit} />}
          {activeTab === 'network' && <RbfNetworkTab t={t} getVal={getVal} openNetworkEdit={openNetworkEdit} />}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <RbfEditModal
          t={t}
          editModal={editModal}
          editForm={editForm}
          setEditForm={setEditForm}
          formErrors={formErrors}
          updateField={updateField}
          saving={saving}
          onClose={() => setEditModal(null)}
          onSave={handleSave}
        />
      )}
    </div>);

}
