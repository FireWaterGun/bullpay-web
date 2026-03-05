'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/app/providers';
import { usePusher } from '@/app/providers';
import { getPublicInvoice, getPublicInvoiceStatus } from '@/lib/api/invoices';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { formatCoinAmount } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import CoinImg from '@/components/CoinImg';
import CountdownTimer from './CountdownTimer';
import PaymentQRCode from './PaymentQRCode';
import PaymentProgressCard from './PaymentProgressCard';
import PageSpinner from '@/components/PageSpinner';
import { Alert, Button, Card, Input, Label } from '../ui'

export default function InvoicePayment({ code }) {
  const { t } = useTranslation();
  const toast = useToast();
  const pusher = usePusher();
  const { fmtDate } = useDateFormat();

  const [invoice, setInvoice] = useState(null);
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInvoice = useCallback(async () => {
    if (!code) return;
    try {
      setLoading(true);
      const data = await getPublicInvoice(code);
      setInvoice(data.invoice);
      setQr(data.qr);
    } catch (err) {
      setError(err?.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  // Real-time updates via Pusher
  useEffect(() => {
    if (!pusher?.subscribe || !pusher?.isConnected || !invoice?.id) return;
    const channelName = `invoice.${invoice.id}`;
    const channel = pusher.subscribe(channelName);

    const refreshStatus = async () => {
      try {
        const statusData = await getPublicInvoiceStatus(code);
        setInvoice((prev) => prev ? { ...prev, ...statusData } : prev);
      } catch {/* ignore */}
    };

    channel.bind('payment.received', refreshStatus);
    channel.bind('invoice.status.changed', refreshStatus);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [pusher?.subscribe, pusher?.isConnected, invoice?.id, code]);

  async function handleCopy(text) {
    const ok = await copyToClipboard(text);
    if (ok) toast.success(t('common.copied', { defaultValue: 'Copied!' }));
  }

  if (loading) {
    return <PageSpinner />;
  }

  if (error || !invoice) {
    return (
      <div className="grow py-6">
        <Alert>
          <i className="bx bx-error-circle mr-1"></i>
          {error || t('invoices.notFound', { defaultValue: 'Invoice not found' })}
        </Alert>
      </div>);

  }

  const status = String(invoice.status || '').toLowerCase();
  const isPaid = status === 'paid' || status === 'completed';
  const isExpired = status === 'expired';

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6 justify-center">
        <div className="lg:col-span-8 xl:col-span-6">
          {/* Status badge */}
          <div className="text-center mb-4">
            {isPaid &&
            <Alert variant="success" className="py-2">
                <i className="bx bx-check-circle mr-1"></i>
                {t('invoices.paidSuccess', { defaultValue: 'Payment received successfully!' })}
              </Alert>
            }
            {isExpired &&
            <Alert className="py-2">
                <i className="bx bx-time-five mr-1"></i>
                {t('invoices.expired', { defaultValue: 'This invoice has expired' })}
              </Alert>
            }
          </div>

          {/* Payment Progress */}
          <PaymentProgressCard invoice={invoice} t={t} />

          {/* QR Code + Address */}
          {!isPaid && !isExpired &&
          <Card className="mb-3">
              <div className="p-5 text-center">
                {qr?.dataUrl &&
              <div className="mb-3">
                    <PaymentQRCode qrDataUrl={qr.dataUrl} size={220} />
                  </div>
              }

                {invoice.paymentAddress &&
              <div className="mb-3">
                    <Label className="text-sm text-muted">
                      {t('invoices.sendTo', { defaultValue: 'Send to this address' })}
                    </Label>
                    <div className="flex items-stretch">
                      <Input
                    type="text"

                    value={invoice.paymentAddress}
                    readOnly className="font-monospace text-[0.85rem]" />

                  
                      <Button onClick={() => handleCopy(invoice.paymentAddress)} variant="outline-secondary">
                        <i className="bx bx-copy"></i>
                      </Button>
                    </div>
                  </div>
              }

                <div className="mb-3">
                  <span className="text-muted text-sm">{t('invoices.amount', { defaultValue: 'Amount' })}:</span>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <CoinImg symbol={invoice.coinSymbol} size={24} />
                    <span className="text-2xl font-bold">
                      {formatCoinAmount(invoice.amountDecimal || invoice.amount || 0)}
                    </span>
                    <span className="text-muted">{invoice.coinSymbol || ''}</span>
                  </div>
                </div>

                {invoice.expiresAt &&
              <div>
                    <small className="text-muted">
                      {t('invoices.timeRemaining', { defaultValue: 'Time remaining' })}:
                    </small>
                    <div>
                      <CountdownTimer expiresAt={invoice.expiresAt} onExpired={loadInvoice} />
                    </div>
                  </div>
              }
              </div>
            </Card>
          }

          {/* Invoice Details */}
          <Card>
            <div className="px-5 py-4 border-b border-surface-200">
              <h6 className="mb-0">{t('invoices.details', { defaultValue: 'Invoice Details' })}</h6>
            </div>
            <div className="p-5">
              <table className="w-full text-sm mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted">ID</td>
                    <td className="font-semibold">{invoice.id || invoice.code}</td>
                  </tr>
                  {invoice.description &&
                  <tr>
                      <td className="text-muted">{t('invoices.description', { defaultValue: 'Description' })}</td>
                      <td>{invoice.description}</td>
                    </tr>
                  }
                  {invoice.merchantName &&
                  <tr>
                      <td className="text-muted">{t('invoices.merchant', { defaultValue: 'Merchant' })}</td>
                      <td>{invoice.merchantName}</td>
                    </tr>
                  }
                  <tr>
                    <td className="text-muted">{t('invoices.createdAt', { defaultValue: 'Created' })}</td>
                    <td>{fmtDate(invoice.createdAt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>);

}