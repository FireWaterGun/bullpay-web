import { apiFetch } from './client'
import { requestId } from '../utils/requestId'
import { extractToken } from '../utils/authToken'

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

export interface CreateWithdrawalBody {
  coinNetworkId: number
  amount: string
  withdrawalAddressId: string | number
  memo?: string
}

export async function createWithdrawal(body: CreateWithdrawalBody, token?: unknown) {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawals`, {
    method: 'POST',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body,
  })
  return res?.data?.withdrawal ?? res?.withdrawal ?? res?.data ?? res
}

export interface ListWithdrawalsParams {
  page?: number
  limit?: number
  status?: string
}

export async function listWithdrawals(params: ListWithdrawalsParams = {}, token?: unknown) {
  const { page = 1, limit = 10, status } = params
  const authHeader = toAuthHeader(token)
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (status) qs.set('status', status)
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawals?${qs.toString()}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const payload = res?.data ?? res
  // Support new structure: data.withdrawals, fallback to old data.items
  const items = Array.isArray(payload?.withdrawals)
    ? payload.withdrawals
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : Array.isArray(res?.results)
          ? res.results
          : []
  // Support meta, pagination, or summary
  const rawPagination = payload?.meta || payload?.pagination || payload?.summary || null
  // Normalize pagination structure
  const pagination = rawPagination ? {
    total: rawPagination.total,
    page: rawPagination.page,
    perPage: rawPagination.perPage || rawPagination.limit,
    totalPages: rawPagination.lastPage || rawPagination.totalPages || Math.ceil(rawPagination.total / (rawPagination.perPage || rawPagination.limit || 10)),
    hasNextPage: rawPagination.hasNextPage,
    hasPrevPage: rawPagination.hasPrevPage
  } : null
  return { items, pagination }
}

export interface FeeEstimate {
  coinNetworkId: number
  symbol: string
  networkSymbol: string
  amount: string
  grossAmount?: string
  baseFee: string
  percentFee: string
  totalFee: string
  netAmount: string
  amountRaw?: string
  grossAmountRaw?: string
  baseFeeRaw?: string
  percentFeeRaw?: string
  totalFeeRaw?: string
  netAmountRaw?: string
  decimals: number
  feePercentage: number
  precision?: {
    displayDecimals: number
  }
  display?: {
    amount: string
    grossAmount: string
    baseFee: string
    percentFee: string
    totalFee: string
    netAmount: string
    percentFeeText: string
  }
  displayUsd?: {
    amountUsd: string
    grossAmountUsd: string
    baseFeeUsd: string
    percentFeeUsd: string
    totalFeeUsd: string
    netAmountUsd: string
    percentFeeUsdText: string
  }
  metadata?: {
    usdPriceStatus: string
    usdPriceSource: string
    usdPriceLastUpdated: string
  }
}

export async function estimateWithdrawalFee(coinNetworkId: number | string, amount: string | number, token?: unknown): Promise<FeeEstimate | null> {
  const authHeader = toAuthHeader(token)
  const qs = new URLSearchParams()
  qs.set('coinNetworkId', String(coinNetworkId))
  qs.set('amount', String(amount))
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawals/estimate-fee?${qs.toString()}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const payload = res?.data ?? res
  if (payload && typeof payload === 'object') {
    return payload as FeeEstimate
  }
  return null
}
