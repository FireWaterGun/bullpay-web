'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth, useToast } from '@/app/providers';
import { getUserWebhookLogs } from '@/lib/api/userWebhookLogs';
import { useDateFormat } from '@/hooks/useDateFormat';
import LocaleDateRangePicker from '@/components/LocaleDateRangePicker';
import { logger } from '@/lib/utils/logger';
import RefreshButton from '@/components/RefreshButton';
import PageSpinner from '@/components/PageSpinner';
import TableEmptyState from '@/components/TableEmptyState';
import { Button, Card, Input, Label, Select, Pagination } from '@/components/ui'
import Table from '@/components/ui/Table';
import { EVENT_OPTIONS, successBadge, eventBadge, httpStatusBadge } from '@/components/webhook/webhookHelpers'

const SORT_BY_OPTIONS = [
{ value: 'created_at', label: 'Created At' },
{ value: 'duration_ms', label: 'Duration' },
{ value: 'http_status', label: 'HTTP Status' },
{ value: 'attempt', label: 'Attempt' }];


export default function WebhookLogsPage() {
  const { fmtDate } = useDateFormat();
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const toast = useToast();

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' };
    return map[i18n.language] || 'en-US';
  }, [i18n.language]);

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states (draft)
  const [paymentIdFilter, setPaymentIdFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [sortByFilter, setSortByFilter] = useState('');
  const [sortOrderFilter, setSortOrderFilter] = useState('');

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState({});

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserWebhookLogs(token, {
        page: currentPage,
        limit: 20,
        ...appliedFilters
      });
      setLogs(data.items || []);
      setPagination(data.pagination || null);
    } catch (error) {
      logger.error('Failed to load webhook logs:', error);
      toast.error(t('webhookLog.loadError', { defaultValue: 'Failed to load webhook logs' }));
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, appliedFilters, toast, t]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  function applyFilters() {
    setAppliedFilters({
      merchantPaymentId: paymentIdFilter ? Number(paymentIdFilter) : undefined,
      event: eventFilter || undefined,
      success: successFilter || undefined,
      fromDate: fromDateFilter || undefined,
      toDate: toDateFilter || undefined,
      sortBy: sortByFilter || undefined,
      sortOrder: sortOrderFilter || undefined
    });
    setCurrentPage(1);
  }

  function resetFilters() {
    setPaymentIdFilter('');
    setEventFilter('');
    setSuccessFilter('');
    setFromDateFilter('');
    setToDateFilter('');
    setSortByFilter('');
    setSortOrderFilter('');
    setAppliedFilters({});
    setCurrentPage(1);
  }

  if (loading && logs.length === 0) {
    return <PageSpinner />;
  }

  return (
    <>
      {/* Header + Filters */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h4 className="font-semibold text-surface-900 mb-1">
              <i className="bx bx-broadcast mr-2 text-primary-500 dark:text-primary-400"></i>
              {t('webhookLog.title', { defaultValue: 'Webhook Logs' })}
            </h4>
            <p className="text-surface-500 text-sm mb-0">
              {t('webhookLog.description', { defaultValue: 'Monitor webhook delivery attempts for your payments' })}
            </p>
          </div>
          <RefreshButton onClick={loadLogs} loading={loading} />
        </div>

        {/* Filters */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>{t('webhookLog.paymentId', { defaultValue: 'Payment ID' })}</Label>
              <Input
                type="number"

                placeholder={t('webhookLog.paymentId', { defaultValue: 'Payment ID' })}
                value={paymentIdFilter}
                onChange={(e) => setPaymentIdFilter(e.target.value)} />
              
            </div>
            <div>
              <Label>{t('webhookLog.event', { defaultValue: 'Event' })}</Label>
              <Select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                <option value="">{t('webhookLog.allEvents', { defaultValue: 'All Events' })}</option>
                {EVENT_OPTIONS.map((ev) =>
                <option key={ev.value} value={ev.value}>{ev.label}</option>
                )}
              </Select>
            </div>
            <div>
              <Label>{t('webhookLog.success', { defaultValue: 'Status' })}</Label>
              <Select value={successFilter} onChange={(e) => setSuccessFilter(e.target.value)}>
                <option value="">{t('webhookLog.allStatuses', { defaultValue: 'All Statuses' })}</option>
                <option value="true">{t('webhookLog.success', { defaultValue: 'Success' })}</option>
                <option value="false">{t('webhookLog.failed', { defaultValue: 'Failed' })}</option>
              </Select>
            </div>
            <div>
              <Label>{t('webhookLog.dateRange', { defaultValue: 'Date Range' })}</Label>
              <LocaleDateRangePicker className="w-full"
              startDate={fromDateFilter}
              endDate={toDateFilter}
              onChangeStart={setFromDateFilter}
              onChangeEnd={setToDateFilter}
              locale={locale}
              placeholder={t('webhookLog.dateRange', { defaultValue: 'Select date range' })}
              t={t} />

              
            </div>
            <div>
              <Label>{t('webhookLog.sortBy', { defaultValue: 'Sort By' })}</Label>
              <Select value={sortByFilter} onChange={(e) => setSortByFilter(e.target.value)}>
                <option value="">{t('webhookLog.default', { defaultValue: 'Default' })}</option>
                {SORT_BY_OPTIONS.map((o) =>
                <option key={o.value} value={o.value}>{o.label}</option>
                )}
              </Select>
            </div>
            <div>
              <Label>{t('webhookLog.sortOrder', { defaultValue: 'Sort Order' })}</Label>
              <Select value={sortOrderFilter} onChange={(e) => setSortOrderFilter(e.target.value)}>
                <option value="">{t('webhookLog.default', { defaultValue: 'Default' })}</option>
                <option value="asc">{t('webhookLog.ascending', { defaultValue: 'Ascending' })}</option>
                <option value="desc">{t('webhookLog.descending', { defaultValue: 'Descending' })}</option>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} disabled={loading}>
              <i className="bx bx-filter-alt mr-1"></i>
              {t('webhookLog.applyFilters', { defaultValue: 'Apply Filters' })}
            </Button>
            <Button onClick={resetFilters} disabled={loading} variant="outline-secondary">
              <i className="bx bx-reset mr-1"></i>
              {t('webhookLog.resetFilters', { defaultValue: 'Reset' })}
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-surface-500 text-xs uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3 px-3 text-left font-medium">{t('webhookLog.paymentId', { defaultValue: 'Payment' })}</th>
                  <th className="py-3 px-3 text-left font-medium">{t('webhookLog.event', { defaultValue: 'Event' })}</th>
                  <th className="py-3 px-3 text-center font-medium">{t('webhookLog.httpStatus', { defaultValue: 'HTTP' })}</th>
                  <th className="py-3 px-3 text-center font-medium">{t('webhookLog.success', { defaultValue: 'Status' })}</th>
                  <th className="py-3 px-3 text-right font-medium">{t('webhookLog.duration', { defaultValue: 'Duration' })}</th>
                  <th className="py-3 px-3 text-center font-medium">{t('webhookLog.attempt', { defaultValue: 'Attempt' })}</th>
                  <th className="py-3 px-3 text-left font-medium">{t('webhookLog.callbackUrl', { defaultValue: 'Callback URL' })}</th>
                  <th className="py-3 px-3 text-left font-medium">{t('webhookLog.error', { defaultValue: 'Error' })}</th>
                  <th className="py-3 px-3 text-left font-medium">{t('webhookLog.created', { defaultValue: 'Created' })}</th>
                  <th className="py-3 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ?
                <TableEmptyState
                  colSpan={10}
                  icon="bx-broadcast"
                  message={t('webhookLog.noLogs', { defaultValue: 'No webhook logs found' })}
                  sub={t('webhookLog.noLogsSub', { defaultValue: 'Webhook delivery logs will appear here when payments trigger callbacks' })} /> :


                logs.map((log) =>
                <tr key={log.id} className="border-b border-surface-200 hover:bg-surface-50/50 dark:hover:bg-white/4 transition-colors whitespace-nowrap">
                      <td className="py-3 px-3 font-medium text-surface-900">{log.merchantPaymentId || '-'}</td>
                      <td className="py-3 px-3">{eventBadge(log.event)}</td>
                      <td className="py-3 px-3 text-center">{httpStatusBadge(log.httpStatus)}</td>
                      <td className="py-3 px-3 text-center">{successBadge(log.success, t)}</td>
                      <td className="py-3 px-3 text-right">
                        {log.durationMs != null ?
                    <span className={log.durationMs > 5000 ? 'text-red-500 dark:text-red-400 font-medium' : 'text-surface-600'}>
                            {log.durationMs.toLocaleString()}ms
                          </span> :
                    '-'}
                      </td>
                      <td className="py-3 px-3 text-center">{log.attempt ?? '-'}</td>
                      <td className="py-3 px-3">
                        <span className="truncate inline-block max-w-[200px] text-surface-600" title={log.callbackUrl}>
                          {log.callbackUrl || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {log.errorMessage ?
                    <span className="text-red-500 dark:text-red-400 truncate inline-block max-w-[180px]" title={log.errorMessage}>
                            {log.errorMessage}
                          </span> :
                    '-'}
                      </td>
                      <td className="py-3 px-3 text-surface-500 text-xs">{fmtDate(log.createdAt)}</td>
                      <td className="py-3 px-3">
                        <Link
                      href={`/webhook-logs/${log.id}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-surface-500 hover:bg-surface-100 dark:hover:bg-white/8 transition-colors"
                      title={t('webhookLog.viewDetails', { defaultValue: 'View details' })}>
                      
                          <i className="bx bx-chevron-right"></i>
                        </Link>
                      </td>
                    </tr>
                )
                }
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        </div>
      </Card>
    </>);

}