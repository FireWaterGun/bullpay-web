'use client';

import { formatAmount } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import { paymentStatusBadge } from '@/components/admin/adminInvoiceHelpers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import CardEmptyState from '@/components/CardEmptyState';
import Button from '../ui/Button'
import Card from '../ui/Card'
import Table from '../ui/Table';

/**
 * Payments table for AdminInvoiceDetail.
 * Displays all payments associated with an invoice.
 */
export default function AdminInvoicePaymentsTable({ payments, coinSymbol, network, onCopy }) {
  const { t } = useAdminTranslation();
  const { fmtDate } = useDateFormat();
  return (
    <Card>
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-transfer mr-2"></i>
          Payments ({payments.length})
        </h5>
      </div>
        {payments.length === 0 ?
        <div className="p-5">
          <CardEmptyState
            icon="bx-credit-card"
            message="No payments recorded for this invoice" />
        </div> :


        <Table className="min-w-[900px]">
              <thead>
                <tr>
                  <th className="min-w-[60px]">{t('admin.detail.id', { defaultValue: 'ID' })}</th>
                  <th className="min-w-[100px]">{t('admin.detail.status', { defaultValue: 'Status' })}</th>
                  <th className="text-right min-w-[150px]">{t('admin.detail.amount', { defaultValue: 'Amount' })}</th>
                  <th className="text-right min-w-[150px]">{t('admin.detail.actualAmount', { defaultValue: 'Actual Amount' })}</th>
                  <th className="min-w-[120px]">{t('admin.detail.confirmations', { defaultValue: 'Confirmations' })}</th>
                  <th className="min-w-[680px]">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</th>
                  <th className="min-w-[420px]">{t('admin.detail.fromAddress', { defaultValue: 'From Address' })}</th>
                  <th className="min-w-[420px]">{t('admin.detail.toAddress', { defaultValue: 'To Address' })}</th>
                  <th className="min-w-[140px]">{t('admin.detail.detected', { defaultValue: 'Detected' })}</th>
                  <th className="min-w-[140px]">{t('status.confirmed', { defaultValue: 'Confirmed' })}</th>
                  <th className="min-w-[140px]">{t('status.completed', { defaultValue: 'Completed' })}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) =>
              <tr key={payment.id}>
                    <td>
                      <span className="font-semibold text-primary">{payment.id}</span>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className={paymentStatusBadge(payment.status)}>
                        {String(payment.status || '').toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <span className="font-medium">
                        {formatAmount(payment.amount)} {coinSymbol}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <span className="font-medium">
                        {formatAmount(payment.actualAmount)} {coinSymbol}
                      </span>
                    </td>
                    <td className="text-center whitespace-nowrap">
                      {payment.confirmations != null ? payment.confirmations : '-'}
                      {payment.requiredConfirmations != null &&
                  <small className="text-surface-500"> / {payment.requiredConfirmations}</small>
                  }
                    </td>
                    <td>
                      {payment.txHash ?
                  <div className="flex items-center">
                          <span className="mr-2 whitespace-nowrap">
                            {payment.txHash}
                          </span>
                          {network?.explorerUrl &&
                    <Button variant="text-secondary" size="icon" className="rounded-full"
                    href={`${network.explorerUrl}/tx/${payment.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"

                    title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}>
                      
                              <i className="bx bx-link-external text-xl"></i>
                            </Button>
                    }
                        </div> :

                  <span className="text-surface-500">-</span>
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
                      title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })} size="icon-sm" variant="text-secondary">
                      
                            <i className="bx bx-copy"></i>
                          </Button>
                        </div> :

                  <span className="text-surface-500">-</span>
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
                      title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })} size="icon-sm" variant="text-secondary">
                      
                            <i className="bx bx-copy"></i>
                          </Button>
                        </div> :

                  <span className="text-surface-500">-</span>
                  }
                    </td>
                    <td>
                      <span className="whitespace-nowrap">
                        {payment.detectedAt ? fmtDate(payment.detectedAt) : <span className="text-surface-500">-</span>}
                      </span>
                    </td>
                    <td>
                      <span className="whitespace-nowrap">
                        {payment.confirmedAt ? fmtDate(payment.confirmedAt) : <span className="text-surface-500">-</span>}
                      </span>
                    </td>
                    <td>
                      <span className="whitespace-nowrap">
                        {payment.completedAt ? fmtDate(payment.completedAt) : <span className="text-surface-500">-</span>}
                      </span>
                    </td>
                  </tr>
              )}
              </tbody>
            </Table>
        }
    </Card>);

}