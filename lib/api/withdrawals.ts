import { apiFetch } from '@/lib/api-client'

export interface CreateWithdrawalBody {
  coinNetworkId: number
  amount: string
  withdrawalAddressId: string | number
  memo?: string
  twoFactorCode?: string
}

export async function createWithdrawal(body: CreateWithdrawalBody, token?: string) {
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawals`, {
    method: 'POST',
    token,
    body,
  })
  return res?.withdrawal ?? res
}

export interface ListWithdrawalsParams {
  page?: number
  limit?: number
  status?: string
}

export async function listWithdrawals(params: ListWithdrawalsParams = {}, token?: string) {
  const { page = 1, limit = 10, status } = params
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (status) qs.set('status', status)
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawals?${qs.toString()}`, { token })
  // Support new structure: data.withdrawals, fallback to old data.items
  const items = Array.isArray(res?.withdrawals)
    ? res.withdrawals
    : Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res)
        ? res
        : []
  // Support meta, pagination, or summary
  const rawPagination = res?.meta || res?.pagination || res?.summary || null
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

export async function getWithdrawalById(id: number | string, token?: string) {
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawals/${id}`, { token })
  return res?.withdrawal ?? res
}

export async function estimateWithdrawalFee(coinNetworkId: number | string, amount: string | number, token?: string): Promise<FeeEstimate | null> {
  const qs = new URLSearchParams()
  qs.set('coinNetworkId', String(coinNetworkId))
  qs.set('amount', String(amount))
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawals/estimate-fee?${qs.toString()}`, { token })
  if (res && typeof res === 'object') {
    return res as FeeEstimate
  }
  return null
}
