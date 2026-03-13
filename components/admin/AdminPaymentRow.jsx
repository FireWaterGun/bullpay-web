'use client'

import { useRouter } from 'next/navigation'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import CoinImg from '@/components/CoinImg'
import Button from '../ui/Button'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function AdminPaymentRow({ payment, onCopy }) {
  const router = useRouter()
  const { fmtDate } = useDateFormat()
  const { t } = useAdminTranslation()
  const { copiedId, handleCopy } = useCopyFeedback()

  function truncateHash(hash) {
    if (!hash) return '-'
    if (hash.length <= 16) return hash
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }

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
    <tr className="cursor-pointer" onClick={() => router.push(`/admin/payments/${payment.id}`)}>
      <td>
        <span className="font-semibold text-primary">{payment.id}</span>
      </td>
      <td className="text-center">
        <span className="font-medium">{payment.userId || '-'}</span>
      </td>
      <td className="text-center" onClick={(e) => e.stopPropagation()}>
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
            {networkName ? <small className="text-surface-500 text-xs">{networkName}</small> : null}
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
      <td onClick={(e) => e.stopPropagation()}>
        {payment.txHash ? (
          <div className="flex items-center">
            <span className="mr-2 font-mono text-xs">{truncateHash(payment.txHash)}</span>
            {explorerUrl && (
              <Button
                variant="text-secondary"
                size="icon-sm"
                href={`${explorerUrl}/tx/${payment.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
              >
                <i className="bx bx-link-external"></i>
              </Button>
            )}
          </div>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        {payment.fromAddress ? (
          <div className="flex items-center">
            <span className="mr-2 font-mono text-xs">{truncateHash(payment.fromAddress)}</span>
            <Button
              onClick={() => handleCopy(payment.fromAddress, `from-${payment.id}`)}
              title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
              size="icon-sm"
              variant="text-secondary"
            >
              <i className={`bx ${copiedId === `from-${payment.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
            </Button>
          </div>
        ) : (
          <span className="text-surface-500">-</span>
        )}
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        {payment.toAddress ? (
          <div className="flex items-center">
            <span className="mr-2 font-mono text-xs">{truncateHash(payment.toAddress)}</span>
            <Button
              onClick={() => handleCopy(payment.toAddress, `to-${payment.id}`)}
              title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
              size="icon-sm"
              variant="text-secondary"
            >
              <i className={`bx ${copiedId === `to-${payment.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
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
      <td onClick={(e) => e.stopPropagation()}>
        <Button
          variant="text-secondary"
          size="icon-sm"
          href={`/admin/payments/${payment.id}`}
          title={t('admin.detail.viewDetail', { defaultValue: 'View detail' })}
        >
          <i className="bx bx-show text-[1rem]"></i>
        </Button>
      </td>
    </tr>
  )
}
