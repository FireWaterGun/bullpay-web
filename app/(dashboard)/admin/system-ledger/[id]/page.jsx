'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useToast } from '@/app/providers';
import { getSystemLedgerEntry } from '@/lib/api/admin';
import { formatUsd } from '@/lib/utils/format';
import CoinImg from '@/components/CoinImg';
import { copyToClipboard as copyText } from '@/lib/utils/clipboard';
import { formatAmount, stateBadge, entryCodeLabels, getPurposeLabel, parseMetadata } from '@/components/ledger/ledgerUtils';
import { TransactionCard, TimestampsCard, MetadataCard } from '@/components/ledger/SystemLedgerDetailCards';
import { logger } from '@/lib/utils/logger';
import PageSpinner from '@/components/PageSpinner';
import { Badge, Button, Card } from '../../../../../components/ui';

export default function SystemLedgerDetail() {
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
      const data = await getSystemLedgerEntry(token, parseInt(id));
      setEntry(data);
    } catch (error) {
      logger.error('Failed to load system ledger entry:', error);
      toast.error(t('admin.ledger.loadError', { defaultValue: 'Failed to load ledger entry' }));
    } finally {
      setLoading(false);
    }
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
  const metadata = parseMetadata(entry);
  const purposeLabel = getPurposeLabel(metadata);
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
                      {t('admin.ledger.systemLedgerEntry', { defaultValue: 'System Ledger Entry' })} #{entry.id}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${entry.state === 'reversed' ? 'bg-surface-100 text-surface-600' : isCredit ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        <i className={`bx ${isCredit ? 'bx-minus-circle' : 'bx-plus-circle'} mr-1`}></i>
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
                  <div className={`text-2xl font-bold ${isReversed ? '' : isCredit ? 'text-danger' : 'text-success'}`}>
                    {isReversed ? '' : isCredit ? '-' : '+'}{formatAmount(entry.amount)} <span className="text-[0.75em] font-normal">{entry.coinSymbol}</span>
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
                        <td className="text-muted">{t('admin.detail.walletId', { defaultValue: 'Wallet ID' })}</td>
                        <td>{entry.walletId || 'N/A'}</td>
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
                          <Badge className={`${entry.state === 'reversed' ? 'bg-surface-100 text-surface-600' : isCredit ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
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
                          <span className={`font-bold ${isReversed ? '' : isCredit ? 'text-danger' : 'text-success'}`}>
                            {isReversed ? '' : isCredit ? '-' : '+'}{formatAmount(entry.amount)}
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
                      {purposeLabel &&
                        <tr>
                          <td className="text-muted">{t('admin.detail.purpose', { defaultValue: 'Purpose' })}</td>
                          <td className="font-medium">{purposeLabel}</td>
                        </tr>
                        }
                    </tbody>
                  </table>
                  </div>
                </div>
              </Card>
            </div>

            {/* Transaction, Timestamps & Metadata */}
            <div className="md:col-span-6">
              <TransactionCard entry={entry} metadata={metadata} explorerUrl={explorerUrl} onCopy={handleCopy} />
              <TimestampsCard entry={entry} />
              <MetadataCard metadata={metadata} />
            </div>
          </div>
        </div>
      </div>
    </div>);

}