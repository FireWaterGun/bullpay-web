'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

export default function SweepScanningSettings({ formData, handleNestedChange, validateNumberInput }) {
  const { t } = useAdminTranslation()

  return (
    <>
      <div className="col-12 mt-5">
        <hr className="my-4" />
        <h6 className="text-primary mb-4">
          {t('admin.sweep.scanningSettings', { defaultValue: 'Scanning Settings' })}
        </h6>
      </div>

      <div className="col-md-4">
        <label htmlFor="maxDiscoverPerRun" className="form-label">
          {t('admin.sweep.maxDiscoverPerRun', { defaultValue: 'Max Discover/Run' })}
        </label>
        <input
          type="number"
          className="form-control"
          id="maxDiscoverPerRun"
          placeholder="10"
          min="1"
          value={formData.batchProcessingLimits.maxDiscoverPerRun || ''}
          onChange={(e) => handleNestedChange('batchProcessingLimits', 'maxDiscoverPerRun', parseInt(e.target.value) || '')}
          onInput={validateNumberInput}
        />
        <small className="text-muted">
          {t('admin.sweep.maxDiscoverPerRunHelp', { defaultValue: 'Max wallets to discover' })}
        </small>
      </div>

      <div className="col-md-4">
        <label htmlFor="maxPendingPerRun" className="form-label">
          {t('admin.sweep.maxPendingPerRun', { defaultValue: 'Max Pending/Run' })}
        </label>
        <input
          type="number"
          className="form-control"
          id="maxPendingPerRun"
          placeholder="50"
          min="1"
          value={formData.batchProcessingLimits.maxPendingPerRun || ''}
          onChange={(e) => handleNestedChange('batchProcessingLimits', 'maxPendingPerRun', parseInt(e.target.value) || '')}
          onInput={validateNumberInput}
        />
        <small className="text-muted">
          {t('admin.sweep.maxPendingPerRunHelp', { defaultValue: 'Max pending to process' })}
        </small>
      </div>

      <div className="col-md-4">
        <label htmlFor="maxUnlockPerRun" className="form-label">
          {t('admin.sweep.maxUnlockPerRun', { defaultValue: 'Max Unlock/Run' })}
        </label>
        <input
          type="number"
          className="form-control"
          id="maxUnlockPerRun"
          placeholder="100"
          min="1"
          value={formData.batchProcessingLimits.maxUnlockPerRun || ''}
          onChange={(e) => handleNestedChange('batchProcessingLimits', 'maxUnlockPerRun', parseInt(e.target.value) || '')}
          onInput={validateNumberInput}
        />
        <small className="text-muted">
          {t('admin.sweep.maxUnlockPerRunHelp', { defaultValue: 'Max wallets to unlock' })}
        </small>
      </div>
    </>
  )
}
