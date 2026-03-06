'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import CoinImg from '@/components/CoinImg';
import { formatAmount } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import { copyToClipboard } from '@/lib/utils/clipboard';
import TableEmptyState from '@/components/TableEmptyState';
import { Card, Pagination } from '@/components/ui';
import Table from '@/components/ui/Table';
import { useState } from 'react';

const statusBadge = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expired: 'bg-surface-100 text-surface-600 dark:bg-dark-elevated',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function InvoiceTable({
  items,
  pagination,
  loading,
  onPageChange,
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { fmtDateTime } = useDateFormat();
  const [copiedId, setCopiedId] = useState(null);

  async function handleCopy(addr, id, e) {
    e.stopPropagation();
    if (!addr) return;
    try {
      await copyToClipboard(addr);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <Card>
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-surface-200 text-left text-xs uppercase text-surface-500 whitespace-nowrap">
                <th className="px-3 py-2">{t('invoices.invoice', { defaultValue: 'Invoice' })}</th>
                <th className="px-3 py-2">{t('invoices.coin', { defaultValue: 'Coin' })}</th>
                <th className="px-3 py-2 min-w-[320px]">{t('invoices.paymentAddress', { defaultValue: 'Payment Address' })}</th>
                <th className="px-3 py-2 text-right">{t('invoices.amount', { defaultValue: 'Amount' })}</th>
                <th className="px-3 py-2">{t('invoices.statusCol', { defaultValue: 'Status' })}</th>
                <th className="px-3 py-2">{t('invoices.date', { defaultValue: 'Date' })}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {items.length === 0 ? (
                <TableEmptyState
                  colSpan={7}
                  icon="bx-file"
                  message={t('invoices.none', { defaultValue: 'No invoices found' })}
                  sub={t('invoices.noneSub', { defaultValue: 'Create your first invoice to get started' })}
                />
              ) : (
                items.map((it) => {
                  const coinSym = (it.coin?.symbol || '').toUpperCase();
                  const netSym = (it.network?.symbol || '').toUpperCase();

                  return (
                    <tr
                      key={it.id}
                      className="hover:bg-surface-50 dark:hover:bg-white/4 cursor-pointer"
                      onClick={() => router.push(`/invoices/${it.id}`)}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="font-semibold text-primary-600">
                          {it.publicCode || it.code || it.id}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <CoinImg
                            coin={it.coin}
                            symbol={coinSym}
                            networkSymbol={netSym}
                            size={24}
                            className="mr-2"
                          />
                          <div>
                            <div className="font-medium leading-[1.2]">{coinSym || '-'}</div>
                            {it.network?.name && (
                              <small className="text-surface-500 text-xs">
                                {it.network.name}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {it.paymentAddress ? (
                          <div className="flex items-center gap-2">
                            <code className="text-surface-800 font-mono text-xs break-all">
                              {it.paymentAddress}
                            </code>
                            <button
                              type="button"
                              className="shrink-0 p-1 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                              title={t('actions.copy', { defaultValue: 'Copy' })}
                              onClick={(e) => handleCopy(it.paymentAddress, it.id, e)}
                            >
                              <i className={`bx ${copiedId === it.id ? 'bx-check text-green-500' : 'bx-copy'} text-base`} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-surface-500">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <span className="font-medium">
                          {formatAmount(it.amount)} {coinSym}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            statusBadge[it.status?.toLowerCase()] ||
                            'bg-surface-100 text-surface-600 dark:bg-dark-elevated'
                          }`}
                        >
                          {it.status
                            ? t(`invoices.${it.status.toLowerCase()}`, { defaultValue: it.status })
                            : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span>{fmtDateTime(it.createdAt || it.created_at)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 justify-end">
                          <Link
                            href={`/invoices/${it.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-primary-300 text-primary-600 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-400 dark:hover:bg-primary-900/30"
                            onClick={(e) => e.stopPropagation()}
                            title={t('actions.view', { defaultValue: 'View' })}
                          >
                            <i className="bx bx-show" />
                          </Link>
                          {it.publicCode && (
                            <Link
                              href={`/pay/${it.publicCode}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50 dark:hover:bg-white/6"
                              onClick={(e) => e.stopPropagation()}
                              title={t('actions.viewPayment', { defaultValue: 'Payment Page' })}
                            >
                              <i className="bx bx-qr" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          pagination={pagination}
          loading={loading}
          onPageChange={onPageChange}
        />
      </div>
    </Card>
  );
}
