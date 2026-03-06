'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/app/providers';
import { getAdminPayments } from '@/lib/api/admin';
import { copyToClipboard as copyText } from '@/lib/utils/clipboard';
import AdminPaymentFilters from '@/components/admin/AdminPaymentFilters';
import AdminPaymentRow from '@/components/admin/AdminPaymentRow';
import { logger } from '@/lib/utils/logger';
import RefreshButton from '@/components/RefreshButton';
import PageSpinner from '@/components/PageSpinner';
import TableEmptyState from '@/components/TableEmptyState';
import { Card } from '@/components/ui'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table';

export default function AdminPaymentList() {
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();

  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states (draft — applied on "Apply")
  const [statusFilter, setStatusFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [invoiceIdFilter, setInvoiceIdFilter] = useState('');
  const [txHashFilter, setTxHashFilter] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [sortByFilter, setSortByFilter] = useState('');
  const [sortOrderFilter, setSortOrderFilter] = useState('');

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({});

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminPayments(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters
      });
      setPayments(data.items || []);
      setPagination(data.pagination || null);
    } catch (error) {
      logger.error('Failed to load payments:', error);
      toast.error(t('admin.payments.loadError', { defaultValue: 'Failed to load payments' }));
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, appliedFilters, toast, t]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  function applyFilters() {
    setAppliedFilters({
      status: statusFilter || undefined,
      userId: userIdFilter ? Number(userIdFilter) : undefined,
      invoiceId: invoiceIdFilter ? Number(invoiceIdFilter) : undefined,
      txHash: txHashFilter || undefined,
      fromDate: fromDateFilter || undefined,
      toDate: toDateFilter || undefined,
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined
    });
    setCurrentPage(1);
  }

  function resetFilters() {
    setStatusFilter('');
    setUserIdFilter('');
    setInvoiceIdFilter('');
    setTxHashFilter('');
    setFromDateFilter('');
    setToDateFilter('');
    setSortByFilter('');
    setSortOrderFilter('');
    setAppliedFilters({});
    setCurrentPage(1);
  }

  async function handleCopy(text) {
    const ok = await copyText(text);
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied to clipboard!' }));
  }

  if (loading && payments.length === 0) {
    return <PageSpinner />;
  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Header */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-transfer mr-2"></i>
                    {t('admin.payments.title', { defaultValue: 'Payments' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.payments.description', { defaultValue: 'View all blockchain payment transactions' })}
                  </p>
                </div>
                <RefreshButton onClick={loadPayments} loading={loading} />
              </div>
            </div>
            <AdminPaymentFilters
              locale={locale}
              loading={loading}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              userIdFilter={userIdFilter}
              setUserIdFilter={setUserIdFilter}
              invoiceIdFilter={invoiceIdFilter}
              setInvoiceIdFilter={setInvoiceIdFilter}
              txHashFilter={txHashFilter}
              setTxHashFilter={setTxHashFilter}
              fromDateFilter={fromDateFilter}
              setFromDateFilter={setFromDateFilter}
              toDateFilter={toDateFilter}
              setToDateFilter={setToDateFilter}
              sortByFilter={sortByFilter}
              setSortByFilter={setSortByFilter}
              sortOrderFilter={sortOrderFilter}
              setSortOrderFilter={setSortOrderFilter}
              onApply={applyFilters}
              onReset={resetFilters} />
            
          </Card>

          {/* Table */}
          <Card>
              <Table>
                  <thead>
                    <tr className="whitespace-nowrap">
                      <th>{t('table.id', { defaultValue: 'ID' })}</th>
                      <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
                      <th className="text-center">{t('table.invoiceId', { defaultValue: 'Invoice ID' })}</th>
                      <th>{t('table.coin', { defaultValue: 'Coin' })}</th>
                      <th className="text-right">{t('table.amount', { defaultValue: 'Amount' })}</th>
                      <th className="text-right">{t('table.usd', { defaultValue: 'USD' })}</th>
                      <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                      <th>{t('table.confirmations', { defaultValue: 'Confirmations' })}</th>
                      <th>{t('table.txHash', { defaultValue: 'Tx Hash' })}</th>
                      <th>{t('table.fromAddress', { defaultValue: 'From Address' })}</th>
                      <th>{t('table.toAddress', { defaultValue: 'To Address' })}</th>
                      <th>{t('table.created', { defaultValue: 'Created' })}</th>
                      <th>{t('table.confirmed', { defaultValue: 'Confirmed' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ?
                    <TableEmptyState
                      colSpan={14}
                      icon="bx-credit-card"
                      message={t('admin.payments.noPayments', { defaultValue: 'No payments found' })}
                      sub={t('admin.payments.noPaymentsSub', { defaultValue: 'No payments match the current filters' })} /> :


                    payments.map((payment) =>
                    <AdminPaymentRow
                      key={payment.id}
                      payment={payment}
                      onCopy={handleCopy} />

                    )
                    }
                  </tbody>
                </Table>

              <div className="px-5 py-1.5">
                <Pagination pagination={pagination} onPageChange={setCurrentPage} loading={loading} />
              </div>
          </Card>
        </div>
      </div>
    </div>);

}