'use client';

import CoinImg from '@/components/CoinImg';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { formatCoinAmount } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import { Button, Card } from '../ui'

export default function PaymentDetailsSection({ invoice, toast, t }) {
  const { fmtDate } = useDateFormat();
  async function handleCopy(text) {
    const ok = await copyToClipboard(text);
    if (ok) toast?.('success', t?.('common.copied', { defaultValue: 'Copied!' }) || 'Copied!');
  }

  return (
    <Card className="mb-3">
      <div className="px-5 py-4 border-b border-surface-200">
        <h6 className="mb-0">{t?.('invoices.paymentDetails', { defaultValue: 'Payment Details' }) || 'Payment Details'}</h6>
      </div>
      <div className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full mb-0">
            <tbody>
              <tr>
                <td className="text-muted w-[160px]">{t?.('invoices.coin', { defaultValue: 'Coin' }) || 'Coin'}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <CoinImg symbol={invoice?.coinSymbol} networkSymbol={invoice?.networkSymbol} size={20} />
                    <span>{invoice?.coinSymbol || '-'}</span>
                    {invoice?.networkSymbol && <small className="text-muted">({invoice.networkSymbol})</small>}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="text-muted">{t?.('invoices.amount', { defaultValue: 'Amount' }) || 'Amount'}</td>
                <td className="font-semibold">{formatCoinAmount(invoice?.amountDecimal || invoice?.amount || 0)} {invoice?.coinSymbol || ''}</td>
              </tr>
              {invoice?.paymentAddress &&
              <tr>
                  <td className="text-muted">{t?.('invoices.address', { defaultValue: 'Address' }) || 'Address'}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <span className="font-monospace text-sm break-words">{invoice.paymentAddress}</span>
                      <Button onClick={() => handleCopy(invoice.paymentAddress)} size="icon" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none shrink-0">
                        <i className="bx bx-copy"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              }
              {invoice?.memo &&
              <tr>
                  <td className="text-muted">{t?.('invoices.memo', { defaultValue: 'Memo' }) || 'Memo'}</td>
                  <td>{invoice.memo}</td>
                </tr>
              }
              {invoice?.description &&
              <tr>
                  <td className="text-muted">{t?.('invoices.description', { defaultValue: 'Description' }) || 'Description'}</td>
                  <td>{invoice.description}</td>
                </tr>
              }
              <tr>
                <td className="text-muted">{t?.('invoices.createdAt', { defaultValue: 'Created' }) || 'Created'}</td>
                <td>{fmtDate(invoice?.createdAt)}</td>
              </tr>
              {invoice?.expiresAt &&
              <tr>
                  <td className="text-muted">{t?.('invoices.expiresAt', { defaultValue: 'Expires' }) || 'Expires'}</td>
                  <td>{fmtDate(invoice?.expiresAt)}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </Card>);

}