'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth, useToast } from '@/app/providers';
import { getWithdrawalAddressById, approveWithdrawalAddress, suspendWithdrawalAddress } from '@/lib/api/admin';
import { useDateFormat } from '@/hooks/useDateFormat';
import { copyToClipboard } from '@/lib/utils/clipboard';
import CoinImg from '@/components/CoinImg';
import { addressStatusBadgeClass, formatAddressStatus } from '@/components/balance/withdrawalHelpers';
import AddressActionModal from '@/components/balance/AddressActionModal';
import AddressAuditLog from '@/components/balance/AddressAuditLog';
import RefreshButton from '@/components/RefreshButton';
import PageSpinner from '@/components/PageSpinner';
import { Button, Card } from '../../../../components/ui'

export default function WithdrawalAddressDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { token } = useAuth();
  const toast = useToast();
  const { fmtDate } = useDateFormat();

  const addressId = params?.id;
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (token && addressId) loadAddress();
  }, [token, addressId]);

  async function loadAddress() {
    try {
      setLoading(true);
      const data = await getWithdrawalAddressById(token, addressId);
      setAddress(data);
    } catch (err) {
      toast.error(err?.message || t('withdrawalAddresses.loadError', { defaultValue: 'Failed to load address' }));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text) {
    const ok = await copyToClipboard(text);
    if (ok) toast.success(t('common.copied', { defaultValue: 'Copied!' }));
  }

  async function handleConfirmAction(reason) {
    if (!address) return;
    try {
      setActionLoading(true);
      if (actionType === 'approve') {
        await approveWithdrawalAddress(token, address.id);
        toast.success(t('withdrawalAddresses.approved', { defaultValue: 'Address approved' }));
      } else if (actionType === 'suspend') {
        await suspendWithdrawalAddress(token, address.id, reason);
        toast.success(t('withdrawalAddresses.suspended', { defaultValue: 'Address suspended' }));
      }
      setActionType('');
      loadAddress();
    } catch (err) {
      toast.error(err?.message || t('withdrawalAddresses.actionError', { defaultValue: 'Action failed' }));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && !address) {
    return <PageSpinner />;
  }

  if (!address) {
    return (
      <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{t('withdrawalAddresses.notFound', { defaultValue: 'Address not found' })}</div>);

  }

  return (
    <>
      <div className="flex items-center mb-6">
        <button className="mr-2 p-2 rounded-lg hover:bg-surface-100 text-surface-600" onClick={() => router.back()}>
          <i className="bx bx-arrow-back"></i>
        </button>
        <div>
          <h4 className="font-bold text-surface-900 mb-0">{t('withdrawalAddresses.detail', { defaultValue: 'Address Detail' })} #{address.id}</h4>
          <span className={addressStatusBadgeClass(address.status)}>
            {formatAddressStatus(address.status)}
          </span>
        </div>
        <RefreshButton onClick={loadAddress} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <Card>
            <div className="px-6 py-4 border-b border-surface-100">
              <h6 className="font-semibold text-surface-900 mb-0">{t('withdrawalAddresses.details', { defaultValue: 'Address Details' })}</h6>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="text-surface-500 py-2 pr-4 w-[160px]">{t('withdrawalAddresses.user', { defaultValue: 'User' })}</td>
                    <td className="py-2">{address.user?.email || address.userId || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-surface-500 py-2 pr-4">{t('withdrawalAddresses.coin', { defaultValue: 'Coin' })}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <CoinImg symbol={address.coin?.symbol} networkSymbol={address.network?.symbol} size={20} />
                        <span>{address.coin?.symbol || '-'} ({address.network?.name || address.network?.symbol || ''})</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-surface-500 py-2 pr-4">{t('withdrawalAddresses.label', { defaultValue: 'Label' })}</td>
                    <td className="py-2">{address.label || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-surface-500 py-2 pr-4">{t('withdrawalAddresses.address', { defaultValue: 'Address' })}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-sm break-all">{address.address || '-'}</span>
                        {address.address &&
                          <button className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500 shrink-0" onClick={() => handleCopy(address.address)}>
                            <i className="bx bx-copy"></i>
                          </button>
                          }
                      </div>
                    </td>
                  </tr>
                  {address.memo &&
                    <tr>
                      <td className="text-surface-500 py-2 pr-4">{t('withdrawalAddresses.memo', { defaultValue: 'Memo' })}</td>
                      <td className="py-2">{address.memo}</td>
                    </tr>
                    }
                  <tr>
                    <td className="text-surface-500 py-2 pr-4">{t('withdrawalAddresses.created', { defaultValue: 'Created' })}</td>
                    <td className="py-2">{fmtDate(address.createdAt)}</td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <div className="p-6">
              <div className="flex gap-2">
                {address.status !== 'active' &&
                <Button onClick={() => setActionType('approve')} className="text-sm">
                    <i className="bx bx-check mr-1"></i>{t('common.approve', { defaultValue: 'Approve' })}
                  </Button>
                }
                {address.status !== 'suspended' &&
                <button className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700" onClick={() => setActionType('suspend')}>
                    <i className="bx bx-block mr-1"></i>{t('common.suspend', { defaultValue: 'Suspend' })}
                  </button>
                }
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <div className="px-6 py-4 border-b border-surface-100">
              <h6 className="font-semibold text-surface-900 mb-0">{t('withdrawalAddresses.auditLog', { defaultValue: 'Audit Log' })}</h6>
            </div>
            <div className="p-6">
              <AddressAuditLog logs={address.auditLogs || []} t={t} />
            </div>
          </Card>
        </div>
      </div>

      {actionType &&
      <AddressActionModal
        show
        address={address}
        action={actionType}
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onClose={() => setActionType('')}
        t={t} />

      }
    </>);

}