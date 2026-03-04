'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useAuth } from '@/app/providers'
import { updateSweepSetting } from '@/lib/api/admin'
import { useToast } from '@/app/providers'
const ConfirmResetModal = dynamic(() => import('@/components/ConfirmResetModal'), { ssr: false })
import { logger } from '@/lib/utils/logger'
import CardEmptyState from '@/components/CardEmptyState'

export default function GasSettingsForm({ gasSettings, setGasSettings }) {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({})

  const [deleteConfirmNetwork, setDeleteConfirmNetwork] = useState(null)
  const [showGasNetworkForm, setShowGasNetworkForm] = useState(false)
  const [editingGasNetwork, setEditingGasNetwork] = useState(null)
  const [gasNetworkFormData, setGasNetworkFormData] = useState({ network: '', minNative: '' })

  function handleEdit() {
    setFormData({ bufferMultiplier: gasSettings.bufferMultiplier ?? 1.5 })
    setShowModal(true)
  }

  async function handleSave() {
    try {
      setLoading(true)
      const settingValue = {
        bufferMultiplier: parseFloat(formData.bufferMultiplier) || 1.5,
        minNativeByNetwork: gasSettings.minNativeByNetwork || {}
      }
      await updateSweepSetting(token, 'payment.withdraw.gas', settingValue)
      setGasSettings(settingValue)
      setShowModal(false)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      logger.error('Failed to save:', error)
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setLoading(false)
    }
  }

  function handleAddGasNetwork() {
    setEditingGasNetwork(null)
    setGasNetworkFormData({ network: '', minNative: '' })
    setShowGasNetworkForm(true)
  }

  function handleEditGasNetwork(network, minNative) {
    setEditingGasNetwork(network)
    setGasNetworkFormData({ network, minNative })
    setShowGasNetworkForm(true)
  }

  async function handleSaveGasNetwork() {
    try {
      setLoading(true)
      const minNativeByNetwork = { ...(gasSettings.minNativeByNetwork || {}) }

      if (editingGasNetwork && editingGasNetwork !== gasNetworkFormData.network) {
        delete minNativeByNetwork[editingGasNetwork]
      }

      minNativeByNetwork[gasNetworkFormData.network] = gasNetworkFormData.minNative

      const newSettings = { ...gasSettings, minNativeByNetwork }
      await updateSweepSetting(token, 'payment.withdraw.gas', newSettings)
      setGasSettings(newSettings)
      setShowGasNetworkForm(false)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      logger.error('Failed to save:', error)
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteGasNetwork(network) {
    setDeleteConfirmNetwork(network)
  }

  async function confirmDeleteGasNetwork() {
    const network = deleteConfirmNetwork
    setDeleteConfirmNetwork(null)
    if (!network) return

    try {
      setLoading(true)
      const minNativeByNetwork = { ...(gasSettings.minNativeByNetwork || {}) }
      delete minNativeByNetwork[network]

      const newSettings = { ...gasSettings, minNativeByNetwork }
      await updateSweepSetting(token, 'payment.withdraw.gas', newSettings)
      setGasSettings(newSettings)
      toast.success(t('admin.withdrawal.deleteSuccess', { defaultValue: 'Deleted successfully' }))
    } catch (error) {
      logger.error('Failed to delete:', error)
      toast.error(error?.message || t('admin.withdrawal.deleteError', { defaultValue: 'Failed to delete' }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-4">
        <div className="mb-3">
          <h6 className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{t('admin.withdrawal.gasSettings', { defaultValue: 'Gas Settings' })}</h6>
          <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.gasSettingsDesc', { defaultValue: 'Native gas guard configuration' })}</p>
        </div>
        <div className="table-responsive">
          <table className="table table-borderless mb-0">
            <tbody>
              <tr style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
                <td width="35%" className="py-3 ps-3" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.bufferMultiplier', { defaultValue: 'Buffer Multiplier' })}</td>
                <td className="py-3">
                  <div className="d-flex align-items-center gap-2">
                    {gasSettings.bufferMultiplier !== undefined && gasSettings.bufferMultiplier !== null ? (
                      <code>{gasSettings.bufferMultiplier}</code>
                    ) : (
                      <span className="text-muted">Not set</span>
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

      <hr className="my-4" />

      <div className="mb-4">
        <div className="mb-3">
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <h6 className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{t('admin.withdrawal.minNativeByNetwork', { defaultValue: 'Min Native by Network' })}</h6>
              <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>{t('admin.withdrawal.minNativeByNetworkDesc', { defaultValue: 'Minimum native balance required per network' })}</p>
            </div>
            <div className="d-flex justify-content-end" style={{ width: '120px', paddingRight: '12px' }}>
              <button type="button" className="btn btn-sm btn-primary" onClick={handleAddGasNetwork}>
                <i className="bx bx-plus me-1"></i>
                {t('actions.add', { defaultValue: 'Add' })}
              </button>
            </div>
          </div>
        </div>

        {Object.keys(gasSettings.minNativeByNetwork || {}).length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>{t('admin.withdrawal.network', { defaultValue: 'Network' })}</th>
                  <th>{t('admin.withdrawal.minNative', { defaultValue: 'Min Native' })}</th>
                  <th className="text-end">{t('actions.actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(gasSettings.minNativeByNetwork || {}).map(([network, minNative]) => (
                  <tr key={network}>
                    <td><strong>{network}</strong></td>
                    <td><code>{minNative}</code></td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-icon me-1"
                        onClick={() => handleEditGasNetwork(network, minNative)}
                        disabled={loading}
                      >
                        <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-icon"
                        onClick={() => handleDeleteGasNetwork(network)}
                        disabled={loading}
                      >
                        <i className="bx bx-trash text-danger" style={{ fontSize: '1.25rem' }}></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <CardEmptyState
            icon="bx-data"
            message={t('admin.withdrawal.noNetworks', { defaultValue: 'No networks configured' })}
          />
        )}
      </div>

      {showModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {t('admin.withdrawal.editGasSettings', { defaultValue: 'Edit Gas Settings' })}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">{t('admin.withdrawal.bufferMultiplier', { defaultValue: 'Buffer Multiplier' })}</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.bufferMultiplier || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                            setFormData({ ...formData, bufferMultiplier: value })
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

      {showGasNetworkForm && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingGasNetwork
                      ? t('admin.withdrawal.editNetwork', { defaultValue: 'Edit Network' })
                      : t('admin.withdrawal.addNetwork', { defaultValue: 'Add Network' })
                    }
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowGasNetworkForm(false)} disabled={loading}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">{t('admin.withdrawal.network', { defaultValue: 'Network' })}*</label>
                      <input
                        type="text"
                        className="form-control"
                        value={gasNetworkFormData.network}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[a-zA-Z0-9]*$/.test(value) && value.length <= 20)) {
                            setGasNetworkFormData({ ...gasNetworkFormData, network: value })
                          }
                        }}
                        disabled={!!editingGasNetwork}
                        placeholder="ETH, BSC, etc."
                        maxLength={20}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">{t('admin.withdrawal.minNative', { defaultValue: 'Min Native' })}*</label>
                      <input
                        type="text"
                        className="form-control"
                        value={gasNetworkFormData.minNative}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || (/^[0-9]*\.?[0-9]*$/.test(value) && value.length <= 20)) {
                            setGasNetworkFormData({ ...gasNetworkFormData, minNative: value })
                          }
                        }}
                        placeholder="0.001"
                        maxLength={20}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowGasNetworkForm(false)}
                    disabled={loading}
                  >
                    {t('actions.cancel', { defaultValue: 'Cancel' })}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveGasNetwork}
                    disabled={loading || !gasNetworkFormData.network || !gasNetworkFormData.minNative}
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

      {deleteConfirmNetwork && (
        <ConfirmResetModal
          title={t('actions.confirm', { defaultValue: 'Confirm Delete' })}
          message={t('admin.withdrawal.confirmDelete', { defaultValue: 'Are you sure you want to delete this?' })}
          confirmLabel={t('actions.delete', { defaultValue: 'Delete' })}
          onConfirm={confirmDeleteGasNetwork}
          onClose={() => setDeleteConfirmNetwork(null)}
        />
      )}
    </>
  )
}
