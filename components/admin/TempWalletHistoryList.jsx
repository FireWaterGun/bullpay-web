'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams as useNextSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useToast } from '@/app/providers';
import { getTempWalletHistories } from '@/lib/api/admin';
import { listCoins } from '@/lib/api/coins';
import { useDateFormat } from '@/hooks/useDateFormat';
import CoinImg from '@/components/CoinImg';
import TableEmptyState from '@/components/TableEmptyState';
import { logger } from '@/lib/utils/logger';
import PageSpinner from '@/components/PageSpinner';
import { Button, Card, Input, Label, Select, inputClass, badgeBase } from '../ui';

const HISTORY_STATUS_OPTIONS = ['assigned', 'deposited', 'swept', 'released', 'failed'];
const SORT_BY_OPTIONS = [
{ value: 'createdAt', label: 'Created At' },
{ value: 'firstDepositAt', label: 'First Deposit' },
{ value: 'sweptAt', label: 'Swept At' },
{ value: 'releasedAt', label: 'Released At' }];


function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'assigned') return `${badgeBase} bg-cyan-50 text-cyan-700`;
  if (v === 'deposited') return `${badgeBase} bg-primary-50 text-primary-600`;
  if (v === 'swept') return `${badgeBase} bg-amber-50 text-amber-700`;
  if (v === 'released') return `${badgeBase} bg-green-50 text-green-700`;
  if (v === 'failed') return `${badgeBase} bg-red-50 text-red-700`;
  return `${badgeBase} bg-surface-100 text-surface-600`;
}

export default function TempWalletHistoryList() {
  const { fmtDate } = useDateFormat();
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();
  const searchParams = useNextSearchParams();

  const initTempWalletId = searchParams.get('tempWalletId') || '';
  const initInvoiceId = searchParams.get('invoiceId') || '';
  const initCoinNetworkId = searchParams.get('coinNetworkId') || '';
  const initStatus = searchParams.get('status') || '';
  const initSortBy = searchParams.get('sortBy') || '';
  const initSortOrder = searchParams.get('sortOrder') || '';
  const initPage = parseInt(searchParams.get('page')) || 1;

  const [loading, setLoading] = useState(false);
  const [histories, setHistories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(initPage);
  const [coinNetworks, setCoinNetworks] = useState([]);

  const [tempWalletIdFilter, setTempWalletIdFilter] = useState(initTempWalletId);
  const [invoiceIdFilter, setInvoiceIdFilter] = useState(initInvoiceId);
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId);
  const [statusFilter, setStatusFilter] = useState(initStatus);
  const [sortByFilter, setSortByFilter] = useState(initSortBy);
  const [sortOrderFilter, setSortOrderFilter] = useState(initSortOrder);

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {};
    if (initTempWalletId) f.tempWalletId = Number(initTempWalletId);
    if (initInvoiceId) f.invoiceId = Number(initInvoiceId);
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId);
    if (initStatus) f.status = initStatus;
    if (initSortBy) f.sortBy = initSortBy;
    if (initSortOrder) f.sortOrder = initSortOrder;
    return f;
  });

  useEffect(() => {loadHistories();}, [currentPage, appliedFilters]);

  useEffect(() => {
    listCoins(token).then(setCoinNetworks).catch(() => {});
  }, []);

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {if (v !== undefined && v !== '') params.set(k, String(v));});
    if (page > 1) params.set('page', page);
    window.history.replaceState(null, '', `?${params.toString()}`);
  }

  function applyFilters() {
    const f = {
      tempWalletId: tempWalletIdFilter ? Number(tempWalletIdFilter) : undefined,
      invoiceId: invoiceIdFilter ? Number(invoiceIdFilter) : undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      status: statusFilter || undefined,
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined
    };
    setAppliedFilters(f);
    setCurrentPage(1);
    syncSearchParams(f, 1);
  }

  function resetFilters() {
    setTempWalletIdFilter('');
    setInvoiceIdFilter('');
    setCoinNetworkIdFilter('');
    setStatusFilter('');
    setSortByFilter('');
    setSortOrderFilter('');
    setAppliedFilters({});
    setCurrentPage(1);
    syncSearchParams({}, 1);
  }

  async function loadHistories() {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getTempWalletHistories(token, { page: currentPage, limit: 20, ...appliedFilters });
      setHistories(data.items || []);
      setPagination(data.pagination || null);
    } catch (error) {
      logger.error('Failed to load temp wallet histories:', error);
      toast.error(t('admin.tempWallet.loadHistoriesError', { defaultValue: 'Failed to load temp wallet histories' }));
    } finally {
      setLoading(false);
    }
  }

  if (loading && histories.length === 0) {
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
                    <i className="bx bx-history mr-2"></i>
                    {t('admin.tempWalletHistories.title', { defaultValue: 'Temp Wallet Histories' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.tempWalletHistories.description', { defaultValue: 'Monitor wallet usage history (read-only)' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline-secondary" href="/admin/temp-wallets">
                    <i className="bx bx-wallet mr-1"></i>
                    {t('admin.tempWallets.title', { defaultValue: 'Temp Wallets' })}
                  </Button>
                  <Button onClick={loadHistories} disabled={loading}>
                    <i className="bx bx-refresh mr-1"></i>
                    {t('actions.refresh', { defaultValue: 'Refresh' })}
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.status', { defaultValue: 'Status' })}</Label>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    {HISTORY_STATUS_OPTIONS.map((s) =>
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    )}
                  </Select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('admin.tempWalletHistories.tempWalletId', { defaultValue: 'Temp Wallet ID' })}</Label>
                  <Input type="number" placeholder={t('admin.tempWalletHistories.tempWalletId', { defaultValue: 'Temp Wallet ID' })} value={tempWalletIdFilter} onChange={(e) => setTempWalletIdFilter(e.target.value)} />
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.invoiceId', { defaultValue: 'Invoice ID' })}</Label>
                  <Input type="number" placeholder={t('filter.invoiceId', { defaultValue: 'Invoice ID' })} value={invoiceIdFilter} onChange={(e) => setInvoiceIdFilter(e.target.value)} />
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</Label>
                  <div className="dropdown">
                    <button
                      className={`${inputClass()} flex items-center justify-between text-left`}
                      type="button"
                      aria-expanded="false">

                      
                      {coinNetworkIdFilter ? (() => {
                        const cn = coinNetworks.find((c) => String(c.id) === String(coinNetworkIdFilter));
                        if (!cn) return 'All';
                        const sym = (cn.coin?.symbol || '').toUpperCase();
                        const net = (cn.network?.symbol || '').toUpperCase();
                        return (
                          <span className="flex items-center gap-2">
                            <CoinImg symbol={sym} networkSymbol={net} size={22} />
                            <span className="font-semibold text-[0.85rem]">{sym}</span>
                            <span className="text-muted text-xs">{net}</span>
                          </span>);

                      })() : <span className="text-muted">All</span>}
                    </button>
                    <ul className="absolute z-50 mt-1 min-w-[160px] bg-white border border-surface-200 rounded-lg shadow-lg py-1 w-full max-h-[280px] overflow-y-auto">
                      <li>
                        <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer" onClick={() => setCoinNetworkIdFilter('')}>
                          <span className="text-muted">All</span>
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      {coinNetworks.map((cn) => {
                        const sym = (cn.coin?.symbol || '').toUpperCase();
                        const net = (cn.network?.symbol || '').toUpperCase();
                        return (
                          <li key={cn.id}>
                            <button className="block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer flex items-center gap-2 py-2" onClick={() => setCoinNetworkIdFilter(String(cn.id))}>
                              <CoinImg symbol={sym} networkSymbol={net} size={28} />
                              <div>
                                <div className="font-semibold text-[0.85rem]">{sym}</div>
                                <div className="text-muted text-[0.7rem]">{net}</div>
                              </div>
                            </button>
                          </li>);

                      })}
                    </ul>
                  </div>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.sortBy', { defaultValue: 'Sort By' })}</Label>
                  <Select value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                    <option value="">{t('filter.default', { defaultValue: 'Default' })}</option>
                    {SORT_BY_OPTIONS.map((o) =>
                    <option key={o.value} value={o.value}>{o.label}</option>
                    )}
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
            <div className="p-5">
              <div className="overflow-x-auto overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="whitespace-nowrap">
                      <th>{t('table.id', { defaultValue: 'ID' })}</th>
                      <th className="text-center">{t('admin.tempWalletHistories.walletId', { defaultValue: 'Wallet ID' })}</th>
                      <th className="text-center">{t('table.invoiceId', { defaultValue: 'Invoice ID' })}</th>
                      <th className="text-center">{t('table.userId', { defaultValue: 'User ID' })}</th>
                      <th className="text-center">{t('filter.coinNetwork', { defaultValue: 'Coin / Network' })}</th>
                      <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                      <th>{t('admin.tempWalletHistories.firstDeposit', { defaultValue: 'First Deposit' })}</th>
                      <th>{t('admin.tempWalletHistories.swept', { defaultValue: 'Swept' })}</th>
                      <th>{t('admin.tempWalletHistories.released', { defaultValue: 'Released' })}</th>
                      <th>{t('table.created', { defaultValue: 'Created' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {histories.length === 0 ?
                    <TableEmptyState
                      colSpan={11}
                      icon="bx-history"
                      message={t('admin.tempWalletHistories.noHistories', { defaultValue: 'No histories found' })} /> :


                    histories.map((h) =>
                    <tr key={h.id}>
                          <td>
                            <span className="font-semibold text-primary">{h.id}</span>
                          </td>
                          <td className="text-center">
                            <Link
                          href={`/admin/temp-wallets/${h.tempWalletId}`}
                          className="text-primary font-medium">
                          
                              {h.tempWalletId || '-'}
                            </Link>
                          </td>
                          <td className="text-center">
                            {h.invoiceId ?
                        <Link
                          href={`/admin/invoices/${h.invoiceId}`}
                          className="text-primary font-medium">
                          
                                {h.invoiceId}
                              </Link> :

                        <span className="text-muted">-</span>
                        }
                          </td>
                          <td className="text-center">
                            <span className="font-medium">{h.userId || '-'}</span>
                          </td>
                          <td className="whitespace-nowrap">
                            {(() => {
                          const cn = coinNetworks.find((c) => c.id === h.coinNetworkId);
                          if (!cn) return <span className="font-medium">{h.coinNetworkId || '-'}</span>;
                          const sym = (cn.coin?.symbol || '').toUpperCase();
                          const net = (cn.network?.name || cn.network?.symbol || '').toUpperCase();
                          return (
                            <div className="flex items-center">
                                  <CoinImg symbol={sym} networkSymbol={(cn.network?.symbol || '').toUpperCase()} size={24} className="mr-3" />
                                  <div>
                                    <div className="font-medium leading-[1.2]">{sym}</div>
                                    {net && <small className="text-muted text-xs">{net}</small>}
                                  </div>
                                </div>);

                        })()}
                          </td>
                          <td className="whitespace-nowrap text-center">
                            <span className={statusBadgeClass(h.status)}>
                              {String(h.status || '').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className="whitespace-nowrap">{fmtDate(h.firstDepositAt)}</span>
                          </td>
                          <td>
                            <span className="whitespace-nowrap">{fmtDate(h.sweptAt)}</span>
                          </td>
                          <td>
                            <span className="whitespace-nowrap">{fmtDate(h.releasedAt)}</span>
                          </td>
                          <td>
                            <span className="whitespace-nowrap">{fmtDate(h.createdAt)}</span>
                          </td>
                          <td>
                            <Button variant="text-secondary" size="icon"
                        href={`/admin/temp-wallet-histories/${h.id}`}

                        title={t('admin.detail.viewDetail', { defaultValue: 'View detail' })}>
                          
                              <i className="bx bx-show text-xl"></i>
                            </Button>
                          </td>
                        </tr>
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
                    onClick={() => {setCurrentPage((p) => p - 1);syncSearchParams(appliedFilters, currentPage - 1);}} variant="outline-secondary" size="sm">
                    
                      <i className="bx bx-chevron-left"></i>
                      {t('actions.prev', { defaultValue: 'Previous' })}
                    </Button>
                    <Button

                    disabled variant="outline-secondary" size="sm">
                    
                      {pagination.page} / {pagination.totalPages}
                    </Button>
                    <Button

                    disabled={!pagination.hasNext || loading}
                    onClick={() => {setCurrentPage((p) => p + 1);syncSearchParams(appliedFilters, currentPage + 1);}} variant="outline-secondary" size="sm">
                    
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