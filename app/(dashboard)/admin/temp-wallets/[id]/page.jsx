'use client';

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link';
import { useAuth } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useToast } from '@/app/providers'
import { getTempWallet } from '@/lib/api/admin'
import { useDateFormat } from '@/hooks/useDateFormat'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import CoinImg from '@/components/CoinImg';
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton';
import PageSpinner from '@/components/PageSpinner';
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function TempWalletDetail() {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation();
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTempWallet(token, id);
      setWallet(data);
    } catch (error) {
      logger.error('Failed to load temp wallet:', error);
      toast.error(t('admin.tempWallet.loadDetailError', { defaultValue: 'Failed to load temp wallet' }));
    } finally {
      setLoading(false);
    }
  }, [token, id, toast, t])

  useEffect(() => {loadWallet();}, [loadWallet]);

  async function handleCopy(text) {
    const ok = await copyText(text);
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }));
  }

  if (loading) {
    return <PageSpinner />;
  }

  if (!wallet) {
    return (
      <div className="grow py-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[3rem] text-surface-500"></i>
          <p className="text-surface-500 mt-2">Temp wallet not found</p>
          <Button onClick={() => router.back()} className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none">Back</Button>
        </div>
      </div>);

  }

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Button variant="outline-secondary" className="mb-3" href="/admin/temp-wallets">
            <i className="bx bx-arrow-back mr-2"></i>Back to Temp Wallets
          </Button>

          {/* Header Card */}
          <Card className="mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="mb-1">
                    <i className="bx bx-wallet mr-2"></i>
                    Temp Wallet #{wallet.id}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={getStatusBadgeClass(wallet.status, 'tempWallet')}>
                      {String(wallet.status || '').toUpperCase()}
                    </span>
                    {wallet.isExpired &&
                    <Badge color="danger" label>EXPIRED</Badge>
                    }
                    {wallet.coinSymbol &&
                    <Badge color="primary" label className="inline-flex items-center gap-1">
                        <CoinImg symbol={wallet.coinSymbol} networkSymbol={wallet.networkSymbol} size={16} />
                        {wallet.coinSymbol} · {wallet.networkSymbol}
                      </Badge>
                    }
                    {wallet.invoiceId &&
                    <Badge color="secondary">Invoice #{wallet.invoiceId}</Badge>
                    }
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline-info"
                  href={`/admin/temp-wallet-histories?tempWalletId=${wallet.id}`}>
                    
                    
                    <i className="bx bx-history mr-1"></i>
                    View Histories
                  </Button>
                  <RefreshButton onClick={loadWallet} loading={loading} />
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-x-6">
            {/* Wallet Info */}
            <div className="md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0"><i className="bx bx-detail mr-2"></i>Wallet Details</h5>
                </div>
                <div className="p-5">
                  <Table responsive={false} className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{wallet.id}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.status', { defaultValue: 'Status' })}</td>
                        <td>
                          <span className={getStatusBadgeClass(wallet.status, 'tempWallet')}>
                            {String(wallet.status || '').toUpperCase()}
                          </span>
                          {wallet.isExpired &&
                          <Badge color="danger" label className="ml-1">EXPIRED</Badge>
                          }
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Invoice ID</td>
                        <td>
                          {wallet.invoiceId ?
                          <Link
                            href={`/admin/invoices/${wallet.invoiceId}`}
                            className="font-medium text-primary">
                            
                              {wallet.invoiceId}
                            </Link> :
                          <span className="text-surface-500">-</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
                        <td className="font-medium">{wallet.userId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.coin', { defaultValue: 'Coin' })}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <CoinImg symbol={wallet.coinSymbol} networkSymbol={wallet.networkSymbol} size={28} />
                            <div>
                              <span className="font-semibold">{wallet.coinSymbol || '-'}</span>
                              <span className="text-surface-500 ml-1 text-[0.8rem]">on {wallet.networkName || wallet.networkSymbol || '-'}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Decimals</td>
                        <td className="font-medium">{wallet.decimals ?? '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.address', { defaultValue: 'Address' })}</td>
                        <td>
                          {wallet.address ?
                          <div className="flex items-center">
                              <code className="text-surface-800 mr-2 text-[0.8rem] break-all">
                                {wallet.address}
                              </code>
                              <Button

                              onClick={() => handleCopy(wallet.address)}
                              title={t('actions.copy', { defaultValue: 'Copy' })} size="icon-sm" variant="text-secondary" className="shrink-0">
                              
                                <i className="bx bx-copy"></i>
                              </Button>
                              {wallet.explorerUrl &&
                            <Button variant="text-primary" size="icon" className="rounded-full shrink-0"
                            href={`${wallet.explorerUrl}/address/${wallet.address}`}
                            target="_blank"
                            rel="noopener noreferrer"

                            title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}>
                              
                                  <i className="bx bx-link-external"></i>
                                </Button>
                            }
                            </div> :
                          <span className="text-surface-500">-</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Reuse Count</td>
                        <td className="font-medium">{wallet.reuseCount ?? 0}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Total Received</td>
                        <td>
                          <span className="font-medium">{wallet.totalReceivedAmount || '0'}</span>
                          <span className="text-surface-500 ml-1 text-xs">{wallet.coinSymbol}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Total Swept</td>
                        <td>
                          <span className="font-medium">{wallet.totalSweptAmount || '0'}</span>
                          <span className="text-surface-500 ml-1 text-xs">{wallet.coinSymbol}</span>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="md:col-span-6">
              {/* Flags */}
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0"><i className="bx bx-flag mr-2"></i>Flags</h5>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {wallet.isReusable != null && (
                    wallet.isReusable ?
                    <Badge color="success" label>Reusable</Badge> :
                    <Badge color="secondary">Not Reusable</Badge>)
                    }
                    {wallet.isAssigned && <Badge color="info" label>Assigned</Badge>}
                    {wallet.isAvailable && <Badge color="success" label>Available</Badge>}
                    {wallet.isExpired && <Badge color="danger" label>{t('status.expired', { defaultValue: 'Expired' })}</Badge>}
                    {wallet.hasBeenUsed && <Badge color="warning" label>Has Been Used</Badge>}
                    {wallet.needsSweeping && <Badge color="primary" label>Needs Sweeping</Badge>}
                    {wallet.timeToExpiry != null &&
                    <Badge color="warning" label>
                        Expires in {Math.floor(wallet.timeToExpiry / 60000)}m
                      </Badge>
                    }
                  </div>
                </div>
              </Card>

              {/* Timestamps */}
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0"><i className="bx bx-time-five mr-2"></i>{t('admin.detail.timestamps', { defaultValue: 'Timestamps' })}</h5>
                </div>
                <div className="p-5">
                  <Table responsive={false} className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                        <td>{fmtDate(wallet.createdAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
                        <td>{fmtDate(wallet.updatedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Expires</td>
                        <td>{fmtDate(wallet.expiresAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">First Used</td>
                        <td>{fmtDate(wallet.firstUsedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Last Assigned</td>
                        <td>{fmtDate(wallet.lastAssignedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Last Released</td>
                        <td>{fmtDate(wallet.lastReleasedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Last Checked</td>
                        <td>{fmtDate(wallet.lastCheckedAt)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Last Sweep</td>
                        <td>{fmtDate(wallet.lastSweepAt)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card>

              {/* Sweep Info */}
              {(wallet.lastSweepTxHash || wallet.lastSweepAmountRaw || wallet.lastTxHash || wallet.lastBlockNumber) &&
              <Card className="mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0"><i className="bx bx-transfer mr-2"></i>Sweep Info</h5>
                  </div>
                  <div className="p-5">
                    <Table responsive={false} className="mb-0">
                      <tbody>
                        {wallet.lastSweepTxHash &&
                      <tr>
                            <td className="text-surface-500 w-2/5">Sweep Tx Hash</td>
                            <td>
                              <div className="flex items-center">
                                <code className="text-surface-800 mr-2 text-xs break-all">
                                  {wallet.lastSweepTxHash}
                                </code>
                                <Button

                              onClick={() => handleCopy(wallet.lastSweepTxHash)}
                              title={t('actions.copy', { defaultValue: 'Copy' })} size="icon-sm" variant="text-secondary" className="shrink-0">
                              
                                  <i className="bx bx-copy"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                      }
                        {(wallet.lastSweepAmount || wallet.lastSweepAmountRaw) &&
                      <tr>
                            <td className="text-surface-500">Sweep Amount</td>
                            <td>
                              <span className="font-medium">{wallet.lastSweepAmount || wallet.lastSweepAmountRaw}</span>
                              <span className="text-surface-500 ml-1 text-xs">{wallet.coinSymbol}</span>
                            </td>
                          </tr>
                      }
                        {wallet.lastTxHash &&
                      <tr>
                            <td className="text-surface-500">Last Tx Hash</td>
                            <td>
                              <div className="flex items-center">
                                <code className="text-surface-800 mr-2 text-xs break-all">
                                  {wallet.lastTxHash}
                                </code>
                                <Button

                              onClick={() => handleCopy(wallet.lastTxHash)}
                              title={t('actions.copy', { defaultValue: 'Copy' })} size="icon-sm" variant="text-secondary" className="shrink-0">
                              
                                  <i className="bx bx-copy"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                      }
                        {wallet.lastBlockNumber &&
                      <tr>
                            <td className="text-surface-500">Last Block Number</td>
                            <td className="font-medium">{wallet.lastBlockNumber}</td>
                          </tr>
                      }
                        {(wallet.lastLeftoverTokenAmount || wallet.lastLeftoverTokenRaw) &&
                      <tr>
                            <td className="text-surface-500">Leftover Token</td>
                            <td>
                              <span className="font-medium">{wallet.lastLeftoverTokenAmount || wallet.lastLeftoverTokenRaw}</span>
                              <span className="text-surface-500 ml-1 text-xs">{wallet.coinSymbol}</span>
                            </td>
                          </tr>
                      }
                        {(wallet.lastLeftoverNativeAmount || wallet.lastLeftoverNativeRaw) &&
                      <tr>
                            <td className="text-surface-500">Leftover Native</td>
                            <td>
                              <span className="font-medium">{wallet.lastLeftoverNativeAmount || wallet.lastLeftoverNativeRaw}</span>
                            </td>
                          </tr>
                      }
                        {wallet.lastReason &&
                      <tr>
                            <td className="text-surface-500">Last Reason</td>
                            <td>{wallet.lastReason}</td>
                          </tr>
                      }
                        {wallet.lastSource &&
                      <tr>
                            <td className="text-surface-500">Last Source</td>
                            <td>{wallet.lastSource}</td>
                          </tr>
                      }
                      </tbody>
                    </Table>
                  </div>
                </Card>
              }

              {/* Metadata */}
              {wallet.metadata && Object.keys(wallet.metadata).length > 0 &&
              <Card className="mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0"><i className="bx bx-code-alt mr-2"></i>{t('admin.detail.metadata', { defaultValue: 'Metadata' })}</h5>
                  </div>
                  <div className="p-5">
                    <pre className="mb-0 whitespace-pre-wrap break-all text-[0.8rem] max-h-[300px] overflow-auto">
                      {JSON.stringify(wallet.metadata, null, 2)}
                    </pre>
                  </div>
                </Card>
              }
            </div>
          </div>
        </div>
      </div>
    </div>);

}