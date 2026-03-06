'use client'

import { useTranslation } from 'react-i18next'
import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { statusClass, formatTxHash } from './invoiceDetailHelpers'
import Table from '@/components/ui/Table'

export default function InvoicePaymentsTable({ payments, coinSym, explorer }) {
  const { t } = useTranslation()
  const { fmtDateTime } = useDateFormat()

  if (!payments) {
    return (
      <div className="rounded-lg bg-info-50 dark:bg-info-950/30 text-info-700 dark:text-info-400 p-4 flex items-center gap-2">
        <i className="bx bx-info-circle text-lg"></i>
        {t('invoices.noPaymentsData', { defaultValue: 'No payments data available' })}
      </div>
    )
  }

  if (!Array.isArray(payments)) {
    return (
      <div className="rounded-lg bg-warning-50 dark:bg-warning-950/30 text-warning-700 dark:text-warning-400 p-4 flex items-center gap-2">
        <i className="bx bx-error text-lg"></i>
        {t('invoices.paymentsNotArray', { defaultValue: 'Payments data format error' })}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-lg bg-info-50 dark:bg-info-950/30 text-info-700 dark:text-info-400 p-4 flex items-center gap-2">
        <i className="bx bx-info-circle text-lg"></i>
        {t('invoices.noPaymentTransactions', { defaultValue: 'No payment transactions yet' })}
      </div>
    )
  }

  return (
    <Table>
        <thead>
          <tr>
            <th>#</th>
            <th>{t('invoices.txHash') || 'Tx Hash'}</th>
            <th>{t('invoices.amount') || 'Amount'}</th>
            <th>{t('invoices.status') || 'Status'}</th>
            <th>{t('invoices.date') || 'Date'}</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p, idx) => (
            <tr key={p.id || idx}>
              <td>{idx + 1}</td>
              <td className="whitespace-nowrap">
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
              <td className="whitespace-nowrap">
                {formatAmount(p.actualAmount || p.amount || 0)} {coinSym}
              </td>
              <td>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass(p.status)}`}>
                  {p.status ? t(`invoices.${p.status.toLowerCase()}`, { defaultValue: p.status }) : '-'}
                </span>
              </td>
              <td className="whitespace-nowrap">{fmtDateTime(p.createdAt || p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
  )
}
