'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useToast } from '@/app/providers';
import { getPlatformLedgerEntry } from '@/lib/api/admin';
import { formatUsd } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import CoinImg from '@/components/CoinImg';
import { copyToClipboard as copyText } from '@/lib/utils/clipboard';
import { logger } from '@/lib/utils/logger';
import PageSpinner from '@/components/PageSpinner';
import { Badge, Button, Card } from '../../../../../components/ui';

export default function PlatformLedgerDetail() {
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
      const data = await getPlatformLedgerEntry(token, parseInt(id));
      setEntry(data);
    } catch (error) {
      logger.error('Failed to load platform ledger entry:', error);
      toast.error(t('admin.platformLedger.loadError', { defaultValue: 'Failed to load platform ledger entry' }));
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
    if (state === 'reversed') return <Badge className="bg-surface-100 text-surface-600">Reversed</Badge>;
    return <span className="text-muted">{state || 'N/A'}</span>;
  }

  async function handleCopy(text) {
    const ok = await copyText(text);
    if (ok) toast.success(t('common.copiedToClipboard', { defaultValue: 'Copied!' }));else
    toast.error(t('common.copyFailed', { defaultValue: 'Failed to copy' }));
  }

  const entryCodeLabels = {
    'WF': 'Withdrawal Fee',
    'FR': 'Fee Refund',
    'SG': 'Sweep Gas Topup',
    'SC': 'Sweep Gas Cost',
    'WG': 'Withdrawal Gas',
    'XI': 'Internal Transfer In',
    'XO': 'Internal Transfer Out'
  };

  if (loading) {
    return <PageSpinner />;
  }

  if (!entry) {
    return (
      <div className="grow py-6">
        <div className="text-center py-5">
          <i className="bx bx-error-circle text-[3rem] text-surface-500"></i>
          <p className="text-muted mt-2">{t('admin.platformLedger.notFound', { defaultValue: 'Platform ledger entry not found' })}</p>
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

  const explorerUrl = entry.explorerUrl || null;

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
                      Platform Ledger Entry #{entry.id}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${entry.accountType === 'revenue' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {entry.accountType === 'revenue' ? 'Revenue' : 'Expense'}
                      </Badge>
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
                    Details
                  </h5>
                </div>
                <div className="p-5">
                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td className="text-muted w-2/5">{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{entry.id}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">Account Type</td>
                        <td>
                          <Badge className={`${entry.accountType === 'revenue' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                            {entry.accountType === 'revenue' ? 'Revenue' : 'Expense'}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.coin', { defaultValue: 'Coin' })}</td>
                        <td>
                          <div className="flex items-center">
                            <CoinImg symbol={entry.coinSymbol} networkSymbol={entry.networkSymbol} size={24} className="mr-3" />
                            <span className="font-medium">{entry.coinSymbol || '-'}</span>
                            {entry.networkName && <span className="text-muted ml-1">({entry.networkName})</span>}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Entry Code</td>
                        <td>
                          <span className="font-medium">{entry.entryCode || '-'}</span>
                          {entry.entryCode && entryCodeLabels[entry.entryCode] &&
                          <span className="text-muted ml-1">- {entryCodeLabels[entry.entryCode]}</span>
                          }
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Entry Type</td>
                        <td>
                          <Badge className={`${entry.state === 'reversed' ? 'bg-surface-100 text-surface-600' : isCredit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {isCredit ? 'Credit' : 'Debit'}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.state', { defaultValue: 'State' })}</td>
                        <td>{stateBadge(entry.state)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.amount', { defaultValue: 'Amount' })}</td>
                        <td>
                          <span className={`font-medium ${isReversed ? '' : isCredit ? 'text-success' : 'text-danger'}`}>
                            {isReversed ? '' : isCredit ? '+' : '-'}{formatAmount(entry.amount)} {entry.coinSymbol}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">USD Value</td>
                        <td className="font-medium">{formatUsd(entry.amountUsd)}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                        <td>{fmtDateTime(entry.createdAt)}</td>
                      </tr>
                      {entry.updatedAt &&
                      <tr>
                          <td className="text-muted">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
                          <td>{fmtDateTime(entry.updatedAt)}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Transaction & Metadata */}
            <div className="md:col-span-6">
              {entry.txHash &&
              <Card className="mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0">
                      <i className="bx bx-link mr-2"></i>
                      Transaction
                    </h5>
                  </div>
                  <div className="p-5">
                    <table className="w-full">
                      <tbody>
                        <tr>
                          <td className="text-muted w-[30%]">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</td>
                          <td>
                            <div className="flex items-center">
                              <code className="mr-2 break-all">{entry.txHash}</code>
                              <Button

                              onClick={() => handleCopy(entry.txHash)}
                              title={t('actions.copy', { defaultValue: 'Copy' })} size="icon" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none">
                              
                                <i className="bx bx-copy"></i>
                              </Button>
                              {explorerUrl &&
                            <Button variant="text-secondary" size="icon"
                            href={`${explorerUrl}/tx/${entry.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"

                            title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}>
                              
                                  <i className="bx bx-link-external"></i>
                                </Button>
                            }
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              }

              {metadata && Object.keys(metadata).length > 0 &&
              <Card className="mb-4">
                  <div className="px-5 py-4 border-b border-surface-200">
                    <h5 className="mb-0">
                      <i className="bx bx-code-alt mr-2"></i>
                      Metadata
                    </h5>
                  </div>
                  <div className="p-5">
                    <pre className="bg-lighter p-3 rounded text-[0.85rem] max-h-[400px] overflow-auto">
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