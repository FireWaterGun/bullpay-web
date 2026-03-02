'use client'

import { useState } from 'react'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useAuth } from '@/app/providers'
import { updateSweepSetting } from '@/lib/api/admin'
import { useToast } from '@/app/providers'
import { logger } from '@/lib/utils/logger'

export default function ReconciliationForm({ reconciliation, setReconciliation }) {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({})

  function handleEdit() {
    setFormData({ staleMinutes: reconciliation.staleMinutes || '', maxPerRun: reconciliation.maxPerRun || '', jitterMsMin: reconciliation.jitterMs?.min || '', jitterMsMax: reconciliation.jitterMs?.max || '' })
    setShowModal(true)
  }

  async function handleSave() {
    try {
      setLoading(true)
      const settingValue = { staleMinutes: parseInt(formData.staleMinutes) || 0, maxPerRun: parseInt(formData.maxPerRun) || 0, jitterMs: { min: parseInt(formData.jitterMsMin) || 0, max: parseInt(formData.jitterMsMax) || 0 } }
      await updateSweepSetting(token, 'payment.withdraw.reconciliation', settingValue)
      setReconciliation(settingValue)
      setShowModal(false)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      logger.error('Failed to save:', error)
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-4">
        <div className="mb-3">
          <h6 className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{t('admin.withdrawal.reconciliation', { defaultValue: 'Reconciliation' })}</h6>
          <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.reconciliationDesc', { defaultValue: 'Background scanner tuning' })}</p>
        </div>
        <div className="table-responsive">
          <table className="table table-borderless mb-0">
            <tbody>
              <tr style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
                <td width="35%" className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.staleMinutes', { defaultValue: 'Stale Minutes' })}</td>
                <td className="py-3"><code>{reconciliation.staleMinutes || '-'}</code></td>
              </tr>
              <tr>
                <td className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.maxPerRun', { defaultValue: 'Max Per Run' })}</td>
                <td className="py-3"><code>{reconciliation.maxPerRun || '-'}</code></td>
              </tr>
              <tr style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
                <td className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.jitterMs', { defaultValue: 'Jitter (ms)' })}</td>
                <td className="py-3">
                  <div className="d-flex align-items-center gap-2">
                    {reconciliation.jitterMs ? (
                      <code>{reconciliation.jitterMs.min} - {reconciliation.jitterMs.max}</code>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                    <button type="button" className="btn btn-sm btn-icon" onClick={handleEdit} style={{ marginLeft: 'auto' }}>
                      <i className="bx bx-edit text-primary" style={{ fontSize: '1rem' }}></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {t('admin.withdrawal.editReconciliation', { defaultValue: 'Edit Reconciliation' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.withdrawal.staleMinutes', { defaultValue: 'Stale Minutes' })}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.staleMinutes || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, staleMinutes: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.withdrawal.maxPerRun', { defaultValue: 'Max Per Run' })}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.maxPerRun || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, maxPerRun: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.withdrawal.jitterMsMin', { defaultValue: 'Jitter Min (ms)' })}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.jitterMsMin || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, jitterMsMin: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.withdrawal.jitterMsMax', { defaultValue: 'Jitter Max (ms)' })}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.jitterMsMax || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, jitterMsMax: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                  >
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
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
        </>
      )}
    </>
  )
}
