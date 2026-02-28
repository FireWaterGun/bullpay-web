'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth, useToast } from '@/app/providers'
import { getWallet, updateWallet, deleteWallet } from '@/lib/api/wallets'
import ConfirmModal from '@/components/ConfirmModal'

export default function WalletEdit() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()

  const walletId = params?.id
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    label: '',
    address: '',
    memo: '',
  })

  useEffect(() => {
    if (token && walletId) loadWallet()
  }, [token, walletId])

  async function loadWallet() {
    try {
      setLoading(true)
      const data = await getWallet(walletId, token)
      setWallet(data)
      if (data) {
        setForm({
          label: data.label || '',
          address: data.address || '',
          memo: data.memo || '',
        })
      }
    } catch (err) {
      toast.error( t('wallets.loadError', { defaultValue: 'Failed to load wallet' }))
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.label) {
      toast.error( t('wallets.labelRequired', { defaultValue: 'Label is required' }))
      return
    }
    try {
      setSaving(true)
      await updateWallet(walletId, {
        label: form.label,
        memo: form.memo || undefined,
      }, token)
      toast.success( t('wallets.updateSuccess', { defaultValue: 'Address updated successfully' }))
      router.push('/withdrawals')
    } catch (err) {
      toast.error( err?.message || t('wallets.updateError', { defaultValue: 'Failed to update address' }))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true)
      await deleteWallet(walletId, token)
      toast.success( t('wallets.deleteSuccess', { defaultValue: 'Address deleted successfully' }))
      router.push('/withdrawals')
    } catch (err) {
      toast.error( err?.message || t('wallets.deleteError', { defaultValue: 'Failed to delete address' }))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!wallet) {
    return <div className="alert alert-danger">{t('wallets.notFound', { defaultValue: 'Wallet not found' })}</div>
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <button className="btn btn-text-secondary me-2" onClick={() => router.back()}>
          <i className="bx bx-arrow-back"></i>
        </button>
        <h4 className="fw-bold mb-0">{t('wallets.editTitle', { defaultValue: 'Edit Withdrawal Address' })}</h4>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <label className="form-label">{t('wallets.label', { defaultValue: 'Label' })} <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">{t('wallets.address', { defaultValue: 'Address' })}</label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    value={form.address}
                    disabled
                  />
                  <small className="text-muted">{t('wallets.addressNoEdit', { defaultValue: 'Address cannot be changed' })}</small>
                </div>

                <div className="mb-4">
                  <label className="form-label">{t('wallets.memo', { defaultValue: 'Memo' })}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.memo}
                    onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary flex-grow-1" disabled={saving}>
                    {saving ? (
                      <><span className="spinner-border spinner-border-sm me-1"></span>{t('wallets.saving', { defaultValue: 'Saving...' })}</>
                    ) : (
                      <><i className="bx bx-check me-1"></i>{t('wallets.save', { defaultValue: 'Save Changes' })}</>
                    )}
                  </button>
                  <button type="button" className="btn btn-outline-danger" onClick={() => setShowDeleteConfirm(true)}>
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          show
          title={t('wallets.deleteTitle', { defaultValue: 'Delete Address' })}
          message={t('wallets.deleteConfirm', { defaultValue: 'Are you sure you want to delete this withdrawal address?' })}
          confirmText={t('wallets.delete', { defaultValue: 'Delete' })}
          confirmVariant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
