'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import { getSweepSettings, updateSweepSetting } from '@/lib/api/admin'
import { useToast } from '@/app/providers'
import OverrideTable from '@/components/admin/withdrawal-overrides/OverrideTable'
import OverrideFormModal from '@/components/admin/withdrawal-overrides/OverrideFormModal'
import DeleteConfirmModal from '@/components/admin/withdrawal-overrides/DeleteConfirmModal'
import { logger } from '@/lib/utils/logger'

export default function WithdrawalOverrides() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [coinOverrides, setCoinOverrides] = useState({})
  const [networkOverrides, setNetworkOverrides] = useState({})
  const [coinNetworkOverrides, setCoinNetworkOverrides] = useState({})

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'coin', 'network', 'coinNetwork'
  const [editingKey, setEditingKey] = useState(null)
  const [formData, setFormData] = useState({
    key: '',
    minimum: '',
    maximum: '',
    feeType: 'percentage',
    feePercentage: '',
    feeMin: '',
    feeMax: '',
    feeFixed: ''
  })

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState({ key: '', type: '' })

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

      setCoinOverrides(settingsMap.coin_overrides?.parsedValue || {})
      setNetworkOverrides(settingsMap.network_overrides?.parsedValue || {})
      setCoinNetworkOverrides(settingsMap.coin_network_overrides?.parsedValue || {})
    } catch (error) {
      logger.error('Failed to load withdrawal overrides:', error)
      toast.error(t('admin.withdrawal.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  function handleEdit(type, key, config) {
    setModalType(type)
    setEditingKey(key)
    setFormData({
      key: key,
      minimum: config.minimum || '',
      maximum: config.maximum || '',
      feeType: config.fee?.type || 'percentage',
      feePercentage: config.fee?.percentage || '',
      feeMin: config.fee?.min || '',
      feeMax: config.fee?.max || '',
      feeFixed: config.fee?.fixed || ''
    })
    setShowModal(true)
  }

  async function handleSave() {
    try {
      if (!formData.key.trim()) {
        toast.error(t('admin.withdrawal.keyRequired', { defaultValue: 'Key is required' }))
        return
      }

      const config = {}
      if (formData.minimum) config.minimum = formData.minimum
      if (formData.maximum) config.maximum = formData.maximum

      config.fee = { type: formData.feeType }
      if (formData.feeType === 'percentage') {
        if (formData.feePercentage) config.fee.percentage = formData.feePercentage
        if (formData.feeMin) config.fee.min = formData.feeMin
        if (formData.feeMax) config.fee.max = formData.feeMax
      } else if (formData.feeType === 'fixed') {
        if (formData.feeFixed) config.fee.fixed = formData.feeFixed
      }

      setLoading(true)

      let newData, settingKey
      if (modalType === 'coin') {
        newData = { ...coinOverrides, [formData.key.toUpperCase()]: config }
        settingKey = 'payment.withdraw.coin_overrides'
        await updateSweepSetting(token, settingKey, newData)
        setCoinOverrides(newData)
      } else if (modalType === 'network') {
        newData = { ...networkOverrides, [formData.key.toUpperCase()]: config }
        settingKey = 'payment.withdraw.network_overrides'
        await updateSweepSetting(token, settingKey, newData)
        setNetworkOverrides(newData)
      } else if (modalType === 'coinNetwork') {
        newData = { ...coinNetworkOverrides, [formData.key]: config }
        settingKey = 'payment.withdraw.coin_network_overrides'
        await updateSweepSetting(token, settingKey, newData)
        setCoinNetworkOverrides(newData)
      }

      setShowModal(false)
      toast.success(t('admin.withdrawal.saveSuccess', { defaultValue: 'Override saved successfully' }))
    } catch (error) {
      logger.error('Failed to save:', error)
      toast.error(error?.message || t('admin.withdrawal.saveError', { defaultValue: 'Failed to save override' }))
    } finally {
      setLoading(false)
    }
  }

  function handleDelete(type, key) {
    setDeleteTarget({ key, type })
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    try {
      setLoading(true)

      let newData, settingKey
      if (deleteTarget.type === 'coin') {
        newData = { ...coinOverrides }
        delete newData[deleteTarget.key]
        settingKey = 'payment.withdraw.coin_overrides'
        await updateSweepSetting(token, settingKey, newData)
        setCoinOverrides(newData)
      } else if (deleteTarget.type === 'network') {
        newData = { ...networkOverrides }
        delete newData[deleteTarget.key]
        settingKey = 'payment.withdraw.network_overrides'
        await updateSweepSetting(token, settingKey, newData)
        setNetworkOverrides(newData)
      } else if (deleteTarget.type === 'coinNetwork') {
        newData = { ...coinNetworkOverrides }
        delete newData[deleteTarget.key]
        settingKey = 'payment.withdraw.coin_network_overrides'
        await updateSweepSetting(token, settingKey, newData)
        setCoinNetworkOverrides(newData)
      }

      setShowDeleteModal(false)
      toast.success(t('admin.withdrawal.deleteSuccess', { defaultValue: 'Override deleted successfully' }))
    } catch (error) {
      logger.error('Failed to delete:', error)
      toast.error(error?.message || t('admin.withdrawal.deleteError', { defaultValue: 'Failed to delete override' }))
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
              <h5 className="mb-0">{t('admin.withdrawal.overrides', { defaultValue: 'Overrides' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.withdrawal.overridesDescription', { defaultValue: 'Coin, network, and coin-network specific withdrawal configurations' })}
              </p>
            </div>
            <div className="card-body">
              <OverrideTable type="coin" data={coinOverrides} onEdit={handleEdit} loading={loading} />
              <OverrideTable type="network" data={networkOverrides} onEdit={handleEdit} loading={loading} />
              <OverrideTable type="coinNetwork" data={coinNetworkOverrides} onEdit={handleEdit} loading={loading} />
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <OverrideFormModal
          modalType={modalType}
          editingKey={editingKey}
          formData={formData}
          setFormData={setFormData}
          loading={loading}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          loading={loading}
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}
