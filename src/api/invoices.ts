import { apiFetch } from './client'
import { requestId } from '../utils/requestId'
import { extractToken } from '../utils/authToken'

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

function toAuthHeader(input?: unknown): string | undefined {
  if (!input) return undefined
  let token: string | undefined = typeof input === 'string' ? input : extractToken(input)
  if (!token) return undefined
  const t = token.trim()
  if (t === '[object Object]') return undefined
  if (t.startsWith('{') || t.startsWith('[')) {
    try {
      const parsed = JSON.parse(t)
      token = extractToken(parsed)
    } catch {
      return undefined
    }
  }
  return token ? `Bearer ${token}` : undefined
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

  const res = await apiFetch<any>(`/invoices?${qs.toString()}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })

  const payload = res?.data ?? res
  const items: InvoiceRecord[] = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? (payload as InvoiceRecord[])
      : Array.isArray(res?.results)
        ? res.results
        : []
  const total = payload?.pagination?.total ?? payload?.total ?? payload?.count ?? (Array.isArray(items) ? items.length : undefined)
  const currentPage = payload?.pagination?.page ?? page
  const currentLimit = payload?.pagination?.limit ?? limit

  return { items, total, page: currentPage, limit: currentLimit }
}

export async function getInvoice(id: number | string, token?: unknown): Promise<InvoiceRecord> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/invoices/${id}`, {
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
  coinNetworkId: number
  amount: string | number
  description?: string
  memo?: string
  expiryHours?: number
}

export async function createInvoice(body: CreateInvoiceBody, token?: unknown): Promise<InvoiceRecord> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/invoices`, {
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
// Public invoice QR (no auth required)
// GET /public/invoices/:code/qr
// Response shape (example): { success, data: { invoice: {...}, qr: {...} } }
// ---------------------------------------------
export interface PublicInvoiceQrResult {
  invoice: InvoiceRecord
  qr: Record<string, any>
}

export async function getPublicInvoiceQr(code: string): Promise<PublicInvoiceQrResult> {
  if (!code) throw new Error('Missing invoice code')
  const res = await apiFetch<any>(`/public/invoices/${encodeURIComponent(code)}/qr`, {
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
// GET /public/invoices/:code/status
// Expected generic shapes:
// { success, data: { invoice: {...} } }
// or { invoice: {...} }
// ---------------------------------------------
export interface PublicInvoiceStatusResult {
  invoice: InvoiceRecord
}

export async function getPublicInvoiceStatus(code: string): Promise<PublicInvoiceStatusResult> {
  if (!code) throw new Error('Missing invoice code')
  const res = await apiFetch<any>(`/public/invoices/${encodeURIComponent(code)}/status`, {
    method: 'GET',
    headers: { 'x-request-id': requestId() },
  })
  const invoice = res?.data?.invoice ?? res?.invoice ?? res?.data ?? {}
  return { invoice }
}
