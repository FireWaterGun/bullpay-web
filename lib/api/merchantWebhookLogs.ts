import { apiFetch } from '@/lib/api-client'

const BASE = '/api/v1/admin/merchant-webhook-logs'

export interface WebhookLogListParams {
  page?: number
  limit?: number
  merchantId?: number
  merchantPaymentId?: number
  invoiceId?: number
  q?: string
  event?: string
  success?: string
  fromDate?: string
  toDate?: string
  sortBy?: string
  sortOrder?: string
}

export async function getWebhookLogs(token: string | null, params: WebhookLogListParams = {}) {
  const qp = new URLSearchParams()

  if (params.page) qp.append('page', String(params.page))
  if (params.limit) qp.append('limit', String(params.limit))
  if (params.merchantId) qp.append('merchantId', String(params.merchantId))
  if (params.merchantPaymentId) qp.append('merchantPaymentId', String(params.merchantPaymentId))
  if (params.invoiceId) qp.append('invoiceId', String(params.invoiceId))
  if (params.q) qp.append('q', params.q)
  if (params.event) qp.append('event', params.event)
  if (params.success) qp.append('success', params.success)
  if (params.fromDate) qp.append('fromDate', params.fromDate)
  if (params.toDate) qp.append('toDate', params.toDate)
  if (params.sortBy) qp.append('sortBy', params.sortBy)
  if (params.sortOrder) qp.append('sortOrder', params.sortOrder)

  const qs = qp.toString()
  const url = `${BASE}${qs ? `?${qs}` : ''}`

  const data = await apiFetch<any>(url, { token })

  const items = data?.items || []
  const meta = data?.meta || data?.pagination || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? (meta.page || 1) < (meta.lastPage || 1),
      hasPrev: meta.hasPrevPage ?? (meta.page || 1) > 1,
    },
  }
}

export async function getWebhookLog(token: string | null, id: number | string) {
  const data = await apiFetch<any>(`${BASE}/${id}`, { token })
  return data?.webhookLog || data
}

export async function retryWebhook(token: string | null, merchantPaymentId: number | string) {
  return apiFetch(`${BASE}/${merchantPaymentId}/retry`, {
    method: 'POST',
    token,
  })
}
