'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams as useNextSearchParams } from 'next/navigation';
import { useAuth, useToast } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { getMerchants, activateMerchant, suspendMerchant } from '@/lib/api/admin';
import { formatCommission } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import { STATUS_OPTIONS, statusBadgeClass } from '@/components/admin/merchantListHelpers';
import MerchantConfirmModal from '@/components/admin/MerchantConfirmModal';
import { logger } from '@/lib/utils/logger';
import RefreshButton from '@/components/RefreshButton';
import TableEmptyState from '@/components/TableEmptyState';
import { Badge, Button, Card, Label, Select, Spinner } from '@/components/ui'
import ActionMenu from '@/components/ui/ActionMenu'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table';

export default function AdminMerchantsPage() {
  const { fmtDate } = useDateFormat();
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();
  const searchParams = useNextSearchParams();

  const initStatus = searchParams.get('status') || '';
  const initPage = parseInt(searchParams.get('page')) || 1;

  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(initPage);

  const [statusFilter, setStatusFilter] = useState(initStatus);
  const [appliedStatus, setAppliedStatus] = useState(initStatus);

  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const loadMerchants = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getMerchants(token, { page: currentPage, limit: 20, status: appliedStatus || undefined });
      setMerchants(data.items || []);
      setPagination(data.pagination || null);
    } catch (error) {
      logger.error('Failed to load merchants:', error);
      toast.error(t('admin.merchants.loadError', { defaultValue: 'Failed to load merchants' }));
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, appliedStatus, toast, t]);

  useEffect(() => {loadMerchants();}, [loadMerchants]);

  function syncSearchParams(status, page) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (page > 1) params.set('page', page);
    window.history.replaceState(null, '', `?${params.toString()}`);
  }

  function applyFilters() {
    setAppliedStatus(statusFilter);
    setCurrentPage(1);
    syncSearchParams(statusFilter, 1);
  }

  function resetFilters() {
    setStatusFilter('');
    setAppliedStatus('');
    setCurrentPage(1);
    syncSearchParams('', 1);
  }

  function openModal(action, merchant) {setModalAction(action);setSelectedMerchant(merchant);setShowModal(true);}
  function closeModal() {if (modalLoading) return;setShowModal(false);setSelectedMerchant(null);setModalAction('');}

  async function handleConfirm() {
    if (!selectedMerchant) return;
    try {
      setModalLoading(true);
      if (modalAction === 'activate') {
        await activateMerchant(token, selectedMerchant.id);
        toast.success(t('admin.merchants.activateSuccess', { defaultValue: 'Merchant activated successfully' }));
      } else if (modalAction === 'suspend') {
        await suspendMerchant(token, selectedMerchant.id);
        toast.success(t('admin.merchants.suspendSuccess', { defaultValue: 'Merchant suspended successfully' }));
      }
      closeModal();
      loadMerchants();
    } catch (error) {
      logger.error(`Failed to ${modalAction} merchant:`, error);
      toast.error(error?.message || t('admin.merchants.actionError', { defaultValue: 'Action failed. Please try again.' }));
    } finally {
      setModalLoading(false);
    }
  }

  if (loading && merchants.length === 0) {
    return (
      <div className="grow py-6">
        <div className="text-center py-5">
          <Spinner role="status" className="text-primary" />
          <p className="mt-3 text-surface-500">{t('invoices.loading', { defaultValue: 'Loading...' })}</p>
        </div>
      </div>);

  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h4 className="mb-1"><i className="bx bx-store mr-2"></i>{t('admin.merchants.title', { defaultValue: 'Merchants' })}</h4>
                  <p className="text-surface-500 mb-0">{t('admin.merchants.description', { defaultValue: 'Manage merchant accounts and status' })}</p>
                </div>
                <RefreshButton onClick={loadMerchants} loading={loading} />
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.status', { defaultValue: 'Status' })}</Label>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={applyFilters} disabled={loading}><i className="bx bx-filter-alt mr-1"></i>{t('filter.apply', { defaultValue: 'Apply Filters' })}</Button>
                <Button onClick={resetFilters} disabled={loading} variant="outline-secondary"><i className="bx bx-reset mr-1"></i>{t('filter.reset', { defaultValue: 'Reset' })}</Button>
              </div>
            </div>
          </Card>

          <Card>
              <Table>
                  <thead>
                    <tr className="whitespace-nowrap">
                      <th>{t('table.id', { defaultValue: 'ID' })}</th>
                      <th>{t('admin.merchants.name', { defaultValue: 'Name' })}</th>
                      <th>{t('admin.merchants.email', { defaultValue: 'Email' })}</th>
                      <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                      <th className="text-right">{t('admin.merchants.commission', { defaultValue: 'Commission' })}</th>
                      <th className="text-center">{t('admin.merchants.webhook', { defaultValue: 'Webhook' })}</th>
                      <th>{t('table.created', { defaultValue: 'Created' })}</th>
                      <th className="text-center">{t('actions.actions', { defaultValue: 'Actions' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchants.length === 0 ?
                    <TableEmptyState
                      colSpan={8}
                      icon="bx-store"
                      message={t('admin.merchants.noMerchants', { defaultValue: 'No merchants found' })}
                      sub={t('admin.merchants.noMerchantsSub', { defaultValue: 'No merchants match the current search' })} /> :


                    merchants.map((merchant) => {
                      const status = String(merchant.status || '').toLowerCase();
                      const canActivate = status === 'pending' || status === 'suspended';
                      const canSuspend = status === 'active' || status === 'pending';
                      return (
                        <tr key={merchant.id}>
                            <td><span className="font-semibold text-primary">{merchant.id}</span></td>
                            <td>
                              <div>
                                <span className="font-medium">{merchant.name || '-'}</span>
                                {merchant.description && <small className="block text-surface-500 truncate max-w-[250px]" title={merchant.description}>{merchant.description}</small>}
                              </div>
                            </td>
                            <td>
                              <div>
                                <span>{merchant.email || '-'}</span>
                                {merchant.websiteUrl && <small className="block"><a href={merchant.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-surface-500">{merchant.websiteUrl}</a></small>}
                              </div>
                            </td>
                            <td className="text-center whitespace-nowrap"><span className={statusBadgeClass(merchant.status)}>{String(merchant.status || '').toUpperCase()}</span></td>
                            <td className="text-right whitespace-nowrap">{merchant.commissionRate ? formatCommission(merchant.commissionRate) : '-'}</td>
                            <td className="text-center">
                              {merchant.hasWebhook ? <Badge color="success" label><i className="bx bx-check"></i></Badge> : <Badge color="secondary"><i className="bx bx-x"></i></Badge>}
                            </td>
                            <td className="whitespace-nowrap text-[0.85rem]">{fmtDate(merchant.createdAt)}</td>
                            <td className="text-center">
                              <ActionMenu>
                                {canActivate && <ActionMenu.Item icon="bx-check-circle" onClick={() => openModal('activate', merchant)}>{t('admin.merchants.activate', { defaultValue: 'Activate' })}</ActionMenu.Item>}
                                {canSuspend && <ActionMenu.Item icon="bx-block" danger onClick={() => openModal('suspend', merchant)}>{t('admin.merchants.suspend', { defaultValue: 'Suspend' })}</ActionMenu.Item>}
                                {!canActivate && !canSuspend && <ActionMenu.Item disabled>{t('admin.merchants.noActions', { defaultValue: 'No actions available' })}</ActionMenu.Item>}
                              </ActionMenu>
                            </td>
                          </tr>);

                    })
                    }
                  </tbody>
                </Table>

              <div className="px-5 py-1.5">
                <Pagination pagination={pagination} onPageChange={setCurrentPage} loading={loading} />
              </div>
          </Card>
        </div>
      </div>

      {showModal && selectedMerchant &&
      <MerchantConfirmModal merchant={selectedMerchant} action={modalAction} loading={modalLoading} onConfirm={handleConfirm} onClose={closeModal} />
      }
    </div>);

}