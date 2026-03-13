'use client'

import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { paymentStatusBadge } from '@/components/admin/adminInvoiceHelpers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import CardEmptyState from '@/components/CardEmptyState'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Table from '../ui/Table'

/**
 * Payments table for AdminInvoiceDetail.
 * Displays all payments associated with an invoice.
 */
export default function AdminInvoicePaymentsTable({ payments, coinSymbol, network, onCopy }) {
  const { t } = useAdminTranslation()
  const { fmtDate } = useDateFormat()
  const { copiedId, handleCopy } = useCopyFeedback()
  return (
    <Card>
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-transfer mr-2"></i>
          {t('admin.invoiceDetail.payments', { defaultValue: 'Payments' })} ({payments.length})
        </h5>
      </div>
      {payments.length === 0 ? (
        <div className="p-5">
          <CardEmptyState
            icon="bx-credit-card"
            message={t('admin.invoiceDetail.noPayments', { defaultValue: 'No payments recorded for this invoice' })}
          />
        </div>
      ) : (
        <>
          <div className="sm:hidden p-4 space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-lg border border-surface-200 p-3 bg-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs text-surface-500">
                    #{payment.id}
                  </div>
                  <span className={paymentStatusBadge(payment.status)}>{String(payment.status || '').toUpperCase()}</span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-surface-500 text-xs">{t('admin.detail.amount', { defaultValue: 'Amount' })}</div>
                    <div className="font-medium">{formatAmount(payment.amount)} {coinSymbol}</div>
                  </div>
                  <div>
                    <div className="text-surface-500 text-xs">{t('admin.detail.actualAmount', { defaultValue: 'Actual Amount' })}</div>
                    <div className="font-medium">{formatAmount(payment.actualAmount)} {coinSymbol}</div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-surface-500">
                  {t('admin.detail.confirmations', { defaultValue: 'Confirmations' })}:{' '}
                  <span className="text-surface-700">
                    {payment.confirmations != null ? payment.confirmations : '-'}
                    {payment.requiredConfirmations != null ? ` / ${payment.requiredConfirmations}` : ''}
                  </span>
                </div>

                {payment.txHash ? (
                  <div className="mt-2 text-xs">
                    <div className="text-surface-500">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono truncate">{payment.txHash}</span>
                      {network?.explorerUrl ? (
                        <Button
                          variant="text-secondary"
                          size="icon-sm"
                          href={`${network.explorerUrl}/tx/${payment.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
                        >
                          <i className="bx bx-link-external text-[1rem]"></i>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
                  {payment.fromAddress ? (
                    <div className="flex items-center gap-2">
                      <span className="text-surface-500 shrink-0">{t('admin.detail.fromAddress', { defaultValue: 'From Address' })}:</span>
                      <span className="font-mono truncate">{payment.fromAddress}</span>
                      <Button
                        onClick={() => handleCopy(payment.fromAddress, `from-${payment.id}`)}
                        title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                        size="icon-sm"
                        variant="text-secondary"
                      >
                        <i className={`bx ${copiedId === `from-${payment.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
                      </Button>
                    </div>
                  ) : null}
                  {payment.toAddress ? (
                    <div className="flex items-center gap-2">
                      <span className="text-surface-500 shrink-0">{t('admin.detail.toAddress', { defaultValue: 'To Address' })}:</span>
                      <span className="font-mono truncate">{payment.toAddress}</span>
                      <Button
                        onClick={() => handleCopy(payment.toAddress, `to-${payment.id}`)}
                        title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}
                        size="icon-sm"
                        variant="text-secondary"
                      >
                        <i className={`bx ${copiedId === `to-${payment.id}` ? 'bx-check text-success' : 'bx-copy'}`}></i>
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-2 text-xs text-surface-500 space-y-0.5">
                  <div>{t('admin.detail.detected', { defaultValue: 'Detected' })}: <span className="text-surface-700">{payment.detectedAt ? fmtDate(payment.detectedAt) : '-'}</span></div>
                  <div>{t('status.confirmed', { defaultValue: 'Confirmed' })}: <span className="text-surface-700">{payment.confirmedAt ? fmtDate(payment.confirmedAt) : '-'}</span></div>
                  <div>{t('status.completed', { defaultValue: 'Completed' })}: <span className="text-surface-700">{payment.completedAt ? fmtDate(payment.completedAt) : '-'}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block">
            <Table className="min-w-[900px]">
              <thead>
                <tr>
                  <th className="min-w-[60px]">{t('admin.detail.id', { defaultValue: 'ID' })}</th>
                  <th className="min-w-[100px]">{t('admin.detail.status', { defaultValue: 'Status' })}</th>
                  <th className="text-right min-w-[150px]">{t('admin.detail.amount', { defaultValue: 'Amount' })}</th>
                  <th className="text-right min-w-[150px]">
                    {t('admin.detail.actualAmount', { defaultValue: 'Actual Amount' })}
                  </th>
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
                {payments.map((payment) => (
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
                      {payment.requiredConfirmations != null ? (
                        <small className="text-surface-500"> / {payment.requiredConfirmations}</small>
                      ) : null}
                    </td>
                    <td>
                      {payment.txHash ? (
                        <div className="flex items-center">
                          <span className="mr-2 whitespace-nowrap">{payment.txHash}</span>
                          {network?.explorerUrl ? (
                            <Button
                              variant="text-secondary"
                              size="icon-sm"
                              href={`${network.explorerUrl}/tx/${payment.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
                            >
                              <i className="bx bx-link-external text-[1rem]"></i>
                            </Button>
                          ) : null}
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
                    <td>
                      {payment.toAddress ? (
                        <div className="flex items-center">
                          <span className="mr-2 whitespace-nowrap">{payment.toAddress}</span>
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
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
    </Card>
  )
}
