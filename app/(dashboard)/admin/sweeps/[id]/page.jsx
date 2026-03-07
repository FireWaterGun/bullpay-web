'use client';

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getSweepById } from '@/lib/api/admin'
import { AmountNormalizer } from '@/lib/utils/amount_normalizer'
import { formatUsd } from '@/lib/utils/format'
import CoinImg from '@/components/CoinImg';
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import SweepMetadataCard from '@/components/admin/SweepMetadataCard';
import SweepTransactionCard, { SweepTimestampsCard } from '@/components/admin/SweepTransactionCard';
import { logger } from '@/lib/utils/logger'
import PageSpinner from '@/components/PageSpinner';
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function SweepDetail() {
  const { t } = useAdminTranslation()
  const { token } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [sweep, setSweep] = useState(null);

  const loadSweep = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSweepById(token, parseInt(id));
      setSweep(data);
    } catch (error) {
      logger.error('Failed to load sweep transaction:', error);
      toast.error(t('admin.sweepDetail.loadError', { defaultValue: 'Failed to load sweep transaction' }));
    } finally {
      setLoading(false);
    }
  }, [token, id, toast, t])

  useEffect(() => {
    loadSweep();
  }, [loadSweep]);

  function formatAmount(amountRaw, decimals, coinSymbol, networkSymbol) {
    if (!amountRaw || !decimals) return '0';
    try {
      const chain = AmountNormalizer.detectChain(coinSymbol || '', networkSymbol || '');
      return AmountNormalizer.fromRaw(amountRaw.toString(), chain, decimals);
    } catch (error) {
      const amount = Number(amountRaw) / Math.pow(10, decimals);
      return amount.toString();
    }
  }

  async function handleCopy(text) {
    const ok = await copyText(text);
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }));
  }

  if (loading) {
    return <PageSpinner />;
  }

  if (!sweep) {
    return (
      <div className="grow py-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[3rem] text-surface-500"></i>
          <p className="text-surface-500 mt-2">Sweep transaction not found</p>
          <Button onClick={() => router.back()}>
            {t('actions.back', { defaultValue: 'Back' })}
          </Button>
        </div>
      </div>);

  }

  const coinSymbol = (sweep.coinNetwork?.coin?.symbol || sweep.coinSymbol || '').toUpperCase();
  const networkSymbol = (sweep.coinNetwork?.network?.symbol || sweep.networkSymbol || '').toUpperCase();
  const networkName = sweep.coinNetwork?.network?.name || sweep.networkName || '';
  const explorerUrl = sweep.coinNetwork?.network?.explorerUrl || sweep.explorerUrl || null;

  let metadata = {};
  try {
    metadata = typeof sweep.metadata === 'string' ? JSON.parse(sweep.metadata) : sweep.metadata || {};
  } catch (e) {/* ignore */}

  const failureReason = metadata.failureReason || null;

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Button
            onClick={() => router.back()} variant="outline-secondary" className="mb-3">

            
            <i className="bx bx-arrow-back mr-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </Button>

          <Card className="mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {coinSymbol &&
                  <CoinImg
                    symbol={coinSymbol}
                    networkSymbol={networkSymbol}
                    size={48} />

                  }
                  <div>
                    <h4 className="mb-1">
                      Sweep Transaction #{sweep.id}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={getStatusBadgeClass(sweep.status, 'sweep')}>
                        {String(sweep.status || '').toUpperCase()}
                      </span>
                      {metadata.type &&
                      <Badge color="info" label>
                          {metadata.type}
                        </Badge>
                      }
                      {coinSymbol &&
                      <Badge color="secondary">
                          {coinSymbol}
                        </Badge>
                      }
                      {networkName &&
                      <Badge color="secondary">
                          {networkName}
                        </Badge>
                      }
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {sweep.amount || formatAmount(sweep.amountRaw, sweep.decimals, coinSymbol, networkSymbol)}{' '}
                    <span className="text-[0.75em] font-normal">{coinSymbol}</span>
                  </div>
                  {sweep.amountUsd &&
                  <div className="text-surface-500">
                      {formatUsd(sweep.amountUsd)}
                    </div>
                  }
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-x-6">
            <div className="md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    <i className="bx bx-detail mr-2"></i>
                    Details
                  </h5>
                </div>
                <div className="p-5">
                  <Table>
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{sweep.id}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
                        <td>{sweep.userId || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.coinNetworkId', { defaultValue: 'Coin Network ID' })}</td>
                        <td>{sweep.coinNetworkId || 'N/A'}</td>
                      </tr>
                      {coinSymbol &&
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.coin', { defaultValue: 'Coin' })}</td>
                          <td>
                            <div className="flex items-center">
                              <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} className="mr-3" />
                              <div>
                                <span className="font-medium">{coinSymbol}</span>
                                {networkName &&
                                <small className="text-surface-500 ml-1">/ {networkName}</small>
                                }
                              </div>
                            </div>
                          </td>
                        </tr>
                        }
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.status', { defaultValue: 'Status' })}</td>
                        <td><span className={getStatusBadgeClass(sweep.status, 'sweep')}>{String(sweep.status || '').toUpperCase()}</span></td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.amount', { defaultValue: 'Amount' })}</td>
                        <td>
                          <span className="font-bold">
                            {sweep.amount || formatAmount(sweep.amountRaw, sweep.decimals, coinSymbol, networkSymbol)}
                          </span>
                        </td>
                      </tr>
                      {sweep.actualAmount &&
                        <tr>
                          <td className="text-surface-500">Actual Amount</td>
                          <td><span className="font-medium">{sweep.actualAmount}</span></td>
                        </tr>
                        }
                      <tr>
                        <td className="text-surface-500">Amount (Raw)</td>
                        <td><code className="text-[0.8rem]">{sweep.amountRaw || 'N/A'}</code></td>
                      </tr>
                      {sweep.amountUsd &&
                        <tr>
                          <td className="text-surface-500">USD Value</td>
                          <td>{formatUsd(sweep.amountUsd)}</td>
                        </tr>
                        }
                      {sweep.usdRate &&
                        <tr>
                          <td className="text-surface-500">USD Rate</td>
                          <td>
                            {formatUsd(sweep.usdRate)}
                            {sweep.rateSource && <small className="text-surface-500 ml-1">({sweep.rateSource})</small>}
                          </td>
                        </tr>
                        }
                      <tr>
                        <td className="text-surface-500">Decimals</td>
                        <td>{sweep.decimals ?? 'N/A'}</td>
                      </tr>
                      {sweep.reservationId &&
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.reservationId', { defaultValue: 'Reservation ID' })}</td>
                          <td><code className="text-[0.8rem]">{sweep.reservationId}</code></td>
                        </tr>
                        }
                      {sweep.systemWalletId &&
                        <tr>
                          <td className="text-surface-500">System Wallet ID</td>
                          <td>{sweep.systemWalletId}</td>
                        </tr>
                        }
                    </tbody>
                  </Table>
                </div>
              </Card>

              <SweepMetadataCard metadata={metadata} />
            </div>

            <div className="md:col-span-6">
              <SweepTransactionCard sweep={sweep} explorerUrl={explorerUrl} onCopy={handleCopy} />
              <SweepTimestampsCard sweep={sweep} metadata={metadata} />
            </div>
          </div>

          {failureReason &&
          <Card className="mb-4">
              <div className="px-5 py-4 border-b border-surface-200">
                <h5 className="mb-0 text-danger">
                  <i className="bx bx-error mr-2"></i>
                  Failure Reason
                </h5>
              </div>
              <div className="p-5">
                <pre className="mb-0 text-danger whitespace-pre-wrap break-all text-[0.85rem]">
                  {failureReason}
                </pre>
              </div>
            </Card>
          }
        </div>
      </div>
    </div>);

}