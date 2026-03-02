'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import { getSweepSettings, updateSweepSetting } from '@/lib/api/admin'
import { useToast } from '@/app/providers'
import SweepScanningSettings from '@/components/admin/SweepScanningSettings'
import SweepReconciliationSettings from '@/components/admin/SweepReconciliationSettings'
const ConfirmResetModal = dynamic(() => import('@/components/ConfirmResetModal'), { ssr: false })
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'

export default function Sweep() {
  const { t } = useTranslation()
  const { user, token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [settings, setSettings] = useState({})
  const [originalData, setOriginalData] = useState({}) // เก็บข้อมูลเดิมเพื่อเทียบ
  const [formData, setFormData] = useState({
    isEnabled: false,
    defaultThresholds: { minBalance: '', gasBuffer: '' },
    useDynamicGasEstimation: false,
    gasPriceAdjustment: { defaultMultiplier: '', byNetworkSymbol: {} },
    batchProcessingLimits: { maxPendingPerRun: '', maxDiscoverPerRun: '', maxUnlockPerRun: '' },
    staleTransactionChecker: { staleMinutes: '', maxPerRun: '', jitterMs: { min: '', max: '' } }
  })

  // เช็คว่ามีการเปลี่ยนแปลงหรือไม่
  const hasChanges = () => {
    if (!originalData || Object.keys(originalData).length === 0) return false
    
    if (formData.isEnabled !== originalData.isEnabled) return true
    if (JSON.stringify(formData.defaultThresholds) !== JSON.stringify(originalData.defaultThresholds)) return true
    if (formData.useDynamicGasEstimation !== originalData.useDynamicGasEstimation) return true
    if (JSON.stringify(formData.gasPriceAdjustment) !== JSON.stringify(originalData.gasPriceAdjustment)) return true
    if (JSON.stringify(formData.batchProcessingLimits) !== JSON.stringify(originalData.batchProcessingLimits)) return true
    if (JSON.stringify(formData.staleTransactionChecker) !== JSON.stringify(originalData.staleTransactionChecker)) return true
    
    return false
  }

  // นับจำนวนการเปลี่ยนแปลง
  const countChanges = () => {
    if (!originalData || Object.keys(originalData).length === 0) return 0
    
    let count = 0
    if (formData.isEnabled !== originalData.isEnabled) count++
    if (JSON.stringify(formData.defaultThresholds) !== JSON.stringify(originalData.defaultThresholds)) count++
    if (formData.useDynamicGasEstimation !== originalData.useDynamicGasEstimation) count++
    if (JSON.stringify(formData.gasPriceAdjustment) !== JSON.stringify(originalData.gasPriceAdjustment)) count++
    if (JSON.stringify(formData.batchProcessingLimits) !== JSON.stringify(originalData.batchProcessingLimits)) count++
    if (JSON.stringify(formData.staleTransactionChecker) !== JSON.stringify(originalData.staleTransactionChecker)) count++
    
    return count
  }

  // Fetch sweep settings
  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoadingData(true)
      const data = await getSweepSettings(token)
      
      // Parse settings from API response
      const settingsMap = {}
      data.forEach(setting => {
        const key = setting.keyName.replace('sweep.', '')
        settingsMap[key] = setting
      })
      
      setSettings(settingsMap)
      
      // Map to form data
      const initialData = {
        isEnabled: settingsMap.is_enabled?.parsedValue ?? false,
        defaultThresholds: settingsMap.default_thresholds?.parsedValue || { minBalance: 0.0001, gasBuffer: 0.00005 },
        useDynamicGasEstimation: settingsMap.use_dynamic_gas_estimation?.parsedValue ?? true,
        gasPriceAdjustment: settingsMap.gas_price_adjustment?.parsedValue || { defaultMultiplier: 1.2, byNetworkSymbol: {} },
        batchProcessingLimits: settingsMap.batch_processing_limits?.parsedValue || { maxPendingPerRun: 50, maxDiscoverPerRun: 10, maxUnlockPerRun: 100 },
        staleTransactionChecker: settingsMap.stale_transaction_checker?.parsedValue || { staleMinutes: 2, maxPerRun: 50, jitterMs: { min: 5000, max: 20000 } }
      }
      
      setFormData(initialData)
      setOriginalData(JSON.parse(JSON.stringify(initialData))) // Deep copy
    } catch (error) {
      logger.error('Failed to load sweep settings:', error)
      toast.error(t('admin.sweep.loadError', { defaultValue: 'Failed to load sweep settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      setLoading(true)
      
      const updates = []
      
      // เทียบและบันทึกเฉพาะที่เปลี่ยน
      if (formData.isEnabled !== originalData.isEnabled) {
        updates.push({ key: 'sweep.is_enabled', value: formData.isEnabled })
      }
      
      if (JSON.stringify(formData.defaultThresholds) !== JSON.stringify(originalData.defaultThresholds)) {
        updates.push({ key: 'sweep.default_thresholds', value: formData.defaultThresholds })
      }
      
      if (formData.useDynamicGasEstimation !== originalData.useDynamicGasEstimation) {
        updates.push({ key: 'sweep.use_dynamic_gas_estimation', value: formData.useDynamicGasEstimation })
      }
      
      if (JSON.stringify(formData.gasPriceAdjustment) !== JSON.stringify(originalData.gasPriceAdjustment)) {
        updates.push({ key: 'sweep.gas_price_adjustment', value: formData.gasPriceAdjustment })
      }
      
      if (JSON.stringify(formData.batchProcessingLimits) !== JSON.stringify(originalData.batchProcessingLimits)) {
        updates.push({ key: 'sweep.batch_processing_limits', value: formData.batchProcessingLimits })
      }
      
      if (JSON.stringify(formData.staleTransactionChecker) !== JSON.stringify(originalData.staleTransactionChecker)) {
        updates.push({ key: 'sweep.stale_transaction_checker', value: formData.staleTransactionChecker })
      }
      
      if (updates.length === 0) {
        toast.info(t('admin.sweep.noChanges', { defaultValue: 'No changes to save' }))
        return
      }
      
      // บันทึกเฉพาะที่เปลี่ยน
      await Promise.all(updates.map(u => updateSweepSetting(token, u.key, u.value)))
      
      // แสดงรายละเอียดการอัปเดต
      const updatedSettings = updates.map(u => {
        const keyName = u.key.replace('sweep.', '').replace(/_/g, ' ')
        return keyName.charAt(0).toUpperCase() + keyName.slice(1)
      }).join(', ')
      
      toast.success(
        `Updated ${updates.length} setting(s) successfully! - ${updatedSettings}`,
        5000
      )
      
      await loadSettings()
    } catch (error) {
      logger.error('Failed to save sweep settings:', error)
      toast.error(error?.message || t('admin.sweep.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  function handleNestedChange(field, nestedField, value) {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [nestedField]: value
      }
    }))
  }

  // Validate number input - max 20 digits
  function validateNumberInput(e) {
    const value = e.target.value
    // Remove leading zeros and limit to 20 digits (including decimal point and digits after)
    if (value.length > 20) {
      e.target.value = value.slice(0, 20)
    }
  }

  const [showResetConfirm, setShowResetConfirm] = useState(false)

  function handleReset() {
    setShowResetConfirm(true)
  }

  function confirmReset() {
    setShowResetConfirm(false)
    loadSettings()
  }

  if (loadingData) {
    return <PageSpinner />
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card mb-6">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">{t('admin.sweep.title', { defaultValue: 'Sweep Management' })}</h5>
                <p className="text-muted small mb-0 mt-1">
                  {t('admin.sweep.description', { defaultValue: 'Manage automatic wallet sweeping and consolidation' })}
                </p>
              </div>
            </div>
            <div className="card-body">
              {/* Sweep Settings Form */}
              <form onSubmit={handleSave}>
                <div className="row g-4">
                  {/* Section: Sweep Configuration */}
                  <div className="col-12">
                    <h6 className="text-primary mb-4">
                      {t('admin.sweep.warningTitle', { defaultValue: 'Sweep Configuration' })}
                    </h6>
                  </div>

                  {/* Enable Sweep */}
                  <div className="col-md-6">
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="enableSweep"
                        checked={formData.isEnabled}
                        onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="enableSweep">
                        {t('admin.sweep.enableSweep', { defaultValue: 'Enable Auto Sweep' })}
                      </label>
                    </div>
                    <small className="text-muted">
                      {t('admin.sweep.enableSweepHelp', { defaultValue: 'Automatically sweep funds above threshold' })}
                    </small>
                  </div>

                  {/* Dynamic Gas Estimation */}
                  <div className="col-md-6">
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="dynamicGas"
                        checked={formData.useDynamicGasEstimation}
                        onChange={(e) => handleInputChange('useDynamicGasEstimation', e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="dynamicGas">
                        {t('admin.sweep.dynamicGas', { defaultValue: 'Enable Dynamic Gas Estimation' })}
                      </label>
                    </div>
                    <small className="text-muted">
                      {t('admin.sweep.dynamicGasHelp', { defaultValue: 'Estimate gas dynamically from blockchain RPC' })}
                    </small>
                  </div>

                  {/* Min Balance (Threshold) */}
                  <div className="col-md-6 mt-4">
                    <label htmlFor="minBalance" className="form-label">
                      {t('admin.sweep.minBalance', { defaultValue: 'Min Balance (Threshold)' })}
                    </label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="minBalance"
                      placeholder="0.0001"
                      step="0.00001"
                      value={formData.defaultThresholds.minBalance || ''}
                      onChange={(e) => handleNestedChange('defaultThresholds', 'minBalance', parseFloat(e.target.value) || '')}
                      onInput={validateNumberInput}
                    />
                    <small className="text-muted">
                      {t('admin.sweep.thresholdHelp', { defaultValue: 'Minimum balance to trigger sweep' })}
                    </small>
                  </div>

                  {/* Gas Buffer */}
                  <div className="col-md-6 mt-4">
                    <label htmlFor="gasBuffer" className="form-label">
                      {t('admin.sweep.gasBuffer', { defaultValue: 'Gas Buffer' })}
                    </label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="gasBuffer"
                      placeholder="0.00005"
                      step="0.00001"
                      value={formData.defaultThresholds.gasBuffer || ''}
                      onChange={(e) => handleNestedChange('defaultThresholds', 'gasBuffer', parseFloat(e.target.value) || '')}
                      onInput={validateNumberInput}
                    />
                    <small className="text-muted">
                      {t('admin.sweep.gasBufferHelp', { defaultValue: 'Reserved amount for transaction fees' })}
                    </small>
                  </div>

                  {/* Gas Price Multiplier */}
                  <div className="col-md-6 mt-4">
                    <label htmlFor="headroom" className="form-label">
                      {t('admin.sweep.headroom', { defaultValue: 'Gas Price Multiplier' })}
                    </label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="headroom"
                      placeholder="1.2"
                      step="0.01"
                      value={formData.gasPriceAdjustment.defaultMultiplier || ''}
                      onChange={(e) => handleNestedChange('gasPriceAdjustment', 'defaultMultiplier', parseFloat(e.target.value) || '')}
                      onInput={validateNumberInput}
                    />
                    <small className="text-muted">
                      {t('admin.sweep.headroomHelp', { defaultValue: 'Multiplier to increase transaction priority' })}
                    </small>
                  </div>

                  <SweepScanningSettings
                    formData={formData}
                    handleNestedChange={handleNestedChange}
                    validateNumberInput={validateNumberInput}
                  />

                  <SweepReconciliationSettings
                    formData={formData}
                    setFormData={setFormData}
                    validateNumberInput={validateNumberInput}
                  />

                  {/* Action Buttons */}
                  <div className="col-12 mt-5">
                    <hr className="my-4" />
                    <div className="d-flex gap-2 justify-content-between align-items-center">
                  {hasChanges() && (
                    <div className="text-warning small">
                      <i className="bx bx-info-circle me-1"></i>
                      <span>
                        {t('admin.sweep.unsavedChanges', { defaultValue: 'You have unsaved changes' })}
                        {' '}({countChanges()})
                      </span>
                    </div>
                  )}
                  <div className="d-flex gap-2 ms-auto">
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary" 
                      onClick={handleReset}
                      disabled={!hasChanges() || loading}
                    >
                      <i className="bx bx-reset me-1"></i>
                      {t('actions.reset', { defaultValue: 'Reset' })}
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary position-relative" 
                      disabled={loading || !hasChanges()}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          {t('actions.saving', { defaultValue: 'Saving...' })}
                        </>
                      ) : (
                        <>
                          <i className="bx bx-save me-1"></i>
                          {t('actions.save', { defaultValue: 'Save' })}
                        </>
                      )}
                    </button>
                  </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <ConfirmResetModal
          title={t('actions.confirm', { defaultValue: 'Confirm' })}
          message={t('admin.sweep.resetConfirm', { defaultValue: 'Are you sure you want to reset all settings to their current saved values?' })}
          onConfirm={confirmReset}
          onClose={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  )
}
