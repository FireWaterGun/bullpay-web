'use client'

import CoinImg from '@/components/CoinImg'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { formatCoinAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'

export default function PaymentDetailsSection({ invoice, toast, t }) {
  const { fmtDate } = useDateFormat()
  async function handleCopy(text) {
    const ok = await copyToClipboard(text)
    if (ok) toast?.('success', t?.('common.copied', { defaultValue: 'Copied!' }) || 'Copied!')
  }

  return (
    <div className="card mb-3">
      <div className="card-header">
        <h6 className="mb-0">{t?.('invoices.paymentDetails', { defaultValue: 'Payment Details' }) || 'Payment Details'}</h6>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-borderless mb-0">
            <tbody>
              <tr>
                <td className="text-muted" style={{ width: 160 }}>{t?.('invoices.coin', { defaultValue: 'Coin' }) || 'Coin'}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <CoinImg symbol={invoice?.coinSymbol} networkSymbol={invoice?.networkSymbol} size={20} />
                    <span>{invoice?.coinSymbol || '-'}</span>
                    {invoice?.networkSymbol && <small className="text-muted">({invoice.networkSymbol})</small>}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="text-muted">{t?.('invoices.amount', { defaultValue: 'Amount' }) || 'Amount'}</td>
                <td className="fw-semibold">{formatCoinAmount(invoice?.amountDecimal || invoice?.amount || 0)} {invoice?.coinSymbol || ''}</td>
              </tr>
              {invoice?.paymentAddress && (
                <tr>
                  <td className="text-muted">{t?.('invoices.address', { defaultValue: 'Address' }) || 'Address'}</td>
                  <td>
                    <div className="d-flex align-items-center gap-1">
                      <span className="font-monospace small text-break">{invoice.paymentAddress}</span>
                      <button className="btn btn-sm btn-icon btn-text-secondary flex-shrink-0" onClick={() => handleCopy(invoice.paymentAddress)}>
                        <i className="bx bx-copy"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {invoice?.memo && (
                <tr>
                  <td className="text-muted">{t?.('invoices.memo', { defaultValue: 'Memo' }) || 'Memo'}</td>
                  <td>{invoice.memo}</td>
                </tr>
              )}
              {invoice?.description && (
                <tr>
                  <td className="text-muted">{t?.('invoices.description', { defaultValue: 'Description' }) || 'Description'}</td>
                  <td>{invoice.description}</td>
                </tr>
              )}
              <tr>
                <td className="text-muted">{t?.('invoices.createdAt', { defaultValue: 'Created' }) || 'Created'}</td>
                <td>{fmtDate(invoice?.createdAt)}</td>
              </tr>
              {invoice?.expiresAt && (
                <tr>
                  <td className="text-muted">{t?.('invoices.expiresAt', { defaultValue: 'Expires' }) || 'Expires'}</td>
                  <td>{fmtDate(invoice?.expiresAt)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
