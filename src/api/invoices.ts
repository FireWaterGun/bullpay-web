import { apiFetch, toAuthHeader } from './client'
import { requestId } from '../utils/requestId'

export type SortOrder = 'asc' | 'desc'

export interface ListInvoicesParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrder
  q?: string
  status?: string
  currency?: string
  minAmount?: string | number
  maxAmount?: string | number
  dateFrom?: string // ISO or yyyy-mm-dd
  dateTo?: string // ISO or yyyy-mm-dd
}

export interface InvoiceRecord {
  [key: string]: any
}

export interface ListInvoicesResult {
  items: InvoiceRecord[]
  total?: number
  page?: number
  limit?: number
}

export async function listInvoices(params: ListInvoicesParams = {}, token?: unknown): Promise<ListInvoicesResult> {
  const {
    page = 1,
    limit = 10,
    sortBy = 'created_at',
    sortOrder = 'desc',
    q,
    status,
    currency,
    minAmount,
    maxAmount,
    dateFrom,
    dateTo,
  } = params

  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  qs.set('sortBy', String(sortBy))
  qs.set('sortOrder', String(sortOrder))
  if (q) qs.set('q', q)
  if (status) qs.set('status', status)
  if (currency) qs.set('currency', currency)
  if (minAmount !== undefined && minAmount !== null && `${minAmount}` !== '') qs.set('minAmount', String(minAmount))
  if (maxAmount !== undefined && maxAmount !== null && `${maxAmount}` !== '') qs.set('maxAmount', String(maxAmount))
  if (dateFrom) qs.set('dateFrom', dateFrom)
  if (dateTo) qs.set('dateTo', dateTo)

  const authHeader = toAuthHeader(token)

  const res = await apiFetch<any>(`/api/v1/user/invoices?${qs.toString()}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })

  const payload = res?.data ?? res
  // Support new API structure with data.invoices
  const items: InvoiceRecord[] = Array.isArray(payload?.invoices)
    ? payload.invoices
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? (payload as InvoiceRecord[])
        : Array.isArray(res?.results)
          ? res.results
          : []
  
  // Support new meta structure
  const meta = payload?.meta ?? payload?.pagination
  const total = meta?.total ?? payload?.total ?? payload?.count ?? (Array.isArray(items) ? items.length : undefined)
  const currentPage = meta?.currentPage ?? meta?.page ?? page
  const currentLimit = meta?.perPage ?? meta?.limit ?? limit

  return { items, total, page: currentPage, limit: currentLimit }
}

export async function getInvoice(id: number | string, token?: unknown): Promise<InvoiceRecord> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/api/v1/user/invoices/${id}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })

  const invoice = res?.data?.invoice ?? res?.invoice ?? res?.data ?? res
  if (!invoice || typeof invoice !== 'object') return { id }
  return invoice as InvoiceRecord
}

export interface CreateInvoiceBody {
  coinSymbol: string
  networkSymbol: string
  amount: string | number
  description?: string
  memo?: string
  expiryHours?: number
}

export async function createInvoice(body: CreateInvoiceBody, token?: unknown): Promise<InvoiceRecord> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/api/v1/user/invoices`, {
    method: 'POST',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body,
  })
  const invoice = res?.data?.invoice ?? res?.invoice ?? res?.data ?? res
  if (!invoice || typeof invoice !== 'object') throw new Error('Invalid response')
  return invoice as InvoiceRecord
}

// ---------------------------------------------
// Public invoice (no auth required)
// GET /api/v1/public/invoices/:code
// Response shape: { success, data: { invoice: {...}, qr: {...} } }
// ---------------------------------------------
export interface PublicInvoiceResult {
  invoice: InvoiceRecord
  qr: Record<string, any>
}

export async function getPublicInvoice(code: string): Promise<PublicInvoiceResult> {
  if (!code) throw new Error('Missing invoice code')
  const res = await apiFetch<any>(`/api/v1/public/invoices/${encodeURIComponent(code)}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
    },
  })
  const invoice = res?.data?.invoice ?? res?.invoice ?? res?.data?.data?.invoice ?? res?.data?.data ?? {}
  const qr = res?.data?.qr ?? res?.qr ?? res?.data?.data?.qr ?? {}
  return { invoice, qr }
}

// ---------------------------------------------
// Public invoice QR (no auth required)
// GET /api/v1/public/invoices/:code/qr
// Response shape (example): { success, data: { invoice: {...}, qr: {...} } }
// ---------------------------------------------
export interface PublicInvoiceQrResult {
  invoice: InvoiceRecord
  qr: Record<string, any>
}

export async function getPublicInvoiceQr(code: string): Promise<PublicInvoiceQrResult> {
  if (!code) throw new Error('Missing invoice code')
  const res = await apiFetch<any>(`/api/v1/public/invoices/${encodeURIComponent(code)}/qr`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
    },
  })
  const invoice = res?.data?.invoice ?? res?.invoice ?? res?.data?.data?.invoice ?? res?.data?.data ?? {}
  const qr = res?.data?.qr ?? res?.qr ?? res?.data?.data?.qr ?? {}
  return { invoice, qr }
}

// ---------------------------------------------
// Public invoice status (lighter than QR endpoint)
// GET /api/v1/public/invoices/:code/status
// Expected generic shapes:
// { success, data: { invoice: {...} } }
// or { invoice: {...} }
// ---------------------------------------------
export interface PublicInvoiceStatusResult {
  status: string
  amountRequired: string | null
  amountReceived: string | null
  expiresAt: string | null
  paidAt: string | null
  updatedAt: string | null
  [key: string]: any
}

export async function getPublicInvoiceStatus(code: string): Promise<PublicInvoiceStatusResult> {
  if (!code) throw new Error('Missing invoice code')
  const res = await apiFetch<any>(`/api/v1/public/invoices/${encodeURIComponent(code)}/status`, {
    method: 'GET',
    headers: { 'x-request-id': requestId() },
  })
  const data = res?.data ?? res
  return data as PublicInvoiceStatusResult
}

// ---------------------------------------------
// Public payment (no auth required)
// GET /api/v1/pay/:paymentId
// ---------------------------------------------
export interface PublicPaymentNetwork {
  networkSymbol: string
  networkName: string
  coinSymbol: string
  confirmations: number
}

export interface PublicPaymentResult {
  paymentId: string
  status: string
  amount: string
  coinSymbol: string
  networkSymbol: string | null
  description: string
  merchantName: string
  expiresAt: string
  paidAt: string | null
  hasInvoice: boolean
  successUrl?: string
  cancelUrl?: string
  availableNetworks: PublicPaymentNetwork[]
  paymentAddress?: string
  [key: string]: any
}

export async function getPublicPayment(paymentId: string): Promise<PublicPaymentResult> {
  if (!paymentId) throw new Error('Missing payment ID')
  const res = await apiFetch<any>(`/api/v1/pay/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: { 'x-request-id': requestId() },
  })
  const data = res?.data ?? res
  return data as PublicPaymentResult
}

// ---------------------------------------------
// Payment status (no auth required)
// GET /api/v1/pay/:paymentId/status
// ---------------------------------------------
export interface PublicPaymentStatusResult {
  paymentId: string
  status: string
  paidAt: string | null
  hasInvoice: boolean
  successUrl?: string
  [key: string]: any
}

export async function getPublicPaymentStatus(paymentId: string): Promise<PublicPaymentStatusResult> {
  if (!paymentId) throw new Error('Missing payment ID')
  const res = await apiFetch<any>(`/api/v1/pay/${encodeURIComponent(paymentId)}/status`, {
    method: 'GET',
    headers: { 'x-request-id': requestId() },
  })
  const data = res?.data ?? res
  return data as PublicPaymentStatusResult
}

// ---------------------------------------------
// Select network for a payment (no auth required)
// POST /api/v1/pay/:paymentId/select-network
// ---------------------------------------------
export async function selectPaymentNetwork(
  paymentId: string,
  networkSymbol: string
): Promise<PublicPaymentResult> {
  if (!paymentId) throw new Error('Missing payment ID')
  if (!networkSymbol) throw new Error('Missing network symbol')
  const res = await apiFetch<any>(`/api/v1/pay/${encodeURIComponent(paymentId)}/select-network`, {
    method: 'POST',
    headers: { 'x-request-id': requestId() },
    body: { networkSymbol },
  })
  const data = res?.data ?? res
  return data as PublicPaymentResult
}
