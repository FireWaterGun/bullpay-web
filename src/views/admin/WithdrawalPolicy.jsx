import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'

export default function WithdrawalPolicy() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loadingData, setLoadingData] = useState(true)
  const [autoApprove, setAutoApprove] = useState({})
  const [gasSettings, setGasSettings] = useState({})
  const [policy, setPolicy] = useState({})
  const [reconciliation, setReconciliation] = useState({})
  const [reservation, setReservation] = useState({})

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
      setGasSettings(settingsMap.gas?.parsedValue || {})
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
              
              <div className="row g-4">
                {/* Auto Approve */}
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">{t('admin.withdrawal.autoApprove', { defaultValue: 'Auto Approve' })}</h6>
                    </div>
                    <div className="card-body">
                      <table className="table table-sm mb-0">
                        <tbody>
                          <tr>
                            <td><strong>{t('admin.withdrawal.enabled', { defaultValue: 'Enabled' })}</strong></td>
                            <td>
                              <span className={`badge ${autoApprove.enabled ? 'bg-success' : 'bg-secondary'}`}>
                                {autoApprove.enabled ? 'Yes' : 'No'}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td><strong>{t('admin.withdrawal.thresholdUsd', { defaultValue: 'Threshold (USD)' })}</strong></td>
                            <td><code>{autoApprove.thresholdUsd || 0}</code></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Gas Settings */}
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">{t('admin.withdrawal.gasSettings', { defaultValue: 'Gas Settings' })}</h6>
                    </div>
                    <div className="card-body">
                      <table className="table table-sm mb-0">
                        <tbody>
                          <tr>
                            <td><strong>{t('admin.withdrawal.bufferMultiplier', { defaultValue: 'Buffer Multiplier' })}</strong></td>
                            <td><code>{gasSettings.bufferMultiplier || '-'}</code></td>
                          </tr>
                          <tr>
                            <td><strong>{t('admin.withdrawal.minNativeByNetwork', { defaultValue: 'Min Native/Network' })}</strong></td>
                            <td>
                              <span className="badge rounded-pill bg-primary" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                                {Object.keys(gasSettings.minNativeByNetwork || {}).length}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Policy */}
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">{t('admin.withdrawal.policySettings', { defaultValue: 'Policy Settings' })}</h6>
                    </div>
                    <div className="card-body">
                      <table className="table table-sm mb-0">
                        <tbody>
                          <tr>
                            <td><strong>{t('admin.withdrawal.countPendingInUsage', { defaultValue: 'Count Pending' })}</strong></td>
                            <td>
                              <span className={`badge ${policy.countPendingInUsage ? 'bg-success' : 'bg-secondary'}`}>
                                {policy.countPendingInUsage ? 'Yes' : 'No'}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Reservation */}
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">{t('admin.withdrawal.reservation', { defaultValue: 'Reservation' })}</h6>
                    </div>
                    <div className="card-body">
                      <table className="table table-sm mb-0">
                        <tbody>
                          <tr>
                            <td><strong>{t('admin.withdrawal.reserveTtlSeconds', { defaultValue: 'Reserve TTL (s)' })}</strong></td>
                            <td><code>{reservation.reserveTtlSeconds || '-'}</code></td>
                          </tr>
                          <tr>
                            <td><strong>{t('admin.withdrawal.headroomPercent', { defaultValue: 'Headroom %' })}</strong></td>
                            <td><code>{reservation.headroomPercent || '-'}</code></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Reconciliation */}
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">{t('admin.withdrawal.reconciliation', { defaultValue: 'Reconciliation' })}</h6>
                    </div>
                    <div className="card-body">
                      <table className="table table-sm mb-0">
                        <tbody>
                          <tr>
                            <td><strong>{t('admin.withdrawal.staleMinutes', { defaultValue: 'Stale Minutes' })}</strong></td>
                            <td><code>{reconciliation.staleMinutes || '-'}</code></td>
                          </tr>
                          <tr>
                            <td><strong>{t('admin.withdrawal.maxPerRun', { defaultValue: 'Max Per Run' })}</strong></td>
                            <td><code>{reconciliation.maxPerRun || '-'}</code></td>
                          </tr>
                          <tr>
                            <td><strong>{t('admin.withdrawal.jitterMs', { defaultValue: 'Jitter (ms)' })}</strong></td>
                            <td>
                              {reconciliation.jitterMs ? (
                                <code>{reconciliation.jitterMs.min} - {reconciliation.jitterMs.max}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
