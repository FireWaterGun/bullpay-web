import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings, updateSweepSetting } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'

const FIELD_MAP = {
  minPriority: { field: 'minPriorityFeeByChain', key: 'evm.fee_policy.min_priority_fee_by_chain' },
  headroom: { field: 'headroomByChain', key: 'evm.fee_policy.headroom_by_chain' },
  maxFeeCap: { field: 'maxFeeCapByChain', key: 'evm.fee_policy.max_fee_cap_by_chain' },
  maxPriorityCap: { field: 'maxPriorityCapByChain', key: 'evm.fee_policy.max_priority_cap_by_chain' },
  sweepMaxFeeCap: { field: 'sweepMaxFeeCapByChain', key: 'evm.fee_policy.sweep_max_fee_cap_by_chain' },
  sweepMaxPriorityCap: { field: 'sweepMaxPriorityCapByChain', key: 'evm.fee_policy.sweep_max_priority_cap_by_chain' },
  withdrawMaxFeeCap: { field: 'withdrawMaxFeeCapByChain', key: 'evm.fee_policy.withdraw_max_fee_cap_by_chain' },
  withdrawMaxPriorityCap: { field: 'withdrawMaxPriorityCapByChain', key: 'evm.fee_policy.withdraw_max_priority_cap_by_chain' }
}

export { FIELD_MAP }

export default function useEVMFeePolicy() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [settings, setSettings] = useState({})
  const [originalData, setOriginalData] = useState({})
  const [formData, setFormData] = useState({
    defaultMinPriorityFee: '',
    minPriorityFeeByChain: {},
    headroomMultiplier: '',
    headroomByChain: {},
    maxFeeCapByChain: {},
    maxPriorityCapByChain: {},
    sweepMaxFeeCapByChain: {},
    sweepMaxPriorityCapByChain: {},
    withdrawMaxFeeCapByChain: {},
    withdrawMaxPriorityCapByChain: {},
    bumpMultiplierUnderpriced: '',
    bumpMultiplierReplacement: ''
  })

  // Modal states
  const [showChainModal, setShowChainModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [chainModalType, setChainModalType] = useState('')
  const [chainForm, setChainForm] = useState({ chainId: '', value: '' })
  const [editingChain, setEditingChain] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState({ chainId: '', type: '' })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoadingData(true)
      const data = await getSweepSettings(token, 'blockchain', 'global', 1, 100)

      const settingsMap = {}
      data.forEach(setting => {
        const key = setting.keyName.replace('evm.fee_policy.', '')
        settingsMap[key] = setting
      })

      const initialData = {
        defaultMinPriorityFee: settingsMap.default_min_priority_fee?.parsedValue || '',
        minPriorityFeeByChain: settingsMap.min_priority_fee_by_chain?.parsedValue || {},
        headroomMultiplier: settingsMap.headroom_multiplier?.parsedValue || '',
        headroomByChain: settingsMap.headroom_by_chain?.parsedValue || {},
        maxFeeCapByChain: settingsMap.max_fee_cap_by_chain?.parsedValue || {},
        maxPriorityCapByChain: settingsMap.max_priority_cap_by_chain?.parsedValue || {},
        sweepMaxFeeCapByChain: settingsMap.sweep_max_fee_cap_by_chain?.parsedValue || {},
        sweepMaxPriorityCapByChain: settingsMap.sweep_max_priority_cap_by_chain?.parsedValue || {},
        withdrawMaxFeeCapByChain: settingsMap.withdraw_max_fee_cap_by_chain?.parsedValue || {},
        withdrawMaxPriorityCapByChain: settingsMap.withdraw_max_priority_cap_by_chain?.parsedValue || {},
        bumpMultiplierUnderpriced: settingsMap.bump_multiplier_underpriced?.parsedValue || '',
        bumpMultiplierReplacement: settingsMap.bump_multiplier_replacement?.parsedValue || ''
      }

      setFormData(initialData)
      setOriginalData(JSON.parse(JSON.stringify(initialData)))
      setSettings(settingsMap)
    } catch (error) {
      console.error('Failed to load EVM fee policy settings:', error)
      toast.error(t('admin.evm.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      setLoading(true)

      const updates = []

      if (formData.defaultMinPriorityFee !== originalData.defaultMinPriorityFee) {
        updates.push({ key: 'evm.fee_policy.default_min_priority_fee', value: formData.defaultMinPriorityFee })
      }

      if (JSON.stringify(formData.minPriorityFeeByChain) !== JSON.stringify(originalData.minPriorityFeeByChain)) {
        updates.push({ key: 'evm.fee_policy.min_priority_fee_by_chain', value: formData.minPriorityFeeByChain })
      }

      if (formData.headroomMultiplier !== originalData.headroomMultiplier) {
        updates.push({ key: 'evm.fee_policy.headroom_multiplier', value: formData.headroomMultiplier })
      }

      if (JSON.stringify(formData.headroomByChain) !== JSON.stringify(originalData.headroomByChain)) {
        updates.push({ key: 'evm.fee_policy.headroom_by_chain', value: formData.headroomByChain })
      }

      if (JSON.stringify(formData.maxFeeCapByChain) !== JSON.stringify(originalData.maxFeeCapByChain)) {
        updates.push({ key: 'evm.fee_policy.max_fee_cap_by_chain', value: formData.maxFeeCapByChain })
      }

      if (JSON.stringify(formData.maxPriorityCapByChain) !== JSON.stringify(originalData.maxPriorityCapByChain)) {
        updates.push({ key: 'evm.fee_policy.max_priority_cap_by_chain', value: formData.maxPriorityCapByChain })
      }

      if (JSON.stringify(formData.sweepMaxFeeCapByChain) !== JSON.stringify(originalData.sweepMaxFeeCapByChain)) {
        updates.push({ key: 'evm.fee_policy.sweep_max_fee_cap_by_chain', value: formData.sweepMaxFeeCapByChain })
      }

      if (JSON.stringify(formData.sweepMaxPriorityCapByChain) !== JSON.stringify(originalData.sweepMaxPriorityCapByChain)) {
        updates.push({ key: 'evm.fee_policy.sweep_max_priority_cap_by_chain', value: formData.sweepMaxPriorityCapByChain })
      }

      if (JSON.stringify(formData.withdrawMaxFeeCapByChain) !== JSON.stringify(originalData.withdrawMaxFeeCapByChain)) {
        updates.push({ key: 'evm.fee_policy.withdraw_max_fee_cap_by_chain', value: formData.withdrawMaxFeeCapByChain })
      }

      if (JSON.stringify(formData.withdrawMaxPriorityCapByChain) !== JSON.stringify(originalData.withdrawMaxPriorityCapByChain)) {
        updates.push({ key: 'evm.fee_policy.withdraw_max_priority_cap_by_chain', value: formData.withdrawMaxPriorityCapByChain })
      }

      if (formData.bumpMultiplierUnderpriced !== originalData.bumpMultiplierUnderpriced) {
        updates.push({ key: 'evm.fee_policy.bump_multiplier_underpriced', value: formData.bumpMultiplierUnderpriced })
      }

      if (formData.bumpMultiplierReplacement !== originalData.bumpMultiplierReplacement) {
        updates.push({ key: 'evm.fee_policy.bump_multiplier_replacement', value: formData.bumpMultiplierReplacement })
      }

      if (updates.length === 0) {
        toast.info(t('admin.evm.noChanges', { defaultValue: 'No changes to save' }))
        return
      }

      await Promise.all(updates.map(u => updateSweepSetting(token, u.key, u.value)))

      const updatedSettings = updates.map(u => {
        const keyName = u.key.replace('evm.fee_policy.', '').replace(/_/g, ' ')
        return keyName.charAt(0).toUpperCase() + keyName.slice(1)
      }).join(', ')

      toast.success(
        `Updated ${updates.length} setting(s) successfully! - ${updatedSettings}`,
        5000
      )

      await loadSettings()
    } catch (error) {
      console.error('Failed to save EVM fee policy settings:', error)
      toast.error(error?.message || t('admin.evm.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  function handleReset() {
    if (confirm(t('admin.evm.resetConfirm', { defaultValue: 'Are you sure you want to reset all settings?' }))) {
      loadSettings()
    }
  }

  function validateNumberInput(e) {
    const value = e.target.value
    if (value.length > 20) {
      e.target.value = value.slice(0, 20)
    }
  }

  function hasChanges() {
    return JSON.stringify(formData) !== JSON.stringify(originalData)
  }

  function countChanges() {
    let count = 0
    Object.keys(formData).forEach(key => {
      if (JSON.stringify(formData[key]) !== JSON.stringify(originalData[key])) {
        count++
      }
    })
    return count
  }

  function handleChainValueChange(field, chainId, value) {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [chainId]: value === '' ? undefined : parseFloat(value)
      }
    }))
  }

  function handleRemoveChain(field, chainId) {
    setFormData(prev => {
      const newObj = { ...prev[field] }
      delete newObj[chainId]
      return { ...prev, [field]: newObj }
    })
  }

  function handleAddChain(type) {
    setChainModalType(type)
    setChainForm({ chainId: '', value: '' })
    setEditingChain(null)
    setShowChainModal(true)
  }

  function handleEditChain(type, chainId, value) {
    setChainModalType(type)
    setChainForm({ chainId, value: String(value) })
    setEditingChain(chainId)
    setShowChainModal(true)
  }

  async function handleSaveChain() {
    try {
      if (!chainForm.chainId.trim()) {
        toast.error(t('admin.evm.chainIdRequired', { defaultValue: 'Chain ID is required' }))
        return
      }
      if (!chainForm.value) {
        toast.error(t('admin.evm.valueRequired', { defaultValue: 'Value is required' }))
        return
      }

      setLoading(true)

      const config = FIELD_MAP[chainModalType]
      if (!config) return

      const newData = { ...formData[config.field], [chainForm.chainId]: parseFloat(chainForm.value) }
      await updateSweepSetting(token, config.key, newData)

      setFormData(prev => ({ ...prev, [config.field]: newData }))
      setOriginalData(prev => ({ ...prev, [config.field]: newData }))
      setShowChainModal(false)
      toast.success(t('admin.evm.saveSuccess', { defaultValue: 'Settings saved successfully' }))
    } catch (error) {
      console.error('Failed to save chain setting:', error)
      toast.error(error?.message || t('admin.evm.saveError', { defaultValue: 'Failed to save settings' }))
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteChain(type, chainId) {
    setDeleteTarget({ chainId, type })
    setShowDeleteModal(true)
  }

  async function confirmDelete() {
    try {
      setLoading(true)

      const config = FIELD_MAP[deleteTarget.type]
      if (!config) return

      const newData = { ...formData[config.field] }
      delete newData[deleteTarget.chainId]
      await updateSweepSetting(token, config.key, newData)

      setFormData(prev => ({ ...prev, [config.field]: newData }))
      setOriginalData(prev => ({ ...prev, [config.field]: newData }))
      setShowDeleteModal(false)
      toast.success(t('admin.evm.deleteSuccess', { defaultValue: 'Deleted successfully' }))
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error(error?.message || t('admin.evm.deleteError', { defaultValue: 'Failed to delete' }))
    } finally {
      setLoading(false)
    }
  }

  function getChainModalTitle() {
    const titles = {
      minPriority: 'Min Priority Fee',
      headroom: 'Headroom Multiplier',
      maxFeeCap: 'Max Fee Cap',
      maxPriorityCap: 'Max Priority Cap',
      sweepMaxFeeCap: 'Sweep Max Fee Cap',
      sweepMaxPriorityCap: 'Sweep Max Priority Cap',
      withdrawMaxFeeCap: 'Withdraw Max Fee Cap',
      withdrawMaxPriorityCap: 'Withdraw Max Priority Cap'
    }
    return t(`admin.evm.${chainModalType}`, { defaultValue: titles[chainModalType] || 'Chain Setting' })
  }

  return {
    loading,
    loadingData,
    settings,
    formData,
    originalData,
    showChainModal,
    setShowChainModal,
    showDeleteModal,
    setShowDeleteModal,
    chainModalType,
    chainForm,
    setChainForm,
    editingChain,
    deleteTarget,
    handleSave,
    handleInputChange,
    handleReset,
    validateNumberInput,
    hasChanges,
    countChanges,
    handleChainValueChange,
    handleRemoveChain,
    handleAddChain,
    handleEditChain,
    handleSaveChain,
    handleDeleteChain,
    confirmDelete,
    getChainModalTitle
  }
}
