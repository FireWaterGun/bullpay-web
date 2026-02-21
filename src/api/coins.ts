import { apiFetch, toAuthHeader } from './client'
import { requestId } from '../utils/requestId'

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

export async function listCoins(token?: unknown): Promise<CoinNetworkItem[]> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/api/v1/coins`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const payload = res?.data ?? res
  if (Array.isArray(payload)) return payload as CoinNetworkItem[]
  // Support new API structure with data.coins
  if (Array.isArray(payload?.coins)) return payload.coins as CoinNetworkItem[]
  if (Array.isArray(payload?.items)) return payload.items as CoinNetworkItem[]
  if (Array.isArray(res?.results)) return res.results as CoinNetworkItem[]
  return []
}

export async function getCoinNetworks(coinId: number | string, token?: unknown): Promise<CoinNetworkItem[]> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/api/v1/coins/${coinId}/networks`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const payload = res?.data ?? res
  if (Array.isArray(payload)) return payload as CoinNetworkItem[]
  // Support new API structure with data.coins or data.networks
  if (Array.isArray(payload?.coins)) return payload.coins as CoinNetworkItem[]
  if (Array.isArray(payload?.networks)) return payload.networks as CoinNetworkItem[]
  if (Array.isArray(payload?.items)) return payload.items as CoinNetworkItem[]
  if (Array.isArray(res?.results)) return res.results as CoinNetworkItem[]
  return []
}

export async function getCoinNetworksBySymbol(symbol: string, token?: unknown): Promise<CoinNetworkItem[]> {
  const authHeader = toAuthHeader(token)
  const sym = encodeURIComponent(symbol)
  const res = await apiFetch<any>(`/api/v1/coins/${sym}/networks`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const payload = res?.data ?? res
  if (Array.isArray(payload)) return payload as CoinNetworkItem[]
  // Support new API structure with data.coins or data.networks
  if (Array.isArray(payload?.coins)) return payload.coins as CoinNetworkItem[]
  if (Array.isArray(payload?.networks)) return payload.networks as CoinNetworkItem[]
  if (Array.isArray(payload?.items)) return payload.items as CoinNetworkItem[]
  if (Array.isArray(res?.results)) return res.results as CoinNetworkItem[]
  return []
}
