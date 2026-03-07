'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

import { useTranslation } from 'react-i18next';
import { useAuth, useToast } from '@/app/providers';
import { getUserWebhookLog } from '@/lib/api/userWebhookLogs';
import { useDateFormat } from '@/hooks/useDateFormat';
import { logger } from '@/lib/utils/logger';
import RefreshButton from '@/components/RefreshButton';
import PageSpinner from '@/components/PageSpinner';
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { eventBadge, httpStatusBadge, successBadge } from '@/components/webhook/webhookHelpers';


export default function WebhookLogDetailPage() {
  const { fmtDate } = useDateFormat();
  const { t } = useTranslation();
  const { id } = useParams();
  const { token } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState(null);

  const loadLog = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserWebhookLog(token, id);
      setLog(data);
    } catch (error) {
      logger.error('Failed to load webhook log:', error);
      toast.error(t('webhookLog.loadError', { defaultValue: 'Failed to load webhook log' }));
    } finally {
      setLoading(false);
    }
  }, [token, id, toast, t]);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  function formatJson(val) {
    if (!val) return null;
    try {
      const obj = typeof val === 'string' ? JSON.parse(val) : val;
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(val);
    }
  }

  if (loading && !log) {
    return <PageSpinner />;
  }

  if (!log) {
    return (
      <div className="rounded-lg bg-warning-50 dark:bg-warning-950/30 text-warning-700 dark:text-warning-300 px-4 py-3 text-sm">{t('webhookLog.notFound', { defaultValue: 'Webhook log not found' })}</div>);

  }

  return (
    <>
      {/* Back button */}
      <div className="mb-4">
        <Button variant="outline-secondary" className="gap-1" href="/webhook-logs">
          <i className="bx bx-arrow-back"></i>
          {t('webhookLog.backToList', { defaultValue: 'Back to Webhook Logs' })}
        </Button>
      </div>

      {/* Header */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-surface-200">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full flex items-center justify-center ${log.success ? 'bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-300' : 'bg-danger-100 text-danger-800 dark:bg-danger-500/15 dark:text-danger-300'} w-12 h-12`}>

                
                <i className={`bx ${log.success ? 'bx-check' : 'bx-x'} text-2xl`}></i>
              </div>
              <div>
                <h4 className="font-semibold text-surface-900 mb-0">
                  {t('webhookLog.detail', { defaultValue: 'Webhook Log Detail' })} #{log.id}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {eventBadge(log.event)}
                  <span className="text-surface-400">&bull;</span>
                  <span>{log.success ? t('webhookLog.success', { defaultValue: 'Success' }) : t('webhookLog.failed', { defaultValue: 'Failed' })}</span>
                  <span className="text-surface-400">&bull;</span>
                  <span>HTTP {httpStatusBadge(log.httpStatus)}</span>
                </div>
              </div>
            </div>
            <RefreshButton onClick={loadLog} loading={loading} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Webhook Details */}
        <Card>
          <div className="px-6 py-4 border-b border-surface-200">
            <h5 className="font-semibold text-surface-900 mb-0">{t('webhookLog.webhookDetails', { defaultValue: 'Webhook Details' })}</h5>
          </div>
          <div className="p-6">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-surface-500 py-2 pr-4 w-2/5">ID</td>
                  <td className="py-2 font-medium">{log.id}</td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.paymentId', { defaultValue: 'Payment ID' })}</td>
                  <td className="py-2 font-medium">{log.merchantPaymentId || '-'}</td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.event', { defaultValue: 'Event' })}</td>
                  <td className="py-2">{eventBadge(log.event)}</td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.callbackUrl', { defaultValue: 'Callback URL' })}</td>
                  <td className="py-2">
                    <code className="text-xs break-all dark:text-primary-400">{log.callbackUrl || '-'}</code>
                  </td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.created', { defaultValue: 'Created' })}</td>
                  <td className="py-2">{fmtDate(log.createdAt)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right: Delivery Info */}
        <Card>
          <div className="px-6 py-4 border-b border-surface-200">
            <h5 className="font-semibold text-surface-900 mb-0">{t('webhookLog.deliveryInfo', { defaultValue: 'Delivery Info' })}</h5>
          </div>
          <div className="p-6">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-surface-500 py-2 pr-4 w-2/5">{t('webhookLog.httpStatus', { defaultValue: 'HTTP Status' })}</td>
                  <td className="py-2">{httpStatusBadge(log.httpStatus)}</td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.success', { defaultValue: 'Success' })}</td>
                  <td className="py-2">{successBadge(log.success, t)}</td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.duration', { defaultValue: 'Duration' })}</td>
                  <td className="py-2">
                    {log.durationMs != null ?
                    <span className={log.durationMs > 5000 ? 'text-danger-600 dark:text-danger-400 font-medium' : ''}>
                        {log.durationMs.toLocaleString()}ms
                      </span> :

                    '-'
                    }
                  </td>
                </tr>
                <tr>
                  <td className="text-surface-500 py-2 pr-4">{t('webhookLog.attempt', { defaultValue: 'Attempt' })}</td>
                  <td className="py-2">{log.attempt ?? '-'}</td>
                </tr>
                {log.errorMessage &&
                <tr>
                    <td className="text-surface-500 py-2 pr-4">{t('webhookLog.error', { defaultValue: 'Error' })}</td>
                    <td className="py-2">
                      <span className="text-danger-600 dark:text-danger-400">{log.errorMessage}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Request Payload */}
      {log.requestPayload &&
      <Card className="mt-6">
          <div className="px-6 py-4 border-b border-surface-200">
            <h5 className="font-semibold text-surface-900 mb-0">{t('webhookLog.requestPayload', { defaultValue: 'Request Payload' })}</h5>
          </div>
          <div className="p-6">
            <pre
            className="bg-surface-50 dark:bg-dark-elevated rounded-lg p-4 mb-0 text-xs overflow-auto max-h-[400px]">

            
              {formatJson(log.requestPayload)}
            </pre>
          </div>
        </Card>
      }

      {/* Response Body */}
      {log.responseBody &&
      <Card className="mt-6">
          <div className="px-6 py-4 border-b border-surface-200">
            <h5 className="font-semibold text-surface-900 mb-0">{t('webhookLog.responseBody', { defaultValue: 'Response Body' })}</h5>
          </div>
          <div className="p-6">
            <pre
            className="bg-surface-50 dark:bg-dark-elevated rounded-lg p-4 mb-0 text-xs overflow-auto max-h-[400px]">

            
              {formatJson(log.responseBody)}
            </pre>
          </div>
        </Card>
      }
    </>);

}