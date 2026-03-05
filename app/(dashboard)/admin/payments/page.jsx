'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useToast } from '@/app/providers';
import { getAdminPayments } from '@/lib/api/admin';
import { copyToClipboard as copyText } from '@/lib/utils/clipboard';
import AdminPaymentFilters from '@/components/admin/AdminPaymentFilters';
import AdminPaymentRow from '@/components/admin/AdminPaymentRow';
import { logger } from '@/lib/utils/logger';
import RefreshButton from '@/components/RefreshButton';
import PageSpinner from '@/components/PageSpinner';
import TableEmptyState from '@/components/TableEmptyState';
import { Button, Card } from '../../../../components/ui'

export default function AdminPaymentList() {
  const { t, i18n } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' };
    return map[i18n.language] || 'en-US';
  }, [i18n.language]);
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

  useEffect(() => {
    loadPayments();
  }, [currentPage, appliedFilters]);

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

  async function loadPayments() {
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
                  <p className="text-muted mb-0">
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
            <div className="p-5">
              <div className="overflow-x-auto overflow-x-auto">
                <table className="w-full">
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
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.total > 0 &&
              <div className="flex justify-between items-center mt-4">
                  <div className="text-muted text-sm">
                    {t('invoices.showingEntries', {
                    start: pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0,
                    end: Math.min(pagination.page * pagination.limit, pagination.total),
                    total: pagination.total,
                    defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
                  })}
                  </div>
                  <div className="inline-flex rounded-lg shadow-sm">
                    <Button

                    disabled={!pagination.hasPrev || loading}
                    onClick={() => setCurrentPage((p) => p - 1)} variant="outline-secondary" size="sm">
                    
                      <i className="bx bx-chevron-left"></i>
                      {t('actions.prev', { defaultValue: 'Previous' })}
                    </Button>
                    <Button

                    disabled variant="outline-secondary" size="sm">
                    
                      {pagination.page} / {pagination.totalPages}
                    </Button>
                    <Button

                    disabled={!pagination.hasNext || loading}
                    onClick={() => setCurrentPage((p) => p + 1)} variant="outline-secondary" size="sm">
                    
                      {t('actions.next', { defaultValue: 'Next' })}
                      <i className="bx bx-chevron-right"></i>
                    </Button>
                  </div>
                </div>
              }
            </div>
          </Card>
        </div>
      </div>
    </div>);

}