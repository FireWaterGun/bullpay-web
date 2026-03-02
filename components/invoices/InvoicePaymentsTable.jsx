'use client'

import { useTranslation } from 'react-i18next'
import { formatAmount, formatDateTime } from '@/lib/utils/format'
import { statusClass, formatTxHash } from './invoiceDetailHelpers'

export default function InvoicePaymentsTable({ payments, coinSym, explorer }) {
  const { t } = useTranslation()

  if (!payments) {
    return (
      <div className="alert alert-info">
        <i className="bx bx-info-circle me-2"></i>
        {t('invoices.noPaymentsData', { defaultValue: 'No payments data available' })}
      </div>
    )
  }

  if (!Array.isArray(payments)) {
    return (
      <div className="alert alert-warning">
        <i className="bx bx-error me-2"></i>
        {t('invoices.paymentsNotArray', { defaultValue: 'Payments data format error' })}
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="alert alert-info">
        <i className="bx bx-info-circle me-2"></i>
        {t('invoices.noPaymentTransactions', { defaultValue: 'No payment transactions yet' })}
      </div>
    )
  }

  return (
    <div className="table-responsive">
      <table className="table table-sm">
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
              <td className="text-nowrap">
                {p.txHash ? (
                  explorer ? (
                    <a
                      href={`${explorer.replace(/\/$/, '')}/tx/${p.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                      title={p.txHash}
                    >
                      {formatTxHash(p.txHash)}
                    </a>
                  ) : (
                    <code className="small" title={p.txHash}>{formatTxHash(p.txHash)}</code>
                  )
                ) : (
                  '-'
                )}
              </td>
              <td className="text-nowrap">
                {formatAmount(p.actualAmount || p.amount || 0)} {coinSym}
              </td>
              <td>
                <span className={`badge text-capitalize ${statusClass(p.status)}`}>
                  {p.status ? t(`invoices.${p.status.toLowerCase()}`, { defaultValue: p.status }) : '-'}
                </span>
              </td>
              <td className="text-nowrap">{formatDateTime(p.createdAt || p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
