'use client'

import { useState, useEffect, useCallback } from 'react'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useAuth } from '@/app/providers'
import { useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getCoinById, updateCoin } from '@/lib/api/admin'
import { logger } from '@/lib/utils/logger'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

export default function CoinEditModal({ coinId, onClose, onSaved }) {
  const { token } = useAuth()
  const toast = useToast()
  const { t } = useAdminTranslation()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formData, setFormData] = useState({
    type: 'native',
    symbol: '',
    name: '',
    decimals: 8,
    logoUrl: '',
    status: 'active',
  })

  const loadCoin = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const coin = await getCoinById(token, coinId)
      if (coin) {
        setFormData({
          type: coin.type || 'native',
          symbol: coin.symbol || '',
          name: coin.name || '',
          decimals: coin.decimals || 8,
          logoUrl: coin.logoUrl || '',
          status: coin.status || 'active',
        })
      } else {
        setError('Coin not found')
      }
    } catch (e) {
      logger.error('Failed to load coin:', e)
      setError(e?.message || 'Failed to load coin')
    } finally {
      setLoading(false)
    }
  }, [token, coinId])

  useEffect(() => {
    if (coinId) loadCoin()
  }, [coinId, loadCoin])

  useEscapeKey(() => { if (!saving) onClose() })

  function handleChange(e) {
    const { name, value } = e.target
    let v = value
    if (name === 'symbol') v = value.toUpperCase()
    if (name === 'decimals' && value !== '') {
      const num = parseInt(value)
      if (num < 0 || num > 18) return
    }
    setFormData((prev) => ({ ...prev, [name]: v }))
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errors = {}
    if (!formData.name || !formData.name.trim()) {
      errors.name = t('crypto.nameRequired', { defaultValue: 'Name is required' })
    } else if (formData.name.length > 30) {
      errors.name = t('crypto.nameTooLong', { defaultValue: 'Name must be max 30 characters' })
    }
    if (formData.logoUrl) {
      try {
        new URL(formData.logoUrl)
      } catch {
        errors.logoUrl = t('crypto.invalidUrl', { defaultValue: 'Must be a valid URL' })
      }
    }
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
      await updateCoin(token, coinId, {
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        decimals: parseInt(formData.decimals),
        type: formData.type,
        logoUrl: formData.logoUrl || undefined,
        status: formData.status || 'active',
      })

      toast.success(t('crypto.coinUpdateSuccess', { defaultValue: 'Coin updated successfully' }))
      onSaved?.()
      onClose()
    } catch (e) {
      logger.error('Failed to update coin:', e)
      setError(e?.message || 'Failed to update coin')
    } finally {
      setSaving(false)
    }
  }

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
              {t('crypto.editCoin', { defaultValue: 'Edit Coin' })}
              {formData.symbol ? <span className="text-primary ml-2">{formData.symbol}</span> : null}
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

                <form onSubmit={handleSubmit} id="coin-edit-form" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="modal-symbol">{t('crypto.symbol', { defaultValue: 'Symbol' })}</Label>
                      <Input id="modal-symbol" name="symbol" value={formData.symbol} disabled className="uppercase" />
                    </div>
                    <div>
                      <Label htmlFor="modal-type">{t('crypto.type', { defaultValue: 'Type' })}</Label>
                      <Input
                        id="modal-type"
                        name="type"
                        value={formData.type === 'native' ? 'Native' : 'Token'}
                        disabled
                      />
                    </div>
                    <div>
                      <Label htmlFor="modal-name">
                        {t('crypto.coinName', { defaultValue: 'Name' })} <span className="text-danger">*</span>
                      </Label>
                      <Input
                        id="modal-name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Bitcoin"
                        maxLength={30}
                        aria-invalid={!!fieldErrors.name}
                        error={!!fieldErrors.name}
                      />
                      {fieldErrors.name ? <p className="mt-1 text-sm text-danger-500">{fieldErrors.name}</p> : null}
                    </div>
                    <div>
                      <Label htmlFor="modal-status">{t('invoices.statusCol', { defaultValue: 'Status' })}</Label>
                      <Select id="modal-status" name="status" value={formData.status} onChange={handleChange}>
                        <option value="active">{t('admin.active', { defaultValue: 'Active' })}</option>
                        <option value="inactive">{t('crypto.inactive', { defaultValue: 'Inactive' })}</option>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="modal-logoUrl">{t('crypto.logoUrl', { defaultValue: 'Logo URL' })}</Label>
                      <Input
                        id="modal-logoUrl"
                        name="logoUrl"
                        type="url"
                        value={formData.logoUrl}
                        onChange={handleChange}
                        placeholder="https://example.com/logo.png"
                        aria-invalid={!!fieldErrors.logoUrl}
                        error={!!fieldErrors.logoUrl}
                      />
                      {fieldErrors.logoUrl ? <p className="mt-1 text-sm text-danger-500">{fieldErrors.logoUrl}</p> : null}
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
              <Button type="submit" form="coin-edit-form" disabled={saving}>
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
