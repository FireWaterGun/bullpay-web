'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import CoinImg from '@/components/CoinImg'
import Button from '../ui/Button'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function AdminPaymentRow({ payment, onCopy }) {
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()

  const coinSymbol = (payment.coin?.symbol || payment.coinSymbol || payment.invoice?.coin?.symbol || '').toUpperCase()
  const networkSymbol = (
    payment.network?.symbol ||
    payment.networkSymbol ||
    payment.invoice?.network?.symbol ||
    ''
  ).toUpperCase()
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
          <Button
            variant="text-primary"
            size="sm"
            className="p-0 font-medium"
            href={`/admin/invoices/${payment.invoiceId}`}
          >
            #{payment.invoiceId}
          </Button>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td className="whitespace-nowrap">
        <div className="flex items-center">
          <CoinImg symbol={coinSymbol} networkSymbol={networkSymbol} size={24} className="mr-2" />

          <div>
            <div className="font-medium leading-[1.2]">{coinSymbol || '-'}</div>
            {networkName && <small className="text-surface-500 text-xs">{networkName}</small>}
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
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td className="whitespace-nowrap text-center">
        <span className={getStatusBadgeClass(payment.status, 'payment')}>
          {String(payment.status || '').toUpperCase()}
        </span>
      </td>
      <td className="text-center">
        {payment.confirmations != null ? (
          <span>
            {payment.confirmations}/{payment.requiredConfirmations ?? '-'}
          </span>
        ) : (
          '-'
        )}
      </td>
      <td>
        {payment.txHash ? (
          <div className="flex items-center">
            <span className="mr-2 whitespace-nowrap">{payment.txHash}</span>
            {explorerUrl && (
              <Button
                variant="text-secondary"
                size="icon"
                className="rounded-full"
                href={`${explorerUrl}/tx/${payment.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
              >
                <i className="bx bx-link-external text-xl"></i>
              </Button>
            )}
          </div>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td>
        {payment.fromAddress ? (
          <div className="flex items-center">
            <span className="mr-2 whitespace-nowrap">{payment.fromAddress}</span>
            <Button
              onClick={() => onCopy(payment.fromAddress)}
              title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
              size="icon-sm"
              variant="text-secondary"
            >
              <i className="bx bx-copy"></i>
            </Button>
          </div>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td>
        {payment.toAddress ? (
          <div className="flex items-center">
            <span className="mr-2 whitespace-nowrap">{payment.toAddress}</span>
            <Button
              onClick={() => onCopy(payment.toAddress)}
              title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
              size="icon-sm"
              variant="text-secondary"
            >
              <i className="bx bx-copy"></i>
            </Button>
          </div>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td>
        <span className="whitespace-nowrap">{fmtDate(payment.createdAt || payment.created_at)}</span>
      </td>
      <td>
        <span className="whitespace-nowrap">
          {payment.confirmedAt ? fmtDate(payment.confirmedAt) : <span className="text-surface-500">-</span>}
        </span>
      </td>
      <td>
        <Button
          variant="text-secondary"
          size="icon"
          href={`/admin/payments/${payment.id}`}
          title={t('admin.detail.viewDetail', { defaultValue: 'View detail' })}
        >
          <i className="bx bx-show text-xl"></i>
        </Button>
      </td>
    </tr>
  )
}
