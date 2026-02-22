import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings, updateSweepSetting } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'
import BaseFeeModal from './BaseFeeModal'
import SlippageModal from './SlippageModal'
import DeleteConfirmModal from './DeleteConfirmModal'

export default function NetworkFees() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [baseFees, setBaseFees] = useState({})
  const [slippageByNetwork, setSlippageByNetwork] = useState({})

  const [showBaseFeeForm, setShowBaseFeeForm] = useState(false)
  const [baseFeeForm, setBaseFeeForm] = useState({ network: '', fee: '' })
  const [editingBaseFee, setEditingBaseFee] = useState(null)

  const [showSlippageForm, setShowSlippageForm] = useState(false)
  const [slippageForm, setSlippageForm] = useState({ network: '', percent: '' })
  const [editingSlippage, setEditingSlippage] = useState(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState({ network: '', type: '' })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoadingData(true)
      const data = await getSweepSettings(token)

      const settingsMap = {}
      data.forEach(setting => {
        const key = setting.keyName.replace('network.fee.', '')
        settingsMap[key] = setting
      })

      setBaseFees(settingsMap.base_fees?.parsedValue || {})
      setSlippageByNetwork(settingsMap.slippage?.parsedValue?.byNetwork || {})
    } catch (error) {
      console.error('Failed to load network fee settings:', error)
      toast.error(t('admin.network.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  function handleEditBaseFee(network, fee) {
    setBaseFeeForm({ network, fee })
    setEditingBaseFee(network)
    setShowBaseFeeForm(true)
  }

  async function handleSaveBaseFee() {
    try {
      if (!baseFeeForm.network.trim()) {
        toast.error(t('admin.network.networkRequired', { defaultValue: 'Network symbol is required' }))
        return
      }
      if (!baseFeeForm.fee.trim()) {
        toast.error(t('admin.network.feeRequired', { defaultValue: 'Fee value is required' }))
        return
      }

      const newBaseFees = { ...baseFees }
      newBaseFees[baseFeeForm.network.toUpperCase()] = baseFeeForm.fee

      setLoading(true)
      await updateSweepSetting(token, 'network.fee.base_fees', newBaseFees)

      setBaseFees(newBaseFees)
      setShowBaseFeeForm(false)
      toast.success(t('admin.network.saveSuccess', { defaultValue: 'Network fee saved successfully' }))
    } catch (error) {
      console.error('Failed to save base fee:', error)
      toast.error(error?.message || t('admin.network.saveError', { defaultValue: 'Failed to save' }))
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteBaseFee(network) {
    setDeleteTarget({ network, type: 'baseFee' })
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    try {
      setLoading(true)

      if (deleteTarget.type === 'baseFee') {
        const newBaseFees = { ...baseFees }
        delete newBaseFees[deleteTarget.network]
        await updateSweepSetting(token, 'network.fee.base_fees', newBaseFees)
        setBaseFees(newBaseFees)
      } else if (deleteTarget.type === 'slippage') {
        const newSlippage = { ...slippageByNetwork }
        delete newSlippage[deleteTarget.network]
        await updateSweepSetting(token, 'network.fee.slippage', { byNetwork: newSlippage })
        setSlippageByNetwork(newSlippage)
      }

      setShowDeleteModal(false)
      toast.success(t('admin.network.deleteSuccess', { defaultValue: 'Deleted successfully' }))
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error(error?.message || t('admin.network.deleteError', { defaultValue: 'Failed to delete' }))
    } finally {
      setLoading(false)
    }
  }

  function handleEditSlippage(network, percent) {
    setSlippageForm({ network, percent })
    setEditingSlippage(network)
    setShowSlippageForm(true)
  }

  async function handleSaveSlippage() {
    try {
      if (!slippageForm.network.trim()) {
        toast.error(t('admin.network.networkRequired', { defaultValue: 'Network symbol is required' }))
        return
      }
      if (!slippageForm.percent) {
        toast.error(t('admin.network.percentRequired', { defaultValue: 'Slippage percentage is required' }))
        return
      }

      const newSlippageByNetwork = { ...slippageByNetwork }
      newSlippageByNetwork[slippageForm.network.toUpperCase()] = parseFloat(slippageForm.percent)

      setLoading(true)
      const currentSlippageSettings = await getSweepSettings(token)
      const slippageData = currentSlippageSettings.find(s => s.keyName === 'network.fee.slippage')?.parsedValue || {}
      const updatedSlippage = {
        ...slippageData,
        byNetwork: newSlippageByNetwork
      }
      await updateSweepSetting(token, 'network.fee.slippage', updatedSlippage)

      setSlippageByNetwork(newSlippageByNetwork)
      setShowSlippageForm(false)
      toast.success(t('admin.network.saveSuccess', { defaultValue: 'Slippage saved successfully' }))
    } catch (error) {
      console.error('Failed to save slippage:', error)
      toast.error(error?.message || t('admin.network.saveError', { defaultValue: 'Failed to save' }))
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteSlippage(network) {
    setDeleteTarget({ network, type: 'slippage' })
    setShowDeleteModal(true)
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
              <h5 className="mb-0">{t('admin.network.title', { defaultValue: 'Network Fees' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.network.description', { defaultValue: 'Configure base network fees and slippage settings' })}
              </p>
            </div>
            <div className="card-body">
              {/* Base Fees */}
              <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    {t('admin.network.baseFees', { defaultValue: 'Base Fees by Network' })}
                    <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                      {Object.keys(baseFees).length}
                    </span>
                  </h6>
                </div>

                {Object.keys(baseFees).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.network.network', { defaultValue: 'Network' })}</th>
                          <th>{t('admin.network.fee', { defaultValue: 'Fee' })}</th>
                          <th className="text-end">{t('actions.actions', { defaultValue: 'Actions' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(baseFees).map(([network, fee]) => (
                          <tr key={network}>
                            <td><strong>{network}</strong></td>
                            <td><code>{fee}</code></td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-icon me-1"
                                onClick={() => handleEditBaseFee(network, fee)}
                                disabled={loading}
                              >
                                <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted py-5">
                    <i className="bx bx-data" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                    <p className="mt-3 mb-0">
                      {t('admin.network.noBaseFees', { defaultValue: 'No base fees configured' })}
                    </p>
                    <small className="text-muted">
                      {t('admin.network.noBaseFeesHelp', { defaultValue: 'Add network-specific base fees for quick estimates' })}
                    </small>
                  </div>
                )}
              </div>

              {/* Slippage by Network */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    {t('admin.network.slippageByNetwork', { defaultValue: 'Slippage by Network' })}
                    <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                      {Object.keys(slippageByNetwork).length}
                    </span>
                  </h6>
                </div>

                {Object.keys(slippageByNetwork).length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('admin.network.network', { defaultValue: 'Network' })}</th>
                          <th>{t('admin.network.slippagePercent', { defaultValue: 'Slippage %' })}</th>
                          <th className="text-end">{t('actions.actions', { defaultValue: 'Actions' })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(slippageByNetwork).map(([network, percent]) => (
                          <tr key={network}>
                            <td><strong>{network}</strong></td>
                            <td><code>{percent}</code></td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-icon me-1"
                                onClick={() => handleEditSlippage(network, percent)}
                                disabled={loading}
                              >
                                <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted py-5">
                    <i className="bx bx-data" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                    <p className="mt-3 mb-0">
                      {t('admin.network.noSlippage', { defaultValue: 'No network-specific slippage configured' })}
                    </p>
                    <small className="text-muted">
                      {t('admin.network.noSlippageHelp', { defaultValue: 'Add network-specific slippage percentages for fee volatility protection' })}
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBaseFeeForm && (
        <BaseFeeModal
          form={baseFeeForm}
          editing={editingBaseFee}
          loading={loading}
          onFormChange={setBaseFeeForm}
          onSave={handleSaveBaseFee}
          onClose={() => setShowBaseFeeForm(false)}
        />
      )}

      {showSlippageForm && (
        <SlippageModal
          form={slippageForm}
          editing={editingSlippage}
          loading={loading}
          onFormChange={setSlippageForm}
          onSave={handleSaveSlippage}
          onClose={() => setShowSlippageForm(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          target={deleteTarget}
          loading={loading}
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}
