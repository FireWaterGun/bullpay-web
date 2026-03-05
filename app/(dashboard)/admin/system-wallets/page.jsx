'use client';

import { useEffect, useState } from 'react';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';

import { useAuth } from '@/app/providers';
import { useToast } from '@/app/providers';
import { getSystemWalletStats } from '@/lib/api/admin';
import { formatAmount, formatUsd, formatCoinAmount } from '@/lib/utils/format';
import { AmountNormalizer } from '@/lib/utils/amount_normalizer';
import CoinImg from '@/components/CoinImg';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { logger } from '@/lib/utils/logger';
import CardEmptyState from '@/components/CardEmptyState';
import { Alert, Badge, Button, Card, Spinner } from '../../../../components/ui';

export default function SystemBalance() {
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(null);

  const copyAddress = async (address) => {
    try {
      await copyToClipboard(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
      toast.success(t('actions.copied', { defaultValue: 'Address copied to clipboard' }));
    } catch (err) {
      logger.error('Failed to copy:', err);
      toast.error(t('actions.copyFailed', { defaultValue: 'Failed to copy address' }));
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError('');
    try {
      // Send USD currency for total balance
      const res = await getSystemWalletStats(token, 'USD');
      setStats(res);
    } catch (e) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to load system wallet stats');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grow py-6">
        <div className="text-center py-6">
          <Spinner role="status" className="text-primary" />

          
        </div>
      </div>);

  }

  if (error) {
    return (
      <div className="grow py-6">
        <Alert role="alert">
          <i className="bx bx-error-circle mr-2"></i>
          {error}
        </Alert>
      </div>);

  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Stats Cards */}
          <div className="grid grid-cols-12 gap-x-6 gap-4 mb-4">
            <div className="md:col-span-4 sm:col-span-6">
              <Card>
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0 mr-3">
                      <i className="bx bxs-wallet bx-lg text-info"></i>
                    </div>
                    <div>
                      <small className="text-muted block">{t('admin.totalWallets', { defaultValue: 'Total Wallets' })}</small>
                      <h4 className="mb-0">{stats?.totalWallets || 0}</h4>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="md:col-span-4 sm:col-span-6">
              <Card>
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0 mr-3">
                      <i className="bx bxs-gas-pump bx-lg text-warning"></i>
                    </div>
                    <div>
                      <small className="text-muted block">{t('admin.gasPurposeWallets', { defaultValue: 'Gas Purpose Wallets' })}</small>
                      <h4 className="mb-0">{stats?.gasPurposeWallets || 0}</h4>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="md:col-span-4 sm:col-span-6">
              <Card>
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="shrink-0 mr-3">
                      <i className="bx bxs-bank bx-lg text-primary"></i>
                    </div>
                    <div>
                      <small className="text-muted block">{t('admin.treasuryPurposeWallets', { defaultValue: 'Treasury Purpose Wallets' })}</small>
                      <h4 className="mb-0">{stats?.treasuryPurposeWallets || 0}</h4>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Total Balance Card */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-surface-800 mb-1">{t('admin.systemBalance', { defaultValue: 'System Balance' })}</h4>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="text-5xl font-bold text-surface-900">
                {formatUsd(stats?.fiat?.totalValueUsd || 0)}
              </div>
              <div className="mt-3">
                <Badge className="bg-primary-50 text-primary-600">
                  <i className="bx bx-wallet mr-1"></i>
                  {stats?.walletsWithFunds || 0} {t('admin.walletsWithFunds', { defaultValue: 'wallets with funds' })}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Wallet Details Table */}
          <Card>
            <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
              <h5 className="mb-0">{t('admin.walletDetails', { defaultValue: 'Wallet Details' })}</h5>
              <Badge className="bg-primary-50 text-primary-600">
                {stats?.balanceDetails?.length || 0} {t('admin.wallets', { defaultValue: 'wallets' })}
              </Badge>
            </div>
            <div className="p-5">
              {!stats?.balanceDetails || stats.balanceDetails.length === 0 ?
              <CardEmptyState
                icon="bx-wallet"
                message={t('admin.noWalletsFound', { defaultValue: 'No wallets with balance found' })} /> :


              <div className="overflow-x-auto overflow-x-auto">
                  <table className="w-full min-w-[1600px]">
                    <thead>
                      <tr>
                        <th>{t('invoices.chain') || 'Chain'}</th>
                        <th className="min-w-[180px]">{t('balance.col.coin')}</th>
                        <th>{t('admin.address', { defaultValue: 'Address' })}</th>
                        <th>{t('admin.purpose', { defaultValue: 'Purpose' })}</th>
                        <th>{t('admin.type', { defaultValue: 'Type' })}</th>
                        <th>{t('invoices.statusCol')}</th>
                        <th className="text-right min-w-[200px] whitespace-nowrap">{t('admin.confirmedBalance', { defaultValue: 'Confirmed' })}</th>
                        <th className="text-right min-w-[200px] whitespace-nowrap">{t('admin.unconfirmedBalance', { defaultValue: 'Unconfirmed' })}</th>
                        <th className="text-right min-w-[200px] whitespace-nowrap">{t('admin.totalBalance', { defaultValue: 'Total Balance' })}</th>
                        <th className="text-right min-w-[140px] whitespace-nowrap">{t('admin.valueUSD', { defaultValue: 'Value (USD)' })}</th>
                        <th className="text-center min-w-[120px]">{t('invoices.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.balanceDetails.map((wallet) => {
                      const coin = wallet.systemWallet?.coinNetwork?.coin;
                      const coinSymbol = coin?.symbol;
                      const network = wallet.systemWallet?.coinNetwork?.network;
                      const networkSymbol = network?.symbol;
                      const networkName = network?.name;
                      const address = wallet.systemWallet?.address || '';

                      // Get decimals and convert raw balance to decimal
                      const decimals = wallet.decimals || wallet.systemWallet?.coinNetwork?.decimals || 18;
                      const decimalBalance = AmountNormalizer.fromRawSimple(
                        wallet.totalBalanceRaw || '0',
                        decimals
                      );

                      const rate = stats.fiat?.rates?.[coinSymbol] || 0;
                      const usdValue = parseFloat(decimalBalance) * parseFloat(rate);

                      return (
                        <tr key={wallet.id}>
                            <td>
                              <span className="text-muted">
                                {(networkSymbol || '').toUpperCase() || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center">
                                <CoinImg coin={coin} symbol={coinSymbol} networkSymbol={networkSymbol} size={32} className="mr-3" />
                                <div>
                                  <div>{coinSymbol || 'N/A'}</div>
                                  <small className="text-muted">{networkName || 'N/A'}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-[400px]">
                                  {address || 'N/A'}
                                </span>
                                {address &&
                              <Button
                                onClick={() => copyAddress(address)}

                                title={t('actions.copy', { defaultValue: 'Copy' })} size="icon" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none">
                                
                                    {copiedAddress === address ?
                                <i className="bx bx-check text-success text-xl"></i> :

                                <i className="bx bx-copy text-xl"></i>
                                }
                                  </Button>
                              }
                              </div>
                            </td>
                            <td>
                              <span className="capitalize">
                                {wallet.systemWallet?.purpose || 'N/A'}
                              </span>
                            </td>
                            <td>
                              {wallet.systemWallet?.walletType === 'hot' ?
                            <Badge className="bg-amber-50 text-amber-700">
                                  <i className="bx bxs-hot mr-1"></i>
                                  {t('admin.hot', { defaultValue: 'Hot' })}
                                </Badge> :

                            <Badge className="bg-cyan-50 text-cyan-700">
                                  <i className="bx bx-shield mr-1"></i>
                                  {t('admin.cold', { defaultValue: 'Cold' })}
                                </Badge>
                            }
                            </td>
                            <td>
                              {wallet.systemWallet?.status === 'active' ?
                            <Badge className="bg-green-50 text-green-700">{t('admin.active', { defaultValue: 'Active' })}</Badge> :

                            <Badge className="bg-surface-100 text-surface-600">
                                  {wallet.systemWallet?.status}
                                </Badge>
                            }
                            </td>
                            <td className="text-right whitespace-nowrap">
                              {(() => {
                              const val = AmountNormalizer.fromRawSimple(wallet.confirmedBalanceRaw || '0', decimals);
                              return (
                                <>
                                    <span className="font-medium" title={`Raw: ${wallet.confirmedBalanceRaw || '0'}\nDecimals: ${decimals}`}>
                                      {formatCoinAmount(val)}
                                    </span>
                                    <small className="text-muted ml-1">{coinSymbol}</small>
                                  </>);

                            })()}
                            </td>
                            <td className="text-right whitespace-nowrap">
                              {(() => {
                              const val = AmountNormalizer.fromRawSimple(wallet.unconfirmedBalanceRaw || '0', decimals);
                              return (
                                <>
                                    <span className="font-medium" title={`Raw: ${wallet.unconfirmedBalanceRaw || '0'}\nDecimals: ${decimals}`}>
                                      {formatCoinAmount(val)}
                                    </span>
                                    <small className="text-muted ml-1">{coinSymbol}</small>
                                  </>);

                            })()}
                            </td>
                            <td className="text-right whitespace-nowrap">
                              <span className="font-medium" title={`Raw: ${wallet.totalBalanceRaw || '0'}\nDecimals: ${decimals}`}>
                                {formatCoinAmount(decimalBalance)}
                              </span>
                              <small className="text-muted ml-1">{coinSymbol}</small>
                            </td>
                            <td className="text-right whitespace-nowrap">
                              <span className="font-medium">
                                {formatUsd(usdValue)}
                              </span>
                            </td>
                            <td className="text-center">
                              <Button variant="text-secondary" size="icon" className="mr-1"
                            href={`/admin/system-ledger?walletId=${wallet.systemWallet?.id}`}

                            title={t('actions.view', { defaultValue: 'View' })}>
                              
                                <i className="bx bx-receipt text-xl"></i>
                              </Button>
                              {wallet.systemWallet?.coinNetwork?.network?.explorerUrl && wallet.systemWallet?.address &&
                            <Button variant="text-secondary" size="icon"
                            href={`${wallet.systemWallet.coinNetwork.network.explorerUrl}/address/${wallet.systemWallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"

                            title={t('invoices.viewOnExplorer')}>
                              
                                  <i className="bx bx-link-external text-xl"></i>
                                </Button>
                            }
                            </td>
                          </tr>);

                    })}
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </Card>
        </div>
      </div>
    </div>);

}