'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getNetworkById, updateNetwork } from '@/lib/api/admin'
import { validateAndBuildPayload } from '@/components/crypto/networkFormValidation'
import { logger } from '@/lib/utils/logger'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

export default function NetworkEditModal({ networkId, onClose, onSaved }) {
  const { token } = useAuth()
  const toast = useToast()
  const { t } = useAdminTranslation()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'mainnet',
    chainId: '',
    rpcUrl: '',
    explorerUrl: '',
    apiUrl: '',
    isTestnet: false,
    confirmationBlocks: 1,
    status: 'active',
  })

  const loadNetwork = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const network = await getNetworkById(token, networkId)
      if (network) {
        setFormData({
          name: network.name || '',
          symbol: network.symbol || '',
          type: network.type || 'mainnet',
          chainId: network.chainId || '',
          rpcUrl: network.rpcUrl || '',
          explorerUrl: network.explorerUrl || '',
          apiUrl: network.apiUrl || '',
          isTestnet: !!network.isTestnet,
          confirmationBlocks: network.confirmationBlocks || 1,
          status: network.status || 'active',
        })
      } else {
        setError('Network not found')
      }
    } catch (e) {
      logger.error('Failed to load network:', e)
      setError(e?.message || 'Failed to load network')
    } finally {
      setLoading(false)
    }
  }, [token, networkId])

  useEffect(() => {
    if (networkId) loadNetwork()
  }, [networkId, loadNetwork])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    let v = value
    if (name === 'symbol') v = value.toUpperCase()
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : v,
    }))
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validateUrl(url) {
    if (!url || !url.trim()) return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  function validate() {
    const errors = {}
    if (!formData.name || !formData.name.trim()) {
      errors.name = t('crypto.nameRequired', { defaultValue: 'Name is required' })
    } else if (formData.name.length > 100) {
      errors.name = t('crypto.nameTooLong', { defaultValue: 'Name must be max 100 characters' })
    }
    if (formData.chainId !== '' && formData.chainId !== null && formData.chainId !== undefined) {
      const n = parseInt(formData.chainId)
      if (isNaN(n) || n <= 0) {
        errors.chainId = t('crypto.chainIdPositive', { defaultValue: 'Must be a positive integer' })
      }
    }
    if (formData.confirmationBlocks !== '' && formData.confirmationBlocks !== null) {
      const n = parseInt(formData.confirmationBlocks)
      if (isNaN(n) || n < 1) {
        errors.confirmationBlocks = t('crypto.confirmBlocksMin', { defaultValue: 'Must be at least 1' })
      } else if (n > 1000) {
        errors.confirmationBlocks = t('crypto.confirmBlocksMax', { defaultValue: 'Must be at most 1000' })
      }
    }
    if (!validateUrl(formData.rpcUrl)) errors.rpcUrl = t('crypto.invalidUrl', { defaultValue: 'Must be a valid URL' })
    if (!validateUrl(formData.explorerUrl)) {
      errors.explorerUrl = t('crypto.invalidUrl', { defaultValue: 'Must be a valid URL' })
    }
    if (!validateUrl(formData.apiUrl)) errors.apiUrl = t('crypto.invalidUrl', { defaultValue: 'Must be a valid URL' })
    return errors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setSaving(true)
    setError('')
    setFieldErrors({})

    try {
      const payload = validateAndBuildPayload(formData, true)
      await updateNetwork(token, networkId, payload)
      toast.success(t('crypto.networkUpdateSuccess', { defaultValue: 'Network updated successfully' }))
      onSaved?.()
      onClose()
    } catch (e) {
      logger.error('Failed to update network:', e)
      setError(e?.message || 'Failed to update network')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={saving ? undefined : onClose}
    >
      <div className="w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-xl shadow-xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 shrink-0">
            <h5 className="text-lg font-semibold">
              {t('crypto.editNetwork', { defaultValue: 'Edit Network' })}
              {formData.symbol && <span className="text-primary ml-2">{formData.symbol}</span>}
            </h5>
            <button
              type="button"
              className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"
              onClick={onClose}
              disabled={saving}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <Spinner className="text-primary" />
              </div>
            ) : (
              <>
                {error && (
                  <Alert role="alert" className="mb-4">
                    <i className="bx bx-error-circle mr-2"></i>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} id="network-edit-form" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Symbol (read-only) */}
                    <div>
                      <Label htmlFor="modal-net-symbol">{t('crypto.symbol', { defaultValue: 'Symbol' })}</Label>
                      <Input
                        id="modal-net-symbol"
                        name="symbol"
                        value={formData.symbol}
                        disabled
                        className="uppercase"
                      />
                    </div>

                    {/* Type (read-only) */}
                    <div>
                      <Label htmlFor="modal-net-type">
                        {t('crypto.networkType', { defaultValue: 'Network Type' })}
                      </Label>
                      <Input id="modal-net-type" name="type" value={formData.type} disabled />
                    </div>

                    {/* Name */}
                    <div>
                      <Label htmlFor="modal-net-name">
                        {t('crypto.networkName', { defaultValue: 'Network Name' })}{' '}
                        <span className="text-danger">*</span>
                      </Label>
                      <Input
                        id="modal-net-name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ethereum"
                        maxLength={100}
                        aria-invalid={!!fieldErrors.name}
                        error={!!fieldErrors.name}
                      />
                      {fieldErrors.name && <p className="mt-1 text-sm text-danger-500">{fieldErrors.name}</p>}
                    </div>

                    {/* Status */}
                    <div>
                      <Label htmlFor="modal-net-status">{t('invoices.statusCol', { defaultValue: 'Status' })}</Label>
                      <Select id="modal-net-status" name="status" value={formData.status} onChange={handleChange}>
                        <option value="active">{t('admin.active', { defaultValue: 'Active' })}</option>
                        <option value="inactive">{t('crypto.inactive', { defaultValue: 'Inactive' })}</option>
                        <option value="maintenance">{t('crypto.maintenance', { defaultValue: 'Maintenance' })}</option>
                        <option value="deprecated">{t('crypto.deprecated', { defaultValue: 'Deprecated' })}</option>
                      </Select>
                    </div>

                    {/* Chain ID */}
                    <div>
                      <Label htmlFor="modal-net-chainId">{t('crypto.chainId', { defaultValue: 'Chain ID' })}</Label>
                      <Input
                        id="modal-net-chainId"
                        type="number"
                        name="chainId"
                        value={formData.chainId}
                        onChange={handleChange}
                        placeholder="1"
                        min="1"
                        aria-invalid={!!fieldErrors.chainId}
                        error={!!fieldErrors.chainId}
                      />
                      {fieldErrors.chainId && <p className="mt-1 text-sm text-danger-500">{fieldErrors.chainId}</p>}
                    </div>

                    {/* Confirmation Blocks */}
                    <div>
                      <Label htmlFor="modal-net-confirmBlocks">
                        {t('crypto.confirmationBlocks', { defaultValue: 'Confirmation Blocks' })}{' '}
                        <span className="text-danger">*</span>
                      </Label>
                      <Input
                        id="modal-net-confirmBlocks"
                        type="number"
                        name="confirmationBlocks"
                        value={formData.confirmationBlocks}
                        onChange={handleChange}
                        min="1"
                        max="1000"
                        aria-invalid={!!fieldErrors.confirmationBlocks}
                        error={!!fieldErrors.confirmationBlocks}
                      />
                      {fieldErrors.confirmationBlocks && (
                        <p className="mt-1 text-sm text-danger-500">{fieldErrors.confirmationBlocks}</p>
                      )}
                    </div>

                    {/* RPC URL */}
                    <div className="col-span-2">
                      <Label htmlFor="modal-net-rpcUrl">{t('crypto.rpcUrl', { defaultValue: 'RPC URL' })}</Label>
                      <Input
                        id="modal-net-rpcUrl"
                        type="url"
                        name="rpcUrl"
                        value={formData.rpcUrl}
                        onChange={handleChange}
                        placeholder="https://eth.llamarpc.com"
                        maxLength={500}
                        aria-invalid={!!fieldErrors.rpcUrl}
                        error={!!fieldErrors.rpcUrl}
                      />
                      {fieldErrors.rpcUrl && <p className="mt-1 text-sm text-danger-500">{fieldErrors.rpcUrl}</p>}
                    </div>

                    {/* Explorer URL */}
                    <div className="col-span-2">
                      <Label htmlFor="modal-net-explorerUrl">
                        {t('crypto.explorerUrl', { defaultValue: 'Explorer URL' })}
                      </Label>
                      <Input
                        id="modal-net-explorerUrl"
                        type="url"
                        name="explorerUrl"
                        value={formData.explorerUrl}
                        onChange={handleChange}
                        placeholder="https://etherscan.io"
                        maxLength={500}
                        aria-invalid={!!fieldErrors.explorerUrl}
                        error={!!fieldErrors.explorerUrl}
                      />
                      {fieldErrors.explorerUrl && (
                        <p className="mt-1 text-sm text-danger-500">{fieldErrors.explorerUrl}</p>
                      )}
                    </div>

                    {/* API URL */}
                    <div className="col-span-2">
                      <Label htmlFor="modal-net-apiUrl">{t('crypto.apiUrl', { defaultValue: 'API URL' })}</Label>
                      <Input
                        id="modal-net-apiUrl"
                        type="url"
                        name="apiUrl"
                        value={formData.apiUrl}
                        onChange={handleChange}
                        placeholder="https://api.etherscan.io/api"
                        maxLength={500}
                        aria-invalid={!!fieldErrors.apiUrl}
                        error={!!fieldErrors.apiUrl}
                      />
                      {fieldErrors.apiUrl && <p className="mt-1 text-sm text-danger-500">{fieldErrors.apiUrl}</p>}
                    </div>

                    {/* Is Testnet */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <input
                          className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                          type="checkbox"
                          id="modal-net-isTestnet"
                          name="isTestnet"
                          checked={formData.isTestnet}
                          onChange={handleChange}
                        />
                        <label className="text-sm text-surface-700" htmlFor="modal-net-isTestnet">
                          {t('crypto.isTestnet', { defaultValue: 'Testnet' })}
                        </label>
                      </div>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-surface-200 shrink-0">
              <Button variant="label-secondary" onClick={onClose} disabled={saving}>
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button type="submit" form="network-edit-form" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    {t('actions.saving', { defaultValue: 'Saving...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-save mr-2"></i>
                    {t('actions.update', { defaultValue: 'Update' })}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
