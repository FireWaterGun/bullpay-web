'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSearchParams as useNextSearchParams } from 'next/navigation';

import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useAuth } from '@/app/providers';
import { useToast } from '@/app/providers';
import { getSystemWallet, getSystemWalletLedger } from '@/lib/api/admin';
import { copyToClipboard as copyText } from '@/lib/utils/clipboard';
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker';
import WalletInfoCard from '@/components/admin/WalletInfoCard';
import WalletLedgerTable from '@/components/admin/WalletLedgerTable';
import { logger } from '@/lib/utils/logger';
import PageSpinner from '@/components/PageSpinner';
import { Button, Card, Input, Label, Select } from '../ui';
import Pagination from '@/components/ui/Pagination'

export default function WalletTransaction() {
  const { t, i18n } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();
  const { walletId } = useParams();
  const searchParams = useNextSearchParams();

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' };
    return map[i18n.language] || 'en-US';
  }, [i18n.language]);

  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);

  const initState = searchParams.get('state') || '';
  const initEntryType = searchParams.get('entryType') || '';
  const initEntryCode = searchParams.get('entryCode') || '';
  const initTxHash = searchParams.get('txHash') || '';
  const initStartDate = searchParams.get('startDate') || '';
  const initEndDate = searchParams.get('endDate') || '';

  const [stateFilter, setStateFilter] = useState(initState);
  const [entryTypeFilter, setEntryTypeFilter] = useState(initEntryType);
  const [entryCodeFilter, setEntryCodeFilter] = useState(initEntryCode);
  const [txHashFilter, setTxHashFilter] = useState(initTxHash);
  const [startDateFilter, setStartDateFilter] = useState(initStartDate);
  const [endDateFilter, setEndDateFilter] = useState(initEndDate);

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {};
    if (initState) f.state = initState;
    if (initEntryType) f.entryType = initEntryType;
    if (initEntryCode) f.entryCode = initEntryCode;
    if (initTxHash) f.txHash = initTxHash;
    if (initStartDate) f.startDate = initStartDate;
    if (initEndDate) f.endDate = initEndDate;
    return f;
  });

  const loadWallet = useCallback(async () => {
    try {
      setWalletLoading(true);
      const data = await getSystemWallet(token, parseInt(walletId));
      setWallet(data);
    } catch (error) {
      logger.error('Failed to load wallet:', error);
      toast.error(t('admin.wallet.loadError', { defaultValue: 'Failed to load wallet details' }));
    } finally {
      setWalletLoading(false);
    }
  }, [token, walletId, toast, t]);

  const loadLedger = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSystemWalletLedger(token, parseInt(walletId), {
        page: currentPage,
        limit: 20,
        ...appliedFilters
      });
      setEntries(data.items || []);
      setPagination(data.pagination || null);
    } catch (error) {
      logger.error('Failed to load ledger:', error);
      toast.error(t('admin.ledger.loadError', { defaultValue: 'Failed to load transactions' }));
    } finally {
      setLoading(false);
    }
  }, [token, walletId, currentPage, appliedFilters, toast, t]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    if (wallet) loadLedger();
  }, [wallet, loadLedger]);

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {if (v !== undefined && v !== '') params.set(k, v);});
    if (page > 1) params.set('page', page);
    window.history.replaceState(null, '', `?${params.toString()}`);
  }

  function applyFilters() {
    const f = {
      state: stateFilter || undefined,
      entryType: entryTypeFilter || undefined,
      entryCode: entryCodeFilter || undefined,
      txHash: txHashFilter || undefined,
      startDate: startDateFilter || undefined,
      endDate: endDateFilter || undefined
    };
    setAppliedFilters(f);
    setCurrentPage(1);
    syncSearchParams(f, 1);
  }

  function resetFilters() {
    setStateFilter('');
    setEntryTypeFilter('');
    setEntryCodeFilter('');
    setTxHashFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setAppliedFilters({});
    setCurrentPage(1);
    window.history.replaceState(null, '', window.location.pathname);
  }

  async function handleCopy(text, e) {
    if (e) e.stopPropagation();
    const ok = await copyText(text);
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }));
  }

  if (walletLoading && !wallet) {
    return <PageSpinner />;
  }

  const assets = wallet?.assets || [];

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Button variant="outline-secondary" className="mb-3"
          href="/admin/system-wallets">
            
            
            <i className="bx bx-arrow-back mr-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </Button>

          <WalletInfoCard
            wallet={wallet}
            assets={assets}
            t={t}
            loading={loading}
            onRefresh={loadLedger}
            onCopy={handleCopy} />
          

          {/* Filters */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <h5 className="mb-0">
                <i className="bx bx-filter mr-2"></i>
                {t('admin.ledger.filters', { defaultValue: 'Filters' })}
              </h5>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.entryType', { defaultValue: 'Entry Type' })}</Label>
                  <Select value={entryTypeFilter} onChange={(e) => setEntryTypeFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="credit">{t('admin.detail.credit', { defaultValue: 'Credit' })}</option>
                    <option value="debit">{t('admin.detail.debit', { defaultValue: 'Debit' })}</option>
                  </Select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.entryCode', { defaultValue: 'Entry Code' })}</Label>
                  <Select value={entryCodeFilter} onChange={(e) => setEntryCodeFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="WA">WA - Wallet Actual</option>
                    <option value="WF">WF - Wallet Fee</option>
                    <option value="WG">WG - Wallet Gas</option>
                    <option value="SP">SP - Settlement Payment</option>
                    <option value="SG">SG - Sweep Gas</option>
                    <option value="SC">SC - Sweep Cost</option>
                    <option value="XI">XI - Internal In</option>
                    <option value="XO">XO - Internal Out</option>
                  </Select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.state', { defaultValue: 'State' })}</Label>
                  <Select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                    <option value="">{t('filter.all', { defaultValue: 'All' })}</option>
                    <option value="committed">Committed</option>
                    <option value="settled">Settled</option>
                    <option value="reversed">Reversed</option>
                  </Select>
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.txHash', { defaultValue: 'Tx Hash' })}</Label>
                  <Input type="text" placeholder="0x..." value={txHashFilter} onChange={(e) => setTxHashFilter(e.target.value)} />
                </div>
                <div className="md:col-span-3 sm:col-span-6">
                  <Label>{t('filter.dateRange', { defaultValue: 'Date Range' })}</Label>
                  <LocaleDateRangePicker className="w-full"
                  startDate={startDateFilter}
                  endDate={endDateFilter}
                  onChangeStart={setStartDateFilter}
                  onChangeEnd={setEndDateFilter}
                  locale={locale}
                  placeholder={t('filter.dateRangePlaceholder', { defaultValue: 'Select date range' })}
                  t={t} />

                  
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

          {/* Ledger Table */}
          <Card>
            <div className="p-5">
              <WalletLedgerTable entries={entries} loading={loading} t={t} />

              <Pagination pagination={pagination} onPageChange={handlePageChange} loading={loading} />
            </div>
          </Card>
        </div>
      </div>
    </div>);

}