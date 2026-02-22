import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings, updateSweepSetting } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'
import AutoApproveForm from './withdrawal-policy/AutoApproveForm'
import GasSettingsForm from './withdrawal-policy/GasSettingsForm'
import ReconciliationForm from './withdrawal-policy/ReconciliationForm'

export default function WithdrawalPolicy() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [autoApprove, setAutoApprove] = useState({})
  const [gasSettings, setGasSettings] = useState({})
  const [policy, setPolicy] = useState({})
  const [reconciliation, setReconciliation] = useState({})
  const [reservation, setReservation] = useState({})

  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [formData, setFormData] = useState({})

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoadingData(true)
      const data = await getSweepSettings(token, 'payment', 'global', 1, 100)

      const settingsMap = {}
      data.forEach(setting => {
        const key = setting.keyName.replace('payment.withdraw.', '')
        settingsMap[key] = setting
      })

      setAutoApprove(settingsMap.auto_approve?.parsedValue || {})

      const gasData = settingsMap.gas?.parsedValue || {}
      setGasSettings({
        bufferMultiplier: gasData.bufferMultiplier ?? 1.5,
        minNativeByNetwork: gasData.minNativeByNetwork || {}
      })

      setPolicy(settingsMap.policy?.parsedValue || {})
      setReconciliation(settingsMap.reconciliation?.parsedValue || {})
      setReservation(settingsMap.reservation?.parsedValue || {})
    } catch (error) {
      console.error('Failed to load withdrawal policy:', error)
      toast.error(t('admin.withdrawal.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  function handleEdit(type) {
    setModalType(type)
    switch(type) {
      case 'policy':
        setFormData({ countPendingInUsage: policy.countPendingInUsage || false })
        break
      case 'reservation':
        setFormData({ reserveTtlSeconds: reservation.reserveTtlSeconds || '', headroomPercent: reservation.headroomPercent || '' })
        break
    }
    setShowModal(true)
  }

  async function handleSave() {
    try {
      setLoading(true)
      let settingKey, settingValue

      switch(modalType) {
        case 'policy':
          settingKey = 'payment.withdraw.policy'
          settingValue = { countPendingInUsage: formData.countPendingInUsage }
          await updateSweepSetting(token, settingKey, settingValue)
          setPolicy(settingValue)
          break
        case 'reservation':
          settingKey = 'payment.withdraw.reservation'
          settingValue = { reserveTtlSeconds: parseInt(formData.reserveTtlSeconds) || 0, headroomPercent: parseFloat(formData.headroomPercent) || 0 }
          await updateSweepSetting(token, settingKey, settingValue)
          setReservation(settingValue)
          break
      }

      setShowModal(false)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">{t('admin.withdrawal.policy', { defaultValue: 'Policy & Settings' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.withdrawal.policyDescription', { defaultValue: 'Auto-approve, gas, policy, and operational settings' })}
              </p>
            </div>
            <div className="card-body">

              <AutoApproveForm autoApprove={autoApprove} setAutoApprove={setAutoApprove} />

              <hr className="my-4" />

              <GasSettingsForm gasSettings={gasSettings} setGasSettings={setGasSettings} />

              {/* Policy Settings */}
              <div className="mb-4">
                <div className="mb-3">
                  <h6 className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{t('admin.withdrawal.policySettings', { defaultValue: 'Policy Settings' })}</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.policySettingsDesc', { defaultValue: 'Policy controls for withdrawal validation' })}</p>
                </div>
                <div className="table-responsive">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
                        <td width="35%" className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.countPendingInUsage', { defaultValue: 'Count Pending' })}</td>
                        <td className="py-3">
                          <div className="form-check form-switch mb-0">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={policy.countPendingInUsage || false}
                              onChange={(e) => {
                                const newValue = { ...policy, countPendingInUsage: e.target.checked }
                                setPolicy(newValue)
                                updateSweepSetting(token, 'payment.withdraw.policy', newValue)
                                  .then(() => toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' })))
                                  .catch(err => {
                                    setPolicy(policy)
                                    toast.error(err?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
                                  })
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <hr className="my-4" />

              {/* Reservation */}
              <div className="mb-4">
                <div className="mb-3">
                  <h6 className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{t('admin.withdrawal.reservation', { defaultValue: 'Reservation' })}</h6>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.reservationDesc', { defaultValue: 'System wallet capacity management' })}</p>
                </div>
                <div className="table-responsive">
                  <table className="table table-borderless mb-0">
                    <tbody>
                      <tr style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
                        <td width="35%" className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.reserveTtlSeconds', { defaultValue: 'Reserve TTL (s)' })}</td>
                        <td className="py-3"><code>{reservation.reserveTtlSeconds || '-'}</code></td>
                      </tr>
                      <tr>
                        <td className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.headroomPercent', { defaultValue: 'Headroom %' })}</td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            <code>{reservation.headroomPercent || '-'}</code>
                            <button type="button" className="btn btn-sm btn-icon" onClick={() => handleEdit('reservation')} style={{ marginLeft: 'auto' }}>
                              <i className="bx bx-edit text-primary" style={{ fontSize: '1rem' }}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <hr className="my-4" />

              <ReconciliationForm reconciliation={reconciliation} setReconciliation={setReconciliation} />

            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalType === 'policy' && t('admin.withdrawal.editPolicy', { defaultValue: 'Edit Policy Settings' })}
                    {modalType === 'reservation' && t('admin.withdrawal.editReservation', { defaultValue: 'Edit Reservation' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    {modalType === 'policy' && (
                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={formData.countPendingInUsage || false}
                            onChange={(e) => setFormData({ ...formData, countPendingInUsage: e.target.checked })}
                          />
                          <label className="form-check-label">{t('admin.withdrawal.countPendingInUsage', { defaultValue: 'Count Pending in Usage' })}</label>
                        </div>
                      </div>
                    )}

                    {modalType === 'reservation' && (
                      <>
                        <div className="col-12">
                          <label className="form-label">{t('admin.withdrawal.reserveTtlSeconds', { defaultValue: 'Reserve TTL (seconds)' })}</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.reserveTtlSeconds || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, reserveTtlSeconds: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label">{t('admin.withdrawal.headroomPercent', { defaultValue: 'Headroom %' })}</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.headroomPercent || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, headroomPercent: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                      </>
                    )}
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
    </div>
  )
}
