'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useToast } from '@/app/providers';
import { getUserLedgerEntry } from '@/lib/api/admin';
import { formatUsd } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import CoinImg from '@/components/CoinImg';
import { copyToClipboard as copyText } from '@/lib/utils/clipboard';
import { logger } from '@/lib/utils/logger';
import PageSpinner from '@/components/PageSpinner';
import { Badge, Button, Card } from '../../../../../components/ui';

export default function UserLedgerDetail() {
  const { fmtDateTime } = useDateFormat();
  const { t } = useAdminTranslation();
  const { token } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    loadEntry();
  }, [id]);

  async function loadEntry() {
    try {
      setLoading(true);
      const data = await getUserLedgerEntry(token, parseInt(id));
      setEntry(data);
    } catch (error) {
      logger.error('Failed to load user ledger entry:', error);
      toast.error(t('admin.ledger.loadError', { defaultValue: 'Failed to load ledger entry' }));
    } finally {
      setLoading(false);
    }
  }

  function formatAmount(val) {
    if (!val && val !== 0) return '0';
    let str = String(val);
    if (str.includes('.')) {
      str = str.replace(/0+$/, '').replace(/\.$/, '');
    }
    return str || '0';
  }


  function stateBadge(state) {
    if (state === 'settled') return <Badge className="bg-green-50 text-green-700">Settled</Badge>;
    if (state === 'committed') return <Badge className="bg-cyan-50 text-cyan-700">Committed</Badge>;
    if (state === 'pending') return <Badge className="bg-amber-50 text-amber-700">{t('status.pending', { defaultValue: 'Pending' })}</Badge>;
    if (state === 'reversed') return <Badge className="bg-surface-100 text-surface-600">Reversed</Badge>;
    return <span className="text-muted">{state || 'N/A'}</span>;
  }

  async function handleCopy(text) {
    const ok = await copyText(text);
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }));else
    toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }));
  }

  if (loading) {
    return <PageSpinner />;
  }

  if (!entry) {
    return (
      <div className="grow py-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[3rem] text-surface-500"></i>
          <p className="text-muted mt-2">{t('admin.ledger.notFound', { defaultValue: 'Ledger entry not found' })}</p>
          <Button onClick={() => router.back()}>
            {t('actions.back', { defaultValue: 'Back' })}
          </Button>
        </div>
      </div>);

  }

  const isCredit = entry.entryType === 'credit';
  const isReversed = entry.state === 'reversed';

  // Parse metadata
  let metadata = {};
  try {
    metadata = typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata || {};
  } catch (e) {/* ignore */}

  const entryCodeLabels = {
    'SP': 'Settlement Payment',
    'SC': 'Sweep Cost',
    'SG': 'Sweep Gas',
    'WD': 'Withdrawal',
    'DP': 'Deposit',
    'FE': 'Fee',
    'AJ': 'Adjustment'
  };

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back Button */}
          <Button
            onClick={() => router.back()} variant="outline-secondary" className="mb-3">

            
            <i className="bx bx-arrow-back mr-2"></i>
            {t('actions.back', { defaultValue: 'Back' })}
          </Button>

          {/* Header */}
          <Card className="mb-4">
            <div className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {entry.coinSymbol &&
                  <CoinImg
                    symbol={entry.coinSymbol}
                    networkSymbol={entry.networkSymbol}
                    size={48} />

                  }
                  <div>
                    <h4 className="mb-1">
                      {t('admin.ledger.userLedgerEntry', { defaultValue: 'User Ledger Entry' })} #{entry.id}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${entry.state === 'reversed' ? 'bg-surface-100 text-surface-600' : isCredit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <i className={`bx ${isCredit ? 'bx-plus-circle' : 'bx-minus-circle'} mr-1`}></i>
                        {isCredit ? 'Credit' : 'Debit'}
                      </Badge>
                      {entry.entryCode &&
                      <Badge className="bg-surface-100 text-surface-600">
                          {entryCodeLabels[entry.entryCode] || entry.entryCode}
                        </Badge>
                      }
                      {stateBadge(entry.state)}
                      {entry.userId &&
                      <Badge className="bg-primary-50 text-primary-600">
                          <i className="bx bx-user mr-1"></i>
                          User #{entry.userId}
                        </Badge>
                      }
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${isReversed ? '' : isCredit ? 'text-success' : 'text-danger'}`}>
                    {isReversed ? '' : isCredit ? '+' : '-'}{formatAmount(entry.amount)} <span className="text-[0.75em] font-normal">{entry.coinSymbol}</span>
                  </div>
                  <div className="text-muted">
                    {formatUsd(entry.amountUsd)}
                  </div>
                  {entry.networkName &&
                  <small className="text-muted">{entry.networkName}</small>
                  }
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-x-6">
            {/* Entry Details */}
            <div className="md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    <i className="bx bx-detail mr-2"></i>
                    {t('admin.ledger.details', { defaultValue: 'Details' })}
                  </h5>
                </div>
                <div className="p-5">
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="text-muted w-2/5">{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{entry.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
                        <td><Badge className="bg-primary-50 text-primary-600">#{entry.userId}</Badge></td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.ledger.coin', { defaultValue: 'Coin' })}</td>
                        <td>
                          <div className="flex items-center">
                            <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={24} className="mr-3" />
                            <div>
                              <span className="font-medium">{entry.coinSymbol || 'N/A'}</span>
                              {entry.networkName &&
                                <small className="text-muted ml-1">/ {entry.networkName}</small>
                                }
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.ledger.entryType', { defaultValue: 'Entry Type' })}</td>
                        <td>
                          <Badge className={`${entry.state === 'reversed' ? 'bg-surface-100 text-surface-600' : isCredit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {isCredit ? 'Credit' : 'Debit'}
                          </Badge>
                        </td>
                      </tr>
                      {entry.entryCode &&
                        <tr>
                          <td className="text-muted">Entry Code</td>
                          <td>
                            <code>{entry.entryCode}</code>
                            <span className="text-muted ml-2">({entryCodeLabels[entry.entryCode] || entry.entryCode})</span>
                          </td>
                        </tr>
                        }
                      <tr>
                        <td className="text-muted">{t('admin.ledger.state', { defaultValue: 'State' })}</td>
                        <td>{stateBadge(entry.state)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.ledger.amount', { defaultValue: 'Amount' })}</td>
                        <td>
                          <span className={`font-bold ${isReversed ? '' : isCredit ? 'text-success' : 'text-danger'}`}>
                            {isReversed ? '' : isCredit ? '+' : '-'}{formatAmount(entry.amount)}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Amount (Raw)</td>
                        <td><code className="text-[0.8rem]">{entry.amountRaw || 'N/A'}</code></td>
                      </tr>
                      <tr>
                        <td className="text-muted">USD Value</td>
                        <td>{formatUsd(entry.amountUsd)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">USD Rate</td>
                        <td>
                          {entry.usdRate ? formatUsd(entry.usdRate) : 'N/A'}
                          {entry.rateSource && <small className="text-muted ml-1">({entry.rateSource})</small>}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Decimals</td>
                        <td>{entry.decimals ?? 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                </div>
              </Card>
            </div>

            {/* Transaction & Timestamps */}
            <div className="md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    <i className="bx bx-link mr-2"></i>
                    Transaction
                  </h5>
                </div>
                <div className="p-5">
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      {entry.reservationId &&
                        <tr>
                          <td className="text-muted w-2/5">{t('admin.detail.reservationId', { defaultValue: 'Reservation ID' })}</td>
                          <td><code>{entry.reservationId}</code></td>
                        </tr>
                        }
                      {entry.relatedId &&
                        <tr>
                          <td className="text-muted">{t('admin.detail.relatedId', { defaultValue: 'Related ID' })}</td>
                          <td>#{entry.relatedId}</td>
                        </tr>
                        }
                      {entry.txHash &&
                        <tr>
                          <td className="text-muted">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</td>
                          <td>
                            <code className="break-words text-xs">{entry.txHash}</code>
                            <div className="flex gap-1 mt-2">
                              {entry.explorerUrl &&
                              <Button variant="outline-primary" size="sm" className="py-[0.2rem] px-[0.5rem] text-xs"
                              href={`${entry.explorerUrl}/tx/${entry.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer">
                                

                                
                                  <i className="bx bx-link-external mr-1"></i>View on Explorer
                                </Button>
                              }
                              <Button

                                onClick={() => handleCopy(entry.txHash)} variant="outline-secondary" size="sm" className="py-[0.2rem] px-[0.5rem] text-xs">

                                
                                <i className="bx bx-copy mr-1"></i>Copy
                              </Button>
                            </div>
                          </td>
                        </tr>
                        }
                    </tbody>
                  </table>
                  </div>
                </div>
              </Card>

              {/* Timestamps */}
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">
                    <i className="bx bx-time mr-2"></i>
                    Timestamps
                  </h5>
                </div>
                <div className="p-5">
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="text-muted w-2/5">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                        <td>{fmtDateTime(entry.createdAt)}</td>
                      </tr>
                      {entry.committedAt &&
                        <tr>
                          <td className="text-muted">Committed</td>
                          <td>{fmtDateTime(entry.committedAt)}</td>
                        </tr>
                        }
                      {entry.settledAt &&
                        <tr>
                          <td className="text-muted">Settled</td>
                          <td>{fmtDateTime(entry.settledAt)}</td>
                        </tr>
                        }
                      {entry.reversedAt &&
                        <tr>
                          <td className="text-muted">Reversed</td>
                          <td>{fmtDateTime(entry.reversedAt)}</td>
                        </tr>
                        }
                      {entry.updatedAt &&
                        <tr>
                          <td className="text-muted">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
                          <td>{fmtDateTime(entry.updatedAt)}</td>
                        </tr>
                        }
                    </tbody>
                  </table>
                  </div>
                </div>
              </Card>

              {/* Metadata card (if present) */}
              {metadata && Object.keys(metadata).length > 0 &&
              <Card className="mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0">
                      <i className="bx bx-code-block mr-2"></i>
                      Metadata
                    </h5>
                  </div>
                  <div className="p-5">
                    <pre className="mb-0 p-3 rounded text-[0.8rem] max-h-[300px] overflow-auto bg-surface-100" style={{ border: '1px solid var(--color-surface-200)' }}>
                      {JSON.stringify(metadata, null, 2)}
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