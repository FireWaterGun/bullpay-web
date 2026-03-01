'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import { getSweepSettings, updateSweepSetting } from '@/lib/api/admin'
import { useToast } from '@/app/providers'
import { logger } from '@/lib/utils/logger'

export default function WithdrawalDefaults() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [defaults, setDefaults] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    minimum: '',
    maximum: '',
    dailyLimit: '',
    monthlyLimit: '',
    feeType: 'percentage',
    feePercentage: '',
    feeMin: '',
    feeMax: '',
    feeFixed: ''
  })

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
      logger.error('Failed to load withdrawal settings:', error)
      toast.error(t('admin.withdrawal.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  function handleEdit() {
    // Determine fee type
    let feeType = 'percentage'
    if (defaults.fee?.type) {
      feeType = defaults.fee.type
    } else if (defaults.fee?.fixed) {
      feeType = 'fixed'
    }

    setFormData({
      minimum: defaults.minimum || '',
      maximum: defaults.maximum || '',
      dailyLimit: defaults.dailyLimit || '',
      monthlyLimit: defaults.monthlyLimit || '',
      feeType: feeType,
      feePercentage: defaults.fee?.percentage || '',
      feeMin: defaults.fee?.min || '',
      feeMax: defaults.fee?.max || '',
      feeFixed: defaults.fee?.fixed || ''
    })
    setShowModal(true)
  }

  async function handleSave() {
    try {
      const config = {
        minimum: formData.minimum,
        maximum: formData.maximum,
        dailyLimit: formData.dailyLimit,
        monthlyLimit: formData.monthlyLimit,
        fee: { type: formData.feeType }
      }

      if (formData.feeType === 'percentage') {
        config.fee.percentage = formData.feePercentage
        config.fee.min = formData.feeMin
        if (formData.feeMax) config.fee.max = formData.feeMax
      } else if (formData.feeType === 'fixed') {
        config.fee.fixed = formData.feeFixed
      }

      setLoading(true)
      await updateSweepSetting(token, 'payment.withdraw.defaults', config)
      setDefaults(config)
      setShowModal(false)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      logger.error('Failed to save:', error)
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
              <h5 className="mb-0">{t('admin.withdrawal.defaults', { defaultValue: 'Defaults & Limits' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.withdrawal.defaultsDescription', { defaultValue: 'Default withdrawal limits and fees applied globally' })}
              </p>
            </div>
            <div className="card-body">
              
              {/* Default Settings */}
              <div>
                <div className="d-flex justify-content-end mb-3">
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleEdit}>
                    <i className="bx bx-edit me-1"></i>
                    {t('actions.edit', { defaultValue: 'Edit' })}
                  </button>
                </div>
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
                        <td>
                          <span className="badge bg-label-info">
                            {defaults.fee?.fixed ? 'fixed' : defaults.fee?.percentage || defaults.fee?.min ? 'percentage' : defaults.fee?.type || '-'}
                          </span>
                        </td>
                      </tr>
                      {(defaults.fee?.percentage || defaults.fee?.min) && !defaults.fee?.fixed && (
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
                      {defaults.fee?.fixed && (
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

      {/* Edit Modal */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {t('admin.withdrawal.editDefaults', { defaultValue: 'Edit Default Settings' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={formData.minimum}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, minimum: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.withdrawal.maximum', { defaultValue: 'Maximum' })}</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={formData.maximum}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, maximum: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.withdrawal.dailyLimit', { defaultValue: 'Daily Limit' })}</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={formData.dailyLimit}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, dailyLimit: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">{t('admin.withdrawal.monthlyLimit', { defaultValue: 'Monthly Limit' })}</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={formData.monthlyLimit}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, monthlyLimit: value })
                          }
                        }}
                        maxLength={20}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</label>
                      <select 
                        className="form-select"
                        value={formData.feeType}
                        onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed</option>
                      </select>
                    </div>
                    {formData.feeType === 'percentage' && (
                      <>
                        <div className="col-md-4">
                          <label className="form-label">{t('admin.withdrawal.feePercentage', { defaultValue: 'Fee %' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.feePercentage}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, feePercentage: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">{t('admin.withdrawal.feeMin', { defaultValue: 'Min Fee' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.feeMin}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, feeMin: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">{t('admin.withdrawal.feeMax', { defaultValue: 'Max Fee' })}</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={formData.feeMax}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                                setFormData({ ...formData, feeMax: value })
                              }
                            }}
                            maxLength={20}
                          />
                        </div>
                      </>
                    )}
                    {formData.feeType === 'fixed' && (
                      <div className="col-12">
                        <label className="form-label">{t('admin.withdrawal.feeFixed', { defaultValue: 'Fixed Fee' })}</label>
                        <input 
                          type="text"
                          className="form-control"
                          value={formData.feeFixed}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                              setFormData({ ...formData, feeFixed: value })
                            }
                          }}
                          maxLength={20}
                        />
                      </div>
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
