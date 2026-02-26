import { apiFetch } from './client'

const BASE = '/api/v1/admin/merchant-webhook-logs'

export interface WebhookLogListParams {
  page?: number
  limit?: number
  merchantId?: number
  merchantPaymentId?: number
  event?: string
  success?: string
  fromDate?: string
  toDate?: string
  sortBy?: string
  sortOrder?: string
}

export async function getWebhookLogs(token: string, params: WebhookLogListParams = {}) {
  const qp = new URLSearchParams()

  if (params.page) qp.append('page', String(params.page))
  if (params.limit) qp.append('limit', String(params.limit))
  if (params.merchantId) qp.append('merchantId', String(params.merchantId))
  if (params.merchantPaymentId) qp.append('merchantPaymentId', String(params.merchantPaymentId))
  if (params.event) qp.append('event', params.event)
  if (params.success) qp.append('success', params.success)
  if (params.fromDate) qp.append('fromDate', params.fromDate)
  if (params.toDate) qp.append('toDate', params.toDate)
  if (params.sortBy) qp.append('sortBy', params.sortBy)
  if (params.sortOrder) qp.append('sortOrder', params.sortOrder)

  const qs = qp.toString()
  const url = `${BASE}${qs ? `?${qs}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || data?.pagination || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    },
  }
}

export async function getWebhookLog(token: string, id: number | string) {
  const response = await apiFetch(`${BASE}/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = response?.data || response
  return data?.webhookLog || data
}

export async function retryWebhook(token: string, merchantPaymentId: number | string) {
  const response = await apiFetch(`${BASE}/${merchantPaymentId}/retry`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return response?.data || response
}
