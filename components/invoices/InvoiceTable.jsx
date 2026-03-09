'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import CoinImg from '@/components/CoinImg'
import { formatAmount } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { copyToClipboard } from '@/lib/utils/clipboard'
import TableEmptyState from '@/components/TableEmptyState'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'
import SortableHeader from '@/components/ui/SortableHeader'
import { useState } from 'react'

const statusBadge = {
  paid: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  completed: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  pending: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  expired: 'bg-surface-100 text-surface-600 dark:bg-dark-elevated',
  cancelled: 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400',
}

export default function InvoiceTable({ items, pagination, loading, onPageChange, sortBy, sortOrder, onSort }) {
  const { t } = useTranslation()
  const router = useRouter()
  const { fmtDateTime } = useDateFormat()
  const [copiedId, setCopiedId] = useState(null)

  async function handleCopy(addr, id, e) {
    e.stopPropagation()
    if (!addr) return
    try {
      await copyToClipboard(addr)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <Card>
      <Table>
        <thead>
          <tr className="whitespace-nowrap">
            <th>{t('invoices.invoice', { defaultValue: 'Invoice' })}</th>
            <th>{t('invoices.source', { defaultValue: 'Source' })}</th>
            <th>{t('invoices.coin', { defaultValue: 'Coin' })}</th>
            <th className="min-w-[320px]">{t('invoices.paymentAddress', { defaultValue: 'Payment Address' })}</th>
            <SortableHeader field="amount" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="text-right">
              {t('invoices.amount', { defaultValue: 'Amount' })}
            </SortableHeader>
            <th>{t('invoices.statusCol', { defaultValue: 'Status' })}</th>
            <SortableHeader field="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort}>
              {t('invoices.date', { defaultValue: 'Date' })}
            </SortableHeader>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <TableEmptyState
              colSpan={8}
              icon="bx-file"
              message={t('invoices.none', { defaultValue: 'No invoices found' })}
              sub={t('invoices.noneSub', { defaultValue: 'Create your first invoice to get started' })}
            />
          ) : (
            items.map((it) => {
              const coinSym = (it.coin?.symbol || '').toUpperCase()
              const netSym = (it.network?.symbol || '').toUpperCase()

              return (
                <tr key={it.id} className="cursor-pointer" onClick={() => router.push(`/invoices/${it.id}`)}>
                  <td className="whitespace-nowrap">
                    <div>
                      <span>{it.invoiceNumber || it.id}</span>
                      {it.publicCode && (
                        <div className="text-xs text-surface-500 font-mono mt-0.5">
                          {it.publicCode}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    {it.merchantId != null ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        <i className="bx bx-store text-[11px]" />
                        {t('invoices.merchant', { defaultValue: 'Merchant' })}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-surface-600 dark:bg-dark-elevated">
                        <i className="bx bx-user text-[11px]" />
                        {t('invoices.personal', { defaultValue: 'Personal' })}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center">
                      <CoinImg coin={it.coin} symbol={coinSym} networkSymbol={netSym} size={24} className="mr-2" />
                      <div>
                        <div className="font-medium leading-[1.2]">{coinSym || '-'}</div>
                        {it.network?.name && <small className="text-surface-500 text-xs">{it.network.name}</small>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {it.paymentAddress ? (
                      <div className="flex items-center gap-2">
                        <code className="text-surface-800 font-mono text-xs break-all">{it.paymentAddress}</code>
                        <button
                          type="button"
                          className="shrink-0 p-1 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                          title={t('actions.copy', { defaultValue: 'Copy' })}
                          onClick={(e) => handleCopy(it.paymentAddress, it.id, e)}
                        >
                          <i
                            className={`bx ${copiedId === it.id ? 'bx-check text-success-500' : 'bx-copy'} text-base`}
                          />
                        </button>
                      </div>
                    ) : (
                      <span className="text-surface-500">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <span className="font-medium">
                      {formatAmount(it.amount)} {coinSym}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        statusBadge[it.status?.toLowerCase()] || 'bg-surface-100 text-surface-600 dark:bg-dark-elevated'
                      }`}
                    >
                      {it.status ? t(`invoices.${it.status.toLowerCase()}`, { defaultValue: it.status }) : '-'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <span>{fmtDateTime(it.createdAt || it.created_at)}</span>
                  </td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="text-secondary"
                        size="icon-sm"
                        href={`/invoices/${it.id}`}
                        onClick={(e) => e.stopPropagation()}
                        title={t('actions.view', { defaultValue: 'View' })}
                      >
                        <i className="bx bx-show text-[1rem]" />
                      </Button>
                      {it.publicCode && (
                        <Button
                          variant="text-secondary"
                          size="icon-sm"
                          href={`/pay/${it.publicCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={t('actions.viewPayment', { defaultValue: 'Payment Page' })}
                        >
                          <i className="bx bx-qr text-[1rem]" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </Table>

      {/* Pagination */}
      <div className="px-5 py-1.5">
        <Pagination pagination={pagination} loading={loading} onPageChange={onPageChange} />
      </div>
    </Card>
  )
}
