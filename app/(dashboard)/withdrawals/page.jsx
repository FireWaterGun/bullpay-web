'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useToast } from '@/app/providers';
import { useUserInvoiceEvents } from '@/hooks/useInvoiceEvents';
import { listWithdrawals } from '@/lib/api/withdrawals';
import { useCoins } from '@/hooks/useCoins';
import { listWallets } from '@/lib/api/wallets';
import WalletAddressTable from '@/components/balance/WalletAddressTable';
import WithdrawalTable from '@/components/withdrawals/WithdrawalTable';
import { formatStatusLabel, WITHDRAWAL_STATUSES } from '@/components/balance/withdrawalHelpers';
import RefreshButton from '@/components/RefreshButton';
import CardEmptyState from '@/components/CardEmptyState';
import PageSpinner from '@/components/PageSpinner';
import { Card, Spinner, Button } from '@/components/ui';

export default function WithdrawalsPage() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const toast = useToast();

  // Wallets state
  const [walletItems, setWalletItems] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');

  // Withdrawals state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { coins } = useCoins();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState('ALL');
  const [pagination, setPagination] = useState(null);

  // Load wallets
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setWalletLoading(true);
        const walletsData = await listWallets(token);
        if (!mounted) return;
        setWalletItems(Array.isArray(walletsData) ? walletsData : []);
      } catch (e) {
        if (!mounted) return;
        setWalletError(typeof e?.message === 'string' ? e.message : 'Failed to load');
      } finally {
        setWalletLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  const loadWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      const queryStatus = status === 'ALL' ? undefined : status.toLowerCase();
      const result = await listWithdrawals({ page, limit, status: queryStatus }, token);
      setItems(Array.isArray(result.items) ? result.items : []);
      setPagination(result.pagination || null);
    } catch (e) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, status]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  // Subscribe to Pusher events for real-time withdrawal updates
  const userIdentifier = user?.id || user?.userId || user?.email;
  useUserInvoiceEvents(userIdentifier, {
    onWithdrawalCompleted: () => loadWithdrawals(),
  });

  const cnById = useMemo(() => {
    const m = new Map();
    for (const cn of coins) {
      m.set(Number(cn.id), cn);
    }
    return m;
  }, [coins]);

  function changeStatus(s) {
    setStatus(s);
    setPage(1);
  }

  const totalPages = pagination ? Number(pagination.totalPages || 1) : 1;

  if (loading && items.length === 0 && walletLoading) {
    return <PageSpinner />;
  }

  return (
    <>
      {/* Wallet Addresses */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h4 className="font-semibold text-surface-900 mb-1">
              <i className="bx bx-wallet mr-2 text-primary-500"></i>
              {t('balance.withdrawals', { defaultValue: 'Withdrawal Addresses' })}
            </h4>
            <p className="text-surface-500 text-sm mb-0">
              {t('wallet.addressDesc', { defaultValue: 'Manage your saved withdrawal addresses' })}
            </p>
          </div>
          <Button href="/wallet/new-address">
            <i className="bx bx-plus mr-1"></i>
            {t('balance.newAddress', { defaultValue: 'New Address' })}
          </Button>
        </div>
        <div className="p-6">
          {walletError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-4 py-3 text-sm">
              {walletError}
            </div>
          )}
          {walletLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : walletItems.length === 0 ? (
            <CardEmptyState
              icon="bx-wallet"
              message={t('wallet.none', { defaultValue: 'No wallets' })}
              sub={t('wallet.noneSub', { defaultValue: 'Add a withdrawal address to get started' })}
            />
          ) : (
            <WalletAddressTable walletItems={walletItems} cnById={cnById} />
          )}
        </div>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h4 className="font-semibold text-surface-900 mb-1">
              <i className="bx bx-transfer mr-2 text-primary-500"></i>
              {t('balance.withdrawalsList', { defaultValue: 'Withdrawal History' })}
            </h4>
            <p className="text-surface-500 text-sm mb-0">
              {t('balance.withdrawalsDesc', { defaultValue: 'Track your withdrawal transactions' })}
            </p>
          </div>
          <RefreshButton onClick={loadWithdrawals} loading={loading} />
        </div>
        <div className="px-6 py-3 border-b border-surface-200">
          <div className="flex flex-wrap gap-1">
            {WITHDRAWAL_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  status === s
                    ? 'bg-primary-600 text-white'
                    : 'text-surface-600 hover:bg-surface-100 dark:hover:bg-white/6'
                }`}
                onClick={() => changeStatus(s)}
              >
                {t(`status.${s.toLowerCase()}`, { defaultValue: formatStatusLabel(s) })}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <WithdrawalTable
          items={items}
          pagination={{
            page,
            totalPages,
            total: pagination?.total || 0,
            limit,
            hasPrev: page > 1,
            hasNext: page < totalPages,
          }}
          loading={loading}
          cnById={cnById}
          onPageChange={setPage}
        />
      </Card>
    </>
  );
}