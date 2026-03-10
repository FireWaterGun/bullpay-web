import { apiFetch } from '@/lib/api-client'

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
  balance?: string
  locked?: string
  pending?: string
  availableBalance?: string
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
    balances?: BalanceBreakdownItem[]
    breakdown?: BalanceBreakdownItem[]
    summary?: {
      totalAssets: number
      totalValueUsd: string
      pendingValueUsd?: string
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

export async function getBalances(token?: string) {
  const data: any = await apiFetch<any>('/api/v1/user/balance', { token })
  // Support new structure with data.balances, fallback to old data.breakdown
  const breakdown = Array.isArray(data?.balances) ? data.balances : Array.isArray(data?.breakdown) ? data.breakdown : []
  return breakdown
}

export interface BalancesWithFiatResult {
  breakdown: BalanceBreakdownItem[]
  totalBalance?: BalanceResponse['data']['totalBalance']
  fiat?: { currency: string; amount: string; pendingAmount?: string; rates?: Record<string, string> }
}

export async function getBalancesWithFiat(
  token?: string,
  currency?: string,
  coinNetworkId?: number | string
): Promise<BalancesWithFiatResult> {
  const queryParams = new URLSearchParams()
  if (currency) queryParams.append('currency', String(currency))
  if (coinNetworkId) queryParams.append('coinNetworkId', String(coinNetworkId))
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : ''
  const data: any = await apiFetch<any>(`/api/v1/user/balance${qs}`, { token })
  // Support new structure with data.balances, fallback to old data.breakdown
  const breakdown: BalanceBreakdownItem[] = Array.isArray(data?.balances)
    ? data.balances
    : Array.isArray(data?.breakdown)
      ? data.breakdown
      : []
  const totalBalance = data?.totalBalance
  // Map new summary structure to old fiat structure for backward compatibility
  const fiat =
    data?.fiat ||
    (data?.summary
      ? {
          currency: data.summary.currency || 'USD',
          amount: data.summary.totalValueUsd || '0',
          pendingAmount: data.summary.pendingValueUsd || '0',
          rates: {},
        }
      : undefined)
  return { breakdown, totalBalance, fiat }
}
