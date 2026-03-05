'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams as useNextSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useToast } from '@/app/providers';
import { getUserLedgerEntries } from '@/lib/api/admin';
import { listCoins } from '@/lib/api/coins';
import UserLedgerFilters from '@/components/ledger/UserLedgerFilters';
import UserLedgerRow from '@/components/ledger/UserLedgerRow';
import { logger } from '@/lib/utils/logger';
import RefreshButton from '@/components/RefreshButton';
import PageSpinner from '@/components/PageSpinner';
import TableEmptyState from '@/components/TableEmptyState';
import { Button, Card } from '../../../../components/ui'

export default function UserLedgerList() {
  const { t, i18n } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();
  const searchParams = useNextSearchParams();

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' };
    return map[i18n.language] || 'en-US';
  }, [i18n.language]);

  const initType = searchParams.get('type') || '';
  const initUserId = searchParams.get('userId') || '';
  const initCoinNetworkId = searchParams.get('coinNetworkId') || '';
  const initEntryCode = searchParams.get('entryCode') || '';
  const initState = searchParams.get('state') || '';
  const initTxHash = searchParams.get('txHash') || '';
  const initStartDate = searchParams.get('startDate') || '';
  const initEndDate = searchParams.get('endDate') || '';
  const initPage = parseInt(searchParams.get('page')) || 1;

  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(initPage);
  const [coinNetworks, setCoinNetworks] = useState([]);

  // Filter states (draft — applied on "Apply")
  const [typeFilter, setTypeFilter] = useState(initType);
  const [userIdFilter, setUserIdFilter] = useState(initUserId);
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId);
  const [entryCodeFilter, setEntryCodeFilter] = useState(initEntryCode);
  const [stateFilter, setStateFilter] = useState(initState);
  const [txHashFilter, setTxHashFilter] = useState(initTxHash);
  const [startDateFilter, setStartDateFilter] = useState(initStartDate);
  const [endDateFilter, setEndDateFilter] = useState(initEndDate);

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {};
    if (initType) f.type = initType;
    if (initUserId) f.userId = Number(initUserId);
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId);
    if (initEntryCode) f.entryCode = initEntryCode;
    if (initState) f.state = initState;
    if (initTxHash) f.txHash = initTxHash;
    if (initStartDate) f.startDate = initStartDate;
    if (initEndDate) f.endDate = initEndDate;
    return f;
  });

  useEffect(() => {
    loadEntries();
  }, [currentPage, appliedFilters]);

  useEffect(() => {
    listCoins(token).then(setCoinNetworks).catch(() => {});
  }, []);

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {if (v !== undefined && v !== '') params.set(k, v);});
    if (page > 1) params.set('page', page);
    window.history.replaceState(null, '', `?${params.toString()}`);
  }

  function applyFilters() {
    const f = {
      type: typeFilter || undefined,
      userId: userIdFilter ? Number(userIdFilter) : undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      entryCode: entryCodeFilter || undefined,
      state: stateFilter || undefined,
      txHash: txHashFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined
    };
    setAppliedFilters(f);
    setCurrentPage(1);
    syncSearchParams(f, 1);
  }

  function resetFilters() {
    setTypeFilter('');
    setUserIdFilter('');
    setCoinNetworkIdFilter('');
    setEntryCodeFilter('');
    setStateFilter('');
    setTxHashFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setAppliedFilters({});
    setCurrentPage(1);
    window.history.replaceState(null, '', window.location.pathname);
  }

  async function loadEntries() {
    try {
      setLoading(true);
      const data = await getUserLedgerEntries(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters
      });
      setEntries(data.items || []);
      setPagination(data.pagination || null);
    } catch (error) {
      logger.error('Failed to load user ledger entries:', error);
      toast.error(t('admin.ledger.loadError', { defaultValue: 'Failed to load ledger entries' }));
    } finally {
      setLoading(false);
    }
  }

  if (loading && entries.length === 0) {
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
                    <i className="bx bx-user mr-2"></i>
                    {t('admin.ledger.userLedger', { defaultValue: 'User Ledger' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.ledger.userLedgerDesc', { defaultValue: 'View all user ledger entries' })}
                  </p>
                </div>
                <RefreshButton onClick={loadEntries} loading={loading} />
              </div>
            </div>
            <UserLedgerFilters
              t={t}
              locale={locale}
              loading={loading}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              entryCodeFilter={entryCodeFilter}
              setEntryCodeFilter={setEntryCodeFilter}
              stateFilter={stateFilter}
              setStateFilter={setStateFilter}
              userIdFilter={userIdFilter}
              setUserIdFilter={setUserIdFilter}
              coinNetworkIdFilter={coinNetworkIdFilter}
              setCoinNetworkIdFilter={setCoinNetworkIdFilter}
              coinNetworks={coinNetworks}
              txHashFilter={txHashFilter}
              setTxHashFilter={setTxHashFilter}
              startDateFilter={startDateFilter}
              setStartDateFilter={setStartDateFilter}
              endDateFilter={endDateFilter}
              setEndDateFilter={setEndDateFilter}
              onApply={applyFilters}
              onReset={resetFilters} />
            
          </Card>

          {/* Table */}
          <Card>
            <div className="p-5">
              <div className="overflow-x-auto overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead>
                    <tr className="whitespace-nowrap">
                      <th>{t('admin.detail.id', { defaultValue: 'ID' })}</th>
                      <th>{t('admin.detail.userId', { defaultValue: 'User ID' })}</th>
                      <th>{t('admin.ledger.type', { defaultValue: 'Type' })}</th>
                      <th>{t('admin.ledger.coin', { defaultValue: 'Coin' })}</th>
                      <th>{t('admin.detail.code', { defaultValue: 'Code' })}</th>
                      <th>{t('admin.ledger.state', { defaultValue: 'State' })}</th>
                      <th className="text-right">{t('admin.ledger.amount', { defaultValue: 'Amount' })}</th>
                      <th className="text-right">USD</th>
                      <th>{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</th>
                      <th>{t('admin.ledger.createdAt', { defaultValue: 'Created' })}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ?
                    <TableEmptyState
                      colSpan={11}
                      icon="bx-book-content"
                      message={t('admin.ledger.noEntries', { defaultValue: 'No ledger entries found' })}
                      sub={t('admin.ledger.noEntriesSub', { defaultValue: 'No entries match the current filters' })} /> :


                    entries.map((entry) =>
                    <UserLedgerRow key={entry.id} entry={entry} t={t} />
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
                    <Button disabled variant="outline-secondary" size="sm">
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