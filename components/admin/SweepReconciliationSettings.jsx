'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

export default function SweepReconciliationSettings({ formData, setFormData, validateNumberInput }) {
  const { t } = useAdminTranslation()

  function handleNestedChange(field, nestedField, value) {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [nestedField]: value
      }
    }))
  }

  return (
    <>
      <div className="col-span-12 mt-5">
        <hr className="my-4" />
        <h6 className="text-primary mb-4">
          {t('admin.sweep.reconciliationSettings', { defaultValue: 'Reconciliation' })}
        </h6>
      </div>

      <div className="md:col-span-3">
        <label htmlFor="staleMinutes" className="form-label">
          {t('admin.sweep.staleMinutes', { defaultValue: 'Stale Minutes' })}
        </label>
        <input
          type="number"
          className="form-input"
          id="staleMinutes"
          placeholder="2"
          min="1"
          value={formData.staleTransactionChecker.staleMinutes || ''}
          onChange={(e) => handleNestedChange('staleTransactionChecker', 'staleMinutes', parseInt(e.target.value) || '')}
          onInput={validateNumberInput}
        />
        <small className="text-muted">
          {t('admin.sweep.staleMinutesHelp', { defaultValue: 'When tx is stale' })}
        </small>
      </div>

      <div className="md:col-span-3">
        <label htmlFor="reconciliationMaxPerRun" className="form-label">
          {t('admin.sweep.maxPerRun', { defaultValue: 'Max/Run' })}
        </label>
        <input
          type="number"
          className="form-input"
          id="reconciliationMaxPerRun"
          placeholder="50"
          min="1"
          value={formData.staleTransactionChecker.maxPerRun || ''}
          onChange={(e) => handleNestedChange('staleTransactionChecker', 'maxPerRun', parseInt(e.target.value) || '')}
          onInput={validateNumberInput}
        />
        <small className="text-muted">
          {t('admin.sweep.maxPerRunHelp', { defaultValue: 'Batch size limit' })}
        </small>
      </div>

      <div className="md:col-span-3">
        <label htmlFor="jitterMin" className="form-label">
          {t('admin.sweep.jitterMin', { defaultValue: 'Jitter Min (ms)' })}
        </label>
        <input
          type="number"
          className="form-input"
          id="jitterMin"
          placeholder="5000"
          min="0"
          step="1000"
          value={formData.staleTransactionChecker.jitterMs?.min || ''}
          onChange={(e) => {
            const newJitterMs = { ...formData.staleTransactionChecker.jitterMs, min: parseInt(e.target.value) || 0 }
            setFormData(prev => ({
              ...prev,
              staleTransactionChecker: { ...prev.staleTransactionChecker, jitterMs: newJitterMs }
            }))
          }}
          onInput={validateNumberInput}
        />
        <small className="text-muted">
          {t('admin.sweep.jitterMinHelp', { defaultValue: 'Min delay' })}
        </small>
      </div>

      <div className="md:col-span-3">
        <label htmlFor="jitterMax" className="form-label">
          {t('admin.sweep.jitterMax', { defaultValue: 'Jitter Max (ms)' })}
        </label>
        <input
          type="number"
          className="form-input"
          id="jitterMax"
          placeholder="20000"
          min="0"
          step="1000"
          value={formData.staleTransactionChecker.jitterMs?.max || ''}
          onChange={(e) => {
            const newJitterMs = { ...formData.staleTransactionChecker.jitterMs, max: parseInt(e.target.value) || 0 }
            setFormData(prev => ({
              ...prev,
              staleTransactionChecker: { ...prev.staleTransactionChecker, jitterMs: newJitterMs }
            }))
          }}
          onInput={validateNumberInput}
        />
        <small className="text-muted">
          {t('admin.sweep.jitterMaxHelp', { defaultValue: 'Max delay' })}
        </small>
      </div>
    </>
  )
}
