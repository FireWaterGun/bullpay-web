import { apiFetch } from './client'
import { requestId } from '../utils/requestId'
import { extractToken } from '../utils/authToken'

export interface CoinNetworkItem {
  id: number
  coinId: number
  networkId: number
  contractAddress?: string | null
  decimals: number
  depositEnable: number
  withdrawEnable: number
  minDeposit?: string
  minWithdraw?: string
  maxWithdraw?: string
  depositFee?: string
  withdrawFee?: string
  depositConfirmations?: number
  status?: string
  createdAt?: string
  updatedAt?: string
  coin?: {
    id: number
    symbol: string
    name: string
    decimals: number
    isStableCoin?: number
    logoUrl?: string
    status?: string
    createdAt?: string
    updatedAt?: string
  }
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

export async function listCoins(token?: unknown): Promise<CoinNetworkItem[]> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/coins`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const payload = res?.data ?? res
  if (Array.isArray(payload)) return payload as CoinNetworkItem[]
  if (Array.isArray(payload?.items)) return payload.items as CoinNetworkItem[]
  if (Array.isArray(res?.results)) return res.results as CoinNetworkItem[]
  return []
}

export async function getCoinNetworks(coinId: number | string, token?: unknown): Promise<CoinNetworkItem[]> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/coins/coin-networks/${coinId}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const payload = res?.data ?? res
  if (Array.isArray(payload)) return payload as CoinNetworkItem[]
  if (Array.isArray(payload?.items)) return payload.items as CoinNetworkItem[]
  if (Array.isArray(res?.results)) return res.results as CoinNetworkItem[]
  return []
}

export async function getCoinNetworksBySymbol(symbol: string, token?: unknown): Promise<CoinNetworkItem[]> {
  const authHeader = toAuthHeader(token)
  const sym = encodeURIComponent(symbol)
  const res = await apiFetch<any>(`/coins/${sym}/networks`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const payload = res?.data ?? res
  if (Array.isArray(payload)) return payload as CoinNetworkItem[]
  if (Array.isArray(payload?.items)) return payload.items as CoinNetworkItem[]
  if (Array.isArray(res?.results)) return res.results as CoinNetworkItem[]
  return []
}
