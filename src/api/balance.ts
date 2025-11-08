import { apiFetch } from './client'
import { requestId } from '../utils/requestId'
import { extractToken } from '../utils/authToken'

export interface BalanceBreakdownItem {
  coinNetworkId: number
  coinSymbol?: string
  networkSymbol?: string
  networkName?: string
  decimals: number
  confirmedBalance?: string
  confirmedBalanceRaw?: string
  unconfirmedBalance?: string
  unconfirmedBalanceRaw?: string
  lockedBalance?: string
  lockedBalanceRaw?: string
  totalBalance?: string
  totalBalanceRaw?: string
  balance?: string // backward compatibility
  locked?: string // backward compatibility
  pending?: string // backward compatibility
  availableBalance?: string // backward compatibility
  coin?: {
    id: number
    symbol: string
    name: string
    type?: string
    logoUrl?: string
  }
  network?: {
    id: number
    symbol: string
    name: string
    chainId?: number
    explorerUrl?: string
  }
  priceUsd?: string
  valueUsd?: string
  lastCheckedAt?: string
  lastUpdated?: string
  updatedAt?: string
}

export interface BalanceResponse {
  success: boolean
  data: {
    balances?: BalanceBreakdownItem[] // new structure
    breakdown?: BalanceBreakdownItem[] // old structure for backward compatibility
    summary?: {
      totalAssets: number
      totalValueUsd: string
      currency: string
    }
    totalBalance?: {
      totalBalance: string
      availableBalance: string
      lockedBalance: string
      pendingBalance: string
      lastUpdated?: string
    }
    lastUpdated?: string
    fiat?: {
      currency: string
      amount: string
      rates?: Record<string, string>
    }
  }
  message?: string
  timestamp?: string
  requestId?: string
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

export async function getBalances(token?: unknown) {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<BalanceResponse>('/api/v1/user/balance', {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const data: any = (res as any)?.data || {}
  // Support new structure with data.balances, fallback to old data.breakdown
  const breakdown = Array.isArray(data?.balances) ? data.balances : Array.isArray(data?.breakdown) ? data.breakdown : []
  return breakdown
}

export interface BalancesWithFiatResult {
  breakdown: BalanceBreakdownItem[]
  totalBalance?: BalanceResponse['data']['totalBalance']
  fiat?: { currency: string; amount: string; rates?: Record<string, string> }
}

export async function getBalancesWithFiat(token?: unknown, currency?: string, coinNetworkId?: number | string): Promise<BalancesWithFiatResult> {
  const authHeader = toAuthHeader(token)
  const queryParams = new URLSearchParams()
  if (currency) queryParams.append('currency', String(currency))
  if (coinNetworkId) queryParams.append('coinNetworkId', String(coinNetworkId))
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : ''
  const res = await apiFetch<BalanceResponse>(`/api/v1/user/balance${qs}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const data: any = (res as any)?.data || {}
  // Support new structure with data.balances, fallback to old data.breakdown
  const breakdown: BalanceBreakdownItem[] = Array.isArray(data?.balances) ? data.balances : Array.isArray(data?.breakdown) ? data.breakdown : []
  const totalBalance = data?.totalBalance
  // Map new summary structure to old fiat structure for backward compatibility
  const fiat = data?.fiat || (data?.summary ? {
    currency: data.summary.currency || 'USD',
    amount: data.summary.totalValueUsd || '0',
    rates: {}
  } : undefined)
  return { breakdown, totalBalance, fiat }
}
