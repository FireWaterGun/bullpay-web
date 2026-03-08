'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb'

import dynamic from 'next/dynamic'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useAuth } from '@/app/providers'
import { getCoinById, createCoin, updateCoin, deleteCoin } from '@/lib/api/admin'
const DeleteConfirmModal = dynamic(() => import('@/components/modals/DeleteConfirmModal'), { ssr: false })
const ErrorModal = dynamic(() => import('@/components/modals/ErrorModal'), { ssr: false })
import { useToast } from '@/app/providers'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, Label, Select } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

export default function CoinForm() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const toast = useToast()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
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
      const coin = await getCoinById(token, parseInt(id))

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
      setError(e?.message || 'Failed to load coin')
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => {
    if (isEdit && id) {
      loadCoin()
    }
  }, [isEdit, id, loadCoin])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    let processedValue = value

    // Auto-uppercase symbol
    if (name === 'symbol') {
      processedValue = value.toUpperCase()
    }

    // Validate decimals field (0-18 only)
    if (name === 'decimals' && value !== '') {
      const num = parseInt(value)
      if (num < 0 || num > 18) {
        return // Don't update if out of range
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue,
    }))
  }

  async function handleDelete() {
    if (!isEdit || !id) return

    setLoading(true)
    setError('')
    setShowDeleteConfirm(false)

    try {
      await deleteCoin(token, parseInt(id))
      router.push('/admin/coins')
    } catch (e) {
      const message = e?.message || 'Failed to delete coin'
      setErrorMessage(message)
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validation
      if (!isEdit) {
        // Create mode - validate required fields
        if (!formData.symbol || formData.symbol.length > 10) {
          throw new Error('Symbol is required and must be max 10 characters')
        }
        if (!formData.name || formData.name.length > 100) {
          throw new Error('Name is required and must be max 100 characters')
        }
      }

      // Validate decimals (always check for both create and edit)
      if (formData.decimals !== '' && formData.decimals !== null && formData.decimals !== undefined) {
        const decimals = parseInt(formData.decimals)
        if (decimals < 0 || decimals > 18) {
          throw new Error(t('crypto.decimalsRangeError', { defaultValue: 'Decimals must be between 0 and 18' }))
        }
      }

      // Validate logoUrl if provided
      if (formData.logoUrl) {
        try {
          new URL(formData.logoUrl)
        } catch {
          throw new Error('Logo URL must be a valid URL')
        }
      }

      const data = {
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        decimals: parseInt(formData.decimals),
        type: formData.type,
        logoUrl: formData.logoUrl || undefined,
        status: formData.status || 'active',
      }

      if (isEdit) {
        await updateCoin(token, parseInt(id), data)
        toast.success(t('crypto.coinUpdateSuccess', { defaultValue: 'Coin updated successfully' }))
      } else {
        await createCoin(token, data)
        toast.success(t('crypto.coinCreateSuccess', { defaultValue: 'Coin created successfully' }))
      }
      router.push('/admin/coins')
    } catch (e) {
      const message = e?.message || (isEdit ? 'Failed to update coin' : 'Failed to create coin')
      setErrorMessage(message)
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEdit) {
    return (
      <div className="grow pb-6">
        <div className="text-center py-6">
          <Spinner role="status" className="text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="grow pb-6">
      {/* Header */}
      <AdminBreadcrumb items={[
        { label: t('crypto.coins', { defaultValue: 'Coins' }), href: '/admin/coins', icon: 'bx-coin-stack' },
        { label: isEdit ? t('crypto.editCoin', { defaultValue: 'Edit Coin' }) : t('crypto.createCoin', { defaultValue: 'Create Coin' }) },
      ]} />

      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12 xl:col-span-8">
          <Card className="mb-4">
            <h5 className="px-5 py-4 border-b border-surface-200">
              {t('crypto.coinInformation', { defaultValue: 'Coin Information' })}
            </h5>
            <div className="p-5">
              {error && (
                <Alert role="alert" className="mb-4">
                  <i className="bx bx-error-circle mr-2"></i>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-12 gap-x-6 gap-4">
                  {/* Symbol */}
                  <div className="col-span-12 md:col-span-6">
                    <Label htmlFor="symbol">
                      {t('crypto.symbol', { defaultValue: 'Symbol' })} <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="symbol"
                      name="symbol"
                      value={formData.symbol}
                      onChange={handleChange}
                      placeholder="BTC"
                      maxLength={10}
                      pattern="[A-Z0-9]+"
                      required
                      disabled={isEdit}
                      className="uppercase"
                    />

                    <small className="text-surface-500">
                      {t('crypto.symbolHelp', { defaultValue: 'Coin ticker symbol (e.g., BTC, ETH)' })}
                    </small>
                  </div>

                  {/* Name */}
                  <div className="col-span-12 md:col-span-6">
                    <Label htmlFor="name">
                      {t('crypto.coinName', { defaultValue: 'Name' })} <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Bitcoin"
                      maxLength={30}
                      required
                    />

                    <small className="text-surface-500">
                      {t('crypto.nameHelp', { defaultValue: 'Full coin name' })}
                    </small>
                  </div>

                  {/* Type */}
                  <div className="col-span-12 md:col-span-6">
                    <Label htmlFor="type">
                      {t('crypto.type', { defaultValue: 'Type' })} <span className="text-danger">*</span>
                    </Label>
                    <Select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      disabled={isEdit}
                    >
                      <option value="native">{t('crypto.native', { defaultValue: 'Native' })}</option>
                      <option value="token">{t('crypto.token', { defaultValue: 'Token' })}</option>
                    </Select>
                    <small className="text-surface-500">
                      {t('crypto.typeHelp', { defaultValue: 'Native blockchain coin or ERC-20/BEP-20 token' })}
                    </small>
                  </div>

                  {/* Decimals */}
                  <div className="col-span-12 md:col-span-6">
                    <Label htmlFor="decimals">
                      {t('crypto.decimals', { defaultValue: 'Decimals' })} <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="number"
                      id="decimals"
                      name="decimals"
                      value={formData.decimals}
                      onChange={handleChange}
                      min="0"
                      max="18"
                      required
                      disabled={isEdit}
                    />

                    <small className="text-surface-500">
                      {t('crypto.decimalsHelp', { defaultValue: 'Number of decimal places (0-18)' })}
                    </small>
                  </div>

                  {/* Status */}
                  <div className="col-span-12 md:col-span-6">
                    <Label htmlFor="status">{t('invoices.statusCol')}</Label>
                    <Select id="status" name="status" value={formData.status} onChange={handleChange}>
                      <option value="active">{t('admin.active', { defaultValue: 'Active' })}</option>
                      <option value="inactive">{t('crypto.inactive', { defaultValue: 'Inactive' })}</option>
                    </Select>
                  </div>

                  {/* Logo URL */}
                  <div className="col-span-12">
                    <Label htmlFor="logoUrl">{t('crypto.logoUrl', { defaultValue: 'Logo URL' })}</Label>
                    <Input
                      type="url"
                      id="logoUrl"
                      name="logoUrl"
                      value={formData.logoUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/logo.png"
                    />

                    <small className="text-surface-500">
                      {t('crypto.logoUrlHelp', { defaultValue: 'External URL to coin logo image' })}
                    </small>
                  </div>

                  {/* Actions */}
                  <div className="col-span-12 pt-3">
                    <div className="flex gap-3 justify-between">
                      <div className="flex gap-3 ml-auto">
                        <Button variant="label-secondary" href="/admin/coins">
                          {t('actions.cancel', { defaultValue: 'Cancel' })}
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? (
                            <>
                              <Spinner role="status" className="w-4 h-4 mr-2" />
                              {t('actions.saving', { defaultValue: 'Saving...' })}
                            </>
                          ) : (
                            <>
                              <i className="bx bx-save mr-2"></i>
                              {isEdit
                                ? t('actions.update', { defaultValue: 'Update' })
                                : t('actions.create', { defaultValue: 'Create' })}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </div>

      <DeleteConfirmModal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={loading}
        message={t('crypto.deleteConfirmMessage', { defaultValue: 'Are you sure you want to delete this coin?' })}
        itemName={formData.symbol}
        itemDetails={`- ${formData.name}`}
      />

      <ErrorModal show={showErrorModal} onClose={() => setShowErrorModal(false)} message={errorMessage} />
    </div>
  )
}
