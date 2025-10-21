import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'

export default function WithdrawalDefaults() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loadingData, setLoadingData] = useState(true)
  const [defaults, setDefaults] = useState({})

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
              <h5 className="mb-0">{t('admin.withdrawal.defaults', { defaultValue: 'Defaults & Limits' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.withdrawal.defaultsDescription', { defaultValue: 'Default withdrawal limits and fees applied globally' })}
              </p>
            </div>
            <div className="card-body">
              
              {/* Default Settings */}
              <div>
                <h6 className="text-primary fw-semibold mb-4">
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
                      {defaults.fee?.type === 'fixed' && (
                        <tr>
                          <td><strong>{t('admin.withdrawal.feeFixed', { defaultValue: 'Fixed Fee' })}</strong></td>
                          <td><code>{defaults.fee?.fixed || '-'}</code></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
