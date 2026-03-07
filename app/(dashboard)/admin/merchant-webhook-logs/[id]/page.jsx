'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

import { useAuth } from '@/app/providers';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useToast } from '@/app/providers';
import { getWebhookLog, retryWebhook } from '@/lib/api/merchantWebhookLogs';
import { useDateFormat } from '@/hooks/useDateFormat';
import { logger } from '@/lib/utils/logger';
import RefreshButton from '@/components/RefreshButton';
import PageSpinner from '@/components/PageSpinner';
import Alert from '@/components/ui/Alert'
import Badge, { bgLabelClass } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import Table from '@/components/ui/Table';

const EVENT_OPTIONS = [
{ value: 'payment.completed', label: 'Completed' },
{ value: 'payment.expired', label: 'Expired' },
{ value: 'payment.cancelled', label: 'Cancelled' },
{ value: 'payment.failed', label: 'Failed' }];


export default function MerchantWebhookLogDetail() {
  const { fmtDate } = useDateFormat();
  const { t } = useAdminTranslation();
  const { id } = useParams();
  const { token, hasPermission } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const loadLog = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWebhookLog(token, id);
      setLog(data);
    } catch (error) {
      logger.error('Failed to load webhook log:', error);
      toast.error(t('admin.webhookLog.loadError', { defaultValue: 'Failed to load webhook log' }));
    } finally {
      setLoading(false);
    }
  }, [token, id, toast, t]);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  async function handleRetry() {
    if (!log?.merchantPaymentId) return;
    try {
      setRetrying(true);
      const res = await retryWebhook(token, log.merchantPaymentId);
      toast.success(res.message || t('admin.webhookLog.retryEnqueued', { defaultValue: 'Webhook retry enqueued' }));
      loadLog();
    } catch (error) {
      logger.error('Retry failed:', error);
      toast.error(error?.message || t('admin.webhookLog.retryFailed', { defaultValue: 'Failed to retry webhook' }));
    } finally {
      setRetrying(false);
    }
  }

  function successText(val) {
    if (val === true || val === 1) return 'Success';
    if (val === false || val === 0) return 'Failed';
    return '-';
  }

  function eventBadge(event) {
    if (!event) return '-';
    const colorMap = {
      'payment.completed': 'success',
      'payment.expired': 'warning',
      'payment.cancelled': 'secondary',
      'payment.failed': 'danger'
    };
    const color = colorMap[event] || 'info';
    const label = EVENT_OPTIONS.find((o) => o.value === event)?.label || event;
    return <Badge color={color} label>{label}</Badge>;
  }

  function httpStatusText(status) {
    if (!status && status !== 0) return '-';
    return String(Number(status));
  }

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
      <div className="grow py-6">
        <Alert variant="warning">{t('admin.webhookLog.notFound', { defaultValue: 'Webhook log not found' })}</Alert>
      </div>);

  }

  const canRetry = hasPermission && hasPermission('admin.merchants.manage');

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          {/* Back button */}
          <div className="mb-4">
            <Button variant="label-secondary" href="/admin/merchant-webhook-logs">
              <i className="bx bx-arrow-back mr-1"></i>
              Back to Webhook Logs
            </Button>
          </div>

          {/* Header */}
          <Card className="mb-4">
            <div className="px-5 py-4 border-b border-surface-200">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full flex items-center justify-center ${bgLabelClass(log.success ? 'success' : 'danger')} w-12 h-12`}>

                    
                    <i className={`bx ${log.success ? 'bx-check' : 'bx-x'} text-2xl`}></i>
                  </div>
                  <div>
                    <h4 className="mb-0">Webhook Log #{log.id}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {eventBadge(log.event)}
                      <span className="text-surface-500">•</span>
                      <span>{successText(log.success)}</span>
                      <span className="text-surface-500">•</span>
                      <span>HTTP {httpStatusText(log.httpStatus)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canRetry &&
                  <Button

                    onClick={handleRetry}
                    disabled={retrying} className="bg-warning-500 text-white hover:bg-warning-600">
                    
                      {retrying ?
                    <>
                          <Spinner className="w-4 h-4 mr-1" />
                          Retrying...
                        </> :

                    <>
                          <i className="bx bx-revision mr-1"></i>
                          Retry Webhook
                        </>
                    }
                    </Button>
                  }
                  <RefreshButton onClick={loadLog} loading={loading} />
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-12 gap-x-6">
            {/* Left: Webhook Details */}
            <div className="md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">Webhook Details</h5>
                </div>
                <div className="p-5">
                  <div className="overflow-x-auto">
                  <Table responsive={false} className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">{t('admin.detail.id', { defaultValue: 'ID' })}</td>
                        <td className="font-medium">{log.id}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Merchant ID</td>
                        <td className="font-medium">{log.merchantId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Payment ID</td>
                        <td className="font-medium">{log.merchantPaymentId || '-'}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.event', { defaultValue: 'Event' })}</td>
                        <td>{eventBadge(log.event)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.callbackUrl', { defaultValue: 'Callback URL' })}</td>
                        <td>
                          {log.callbackUrl ?
                            <code className="text-surface-800 text-[0.8rem] break-all">
                              {log.callbackUrl}
                            </code> :
                            '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
                        <td>{fmtDate(log.createdAt)}</td>
                      </tr>
                    </tbody>
                  </Table>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Response Info */}
            <div className="md:col-span-6">
              <Card className="mb-4">
                <div className="px-5 py-4 border-b border-surface-200">
                  <h5 className="mb-0">Response Info</h5>
                </div>
                <div className="p-5">
                  <div className="overflow-x-auto">
                  <Table responsive={false} className="mb-0">
                    <tbody>
                      <tr>
                        <td className="text-surface-500 w-2/5">HTTP Status</td>
                        <td>{httpStatusText(log.httpStatus)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">{t('admin.detail.success', { defaultValue: 'Success' })}</td>
                        <td>{successText(log.success)}</td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Duration</td>
                        <td>
                          {log.durationMs != null ?
                            <span className={log.durationMs > 5000 ? 'text-danger font-medium' : ''}>
                              {log.durationMs.toLocaleString()}ms
                            </span> :
                            '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-surface-500">Attempt</td>
                        <td>{log.attempt ?? '-'}</td>
                      </tr>
                      {log.errorMessage &&
                        <tr>
                          <td className="text-surface-500">{t('admin.detail.error', { defaultValue: 'Error' })}</td>
                          <td>
                            <span className="text-danger break-words">
                              {log.errorMessage}
                            </span>
                          </td>
                        </tr>
                        }
                    </tbody>
                  </Table>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Request Payload */}
          {log.requestPayload &&
          <Card className="mb-4">
              <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
                <h5 className="mb-0">
                  <i className="bx bx-upload mr-2 text-primary"></i>
                  Request Payload
                </h5>
              </div>
              <div className="p-5">
                <pre
                className="bg-surface-900 text-surface-100 p-3 rounded mb-0 text-[0.8rem] max-h-[400px] overflow-auto whitespace-pre-wrap break-words">

                
                  {formatJson(log.requestPayload)}
                </pre>
              </div>
            </Card>
          }

          {/* Response Body */}
          {log.responseBody &&
          <Card className="mb-4">
              <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
                <h5 className="mb-0">
                  <i className="bx bx-download mr-2 text-info"></i>
                  Response Body
                </h5>
              </div>
              <div className="p-5">
                <pre
                className="bg-surface-900 text-surface-100 p-3 rounded mb-0 text-[0.8rem] max-h-[400px] overflow-auto whitespace-pre-wrap break-words">

                
                  {formatJson(log.responseBody)}
                </pre>
              </div>
            </Card>
          }
        </div>
      </div>
    </div>);

}