'use client';

import { useState, useCallback } from 'react';

import { useTranslation } from 'react-i18next';
import { useDateFormat } from '@/hooks/useDateFormat';
import { copyToClipboard } from '@/lib/utils/clipboard';
import CountdownTimer from './CountdownTimer';
import { Button, Card } from '../ui';

export default function InvoiceDetailActions({ invoice, explorer }) {
  const { t } = useTranslation();
  const { fmtDateTime } = useDateFormat();
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [shareError, setShareError] = useState('');

  const buildPublicUrl = useCallback(() => {
    if (!invoice?.publicCode) return '';
    if (typeof window === 'undefined') return `/pay/${invoice.publicCode}`;
    return `${window.location.origin}/pay/${invoice.publicCode}`;
  }, [invoice?.publicCode]);

  const handleOpenPublic = () => {
    const url = buildPublicUrl();
    if (!url) return;
    try {window.open(url, '_blank', 'noopener');} catch {}
  };

  const handleSharePublic = async () => {
    setShareError('');
    const url = buildPublicUrl();
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: invoice?.invoiceNumber || 'Invoice',
          text: t('invoices.shareText') || 'Invoice payment link',
          url
        });
      } catch (e) {
        if (e && e.name !== 'AbortError') setShareError(t('actions.shareFailed') || 'Share failed');
      }
    } else {
      try {
        await copyToClipboard(url);
        setCopiedPublic(true);
        setTimeout(() => setCopiedPublic(false), 1500);
      } catch {
        setShareError(t('actions.shareNotSupported') || 'Share not supported');
      }
    }
  };

  return (
    <div className="lg:col-span-3">
      {invoice.status === 'pending' && invoice.expiryAt &&
      <Card className="mb-4">
          <div className="p-6">
            <CountdownTimer expiryAt={invoice.expiryAt} />
          </div>
        </Card>
      }
      <Card className="mb-4">
        <div className="p-6">
          <h6 className="mb-3 font-semibold">{t('invoices.actions') || 'Actions'}</h6>
          <div className="grid gap-2">
            {invoice.publicCode &&
            <>
                <Button type="button" onClick={handleOpenPublic} variant="outline-primary" className="bg-transparent hover:bg-primary-600 hover:text-white">
                  <i className="bx bx-link-alt mr-1"></i>
                  {t('actions.openPaymentLink') || 'Open payment page'}
                </Button>
                <Button type="button" onClick={handleSharePublic} className="border border-info-500 text-info-500 bg-transparent hover:bg-info-500 hover:text-white">
                  <i className="bx bx-share-alt mr-1"></i>
                  {t('actions.share') || 'Share'}
                </Button>
              </>
            }
            <Button variant="outline-secondary"

            href={
            explorer && invoice.paymentAddress ?
            `${explorer.replace(/\/$/, '')}/address/${invoice.paymentAddress}` :
            undefined
            }
            target={explorer ? '_blank' : undefined}
            rel={explorer ? 'noreferrer' : undefined}>
              
              <i className="bx bx-link-external mr-1"></i>
              {t('invoices.viewOnExplorer') || 'View on Explorer'}
            </Button>
            <Button variant="outline-secondary" href="/invoices">
              <i className="bx bx-list-ul mr-1"></i>
              {t('nav.history') || 'All invoices'}
            </Button>
          </div>
          {shareError && <div className="rounded-lg bg-amber-50 text-amber-700 mt-3 py-2 px-3 text-sm">{shareError}</div>}
        </div>
      </Card>
      <Card>
        <div className="p-6">
          {invoice.publicCode &&
          <>
              <small className="text-surface-500 block mb-1">{t('invoices.publicCode') || 'Public Code'}</small>
              <div className="flex items-center mb-3 gap-2">
                <code>{invoice.publicCode}</code>
                <Button type="button" onClick={handleOpenPublic} title={t('actions.openPaymentLink') || 'Open payment page'} variant="outline-secondary" size="sm">
                  <i className="bx bx-link-alt"></i>
                </Button>
              </div>
            </>
          }
          <small className="text-surface-500 block mb-1">{t('invoices.createdAt') || 'Created'}</small>
          <div>{fmtDateTime(invoice.createdAt || invoice.created_at)}</div>
          {invoice.expiryAt &&
          <>
              <small className="text-surface-500 block mt-3 mb-1">{t('invoices.expiryAt') || 'Expires'}</small>
              <div>{fmtDateTime(invoice.expiryAt)}</div>
            </>
          }
        </div>
      </Card>
    </div>);

}