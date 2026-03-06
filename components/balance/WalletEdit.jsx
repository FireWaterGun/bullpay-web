'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth, useToast } from '@/app/providers';
import { getWallet, updateWallet, deleteWallet } from '@/lib/api/wallets';
import ConfirmModal from '@/components/ConfirmModal';
import { Button, Card, Input, Label, Spinner } from '@/components/ui'

export default function WalletEdit() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { token } = useAuth();
  const toast = useToast();

  const walletId = params?.id;
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    label: '',
    address: '',
    memo: ''
  });

  const loadWallet = useCallback(async () => {
    if (!token || !walletId) return;
    try {
      setLoading(true);
      const data = await getWallet(walletId, token);
      setWallet(data);
      if (data) {
        setForm({
          label: data.label || '',
          address: data.address || '',
          memo: data.memo || ''
        });
      }
    } catch (err) {
      toast.error(t('wallets.loadError', { defaultValue: 'Failed to load wallet' }));
    } finally {
      setLoading(false);
    }
  }, [token, walletId, toast, t]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.label) {
      toast.error(t('wallets.labelRequired', { defaultValue: 'Label is required' }));
      return;
    }
    try {
      setSaving(true);
      await updateWallet(walletId, {
        label: form.label,
        memo: form.memo || undefined
      }, token);
      toast.success(t('wallets.updateSuccess', { defaultValue: 'Address updated successfully' }));
      router.push('/withdrawals');
    } catch (err) {
      toast.error(err?.message || t('wallets.updateError', { defaultValue: 'Failed to update address' }));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true);
      await deleteWallet(walletId, token);
      toast.success(t('wallets.deleteSuccess', { defaultValue: 'Address deleted successfully' }));
      router.push('/withdrawals');
    } catch (err) {
      toast.error(err?.message || t('wallets.deleteError', { defaultValue: 'Failed to delete address' }));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner role="status" size="lg" className="text-primary-600" />

        
      </div>);

  }

  if (!wallet) {
    return <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 p-4">{t('wallets.notFound', { defaultValue: 'Wallet not found' })}</div>;
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <button type="button" className="text-surface-500 hover:text-surface-700 mr-2" onClick={() => router.back()}>
          <i className="bx bx-arrow-back text-xl"></i>
        </button>
        <h4 className="font-bold mb-0">{t('wallets.editTitle', { defaultValue: 'Edit Withdrawal Address' })}</h4>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-xl">
          <Card>
            <div className="p-6">
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <Label>{t('wallets.label', { defaultValue: 'Label' })} <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"

                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    maxLength={100}
                    required />
                  
                </div>

                <div className="mb-3">
                  <Label>{t('wallets.address', { defaultValue: 'Address' })}</Label>
                  <Input
                    type="text"

                    value={form.address}
                    disabled className="font-mono" />
                  
                  <small className="text-surface-500">{t('wallets.addressNoEdit', { defaultValue: 'Address cannot be changed' })}</small>
                </div>

                <div className="mb-4">
                  <Label>{t('wallets.memo', { defaultValue: 'Memo' })}</Label>
                  <Input
                    type="text"

                    value={form.memo}
                    onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} />
                  
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={saving} className="flex-grow">
                    {saving ?
                    <><Spinner className="w-4 h-4 mr-1" />{t('wallets.saving', { defaultValue: 'Saving...' })}</> :

                    <><i className="bx bx-check mr-1"></i>{t('wallets.save', { defaultValue: 'Save Changes' })}</>
                    }
                  </Button>
                  <Button type="button" onClick={() => setShowDeleteConfirm(true)} className="border border-danger-500 text-danger-500 bg-transparent hover:bg-danger-500 hover:text-white">
                    <i className="bx bx-trash"></i>
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </div>

      {showDeleteConfirm &&
      <ConfirmModal
        show
        title={t('wallets.deleteTitle', { defaultValue: 'Delete Address' })}
        message={t('wallets.deleteConfirm', { defaultValue: 'Are you sure you want to delete this withdrawal address?' })}
        confirmText={t('wallets.delete', { defaultValue: 'Delete' })}
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)} />

      }
    </div>);

}