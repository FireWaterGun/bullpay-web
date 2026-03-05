'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams as useNextSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useToast } from '@/app/providers';
import { getPlatformLedgerEntries } from '@/lib/api/admin';
import { listCoins } from '@/lib/api/coins';
import PlatformLedgerFilterPanel from '@/components/ledger/PlatformLedgerFilterPanel';
import PlatformLedgerTable from '@/components/ledger/PlatformLedgerTable';
import AdjustmentModal from '@/components/ledger/AdjustmentModal';
import { logger } from '@/lib/utils/logger';
import RefreshButton from '@/components/RefreshButton';
import PageSpinner from '@/components/PageSpinner';
import { Button, Card } from '../../../../components/ui'

export default function PlatformLedgerList() {
  const { t, i18n } = useAdminTranslation();
  const { token, navigation } = useAuth();
  const toast = useToast();
  const searchParams = useNextSearchParams();

  const isSuperAdmin = navigation?.role === 'super_admin';
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' };
    return map[i18n.language] || 'en-US';
  }, [i18n.language]);

  const initAccountType = searchParams.get('accountType') || '';
  const initEntryType = searchParams.get('entryType') || '';
  const initEntryCode = searchParams.get('entryCode') || '';
  const initState = searchParams.get('state') || '';
  const initCoinNetworkId = searchParams.get('coinNetworkId') || '';
  const initTxHash = searchParams.get('txHash') || '';
  const initStartDate = searchParams.get('startDate') || '';
  const initEndDate = searchParams.get('endDate') || '';
  const initPage = parseInt(searchParams.get('page')) || 1;

  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(initPage);
  const [coinNetworks, setCoinNetworks] = useState([]);

  const [accountTypeFilter, setAccountTypeFilter] = useState(initAccountType);
  const [entryTypeFilter, setEntryTypeFilter] = useState(initEntryType);
  const [entryCodeFilter, setEntryCodeFilter] = useState(initEntryCode);
  const [stateFilter, setStateFilter] = useState(initState);
  const [coinNetworkIdFilter, setCoinNetworkIdFilter] = useState(initCoinNetworkId);
  const [txHashFilter, setTxHashFilter] = useState(initTxHash);
  const [startDateFilter, setStartDateFilter] = useState(initStartDate);
  const [endDateFilter, setEndDateFilter] = useState(initEndDate);

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {};
    if (initAccountType) f.accountType = initAccountType;
    if (initEntryType) f.entryType = initEntryType;
    if (initEntryCode) f.entryCode = initEntryCode;
    if (initState) f.state = initState;
    if (initCoinNetworkId) f.coinNetworkId = Number(initCoinNetworkId);
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
      accountType: accountTypeFilter || undefined,
      entryType: entryTypeFilter || undefined,
      entryCode: entryCodeFilter || undefined,
      state: stateFilter || undefined,
      coinNetworkId: coinNetworkIdFilter ? Number(coinNetworkIdFilter) : undefined,
      txHash: txHashFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined
    };
    setAppliedFilters(f);
    setCurrentPage(1);
    syncSearchParams(f, 1);
  }

  function resetFilters() {
    setAccountTypeFilter('');
    setEntryTypeFilter('');
    setEntryCodeFilter('');
    setStateFilter('');
    setCoinNetworkIdFilter('');
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
      const data = await getPlatformLedgerEntries(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters
      });
      setEntries(data.items || []);
      setPagination(data.pagination || null);
    } catch (error) {
      logger.error('Failed to load platform ledger entries:', error);
      toast.error(t('admin.platformLedger.loadError', { defaultValue: 'Failed to load platform ledger entries' }));
    } finally {
      setLoading(false);
    }
  }

  if (loading && entries.length === 0) {
    return <PageSpinner />;
  }

  function handleAdjustmentResult(result) {
    if (result === 'in') {
      toast.success(t('admin.adjustment.successIncrease', { defaultValue: 'Balance increased (XI) successfully' }));
      loadEntries();
    } else if (result === 'out') {
      toast.success(t('admin.adjustment.successDecrease', { defaultValue: 'Balance decreased (XO) successfully' }));
      loadEntries();
    } else if (result === 'error:insufficient') {
      toast.error(t('admin.adjustment.insufficientBalance', { defaultValue: 'Insufficient confirmed balance for this adjustment' }));
    } else if (result === 'error') {
      toast.error(t('admin.adjustment.error', { defaultValue: 'Failed to apply adjustment' }));
    }
  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-book-open mr-2"></i>
                    {t('admin.platformLedger.title', { defaultValue: 'Revenue & Expenses' })}
                  </h4>
                  <p className="text-muted mb-0">
                    {t('admin.platformLedger.description', { defaultValue: 'View all revenue and expense entries' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isSuperAdmin &&
                  <Button

                    onClick={() => setShowAdjustModal(true)}>
                    
                      <i className="bx bx-transfer-alt mr-1"></i>
                      {t('admin.adjustment.button', { defaultValue: 'Adjustment (XI/XO)' })}
                    </Button>
                  }
                  <RefreshButton onClick={loadEntries} loading={loading} />
                </div>
              </div>
            </div>
            <PlatformLedgerFilterPanel
              accountTypeFilter={accountTypeFilter} setAccountTypeFilter={setAccountTypeFilter}
              entryTypeFilter={entryTypeFilter} setEntryTypeFilter={setEntryTypeFilter}
              entryCodeFilter={entryCodeFilter} setEntryCodeFilter={setEntryCodeFilter}
              stateFilter={stateFilter} setStateFilter={setStateFilter}
              coinNetworkIdFilter={coinNetworkIdFilter} setCoinNetworkIdFilter={setCoinNetworkIdFilter}
              txHashFilter={txHashFilter} setTxHashFilter={setTxHashFilter}
              startDateFilter={startDateFilter} setStartDateFilter={setStartDateFilter}
              endDateFilter={endDateFilter} setEndDateFilter={setEndDateFilter}
              coinNetworks={coinNetworks}
              locale={locale}
              loading={loading}
              onApply={applyFilters}
              onReset={resetFilters} />
            
          </Card>

          <PlatformLedgerTable
            entries={entries}
            pagination={pagination}
            loading={loading}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            syncSearchParams={syncSearchParams}
            appliedFilters={appliedFilters} />
          
        </div>
      </div>

      {showAdjustModal &&
      <AdjustmentModal
        t={t}
        onClose={() => setShowAdjustModal(false)}
        onSuccess={handleAdjustmentResult} />

      }
    </div>);

}