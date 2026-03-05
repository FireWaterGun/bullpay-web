'use client';


import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { formatAmount } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import CoinImg from '@/components/CoinImg';
import { Button, badgeBase } from '../ui';

export function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase();
  if (v === 'confirmed' || v === 'completed') return `${badgeBase} bg-green-50 text-green-700`;
  if (v === 'detecting' || v === 'pending') return `${badgeBase} bg-amber-50 text-amber-700`;
  if (v === 'confirming' || v === 'processing') return `${badgeBase} bg-cyan-50 text-cyan-700`;
  if (v === 'failed' || v === 'unconfirmed') return `${badgeBase} bg-red-50 text-red-700`;
  if (v === 'expired' || v === 'cancelled' || v === 'canceled') return `${badgeBase} bg-surface-100 text-surface-600`;
  return `${badgeBase} bg-surface-100 text-surface-600`;
}

export default function AdminPaymentRow({ payment, onCopy }) {
  const { fmtDate } = useDateFormat();
  const { t } = useAdminTranslation();

  const coinSymbol = (payment.coin?.symbol || payment.coinSymbol || payment.invoice?.coin?.symbol || '').toUpperCase();
  const networkSymbol = (payment.network?.symbol || payment.networkSymbol || payment.invoice?.network?.symbol || '').toUpperCase();
  const networkName = payment.network?.name || payment.networkName || payment.invoice?.network?.name || '';
  const explorerUrl = payment.explorerUrl || payment.network?.explorerUrl || payment.invoice?.network?.explorerUrl || '';

  return (
    <tr>
      <td>
        <span className="font-semibold text-primary">{payment.id}</span>
      </td>
      <td className="text-center">
        <span className="font-medium">{payment.userId || '-'}</span>
      </td>
      <td className="text-center">
        {payment.invoiceId ?
        <Button variant="text-primary" size="sm" className="p-0 font-medium"
        href={`/admin/invoices/${payment.invoiceId}`}>
          
          
            #{payment.invoiceId}
          </Button> :

        <span className="text-muted">-</span>
        }
      </td>
      <td className="whitespace-nowrap">
        <div className="flex items-center">
          <CoinImg
            symbol={coinSymbol}
            networkSymbol={networkSymbol}
            size={24}
            className="mr-2" />
          
          <div>
            <div className="font-medium leading-[1.2]">{coinSymbol || '-'}</div>
            {networkName &&
            <small className="text-muted text-xs">{networkName}</small>
            }
          </div>
        </div>
      </td>
      <td className="text-right whitespace-nowrap">
        <span className="font-medium">
          {formatAmount(payment.amount)} {coinSymbol}
        </span>
      </td>
      <td className="text-right whitespace-nowrap">
        {payment.amountUsd ?
        <span className="font-medium">${formatAmount(payment.amountUsd)}</span> :

        <span className="text-muted">-</span>
        }
      </td>
      <td className="whitespace-nowrap text-center">
        <span className={statusBadgeClass(payment.status)}>
          {String(payment.status || '').toUpperCase()}
        </span>
      </td>
      <td className="text-center">
        {payment.confirmations != null ?
        <span>{payment.confirmations}/{payment.requiredConfirmations ?? '-'}</span> :
        '-'}
      </td>
      <td>
        {payment.txHash ?
        <div className="flex items-center">
            <span className="mr-2 whitespace-nowrap">
              {payment.txHash}
            </span>
            {explorerUrl &&
          <Button variant="text-secondary" size="icon" className="rounded-full"
          href={`${explorerUrl}/tx/${payment.txHash}`}
          target="_blank"
          rel="noopener noreferrer"

          title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}>
            
                <i className="bx bx-link-external text-xl"></i>
              </Button>
          }
          </div> :

        <span className="text-muted">-</span>
        }
      </td>
      <td>
        {payment.fromAddress ?
        <div className="flex items-center">
            <span className="mr-2 whitespace-nowrap">
              {payment.fromAddress}
            </span>
            <Button

            onClick={() => onCopy(payment.fromAddress)}
            title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })} size="icon" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full">
            
              <i className="bx bx-copy text-xl"></i>
            </Button>
          </div> :

        <span className="text-muted">-</span>
        }
      </td>
      <td>
        {payment.toAddress ?
        <div className="flex items-center">
            <span className="mr-2 whitespace-nowrap">
              {payment.toAddress}
            </span>
            <Button

            onClick={() => onCopy(payment.toAddress)}
            title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })} size="icon" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none rounded-full">
            
              <i className="bx bx-copy text-xl"></i>
            </Button>
          </div> :

        <span className="text-muted">-</span>
        }
      </td>
      <td>
        <span className="whitespace-nowrap">{fmtDate(payment.createdAt || payment.created_at)}</span>
      </td>
      <td>
        <span className="whitespace-nowrap">
          {payment.confirmedAt ? fmtDate(payment.confirmedAt) : <span className="text-muted">-</span>}
        </span>
      </td>
      <td>
        <Button variant="text-secondary" size="icon"
        href={`/admin/payments/${payment.id}`}

        title={t('admin.detail.viewDetail', { defaultValue: 'View detail' })}>
          
          <i className="bx bx-show text-xl"></i>
        </Button>
      </td>
    </tr>);

}