'use client';

import { useState, useEffect, useCallback } from 'react'

import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { useToast } from '@/app/providers'
import { getAdminInvoices } from '@/lib/api/admin'
import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker';
import CoinImg from '@/components/CoinImg';
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton';
import PageSpinner from '@/components/PageSpinner';
import TableEmptyState from '@/components/TableEmptyState';
import Pagination from '@/components/ui/Pagination';
import { Button, Card, Input, Label, Select } from '@/components/ui'
import Table from '@/components/ui/Table';
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function AdminInvoiceList() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();

  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states (draft — applied on "Apply")
  const [statusFilter, setStatusFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [merchantIdFilter, setMerchantIdFilter] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [sortByFilter, setSortByFilter] = useState('');
  const [sortOrderFilter, setSortOrderFilter] = useState('');

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({});

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminInvoices(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters
      });
      setInvoices(data.items || []);
      setPagination(data.pagination || null);
    } catch (error) {
      logger.error('Failed to load invoices:', error);
      toast.error(t('admin.invoices.loadError', { defaultValue: 'Failed to load invoices' }));
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, appliedFilters, toast, t])

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  function applyFilters() {
    setAppliedFilters({
      status: statusFilter || undefined,
      userId: userIdFilter ? Number(userIdFilter) : undefined,
      merchantId: merchantIdFilter ? Number(merchantIdFilter) : undefined,
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
    setMerchantIdFilter('');
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

  if (loading && invoices.length === 0) {
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
                    <i className="bx bx-receipt mr-2"></i>
                    {t('admin.invoices.title', { defaultValue: 'Invoices' })}
                  </h4>
                  <p className="text-surface-500 mb-0">
                    {t('admin.invoices.description', { defaultValue: 'View all invoices and their status' })}
                  </p>
                </div>
                <RefreshButton onClick={loadInvoices} loading={loading} />
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.status', { defaultValue: 'Status' })}</Label>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    <option value="pending">{t('status.pending', { defaultValue: 'Pending' })}</option>
                    <option value="paid">{t('status.paid', { defaultValue: 'Paid' })}</option>
                    <option value="expired">{t('status.expired', { defaultValue: 'Expired' })}</option>
                    <option value="cancelled">{t('status.cancelled', { defaultValue: 'Cancelled' })}</option>
                  </Select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.userId', { defaultValue: 'User ID' })}</Label>
                  <Input type="number" placeholder={t('filter.userId', { defaultValue: 'User ID' })} value={userIdFilter} onChange={(e) => setUserIdFilter(e.target.value)} />
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.merchantId', { defaultValue: 'Merchant ID' })}</Label>
                  <Input type="number" placeholder={t('filter.merchantId', { defaultValue: 'Merchant ID' })} value={merchantIdFilter} onChange={(e) => setMerchantIdFilter(e.target.value)} />
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.dateRange', { defaultValue: 'Date Range' })}</Label>
                  <LocaleDateRangePicker className="w-full"
                  startDate={fromDateFilter}
                  endDate={toDateFilter}
                  onChangeStart={setFromDateFilter}
                  onChangeEnd={setToDateFilter}
                  locale={locale}
                  placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
                  t={t} />

                  
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.sortBy', { defaultValue: 'Sort By' })}</Label>
                  <Select value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="created_at">{t('filter.createdAt', { defaultValue: 'Created At' })}</option>
                    <option value="amount">{t('filter.amount', { defaultValue: 'Amount' })}</option>
                    <option value="expiry_at">{t('filter.expiryAt', { defaultValue: 'Expiry At' })}</option>
                    <option value="paid_at">{t('filter.paidAt', { defaultValue: 'Paid At' })}</option>
                  </Select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.sortOrder', { defaultValue: 'Sort Order' })}</Label>
                  <Select value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    <option value="asc">{t('filter.ascending', { defaultValue: t('admin.detail.ascending', { defaultValue: 'Ascending' }) })}</option>
                    <option value="desc">{t('filter.descending', { defaultValue: t('admin.detail.descending', { defaultValue: 'Descending' }) })}</option>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={applyFilters} disabled={loading}>
                  <i className="bx bx-filter-alt mr-1"></i>
                  {t('filter.apply', { defaultValue: 'Apply Filters' })}
                </Button>
                <Button onClick={resetFilters} disabled={loading} variant="outline-secondary">
                  <i className="bx bx-reset mr-1"></i>
                  {t('filter.reset', { defaultValue: 'Reset' })}
                </Button>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card>
              <Table>
                  <thead>
                    <tr className="whitespace-nowrap">
                      <th>{t('table.id', { defaultValue: 'ID' })}</th>
                      <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
                      <th>{t('table.code', { defaultValue: 'Code' })}</th>
                      <th>{t('table.coin', { defaultValue: 'Coin' })}</th>
                      <th className="text-right">{t('table.amount', { defaultValue: 'Amount' })}</th>
                      <th className="text-right">{t('table.usd', { defaultValue: 'USD' })}</th>
                      <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                      <th>{t('table.paymentAddress', { defaultValue: 'Payment Address' })}</th>
                      <th>{t('table.created', { defaultValue: 'Created' })}</th>
                      <th>{t('table.expires', { defaultValue: 'Expires' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length === 0 ?
                    <TableEmptyState
                      colSpan={11}
                      icon="bx-file"
                      message={t('admin.invoices.noInvoices', { defaultValue: 'No invoices found' })}
                      sub={t('admin.invoices.noInvoicesSub', { defaultValue: 'No invoices match the current filters' })} /> :

                    invoices.map((invoice) => {
                      const coinSymbol = (invoice.coin?.symbol || invoice.coinSymbol || '').toUpperCase();
                      const networkSymbol = (invoice.network?.symbol || invoice.networkSymbol || '').toUpperCase();
                      const networkName = invoice.network?.name || invoice.networkName || '';

                      return (
                        <tr key={invoice.id}>
                            <td>
                              <span className="font-semibold text-primary">{invoice.id}</span>
                            </td>
                            <td className="text-center">
                              <span className="font-medium">{invoice.userId || '-'}</span>
                            </td>
                            <td className="whitespace-nowrap">
                              <span className="font-medium">{invoice.invoiceNumber || invoice.publicCode || invoice.code || '-'}</span>
                            </td>
                            <td className="whitespace-nowrap">
                              <div className="flex items-center">
                                <CoinImg
                                symbol={coinSymbol}
                                networkSymbol={networkSymbol}
                                size={24}
                                className="mr-2" />
                              
                                <div>
                                  <div className="font-medium leading-[1.2]">{coinSymbol || '-'}</div>
                                  {networkName &&
                                <small className="text-surface-500 text-xs">{networkName}</small>
                                }
                                </div>
                              </div>
                            </td>
                            <td className="text-right whitespace-nowrap">
                              <span className="font-medium">
                                {formatAmount(invoice.amount)} {coinSymbol}
                              </span>
                            </td>
                            <td className="text-right whitespace-nowrap">
                              {invoice.amountUsd ?
                            <span className="font-medium">${formatAmount(invoice.amountUsd)}</span> :

                            <span className="text-surface-500">-</span>
                            }
                            </td>
                            <td className="whitespace-nowrap text-center">
                              <span className={getStatusBadgeClass(invoice.status, 'invoice')}>
                                {String(invoice.status || '').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              {invoice.paymentAddress ?
                            <div className="flex items-center">
                                  <span className="mr-2 whitespace-nowrap text-[0.85rem]">
                                    {invoice.paymentAddress}
                                  </span>
                                  <Button

                                onClick={() => handleCopy(invoice.paymentAddress)}
                                title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })} size="icon-sm" variant="text-secondary">
                                
                                    <i className="bx bx-copy"></i>
                                  </Button>
                                </div> :

                            <span className="text-surface-500">-</span>
                            }
                            </td>
                            <td>
                              <span className="whitespace-nowrap">{fmtDate(invoice.createdAt || invoice.created_at)}</span>
                            </td>
                            <td>
                              <span className="whitespace-nowrap">{fmtDate(invoice.expiryAt || invoice.expiry_at)}</span>
                            </td>
                            <td>
                              <Button variant="text-secondary" size="icon"
                            href={`/admin/invoices/${invoice.id}`}

                            title={t('admin.detail.viewDetail', { defaultValue: 'View detail' })}>
                              
                                <i className="bx bx-show text-xl"></i>
                              </Button>
                            </td>
                          </tr>);

                    })
                    }
                  </tbody>
                </Table>

              {/* Pagination */}
              {pagination && pagination.total > 0 &&
              <div className="px-5 py-1.5">
                <Pagination
                  pagination={pagination}
                  onPageChange={setCurrentPage}
                  loading={loading}
                />
              </div>
              }
          </Card>
        </div>
      </div>
    </div>);

}