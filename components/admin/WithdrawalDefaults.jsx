'use client'

import { useState, useEffect } from 'react'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useAuth } from '@/app/providers'
import { getSweepSettings, updateSweepSetting } from '@/lib/api/admin'
import { useToast } from '@/app/providers'
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner'

export default function WithdrawalDefaults() {
  const { t } = useAdminTranslation()
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
    return <PageSpinner />
  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <div className="card mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <h5 className="mb-0">{t('admin.withdrawal.defaults', { defaultValue: 'Defaults & Limits' })}</h5>
              <p className="text-muted text-sm mb-0 mt-1">
                {t('admin.withdrawal.defaultsDescription', { defaultValue: 'Default withdrawal limits and fees applied globally' })}
              </p>
            </div>
            <div className="p-5">
              
              {/* Default Settings */}
              <div>
                <div className="flex justify-end mb-3">
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleEdit}>
                    <i className="bx bx-edit mr-1"></i>
                    {t('actions.edit', { defaultValue: 'Edit' })}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
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
                          <span className="badge bg-cyan-50 text-cyan-700">
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
          <div className="fixed inset-0 bg-black/50 z-40"></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center block" tabIndex="-1">
            <div className="w-full max-w-lg mx-4 max-w-2xl">
              <div className="bg-white rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-5 border-b border-surface-200">
                  <h5 className="text-lg font-semibold text-surface-800">
                    {t('admin.withdrawal.editDefaults', { defaultValue: 'Edit Default Settings' })}
                  </h5>
                  <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={() => setShowModal(false)} disabled={loading}></button>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-12 gap-x-6 gap-3">
                    <div className="md:col-span-6">
                      <label className="form-label">{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</label>
                      <input 
                        type="text"
                        className="form-input"
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
                    <div className="md:col-span-6">
                      <label className="form-label">{t('admin.withdrawal.maximum', { defaultValue: 'Maximum' })}</label>
                      <input 
                        type="text"
                        className="form-input"
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
                    <div className="md:col-span-6">
                      <label className="form-label">{t('admin.withdrawal.dailyLimit', { defaultValue: 'Daily Limit' })}</label>
                      <input 
                        type="text"
                        className="form-input"
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
                    <div className="md:col-span-6">
                      <label className="form-label">{t('admin.withdrawal.monthlyLimit', { defaultValue: 'Monthly Limit' })}</label>
                      <input 
                        type="text"
                        className="form-input"
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
                    <div className="col-span-12">
                      <label className="form-label">{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</label>
                      <select 
                        className="form-input"
                        value={formData.feeType}
                        onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed</option>
                      </select>
                    </div>
                    {formData.feeType === 'percentage' && (
                      <>
                        <div className="md:col-span-4">
                          <label className="form-label">{t('admin.withdrawal.feePercentage', { defaultValue: 'Fee %' })}</label>
                          <input 
                            type="text"
                            className="form-input"
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
                        <div className="md:col-span-4">
                          <label className="form-label">{t('admin.withdrawal.feeMin', { defaultValue: 'Min Fee' })}</label>
                          <input 
                            type="text"
                            className="form-input"
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
                        <div className="md:col-span-4">
                          <label className="form-label">{t('admin.withdrawal.feeMax', { defaultValue: 'Max Fee' })}</label>
                          <input 
                            type="text"
                            className="form-input"
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
                      <div className="col-span-12">
                        <label className="form-label">{t('admin.withdrawal.feeFixed', { defaultValue: 'Fixed Fee' })}</label>
                        <input 
                          type="text"
                          className="form-input"
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
                <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
                  <button 
                    type="button" 
                    className="btn btn bg-surface-200 text-surface-700 hover:bg-surface-300"
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
                        <span className="spinner w-4 h-4 mr-2"></span>
                        {t('actions.saving', { defaultValue: 'Saving...' })}
                      </>
                    ) : (
                      <>
                        <i className="bx bx-save mr-1"></i>
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
