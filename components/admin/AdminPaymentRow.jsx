'use client'

import Link from 'next/link'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'

export function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'confirmed' || v === 'completed') return 'badge bg-green-50 text-green-700'
  if (v === 'detecting' || v === 'pending') return 'badge bg-amber-50 text-amber-700'
  if (v === 'confirming' || v === 'processing') return 'badge bg-cyan-50 text-cyan-700'
  if (v === 'failed' || v === 'unconfirmed') return 'badge bg-red-50 text-red-700'
  if (v === 'expired' || v === 'cancelled' || v === 'canceled') return 'badge bg-surface-100 text-surface-600'
  return 'badge bg-surface-100 text-surface-600'
}

export default function AdminPaymentRow({ payment, onCopy }) {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()

  const coinSymbol = (payment.coin?.symbol || payment.coinSymbol || payment.invoice?.coin?.symbol || '').toUpperCase()
  const networkSymbol = (payment.network?.symbol || payment.networkSymbol || payment.invoice?.network?.symbol || '').toUpperCase()
  const networkName = payment.network?.name || payment.networkName || payment.invoice?.network?.name || ''
  const explorerUrl = payment.explorerUrl || payment.network?.explorerUrl || payment.invoice?.network?.explorerUrl || ''

  return (
    <tr>
      <td>
        <span className="font-semibold text-primary">{payment.id}</span>
      </td>
      <td className="text-center">
        <span className="font-medium">{payment.userId || '-'}</span>
      </td>
      <td className="text-center">
        {payment.invoiceId ? (
          <Link
            href={`/admin/invoices/${payment.invoiceId}`}
            className="btn btn-sm btn bg-transparent text-primary-600 hover:bg-primary-50 shadow-none p-0 font-medium"
          >
            #{payment.invoiceId}
          </Link>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <div className="flex items-center">
          <CoinImg
            symbol={coinSymbol}
            networkSymbol={networkSymbol}
            size={24}
            className="mr-2"
          />
          <div>
            <div className="font-medium" style={{ lineHeight: 1.2 }}>{coinSymbol || '-'}</div>
            {networkName && (
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>{networkName}</small>
            )}
          </div>
        </div>
      </td>
      <td className="text-right whitespace-nowrap">
        <span className="font-medium">
          {formatAmount(payment.amount)} {coinSymbol}
        </span>
      </td>
      <td className="text-right whitespace-nowrap">
        {payment.amountUsd ? (
          <span className="font-medium">${formatAmount(payment.amountUsd)}</span>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td className="whitespace-nowrap text-center">
        <span className={statusBadgeClass(payment.status)}>
          {String(payment.status || '').toUpperCase()}
        </span>
      </td>
      <td className="text-center">
        {payment.confirmations != null ? (
          <span>{payment.confirmations}/{payment.requiredConfirmations ?? '-'}</span>
        ) : '-'}
      </td>
      <td>
        {payment.txHash ? (
          <div className="flex items-center">
            <span className="mr-2" style={{ whiteSpace: 'nowrap' }}>
              {payment.txHash}
            </span>
            {explorerUrl && (
              <a
                href={`${explorerUrl}/tx/${payment.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full"
                title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
              >
                <i className="bx bx-link-external" style={{ fontSize: '1.25rem' }}></i>
              </a>
            )}
          </div>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        {payment.fromAddress ? (
          <div className="flex items-center">
            <span className="mr-2" style={{ whiteSpace: 'nowrap' }}>
              {payment.fromAddress}
            </span>
            <button
              className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full"
              onClick={() => onCopy(payment.fromAddress)}
              title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
            >
              <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
            </button>
          </div>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        {payment.toAddress ? (
          <div className="flex items-center">
            <span className="mr-2" style={{ whiteSpace: 'nowrap' }}>
              {payment.toAddress}
            </span>
            <button
              className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full"
              onClick={() => onCopy(payment.toAddress)}
              title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
            >
              <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
            </button>
          </div>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        <span style={{ whiteSpace: 'nowrap' }}>{fmtDate(payment.createdAt || payment.created_at)}</span>
      </td>
      <td>
        <span style={{ whiteSpace: 'nowrap' }}>
          {payment.confirmedAt ? fmtDate(payment.confirmedAt) : <span className="text-muted">-</span>}
        </span>
      </td>
      <td>
        <Link
          href={`/admin/payments/${payment.id}`}
          className="btn btn-sm btn-icon btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none"
          title={t('admin.detail.viewDetail', { defaultValue: 'View detail' })}
        >
          <i className="bx bx-show" style={{ fontSize: '1.25rem' }}></i>
        </Link>
      </td>
    </tr>
  )
}
