import { apiFetch } from './client'
import { requestId } from '../utils/requestId'
import { extractToken } from '../utils/authToken'

export interface BalanceBreakdownItem {
  coinNetworkId: number
  networkSymbol: string
  balance: string
  locked: string
  pending: string
  availableBalance: string
  lastUpdated?: string
}

export interface BalanceResponse {
  success: boolean
  data: {
    totalBalance: {
      totalBalance: string
      availableBalance: string
      lockedBalance: string
      pendingBalance: string
      lastUpdated?: string
    }
    breakdown: BalanceBreakdownItem[]
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
  const res = await apiFetch<BalanceResponse>('/balance', {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const breakdown = Array.isArray((res as any)?.data?.breakdown) ? (res as any).data.breakdown as BalanceBreakdownItem[] : []
  return breakdown
}

export interface BalancesWithFiatResult {
  breakdown: BalanceBreakdownItem[]
  totalBalance?: BalanceResponse['data']['totalBalance']
  fiat?: { currency: string; amount: string; rates?: Record<string, string> }
}

export async function getBalancesWithFiat(token?: unknown, currency?: string): Promise<BalancesWithFiatResult> {
  const authHeader = toAuthHeader(token)
  const qs = currency ? `?currency=${encodeURIComponent(String(currency))}` : ''
  const res = await apiFetch<BalanceResponse>(`/balance${qs}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const data: any = (res as any)?.data || {}
  const breakdown: BalanceBreakdownItem[] = Array.isArray(data?.breakdown) ? data.breakdown : []
  const totalBalance = data?.totalBalance
  const fiat = data?.fiat
  return { breakdown, totalBalance, fiat }
}
