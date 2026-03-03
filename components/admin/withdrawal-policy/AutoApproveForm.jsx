'use client'

import { useState, useEffect, useRef } from 'react'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useAuth } from '@/app/providers'
import { upsertSetting } from '@/lib/api/admin'
import { useToast } from '@/app/providers'
import { logger } from '@/lib/utils/logger'

export default function AutoApproveForm({ autoApprove, setAutoApprove }) {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({})

  function handleEdit() {
    setFormData({ enabled: autoApprove.enabled || false, thresholdUsd: autoApprove.thresholdUsd || 0 })
    setShowModal(true)
  }

  async function saveAutoApproveFields(enabled, thresholdUsd) {
    await Promise.all([
      upsertSetting(token, { keyName: 'withdrawal.auto_approve.enabled', value: String(enabled) }),
      upsertSetting(token, { keyName: 'withdrawal.auto_approve.threshold_usd', value: String(thresholdUsd) }),
    ])
  }

  async function handleSave() {
    try {
      setLoading(true)
      const enabled = formData.enabled
      const thresholdUsd = parseFloat(formData.thresholdUsd) || 0
      await saveAutoApproveFields(enabled, thresholdUsd)
      setAutoApprove({ enabled, thresholdUsd })
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
          <h6 className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{t('admin.withdrawal.autoApprove', { defaultValue: 'Auto Approve' })}</h6>
          <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.autoApproveDesc', { defaultValue: 'Automatically approve small withdrawals' })}</p>
        </div>
        <div className="table-responsive">
          <table className="table table-borderless mb-0">
            <tbody>
              <tr style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
                <td width="35%" className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.enabled', { defaultValue: 'Enabled' })}</td>
                <td className="py-3">
                  <div className="form-check form-switch mb-0">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={autoApprove.enabled || false}
                      disabled={toggling}
                      onChange={async (e) => {
                        const newEnabled = e.target.checked
                        const prev = { ...autoApprove }
                        setToggling(true)
                        setAutoApprove({ ...autoApprove, enabled: newEnabled })
                        try {
                          await upsertSetting(token, { keyName: 'withdrawal.auto_approve.enabled', value: String(newEnabled) })
                          toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
                        } catch (err) {
                          setAutoApprove(prev)
                          toast.error(err?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
                        } finally {
                          setToggling(false)
                        }
                      }}
                      style={{ cursor: toggling ? 'not-allowed' : 'pointer' }}
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.thresholdUsd', { defaultValue: 'Threshold (USD)' })}</td>
                <td className="py-3">
                  <div className="d-flex align-items-center gap-2">
                    <code>{autoApprove.thresholdUsd || 0}</code>
                    <button type="button" className="btn btn-sm btn-icon" onClick={handleEdit} disabled={toggling} style={{ marginLeft: 'auto' }}>
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
        <AutoApproveModal
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          loading={loading}
          t={t}
        />
      )}
    </>
  )
}

function AutoApproveModal({ formData, setFormData, onClose, onSave, loading, t }) {
  // Stable ref for onClose to avoid listener churn
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Escape key handler
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !loading) onCloseRef.current() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [loading])

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
                  <h5 className="modal-title">
                    {t('admin.withdrawal.editAutoApprove', { defaultValue: 'Edit Auto Approve' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={formData.enabled || false}
                          onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                        />
                        <label className="form-check-label">{t('admin.withdrawal.enabled', { defaultValue: 'Enabled' })}</label>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label">{t('admin.withdrawal.thresholdUsd', { defaultValue: 'Threshold (USD)' })}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.thresholdUsd || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, thresholdUsd: value })
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
                    onClick={onClose}
                    disabled={loading}
                  >
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onSave}
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
  )
}
