'use client'

import { useTranslation } from 'react-i18next'
import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { statusClass, formatTxHash } from './invoiceDetailHelpers'

export default function InvoicePaymentsTable({ payments, coinSym, explorer }) {
  const { t } = useTranslation()
  const { fmtDateTime } = useDateFormat()

  if (!payments) {
    return (
      <div className="rounded-lg bg-blue-50 text-blue-700 p-4 flex items-center gap-2">
        <i className="bx bx-info-circle text-lg"></i>
        {t('invoices.noPaymentsData', { defaultValue: 'No payments data available' })}
      </div>
    )
  }

  if (!Array.isArray(payments)) {
    return (
      <div className="rounded-lg bg-amber-50 text-amber-700 p-4 flex items-center gap-2">
        <i className="bx bx-error text-lg"></i>
        {t('invoices.paymentsNotArray', { defaultValue: 'Payments data format error' })}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 text-blue-700 p-4 flex items-center gap-2">
        <i className="bx bx-info-circle text-lg"></i>
        {t('invoices.noPaymentTransactions', { defaultValue: 'No payment transactions yet' })}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-surface-500">
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">{t('invoices.txHash') || 'Tx Hash'}</th>
            <th className="px-3 py-2">{t('invoices.amount') || 'Amount'}</th>
            <th className="px-3 py-2">{t('invoices.status') || 'Status'}</th>
            <th className="px-3 py-2">{t('invoices.date') || 'Date'}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {payments.map((p, idx) => (
            <tr key={p.id || idx} className="hover:bg-surface-50">
              <td className="px-3 py-2">{idx + 1}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {p.txHash ? (
                  explorer ? (
                    <a
                      href={`${explorer.replace(/\/$/, '')}/tx/${p.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                      title={p.txHash}
                    >
                      {formatTxHash(p.txHash)}
                    </a>
                  ) : (
                    <code className="text-xs" title={p.txHash}>{formatTxHash(p.txHash)}</code>
                  )
                ) : (
                  '-'
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {formatAmount(p.actualAmount || p.amount || 0)} {coinSym}
              </td>
              <td className="px-3 py-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass(p.status)}`}>
                  {p.status ? t(`invoices.${p.status.toLowerCase()}`, { defaultValue: p.status }) : '-'}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{fmtDateTime(p.createdAt || p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
