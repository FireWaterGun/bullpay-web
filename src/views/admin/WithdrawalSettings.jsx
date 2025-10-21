import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings, updateSweepSetting } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'

export default function WithdrawalSettings() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  
  // State for all withdrawal settings
  const [defaults, setDefaults] = useState({})
  const [coinOverrides, setCoinOverrides] = useState({})
  const [networkOverrides, setNetworkOverrides] = useState({})
  const [coinNetworkOverrides, setCoinNetworkOverrides] = useState({})
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
      
      setDefaults(settingsMap.defaults?.parsedValue || {})
      setCoinOverrides(settingsMap.coin_overrides?.parsedValue || {})
      setNetworkOverrides(settingsMap.network_overrides?.parsedValue || {})
      setCoinNetworkOverrides(settingsMap.coin_network_overrides?.parsedValue || {})
      setAutoApprove(settingsMap.auto_approve?.parsedValue || {})
      setGasSettings(settingsMap.gas?.parsedValue || {})
      setPolicy(settingsMap.policy?.parsedValue || {})
      setReconciliation(settingsMap.reconciliation?.parsedValue || {})
      setReservation(settingsMap.reservation?.parsedValue || {})
    } catch (error) {
      console.error('Failed to load withdrawal settings:', error)
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
              <h5 className="mb-0">{t('admin.withdrawal.title', { defaultValue: 'Withdrawal Settings' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.withdrawal.description', { defaultValue: 'Configure withdrawal limits, fees, and policies' })}
              </p>
            </div>
            <div className="card-body">
              
              {/* Default Settings */}
              <div className="mb-5">
                <h6 className="text-primary mb-3">
                  {t('admin.withdrawal.defaultSettings', { defaultValue: 'Default Settings' })}
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td width="30%"><strong>{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</strong></td>
                        <td><code>{defaults.minimum || '-'}</code></td>
                      </tr>
                      <tr>
                        <td><strong>{t('admin.withdrawal.maximum', { defaultValue: 'Maximum' })}</strong></td>
                        <td><code>{defaults.maximum || '-'}</code></td>
                      </tr>
                      <tr>
                        <td><strong>{t('admin.withdrawal.dailyLimit', { defaultValue: 'Daily Limit' })}</strong></td>
                        <td><code>{defaults.dailyLimit || '-'}</code></td>
                      </tr>
                      <tr>
                        <td><strong>{t('admin.withdrawal.monthlyLimit', { defaultValue: 'Monthly Limit' })}</strong></td>
                        <td><code>{defaults.monthlyLimit || '-'}</code></td>
                      </tr>
                      <tr>
                        <td><strong>{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</strong></td>
                        <td><span className="badge bg-label-info">{defaults.fee?.type || '-'}</span></td>
                      </tr>
                      {defaults.fee?.type === 'percentage' && (
                        <>
                          <tr>
                            <td><strong>{t('admin.withdrawal.feePercentage', { defaultValue: 'Fee %' })}</strong></td>
                            <td><code>{defaults.fee?.percentage || '-'}</code></td>
                          </tr>
                          <tr>
                            <td><strong>{t('admin.withdrawal.feeMin', { defaultValue: 'Min Fee' })}</strong></td>
                            <td><code>{defaults.fee?.min || '-'}</code></td>
                          </tr>
                          <tr>
                            <td><strong>{t('admin.withdrawal.feeMax', { defaultValue: 'Max Fee' })}</strong></td>
                            <td><code>{defaults.fee?.max || '-'}</code></td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Coin Overrides */}
              <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    {t('admin.withdrawal.coinOverrides', { defaultValue: 'Coin Overrides' })}
                    <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                      {Object.keys(coinOverrides).length}
                    </span>
                  </h6>
                </div>
                
                {Object.keys(coinOverrides).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.withdrawal.coin', { defaultValue: 'Coin' })}</th>
                          <th>{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</th>
                          <th>{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</th>
                          <th>{t('admin.withdrawal.feeConfig', { defaultValue: 'Fee Config' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(coinOverrides).map(([coin, config]) => (
                          <tr key={coin}>
                            <td><strong>{coin}</strong></td>
                            <td>
                              {config.minimum ? (
                                <code>{config.minimum}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.fee?.type ? (
                                <span className="badge bg-label-info">{config.fee.type}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.fee?.type === 'fixed' && (
                                <code>Fixed: {config.fee.fixed}</code>
                              )}
                              {config.fee?.type === 'percentage' && (
                                <code>{config.fee.percentage}% (min: {config.fee.min}{config.fee.max ? `, max: ${config.fee.max}` : ''})</code>
                              )}
                              {!config.fee?.type && <span className="text-muted">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <p>{t('admin.withdrawal.noCoinOverrides', { defaultValue: 'No coin overrides configured' })}</p>
                  </div>
                )}
              </div>

              {/* Network Overrides */}
              <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    {t('admin.withdrawal.networkOverrides', { defaultValue: 'Network Overrides' })}
                    <span className="badge rounded-pill bg-success ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                      {Object.keys(networkOverrides).length}
                    </span>
                  </h6>
                </div>
                
                {Object.keys(networkOverrides).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.withdrawal.network', { defaultValue: 'Network' })}</th>
                          <th>{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</th>
                          <th>{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</th>
                          <th>{t('admin.withdrawal.feeConfig', { defaultValue: 'Fee Config' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(networkOverrides).map(([network, config]) => (
                          <tr key={network}>
                            <td><strong>{network}</strong></td>
                            <td>
                              {config.minimum ? (
                                <code>{config.minimum}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.fee?.type ? (
                                <span className="badge bg-label-info">{config.fee.type}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.fee?.type === 'fixed' && (
                                <code>Fixed: {config.fee.fixed}</code>
                              )}
                              {config.fee?.type === 'percentage' && (
                                <code>{config.fee.percentage}% (min: {config.fee.min}{config.fee.max ? `, max: ${config.fee.max}` : ''})</code>
                              )}
                              {!config.fee?.type && <span className="text-muted">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <p>{t('admin.withdrawal.noNetworkOverrides', { defaultValue: 'No network overrides configured' })}</p>
                  </div>
                )}
              </div>

              {/* Coin-Network Overrides */}
              <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    {t('admin.withdrawal.coinNetworkOverrides', { defaultValue: 'Coin-Network Overrides' })}
                    <span className="badge rounded-pill bg-warning ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                      {Object.keys(coinNetworkOverrides).length}
                    </span>
                  </h6>
                </div>
                
                {Object.keys(coinNetworkOverrides).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.withdrawal.coinNetworkId', { defaultValue: 'CoinNetwork ID' })}</th>
                          <th>{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</th>
                          <th>{t('admin.withdrawal.maximum', { defaultValue: 'Maximum' })}</th>
                          <th>{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</th>
                          <th>{t('admin.withdrawal.feeConfig', { defaultValue: 'Fee Config' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(coinNetworkOverrides).map(([coinNetworkId, config]) => (
                          <tr key={coinNetworkId}>
                            <td><strong>{coinNetworkId}</strong></td>
                            <td>
                              {config.minimum ? (
                                <code>{config.minimum}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.maximum ? (
                                <code>{config.maximum}</code>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.fee?.type ? (
                                <span className="badge bg-label-info">{config.fee.type}</span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td>
                              {config.fee?.type === 'fixed' && (
                                <code>Fixed: {config.fee.fixed}</code>
                              )}
                              {config.fee?.type === 'percentage' && (
                                <code>{config.fee.percentage}% (min: {config.fee.min}{config.fee.max ? `, max: ${config.fee.max}` : ''})</code>
                              )}
                              {!config.fee?.type && <span className="text-muted">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <p>{t('admin.withdrawal.noCoinNetworkOverrides', { defaultValue: 'No coin-network overrides configured' })}</p>
                  </div>
                )}
              </div>

              {/* Additional Settings */}
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
                      <h6 className="mb-0">{t('admin.withdrawal.policy', { defaultValue: 'Policy' })}</h6>
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
