'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getCoinNetworkById, updateCoinNetwork } from '@/lib/api/admin'
import { logger } from '@/lib/utils/logger'
import CoinImg from '@/components/CoinImg'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Select, Label } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

export default function CoinNetworkEditModal({ coinNetworkId, onClose, onSaved }) {
  const { token } = useAuth()
  const toast = useToast()
  const { t } = useAdminTranslation()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [coinNetwork, setCoinNetwork] = useState(null)
  const [formData, setFormData] = useState({
    withdrawEnabled: true,
    status: 'active',
  })

  const loadCoinNetwork = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getCoinNetworkById(token, coinNetworkId)
      if (data) {
        setCoinNetwork(data)
        setFormData({
          withdrawEnabled: data.withdrawEnabled ?? true,
          status: data.status || 'active',
        })
      } else {
        setError('Coin network not found')
      }
    } catch (e) {
      logger.error('Failed to load coin network:', e)
      setError(e?.message || 'Failed to load coin network')
    } finally {
      setLoading(false)
    }
  }, [token, coinNetworkId])

  useEffect(() => {
    if (coinNetworkId) loadCoinNetwork()
  }, [coinNetworkId, loadCoinNetwork])

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      await updateCoinNetwork(token, coinNetworkId, {
        withdrawEnabled: formData.withdrawEnabled,
        status: formData.status || 'active',
      })

      toast.success(t('crypto.updateSuccess', { defaultValue: 'Coin network updated successfully' }))
      onSaved?.()
      onClose()
    } catch (e) {
      logger.error('Failed to update coin network:', e)
      setError(e?.message || 'Failed to update coin network')
    } finally {
      setSaving(false)
    }
  }

  const coin = coinNetwork?.coin
  const network = coinNetwork?.network

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={saving ? undefined : onClose}
    >
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
            <h5 className="text-lg font-semibold">
              {t('crypto.editCoinNetwork', { defaultValue: 'Edit Coin-Network' })}
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
          <div className="p-5">
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

                {/* Read-only info */}
                {coinNetwork && (
                  <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-white/4 rounded-lg mb-4">
                    <CoinImg coin={coin} symbol={coin?.symbol} networkSymbol={network?.symbol} size={36} showFallback />
                    <div className="min-w-0">
                      <div className="font-medium">
                        {coin?.name || 'N/A'} <span className="text-surface-500">({coin?.symbol})</span>
                      </div>
                      <div className="text-sm text-surface-500">
                        {network?.name || 'N/A'}
                        {network?.chainId && <span className="ml-1">(Chain ID: {network.chainId})</span>}
                      </div>
                      {coinNetwork.contractAddress && (
                        <div className="text-xs text-surface-400 font-mono truncate mt-0.5">
                          {coinNetwork.contractAddress}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} id="coin-network-edit-form">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="modal-cn-status">
                        {t('crypto.status', { defaultValue: 'Status' })} <span className="text-danger">*</span>
                      </Label>
                      <Select
                        id="modal-cn-status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                      >
                        <option value="active">{t('crypto.statusActive', { defaultValue: 'Active' })}</option>
                        <option value="inactive">{t('crypto.statusInactive', { defaultValue: 'Inactive' })}</option>
                        <option value="maintenance">
                          {t('crypto.statusMaintenance', { defaultValue: 'Maintenance' })}
                        </option>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <div className="flex items-center justify-between w-full p-3 border border-surface-200 rounded-lg">
                        <div>
                          <div className="text-sm font-medium">
                            {t('crypto.withdrawEnabled', { defaultValue: 'Withdraw Enabled' })}
                          </div>
                        </div>
                        <input
                          className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                          type="checkbox"
                          name="withdrawEnabled"
                          id="modal-cn-withdrawEnabled"
                          checked={formData.withdrawEnabled}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-surface-200">
              <Button variant="label-secondary" onClick={onClose} disabled={saving}>
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button type="submit" form="coin-network-edit-form" disabled={saving}>
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
