import { apiFetch } from '@/lib/api-client'

export type SortOrder = 'asc' | 'desc'

export interface ListInvoicesParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: SortOrder
  q?: string
  status?: string
  currency?: string
  coinNetworkId?: number | string
  minAmount?: string | number
  maxAmount?: string | number
  dateFrom?: string
  dateTo?: string
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

export async function listInvoices(params: ListInvoicesParams = {}, token?: string): Promise<ListInvoicesResult> {
  const {
    page = 1,
    limit = 10,
    sortBy = 'created_at',
    sortOrder = 'desc',
    q,
    status,
    currency,
    coinNetworkId,
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
  if (coinNetworkId !== undefined && coinNetworkId !== null && `${coinNetworkId}` !== '') {
    qs.set('coinNetworkId', String(coinNetworkId))
  }
  if (minAmount !== undefined && minAmount !== null && `${minAmount}` !== '') qs.set('minAmount', String(minAmount))
  if (maxAmount !== undefined && maxAmount !== null && `${maxAmount}` !== '') qs.set('maxAmount', String(maxAmount))
  if (dateFrom) qs.set('dateFrom', dateFrom)
  if (dateTo) qs.set('dateTo', dateTo)

  const res = await apiFetch<any>(`/api/v1/user/invoices?${qs.toString()}`, { token })

  // New apiFetch already unwraps .data, so res is the payload directly
  const payload = res
  // Support new API structure with data.invoices
  const items: InvoiceRecord[] = Array.isArray(payload?.invoices)
    ? payload.invoices
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? (payload as InvoiceRecord[])
        : []

  // Support new meta structure
  const meta = payload?.meta ?? payload?.pagination
  const total = meta?.total ?? payload?.total ?? payload?.count ?? (Array.isArray(items) ? items.length : undefined)
  const currentPage = meta?.currentPage ?? meta?.page ?? page
  const currentLimit = meta?.perPage ?? meta?.limit ?? limit

  return { items, total, page: currentPage, limit: currentLimit }
}

export async function getInvoice(id: number | string, token?: string): Promise<InvoiceRecord> {
  const res = await apiFetch<any>(`/api/v1/user/invoices/${id}`, { token })

  const invoice = res?.invoice ?? res
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

export async function createInvoice(body: CreateInvoiceBody, token?: string): Promise<InvoiceRecord> {
  const res = await apiFetch<any>(`/api/v1/user/invoices`, {
    method: 'POST',
    token,
    body,
  })
  const invoice = res?.invoice ?? res
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
  const res = await apiFetch<any>(`/api/v1/public/invoices/${encodeURIComponent(code)}`)
  const invoice = res?.invoice ?? res?.data?.invoice ?? res?.data ?? {}
  const qr = res?.qr ?? res?.data?.qr ?? {}
  return { invoice, qr }
}

// ---------------------------------------------
// Public invoice status
// GET /api/v1/public/invoices/:code/status
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
  return apiFetch<PublicInvoiceStatusResult>(`/api/v1/public/invoices/${encodeURIComponent(code)}/status`)
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
  isEstimate?: boolean
  exchangeRate?: string | null
  fiatAmount?: string | null
  fiatCurrency?: string | null
  [key: string]: any
}

export async function getPublicPayment(paymentId: string): Promise<PublicPaymentResult> {
  if (!paymentId) throw new Error('Missing payment ID')
  return apiFetch<PublicPaymentResult>(`/api/v1/pay/${encodeURIComponent(paymentId)}`)
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
  return apiFetch<PublicPaymentStatusResult>(`/api/v1/pay/${encodeURIComponent(paymentId)}/status`)
}

// ---------------------------------------------
// Select network for a payment (no auth required)
// POST /api/v1/pay/:paymentId/select-network
// ---------------------------------------------
export async function selectPaymentNetwork(paymentId: string, networkSymbol: string): Promise<PublicPaymentResult> {
  if (!paymentId) throw new Error('Missing payment ID')
  if (!networkSymbol) throw new Error('Missing network symbol')
  return apiFetch<PublicPaymentResult>(`/api/v1/pay/${encodeURIComponent(paymentId)}/select-network`, {
    method: 'POST',
    body: { networkSymbol },
  })
}
