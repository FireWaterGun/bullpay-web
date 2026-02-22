import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings, updateSweepSetting } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'
import SweepOverrideTable from './SweepOverrideTable'
import SweepOverrideFormModal from './SweepOverrideFormModal'
import SweepDeleteModal from './SweepDeleteModal'

export default function SweepOverrides() {
  const { t } = useTranslation()
  const { user, token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [coinOverrides, setCoinOverrides] = useState({})
  const [networkOverrides, setNetworkOverrides] = useState({})

  // Coin Override Form State
  const [showCoinForm, setShowCoinForm] = useState(false)
  const [coinForm, setCoinForm] = useState({
    coin: '',
    minBalance: '',
    gasBuffer: ''
  })
  const [editingCoin, setEditingCoin] = useState(null)

  // Network Override Form State
  const [showNetworkForm, setShowNetworkForm] = useState(false)
  const [networkForm, setNetworkForm] = useState({
    coinNetworkId: '',
    minBalance: '',
    gasBuffer: ''
  })
  const [editingNetwork, setEditingNetwork] = useState(null)

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState({ id: '', type: '' })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoadingData(true)
      const data = await getSweepSettings(token)

      const settingsMap = {}
      data.forEach(setting => {
        const key = setting.keyName.replace('sweep.', '')
        settingsMap[key] = setting
      })

      setCoinOverrides(settingsMap.coin_specific_settings?.parsedValue || {})
      setNetworkOverrides(settingsMap.network_specific_settings?.parsedValue || {})
    } catch (error) {
      console.error('Failed to load sweep overrides:', error)
      toast.error(t('admin.sweep.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  // Coin Override Handlers
  function handleAddCoin() {
    setCoinForm({ coin: '', minBalance: '', gasBuffer: '' })
    setEditingCoin(null)
    setShowCoinForm(true)
  }

  function handleEditCoin(coin, config) {
    setCoinForm({
      coin: coin,
      minBalance: config.minBalance || '',
      gasBuffer: config.gasBuffer || ''
    })
    setEditingCoin(coin)
    setShowCoinForm(true)
  }

  async function handleSaveCoin() {
    try {
      if (!coinForm.coin.trim()) {
        toast.error(t('admin.sweep.coinRequired', { defaultValue: 'Coin symbol is required' }))
        return
      }

      const newOverrides = { ...coinOverrides }
      const override = {}

      if (coinForm.minBalance !== '') override.minBalance = parseFloat(coinForm.minBalance)
      if (coinForm.gasBuffer !== '') override.gasBuffer = parseFloat(coinForm.gasBuffer)

      if (Object.keys(override).length === 0) {
        toast.error(t('admin.sweep.oneFieldRequired', { defaultValue: 'At least one field is required' }))
        return
      }

      newOverrides[coinForm.coin.toUpperCase()] = override

      setLoading(true)
      await updateSweepSetting(token, 'sweep.coin_specific_settings', newOverrides)

      setCoinOverrides(newOverrides)
      setShowCoinForm(false)
      toast.success(t('admin.sweep.saveSuccess', { defaultValue: 'Override saved successfully' }))
    } catch (error) {
      console.error('Failed to save coin override:', error)
      toast.error(error?.message || t('admin.sweep.saveError', { defaultValue: 'Failed to save override' }))
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteCoin(coin) {
    setDeleteTarget({ id: coin, type: 'coin' })
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    try {
      setLoading(true)

      if (deleteTarget.type === 'coin') {
        const newOverrides = { ...coinOverrides }
        delete newOverrides[deleteTarget.id]
        await updateSweepSetting(token, 'sweep.coin_specific_settings', newOverrides)
        setCoinOverrides(newOverrides)
      } else if (deleteTarget.type === 'network') {
        const newOverrides = { ...networkOverrides }
        delete newOverrides[deleteTarget.id]
        await updateSweepSetting(token, 'sweep.network_specific_settings', newOverrides)
        setNetworkOverrides(newOverrides)
      }

      setShowDeleteModal(false)
      toast.success(t('admin.sweep.deleteSuccess', { defaultValue: 'Override deleted successfully' }))
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error(error?.message || t('admin.sweep.deleteError', { defaultValue: 'Failed to delete override' }))
    } finally {
      setLoading(false)
    }
  }

  // Network Override Handlers
  function handleAddNetwork() {
    setNetworkForm({ coinNetworkId: '', minBalance: '', gasBuffer: '' })
    setEditingNetwork(null)
    setShowNetworkForm(true)
  }

  function handleEditNetwork(coinNetworkId, config) {
    setNetworkForm({
      coinNetworkId: coinNetworkId,
      minBalance: config.minBalance || '',
      gasBuffer: config.gasBuffer || ''
    })
    setEditingNetwork(coinNetworkId)
    setShowNetworkForm(true)
  }

  async function handleSaveNetwork() {
    try {
      if (!networkForm.coinNetworkId.trim()) {
        toast.error(t('admin.sweep.coinNetworkIdRequired', { defaultValue: 'Coin-Network ID is required' }))
        return
      }

      const newOverrides = { ...networkOverrides }
      const override = {}

      if (networkForm.minBalance !== '') override.minBalance = parseFloat(networkForm.minBalance)
      if (networkForm.gasBuffer !== '') override.gasBuffer = parseFloat(networkForm.gasBuffer)

      if (Object.keys(override).length === 0) {
        toast.error(t('admin.sweep.oneFieldRequired', { defaultValue: 'At least one field is required' }))
        return
      }

      newOverrides[networkForm.coinNetworkId] = override

      setLoading(true)
      await updateSweepSetting(token, 'sweep.network_specific_settings', newOverrides)

      setNetworkOverrides(newOverrides)
      setShowNetworkForm(false)
      toast.success(t('admin.sweep.saveSuccess', { defaultValue: 'Override saved successfully' }))
    } catch (error) {
      console.error('Failed to save network override:', error)
      toast.error(error?.message || t('admin.sweep.saveError', { defaultValue: 'Failed to save override' }))
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteNetwork(coinNetworkId) {
    setDeleteTarget({ id: coinNetworkId, type: 'network' })
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
              <h5 className="mb-0">{t('admin.sweep.overridesTitle', { defaultValue: 'Sweep Overrides' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.sweep.overridesDesc', { defaultValue: 'Configure specific sweep settings for individual coins and networks' })}
              </p>
            </div>
            <div className="card-body">
              {/* Coin Overrides */}
              <div className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    {t('admin.sweep.coinOverrides', { defaultValue: 'Coin Overrides' })}
                    <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                      {Object.keys(coinOverrides).length}
                    </span>
                  </h6>
                  {/* Hidden: Add button */}
                </div>
                <SweepOverrideTable
                  overrides={coinOverrides}
                  type="coin"
                  loading={loading}
                  onEdit={handleEditCoin}
                />
              </div>

              {/* Network Overrides */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    {t('admin.sweep.networkOverrides', { defaultValue: 'Network Overrides' })}
                    <span className="badge rounded-pill bg-primary ms-2" style={{ fontSize: '0.75rem', padding: '0.35em 0.65em' }}>
                      {Object.keys(networkOverrides).length}
                    </span>
                  </h6>
                  {/* Hidden: Add button */}
                </div>
                <SweepOverrideTable
                  overrides={networkOverrides}
                  type="network"
                  loading={loading}
                  onEdit={handleEditNetwork}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coin Override Modal */}
      <SweepOverrideFormModal
        type="coin"
        show={showCoinForm}
        loading={loading}
        isEditing={!!editingCoin}
        form={coinForm}
        onFormChange={setCoinForm}
        onSave={handleSaveCoin}
        onClose={() => setShowCoinForm(false)}
      />

      {/* Network Override Modal */}
      <SweepOverrideFormModal
        type="network"
        show={showNetworkForm}
        loading={loading}
        isEditing={!!editingNetwork}
        form={networkForm}
        onFormChange={setNetworkForm}
        onSave={handleSaveNetwork}
        onClose={() => setShowNetworkForm(false)}
      />

      {/* Delete Confirmation Modal */}
      <SweepDeleteModal
        show={showDeleteModal}
        loading={loading}
        target={deleteTarget}
        onConfirm={confirmDelete}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
